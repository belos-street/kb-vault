/**
 * Spike A —— PostgresSaver 最小验证（todo.md §1）
 *
 * 用法（两个独立进程，模拟重启）：
 *   bun scripts/spike-a-checkpoint.ts write    # 1. 写入两轮对话
 *   bun scripts/spike-a-checkpoint.ts resume   # 2. 新进程：读取 + 续聊
 *
 * 验证点：setup() 建表 / checkpoint 落库 / 跨进程同 thread_id 恢复
 * 结论回填：todo.md 底部「Spike 结论」
 */
import { AIMessage } from '@langchain/core/messages'
import { createAgent } from 'langchain'
import { PostgresSaver } from '@langchain/langgraph-checkpoint-postgres'
import { config } from '../src/config.ts'

// fakeModel 导入源探测：官方 unit-testing 指南推荐自 "langchain" 导入，
// 若当前版本未从主包 re-export，则回退 @langchain/core/testing
let fakeModel: () => {
  respond: (entry: unknown) => unknown
}
try {
  const m = (await import('langchain')) as unknown as {
    fakeModel?: typeof fakeModel
  }
  if (typeof m.fakeModel !== 'function')
    throw new Error('langchain 未导出 fakeModel')
  fakeModel = m.fakeModel
  console.log('[probe] fakeModel 来自 "langchain"')
} catch {
  const m = (await import('@langchain/core/testing')) as unknown as {
    fakeModel: typeof fakeModel
  }
  fakeModel = m.fakeModel
  console.log('[probe] fakeModel 来自 "@langchain/core/testing"')
}

const THREAD_ID = process.argv[3] ?? `spike-a-${Date.now()}`
const invokeConfig = { configurable: { thread_id: THREAD_ID } }

// 连接池关闭 API 形态探测：优先 end()，兜底 pool.end()
async function closePool(checkpointer: PostgresSaver) {
  const maybe = checkpointer as unknown as {
    end?: () => Promise<void>
    pool?: { end: () => Promise<void> }
  }
  if (typeof maybe.end === 'function') await maybe.end()
  else if (maybe.pool) await maybe.pool.end()
  else console.log('[probe] PostgresSaver 无 end/pool 关闭入口，依赖进程退出')
}

const mode = process.argv[2] ?? 'write'

// FakeModel FIFO 队列：一次 invoke 消费一条响应，按模式排够数量
function buildModel(invocations: number) {
  const model = fakeModel()
  for (let i = 0; i < invocations; i++)
    model.respond(new AIMessage(`回复 ${i + 1}`))
  return model
}

const checkpointer = PostgresSaver.fromConnString(config.DATABASE_URL)
await checkpointer.setup() // 首次必调：建 checkpoint 相关表

// FakeModel 类型系统不认（运行时兼容），将 agent 收窄为本 spike 用到的最小接口
const agent = createAgent({
  model: buildModel(mode === 'write' ? 2 : 1) as never,
  checkpointer
}) as unknown as {
  invoke: (input: unknown, cfg: unknown) => Promise<unknown>
  getState: (cfg: unknown) => Promise<{ values: { messages: unknown[] } }>
}

if (mode === 'write') {
  console.log(`[write] thread_id = ${THREAD_ID}（resume 时传入）`)
  await agent.invoke(
    { messages: [{ role: 'user', content: '第一轮' }] },
    invokeConfig
  )
  await agent.invoke(
    { messages: [{ role: 'user', content: '第二轮' }] },
    invokeConfig
  )
  const state = await agent.getState(invokeConfig)
  const count = state.values.messages.length
  console.log(`[write] messages = ${count}（预期 4：2 user + 2 ai）`)
} else if (mode === 'resume') {
  console.log(`[resume] thread_id = ${THREAD_ID}`)
  const state = await agent.getState(invokeConfig)
  const count = state.values.messages.length
  const ok = count === 4
  console.log(
    `[resume] 跨进程读取 messages = ${count}（预期 4）→ ${ok ? '恢复成功 ✓' : '恢复失败 ✗'}`
  )
  await agent.invoke(
    { messages: [{ role: 'user', content: '重启后第三轮' }] },
    invokeConfig
  )
  const after = await agent.getState(invokeConfig)
  console.log(
    `[resume] 续聊后 messages = ${after.values.messages.length}（预期 6）`
  )
} else {
  console.error(
    '用法：bun scripts/spike-a-checkpoint.ts write|resume [thread_id]'
  )
  process.exit(1)
}

await closePool(checkpointer)
