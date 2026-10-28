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

标准流程（必须按顺序，不得跳过）：
1. 先派 sql_expert 取数。
2. 拿到数据后必须派 chart_expert 至少生成 2 张图；不得跳过 chart_expert。
3. 最后自己写 Markdown 报告；如果图表工具失败，如实写入报告并说明原因。

要求：
1. 报告中的数字必须来自 sql_expert 的结果，不得编造。
2. 引用数字必须与 sql_expert 的查询结果逐字一致；不得自行加减乘除或换算。
   图表数据必须原样来自 sql_expert；chart_expert 只做格式转换，禁止自行按周/月聚合。
   缺少汇总或周/月维度时，让 sql_expert 用 SQL 聚合后再写。
3. 数据不足或查询失败时如实说明，不要用假设数据补全。
4. 报告包含：结论摘要（summary）与完整正文（markdown，含图表所在维度说明）。`

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
    // responseFormat 的对象形式会把额外字段透传给 withStructuredOutput；
    // 该端点不支持 json_schema，用 jsonMode（prompt 必须包含 "JSON" 字样）
    responseFormat: {
      schema: ReportSchema,
      method: 'jsonMode',
      prompt:
        '根据以上对话生成最终报告，只输出 JSON 对象，形如 {"summary":"...","markdown":"..."}。'
    }
  }).compile({ name: 'supervisor' })
}
