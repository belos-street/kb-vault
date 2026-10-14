/**
 * Agent 端到端测试（todo §4.8）：chit_chat 短路 / 退款全链 /
 * structuredResponse 收口 / 会话恢复
 *
 * 手法：fakeModel 全程可控零真钱（官方 unit-testing 指南）；
 * 分类器与主力模型分别注入各自的 fake；MemorySaver + 独立 thread_id。
 * 数据自理：自建测试订单 SO-TEST-AGNT-01，用例外删除（不碰种子数据）。
 */
import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import { AIMessage } from '@langchain/core/messages'
import { Command, MemorySaver } from '@langchain/langgraph'
import { Client } from 'pg'
import { fakeModel } from 'langchain'
import { EXTRACT_TOOL_NAME, buildAgent } from '@/agent/agent.ts'
import { runTurn, toAgentState, turnConfig } from '@/agent/run-turn.ts'
import { config } from '@/config.ts'
import { createClassifier, type Route } from '@/intent/classifier.ts'
import { closePool, getOrderById } from '@/services/db.ts'

const TEST_ORDER = 'SO-TEST-AGNT-01'
const TEST_TICKET_SUMMARY = 'agent 全链测试工单'
const USER = 'u_001'

async function withClient(
  run: (
    sql: (text: string, values?: unknown[]) => Promise<unknown>
  ) => Promise<void>
): Promise<void> {
  const client = new Client({ connectionString: config.DATABASE_URL })
  await client.connect()
  try {
    await run((text, values) => client.query(text, values))
  } finally {
    await client.end()
  }
}

beforeAll(async () => {
  await withClient(async (sql) => {
    await sql(`DELETE FROM orders WHERE order_id = $1`, [TEST_ORDER])
    await sql(
      `INSERT INTO orders (order_id, user_id, item_name, amount, status, tracking_number, created_at, delivered_at)
       VALUES ($1, 'u_001', '全链测试商品', 66.00, '已签收', 'SF-TEST-AGNT', now() - INTERVAL '2 days', now() - INTERVAL '1 day')`,
      [TEST_ORDER]
    )
  })
})

afterAll(async () => {
  await withClient(async (sql) => {
    await sql(`DELETE FROM orders WHERE order_id = $1`, [TEST_ORDER])
    await sql(`DELETE FROM tickets WHERE summary = $1`, [TEST_TICKET_SUMMARY])
  })
  await closePool()
})

let threadSeq = 0
function turn(input: string) {
  threadSeq += 1
  return {
    input,
    threadId: `agent-test-${threadSeq}`,
    userId: USER
  }
}

function classifyWith(route: Route) {
  return createClassifier(fakeModel().structuredResponse(route))
}

describe('chit_chat 短路', () => {
  it('闲聊不进 Agent 循环（模型零调用，直接出 reply）', async () => {
    const agentModel = fakeModel() // 不排任何响应：被调用会直接抛错
    const agent = await buildAgent({
      model: agentModel,
      checkpointer: new MemorySaver()
    })
    const classify = classifyWith({
      intent: 'chit_chat',
      slots: { order_id: null, category: null },
      reply: '您好，有什么可以帮您？'
    })

    const result = await runTurn({ classify, agent }, turn('你好呀'))

    expect(result.kind).toBe('chit_chat')
    if (result.kind === 'chit_chat') expect(result.reply).toContain('您好')
    expect(agentModel.callCount).toBe(0)
  })
})

describe('退款全链（分类 → 查单 → 审批 → 退单 → 工单）', () => {
  it('两次 HITL 审批后：订单「退款中」+ 工单落库 + 模型收尾', async () => {
    const agentModel = fakeModel()
      .respondWithTools([
        { name: 'query_order', args: { order_id: TEST_ORDER } }
      ])
      .respondWithTools([
        {
          name: 'process_refund',
          args: { order_id: TEST_ORDER, reason: '质量问题' }
        }
      ])
      .respondWithTools([
        {
          name: 'create_ticket',
          args: { type: 'refund', summary: TEST_TICKET_SUMMARY }
        }
      ])
      .respond(new AIMessage('退款已发起，工单已创建，1-3 个工作日到账'))
    const agent = await buildAgent({
      model: agentModel,
      checkpointer: new MemorySaver()
    })
    const classify = classifyWith({
      intent: 'order_ops',
      slots: { order_id: TEST_ORDER, category: 'refund' },
      reply: null
    })

    // 第一轮：查单 → 模型发起 process_refund → HITL 中断
    // 同 thread_id 贯穿全程：中断暂存在 checkpoint，resume 必须接同一会话
    const cfg = turnConfig('agent-test-refund-chain', USER)
    const first = await runTurn(
      { classify, agent },
      {
        input: `帮我退了 ${TEST_ORDER}`,
        threadId: cfg.configurable.thread_id,
        userId: USER
      }
    )
    if (first.kind !== 'agent') throw new Error('预期进入 Agent 循环')
    expect(first.state.interrupts[0]?.value.actionRequests[0]?.name).toBe(
      'process_refund'
    )
    // 查单确实发生了：工具结果进上下文
    const orderSnapshot = first.state.messages.find(
      (m) =>
        m.getType() === 'tool' && String(m.content).includes('全链测试商品')
    )
    expect(orderSnapshot).toBeDefined()

    // 人工 approve 退款 → 工具执行 → 模型接着发起 create_ticket → 再次中断
    const second = toAgentState(
      await agent.invoke(
        new Command({ resume: { decisions: [{ type: 'approve' }] } }),
        cfg
      )
    )
    expect(second.interrupts[0]?.value.actionRequests[0]?.name).toBe(
      'create_ticket'
    )
    const order = await getOrderById(TEST_ORDER)
    expect(order?.status).toBe('退款中')

    // 人工 approve 建单 → 工单落库 → 模型收尾
    const third = toAgentState(
      await agent.invoke(
        new Command({ resume: { decisions: [{ type: 'approve' }] } }),
        cfg
      )
    )
    expect(String(third.messages.at(-1)?.content)).toContain('工单已创建')

    const { listTickets } = await import('@/services/db.ts')
    const tickets = await listTickets()
    const ticket = tickets.find((t) => t.summary === TEST_TICKET_SUMMARY)
    expect(ticket?.user_id).toBe(USER)
    expect(ticket?.status).toBe('open')
  })
})

describe('structuredResponse 收口', () => {
  it('extract 工具产出 result.structuredResponse', async () => {
    const agentModel = fakeModel().respond(
      () =>
        new AIMessage({
          content: '',
          tool_calls: [
            {
              name: EXTRACT_TOOL_NAME,
              args: { resolution: 'answered', follow_up_needed: false },
              id: 'c-extract',
              type: 'tool_call'
            }
          ]
        })
    )
    const agent = await buildAgent({
      model: agentModel,
      checkpointer: new MemorySaver()
    })
    const classify = classifyWith({
      intent: 'consult',
      slots: { order_id: null, category: 'refund' },
      reply: null
    })

    const result = await runTurn({ classify, agent }, turn('退款政策是什么'))

    if (result.kind !== 'agent') throw new Error('预期进入 Agent 循环')
    expect(result.state.structuredResponse).toEqual({
      resolution: 'answered',
      follow_up_needed: false
    })
  })
})

describe('会话恢复（Checkpointer 携带上下文）', () => {
  it('同 thread_id 第二轮能看到第一轮的对话内容', async () => {
    const agentModel = fakeModel()
      .respond(new AIMessage('第一轮答复'))
      .respond(new AIMessage('第二轮答复'))
    const agent = await buildAgent({
      model: agentModel,
      checkpointer: new MemorySaver()
    })
    const classify = classifyWith({
      intent: 'consult',
      slots: { order_id: null, category: 'other' },
      reply: null
    })

    const t1 = { ...turn('我刚才问到哪了'), threadId: 'agent-test-resume' }
    await runTurn({ classify, agent }, t1)
    await runTurn(
      { classify, agent },
      {
        ...t1,
        input: '那我刚才那单什么时候到账'
      }
    )

    // 第二轮发给模型的消息里带着第一轮的用户输入与助手答复
    const seen = agentModel.calls[1]?.messages
      .map((m) => String(m.content))
      .join('\n')
    expect(seen).toContain('我刚才问到哪了')
    expect(seen).toContain('第一轮答复')
    expect(seen).toContain('那我刚才那单什么时候到账')
  })
})
