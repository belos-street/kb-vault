import { z } from 'zod'

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(32),
  REDIS_URL: z.string().min(1),
  PORT: z.coerce.number().int().positive().default(3000),
  ENABLE_DOCS: z.enum(['true', 'false']).default('true'), // 生产设 false：/api/doc 与 /ui 不上线
})

const parsed = envSchema.safeParse(process.env)
if (!parsed.success) {
  const detail = parsed.error.issues
    .map((i) => `${i.path.join('.')}: ${i.message}`)
    .join('; ')
  console.error(`[env] 环境变量校验失败 → ${detail}`)
  process.exit(1)
}

export const env = parsed.data
