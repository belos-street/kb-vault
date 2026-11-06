/**
 * 结构化收口（第 4 步）。
 *
 * 作用
 * - 把"任务结论"变成可校验的对象，而不是一段自由文本。
 * - 实现方式：定义一个保留工具 submit_result，强制模型最后调用它，再用 Zod 校验。
 *
 * 注意
 * - 这个工具名会被占用；业务工具不能同名，否则会静默走错分支。
 * - 收口放在循环末尾，不要一开始就要求结构化，否则会干扰工具推理。
 */
import { z } from 'zod'

/** 保留工具名：业务工具不得使用 */
export const RESULT_TOOL_NAME = 'submit_result'

export const ResultSchema = z.object({
  resolution: z.enum([
    'answered',
    'refund_initiated',
    'ticket_created',
    'escalated'
  ]),
  follow_up_needed: z.boolean()
})

export type AgentResult = z.infer<typeof ResultSchema>

/** 给模型看的 JSON Schema；去掉部分服务端不接受的 $schema。 */
export function toResultToolSchema(): Record<string, unknown> {
  const json = z.toJSONSchema(ResultSchema) as Record<string, unknown>
  delete json.$schema
  return json
}

/** 校验模型传来的收口参数；失败抛错，由循环层决定是重问还是降级。 */
export function parseResult(args: unknown): AgentResult {
  const parsed = ResultSchema.safeParse(args)
  if (!parsed.success) {
    const detail = parsed.error.issues
      .map((issue) => `${issue.path.join('.') || 'args'}: ${issue.message}`)
      .join('; ')
    throw new Error(`结构化收口校验失败：${detail}`)
  }
  return parsed.data
}
