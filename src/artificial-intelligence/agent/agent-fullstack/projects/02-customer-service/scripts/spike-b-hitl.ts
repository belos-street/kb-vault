/**
 * Spike B —— HITL 最小验证（todo.md §1）
 *
 * 用法：bun scripts/spike-b-hitl.ts
 *
 * 验证点：
 *   1. humanInTheLoopMiddleware 的中断如何在 invoke 结果中暴露（__interrupt__）
 *   2. resume payload 的精确字段（{ decisions: [{ type }] } vs [{ type }]）
 *   3. approve / edit / reject 三决策的行为（edit 修订参数、reject 不执行工具）
 * 结论回填：todo.md 底部「Spike 结论」
 *
 * FakeModel 排队规则（官方 @langchain/core/testing）：FIFO，一次 invoke 消费一条；
 * `respondWithTools` 排工具调用轮，`respond(factory)` 排恢复后的最终话术轮。
 */
import * as z from 'zod'
import { AIMessage } from '@langchain/core/messages'
import { Command, MemorySaver } from '@langchain/langgraph'
import { createAgent, tool, humanInTheLoopMiddleware } from 'langchain'

// fakeModel 导入源探测（同 Spike A）
type FakeModelBuilder = () => {
  respondWithTools: (
    r: Array<{ name: string; args: Record<string, unknown> }>
  ) => {
    respond: (f: (msgs: unknown[]) => AIMessage) => unknown
  }
}
let fakeModel: FakeModelBuilder
try {
  const m = (await import('langchain')) as unknown as {
    fakeModel?: FakeModelBuilder
  }
  if (typeof m.fakeModel !== 'function')
    throw new Error('no fakeModel in langchain')
  fakeModel = m.fakeModel
} catch {
  const m = (await import('@langchain/core/testing')) as unknown as {
    fakeModel: FakeModelBuilder
  }
  fakeModel = m.fakeModel
}

const executed: string[] = []

const doRefund = tool(
  async ({ order_id }) => {
    executed.push(order_id)
    return `退款 ${order_id} 已执行`
  },
  {
    name: 'do_refund',
    description: '执行退款',
    schema: z.object({ order_id: z.string() })
  }
)

const hitl = humanInTheLoopMiddleware({
  interruptOn: {
    do_refund: { allowedDecisions: ['approve', 'edit', 'reject'] }
  }
})

function buildAgent() {
  executed.length = 0
  const model = fakeModelBuilder()
  const agent = createAgent({
    model: model as never, // FakeBuiltModel 实现了 BaseChatModel，类型系统不认但运行时兼容
    tools: [doRefund],
    middleware: [hitl],
    checkpointer: new MemorySaver()
  })
  return agent
}

// 每个场景独立 fake 模型：第一轮强制发起 do_refund 工具调用，恢复后的
// 最终话术轮用 factory 动态应答（报告收到的人机决策结果）
function fakeModelBuilder() {
  return fakeModel()
    .respondWithTools([{ name: 'do_refund', args: { order_id: 'SO-001' } }])
    .respond((msgs) => {
      const last = JSON.stringify(msgs.at(-1)).slice(0, 200)
      return new AIMessage(`已按人工决策处理完毕（最后一轮输入：${last}）`)
    })
}

function pickInterrupt(result: unknown) {
  const r = result as Record<string, unknown>
  // oxlint-disable-next-line no-underscore-dangle -- LangGraph 中断字段名就是 __interrupt__
  return r.__interrupt__ ?? r.interrupt ?? null
}

async function runScenario(
  name: string,
  decision: Record<string, unknown>,
  expectExecuted: string | null
) {
  console.log(`\n===== 场景：${name} =====`)
  const agent = buildAgent()
  const cfg = { configurable: { thread_id: `spike-b-${name}` } }

  const r1 = (await agent.invoke(
    { messages: [{ role: 'user', content: '帮我退款 SO-001' }] },
    cfg
  )) as Record<string, unknown>
  const interrupt = pickInterrupt(r1)
  console.log('[中断]', interrupt ? '触发 ✓' : '未触发 ✗')

  // resume payload 形态探测：先试 { decisions: [...] }，失败回退裸数组
  let r2: Record<string, unknown> | null = null
  const shapes: Array<[string, unknown]> = [
    ['{ decisions: [...] }', new Command({ resume: decision })],
    ['[...]（裸数组）', new Command({ resume: decision.decisions as never })]
  ]
  for (const [label, cmd] of shapes) {
    try {
      // oxlint-disable-next-line no-await-in-loop -- 形态探测必须逐个尝试
      r2 = (await agent.invoke(cmd as never, cfg)) as Record<string, unknown>
      console.log(`[恢复] payload 形态 ${label} 可用 ✓`)
      break
    } catch (err) {
      console.log(
        `[恢复] payload 形态 ${label} 失败：${(err as Error).message.slice(0, 140)}`
      )
    }
  }

  if (r2) {
    const last = (r2.messages as Array<{ content: unknown }> | undefined)?.at(
      -1
    )
    console.log(
      '[恢复] 最终消息 =',
      JSON.stringify(last?.content)?.slice(0, 220)
    )
  }
  const ok =
    expectExecuted === null
      ? executed.length === 0
      : executed.includes(expectExecuted)
  console.log(
    `[副作用] executed = ${JSON.stringify(executed)} → ${ok ? '符合预期 ✓' : '不符合预期 ✗'}`
  )
}

await runScenario('approve', { decisions: [{ type: 'approve' }] }, 'SO-001')
await runScenario(
  'edit',
  {
    decisions: [
      {
        type: 'edit',
        editedAction: { name: 'do_refund', args: { order_id: 'SO-EDIT' } }
      }
    ]
  },
  'SO-EDIT'
)
await runScenario(
  'reject',
  { decisions: [{ type: 'reject', message: '金额有误，暂不退' }] },
  null
)

console.log('\n[结论] 请把上方实测形态回填 todo.md「Spike 结论」')
