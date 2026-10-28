/** SQL 专家：工具全部来自 MCP（与本地 tool() 的使用体验一致） */
import type { BaseChatModel } from '@langchain/core/language_models/chat_models'
import type { StructuredToolInterface } from '@langchain/core/tools'
import { createAgent } from 'langchain'
import { buildSqlExpertPrompt } from '@/prompts/sql-expert.ts'

export function createSqlAgent(
  model: BaseChatModel,
  tools: StructuredToolInterface[]
) {
  return createAgent({
    model,
    tools,
    name: 'sql_expert',
    systemPrompt: buildSqlExpertPrompt(),
    description: '把分析需求转成只读 SQL，经 MCP query_sales 执行并返回表格数据'
  }).graph
}
