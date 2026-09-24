import { z } from '@hono/zod-openapi'

/** OpenAPI 文档用统一信封：成功侧 */
export const okEnvelope = <T extends z.ZodType>(data: T) =>
  z.object({ code: z.string(), data })

/** OpenAPI 文档用统一信封：失败侧（details 为调试信息，不入契约） */
export const failEnvelope = z.object({
  code: z.string(),
  message: z.string(),
})

export const authUserSchema = z.object({
  id: z.string(),
  email: z.string(),
  role: z.string(),
})
