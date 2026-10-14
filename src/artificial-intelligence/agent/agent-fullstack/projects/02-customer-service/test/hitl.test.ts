/**
 * HITL 中间件测试（todo §4.6）：敏感工具中断 → approve / edit / reject 三分支
 * 恢复、非敏感工具不中断
 *
 * 手法：fakeModel FIFO 排队（Spike B 结论）——respondWithTools 排工具调用轮，
 * respond 排恢复后的最终话术轮；MemorySaver + 独立 thread_id 隔离每条用例。
 * 数据自理：beforeAll 自建测试订单 SO-TEST-HITL-01，afterAll 删除——
 * 不碰种子订单，避免与 tools.test.ts 互相污染（两者都动 SO-2026-0812 会翻车）。
 */
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'bun:test'
import { AIMessage } from '@langchain/core/messages'
import { Command, MemorySaver } from '@langchain/langgraph'
import { Client } from 'pg'
import { fakeModel } from 'langchain'
import { buildAgent } from '@/agent/agent.ts'
import { toAgentState, turnConfig } from '@/agent/run-turn.ts'
import { config } from '@/config.ts'
import { closePool, getOrderById } from '@/services/db.ts'

const TEST_ORDER = 'SO-TEST-HITL-01'

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
       VALUES ($1, 'u_001', 'HITL 测试商品', 88.00, '已签收', 'SF-TEST-HITL', now() - INTERVAL '2 days', now() - INTERVAL '1 day')`,
      [TEST_ORDER]
    )
  })
})

afterAll(async () => {
  await withClient(async (sql) => {
    await sql(`DELETE FROM orders WHERE order_id = $1`, [TEST_ORDER])
    await sql(`DELETE FROM tickets WHERE summary = $1`, ['hitl 单测工单'])
  })
  await closePool()
})

let threadSeq = 0
function makeConfig() {
  threadSeq += 1
  return turnConfig(`hitl-test-${threadSeq}`, 'u_001')
}

describe('敏感工具触发中断', () => {
  it('process_refund 被拦截：actionRequests / reviewConfigs 齐全', async () => {
    const model = fakeModel().respondWithTools([
      {
        name: 'process_refund',
        args: { order_id: TEST_ORDER, reason: '七天无理由' }
      }
    ])
    const agent = await buildAgent({ model, checkpointer: new MemorySaver() })

    const state = toAgentState(
      await agent.invoke(
        { messages: [{ role: 'user', content: `帮我退了 ${TEST_ORDER}` }] },
        makeConfig()
      )
    )

    expect(state.interrupts).toHaveLength(1)
    const request = state.interrupts[0]?.value
    expect(request?.actionRequests[0]?.name).toBe('process_refund')
    const review = request?.reviewConfigs.find(
      (c) => c.actionName === 'process_refund'
    )
    expect(review?.allowedDecisions).toEqual(['approve', 'edit', 'reject'])
  })

  it('create_ticket 的允许决策只有 approve / reject（不许 edit）', async () => {
    const model = fakeModel().respondWithTools([
      {
        name: 'create_ticket',
        args: { type: 'complaint', summary: 'hitl 单测工单' }
      }
    ])
    const agent = await buildAgent({ model, checkpointer: new MemorySaver() })

    const state = toAgentState(
      await agent.invoke(
        { messages: [{ role: 'user', content: '我要投诉' }] },
        makeConfig()
      )
    )

    const request = state.interrupts[0]?.value
    expect(request?.actionRequests[0]?.name).toBe('create_ticket')
    const review = request?.reviewConfigs.find(
      (c) => c.actionName === 'create_ticket'
    )
    expect(review?.allowedDecisions).toEqual(['approve', 'reject'])
  })
})

describe('三分支恢复', () => {
  // approve / edit 会把测试订单改成「退款中」——每条用例前重置，
  // 否则后续用例的 process_refund 会被「已有退款在处理」挡掉
  beforeEach(async () => {
    await withClient(async (sql) => {
      await sql(
        `UPDATE orders SET status = '已签收', refund_reason = NULL WHERE order_id = $1`,
        [TEST_ORDER]
      )
    })
  })

  it('approve：按原参数执行工具（订单变「退款中」）', async () => {
    const model = fakeModel()
      .respondWithTools([
        {
          name: 'process_refund',
          args: { order_id: TEST_ORDER, reason: '七天无理由' }
        }
      ])
      .respond(new AIMessage('退款已发起，1-3 个工作日到账'))
    const agent = await buildAgent({ model, checkpointer: new MemorySaver() })
    const cfg = makeConfig()

    await agent.invoke(
      { messages: [{ role: 'user', content: `帮我退了 ${TEST_ORDER}` }] },
      cfg
    )
    const state = toAgentState(
      await agent.invoke(
        new Command({ resume: { decisions: [{ type: 'approve' }] } }),
        cfg
      )
    )

    expect(state.messages.at(-1)?.content).toContain('退款已发起')
    const order = await getOrderById(TEST_ORDER)
    expect(order?.status).toBe('退款中')
    expect(order?.refund_reason).toBe('七天无理由')
  })

  it('edit：按修订参数执行（refund_reason 是修订值）', async () => {
    const model = fakeModel()
      .respondWithTools([
        {
          name: 'process_refund',
          args: { order_id: TEST_ORDER, reason: '原始原因' }
        }
      ])
      .respond(new AIMessage('已按修订后的参数执行'))
    const agent = await buildAgent({ model, checkpointer: new MemorySaver() })
    const cfg = makeConfig()

    await agent.invoke(
      { messages: [{ role: 'user', content: `帮我退了 ${TEST_ORDER}` }] },
      cfg
    )
    const state = toAgentState(
      await agent.invoke(
        new Command({
          resume: {
            decisions: [
              {
                type: 'edit',
                editedAction: {
                  name: 'process_refund',
                  args: { order_id: TEST_ORDER, reason: '修订原因' }
                }
              }
            ]
          }
        }),
        cfg
      )
    )

    expect(state.messages.at(-1)?.content).toContain('已按修订后的参数执行')
    const order = await getOrderById(TEST_ORDER)
    expect(order?.refund_reason).toBe('修订原因')
  })

  it('reject：工具不执行 + ToolMessage(error) 让模型礼貌收尾', async () => {
    const model = fakeModel()
      .respondWithTools([
        {
          name: 'process_refund',
          args: { order_id: TEST_ORDER, reason: '七天无理由' }
        }
      ])
      .respond(new AIMessage('好的，已为您取消退款申请'))
    const agent = await buildAgent({ model, checkpointer: new MemorySaver() })
    const cfg = makeConfig()

    await agent.invoke(
      { messages: [{ role: 'user', content: `帮我退了 ${TEST_ORDER}` }] },
      cfg
    )
    const state = toAgentState(
      await agent.invoke(
        new Command({
          resume: { decisions: [{ type: 'reject', message: '坐席拒绝执行' }] }
        }),
        cfg
      )
    )

    // 工具未执行：订单状态不变
    const order = await getOrderById(TEST_ORDER)
    expect(order?.status).toBe('已签收')
    // 拒绝以 ToolMessage(status: error) 进上下文，模型据此收尾
    const toolMsg = state.messages.find(
      (m) =>
        m.getType() === 'tool' && String(m.content).includes('坐席拒绝执行')
    )
    expect(toolMsg).toBeDefined()
    expect(state.messages.at(-1)?.content).toContain('已为您取消退款申请')
  })
})

describe('非敏感工具不中断', () => {
  it('query_order / search_policy 直接放行（无 __interrupt__）', async () => {
    const model = fakeModel()
      .respondWithTools([
        { name: 'query_order', args: { order_id: TEST_ORDER } }
      ])
      .respondWithTools([
        { name: 'search_policy', args: { query: '退款政策' } }
      ])
      .respond(new AIMessage('订单与政策都查好了'))
    const agent = await buildAgent({ model, checkpointer: new MemorySaver() })

    const state = toAgentState(
      await agent.invoke(
        { messages: [{ role: 'user', content: '查下我的订单和退款政策' }] },
        makeConfig()
      )
    )

    expect(state.interrupts).toHaveLength(0)
    expect(state.messages.at(-1)?.content).toContain('订单与政策都查好了')
  })
})
