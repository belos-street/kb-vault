/**
 * Agent Runtime Context（2.3）：createAgent 的 contextSchema
 *
 * CLI invoke 时传 context: { userId }，经框架注入每个工具的
 * runtime.context —— 工具层凭它做权限约束（权限最小化，注入防护的一环）。
 */
import { z } from 'zod'

export const ContextSchema = z.object({
  userId: z.string().describe('当前登录用户 ID（u_001 ~ u_005）')
})

export type AgentContext = z.infer<typeof ContextSchema>
