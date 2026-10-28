import * as z from 'zod'
import { MessagesValue, StateSchema } from '@langchain/langgraph'

/**
 * Supervisor 的结构化收口 Schema（3.4 responseFormat）
 *
 * meta.title 固定工具名：responseFormat 在 langgraph prebuilt 里走
 * model.withStructuredOutput，title 只影响可读性，但保持稳定便于测试断言。
 */
export const ReportSchema = z
  .object({
    summary: z.string(),
    markdown: z.string()
  })
  .meta({ title: 'extract-report' })

export const WorkflowState = new StateSchema({
  // append：多 Agent 共用同一段对话历史（与 supervisor 子图共享同名 channel）
  messages: MessagesValue,
  intent: z.enum(['analysis', 'metrics', 'chat']).optional(), // routeIntent 写
  reply: z.string().optional(), // chat 分支直接回复
  structuredResponse: ReportSchema.optional(), // supervisor 收口，last-value
  status: z.string().optional(), // exportReport 写
  reportPath: z.string().optional() // exportReport 写
})
