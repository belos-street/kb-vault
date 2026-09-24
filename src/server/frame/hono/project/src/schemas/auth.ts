import { z } from '@hono/zod-openapi'

export const registerSchema = z.object({
  email: z.email(),
  password: z.string().min(8).max(72),
})

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
})
