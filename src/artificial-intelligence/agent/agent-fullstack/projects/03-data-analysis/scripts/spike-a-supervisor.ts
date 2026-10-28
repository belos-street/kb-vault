/**
 * Spike A —— createSupervisor + responseFormat 的落点（todo.md §1）
 *
 * 验证点：
 *   1. createSupervisor 返回未编译的 StateGraph（必须 .compile()）
 *   2. responseFormat 走 generate_structured_response 节点，产物落在
 *      子图 state 的 structuredResponse key
 *   3. 编译后的 supervisor 直接 addNode 挂到外层图，共享同名 channel 后
 *      外层能读到 state.structuredResponse
 *
 * 说明：仓库内 .env 是占位 Key（无法真实调用模型），此处用 fakeModel 驱动
 * 全流程；接通真模型后动作序列不变（handoff 工具名 = transfer_to_<agent>）。
 *
 * 用法：bun scripts/spike-a-supervisor.ts
 */
import { AIMessage, HumanMessage } from '@langchain/core/messages'
import {
  END,
  MessagesValue,
  START,
  StateGraph,
  StateSchema
} from '@langchain/langgraph'
import { createReactAgent } from '@langchain/langgraph/prebuilt'
import { createSupervisor } from '@langchain/langgraph-supervisor'
import { fakeModel } from 'langchain'
import { z } from 'zod'

const ReportSchema = z
  .object({
    summary: z.string(),
    markdown: z.string()
  })
  .meta({ title: 'extract-report' })

const OuterState = new StateSchema({
  messages: MessagesValue, // append：与 supervisor 共享
  structuredResponse: ReportSchema.optional() // last-value：与 supervisor 共享
})

// 专家 Agent：一次调用即结束（无工具）
const expertModel = fakeModel().respond(
  new AIMessage('华南区上月销售额 36.28 万，环比 +12%（示例数据）')
)

const sqlExpert = createReactAgent({
  llm: expertModel,
  tools: [],
  name: 'sql_expert',
  prompt: '你是 SQL 专家。'
})

// 主管：先派活，再收口（responseFormat 由独立节点生成）
const supervisorModel = fakeModel()
  .respondWithTools([{ name: 'transfer_to_sql_expert', args: {} }])
  .respond(new AIMessage('sql_expert 已返回结果'))
  .structuredResponse({
    summary: '华南区上月销售额 36.28 万，环比 +12%',
    markdown: '# 华南区上月销售分析\n\n销售额 36.28 万，环比 +12%。'
  })

const supervisor = createSupervisor({
  agents: [sqlExpert],
  llm: supervisorModel,
  prompt:
    '你是数据分析主管。先派 sql_expert 取数，再输出 summary 与 markdown。',
  outputMode: 'full_history',
  responseFormat: ReportSchema
})

console.log(
  `[spike-a] createSupervisor 返回值编译前类型 = ${supervisor.constructor.name}`
)

const outer = new StateGraph(OuterState)
  .addNode('analysis', supervisor.compile())
  .addEdge(START, 'analysis')
  .addEdge('analysis', END)
  .compile()

const out = await outer.invoke({
  messages: [new HumanMessage('上个月华南区销售额多少？写一份简短报告')]
})

const structured = (out as { structuredResponse?: unknown }).structuredResponse
console.log('[spike-a] 外层 state.structuredResponse =', structured)

const ok =
  typeof structured === 'object' &&
  structured !== null &&
  'markdown' in structured
console.log(
  `[spike-a] 结论：${ok ? '共享同名 key 可直读 ✓' : '未读到，需改用包装节点 ✗'}`
)
