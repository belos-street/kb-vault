/**
 * Spike B —— interrupt() + Command({ resume }) 的恢复语义（todo.md §1）
 *
 * 验证点：
 *   1. 中断结果如何暴露（state.__interrupt__）
 *   2. resume payload 从 interrupt() 的返回值取到
 *   3. 恢复后节点从头重跑 —— interrupt() 之前的副作用会执行两次
 *
 * 用法：bun scripts/spike-b-interrupt.ts
 */
import {
  Command,
  END,
  interrupt,
  MemorySaver,
  START,
  StateGraph,
  StateSchema
} from '@langchain/langgraph'
import { z } from 'zod'

const State = new StateSchema({
  status: z.string().optional(),
  entered: z.number().default(0)
})

// 模块级计数器：模拟「interrupt 之前写文件」这种不该存在的副作用
let writeCount = 0

const exportReport = async () => {
  writeCount++
  const decision = interrupt({
    action: 'export',
    summary: '报告已生成',
    tryNo: writeCount
  })
  return {
    status: decision.approved ? 'exported' : 'rejected',
    entered: writeCount
  }
}

const graph = new StateGraph(State)
  .addNode('exportReport', exportReport)
  .addEdge(START, 'exportReport')
  .addEdge('exportReport', END)
  .compile({ checkpointer: new MemorySaver() })

const config = { configurable: { thread_id: 'spike-b' } }

const first = (await graph.invoke({}, config)) as unknown as {
  __interrupt__?: unknown // oxlint: no-underscore-dangle —— LangGraph 保留 key
}
console.log('[spike-b] 首次 invoke 的 __interrupt__ =', first.__interrupt__)

const resumed = await graph.invoke(
  new Command({ resume: { approved: true } }),
  config
)
console.log('[spike-b] resume 后 state =', {
  status: resumed.status,
  entered: resumed.entered
})
console.log(
  `[spike-b] interrupt 前的副作用执行次数 = ${writeCount}（2 = 节点重跑，副作用必须放在 interrupt 之后）`
)
