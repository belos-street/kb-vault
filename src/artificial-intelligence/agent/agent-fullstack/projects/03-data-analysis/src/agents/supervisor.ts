/**
 * Supervisor 组装（3.4）
 *
 * ⚠️ 两个高频坑：参数名是 llm；返回值是未编译的 StateGraph，必须 .compile()
 * ⚠️ 不传 checkpointer：作为子图挂载时继承外层的那一个
 */
import type { BaseChatModel } from '@langchain/core/language_models/chat_models'
import { createSupervisor } from '@langchain/langgraph-supervisor'
import type { createChartAgent } from '@/agents/chart-agent.ts'
import type { createSqlAgent } from '@/agents/sql-agent.ts'
import { ReportSchema } from '@/graph/state.ts'

const SUPERVISOR_PROMPT = `你是数据分析团队主管，手下有两名专家：
- sql_expert：把需求转成只读 SQL 并取数
- chart_expert：把数据按维度画成图表并落盘

标准流程：先派 sql_expert 取数，再派 chart_expert 出图，最后自己写 Markdown 报告。
要求：
1. 报告中的数字必须来自 sql_expert 的结果，不得编造。
2. 数据不足或查询失败时如实说明，不要用假设数据补全。
3. 报告包含：结论摘要（summary）与完整正文（markdown，含图表所在维度说明）。`

export function createAnalysisSupervisor(params: {
  model: BaseChatModel
  sqlAgent: ReturnType<typeof createSqlAgent>
  chartAgent: ReturnType<typeof createChartAgent>
}) {
  const { model, sqlAgent, chartAgent } = params
  return createSupervisor({
    agents: [sqlAgent, chartAgent],
    llm: model,
    prompt: SUPERVISOR_PROMPT,
    outputMode: 'full_history',
    responseFormat: ReportSchema
  }).compile({ name: 'supervisor' })
}
