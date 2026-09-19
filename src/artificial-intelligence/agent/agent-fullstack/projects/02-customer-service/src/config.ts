import 'dotenv/config'
import * as z from 'zod'

const envSchema = z.object({
  // 模型（provider:model 字符串，交由 initChatModel 初始化）
  DEFAULT_MODEL: z.string().default('openai:gpt-5.4'),
  CLASSIFIER_MODEL: z.string().default('openai:gpt-5.4-mini'),
  FALLBACK_MODEL_1: z.string().optional(),
  FALLBACK_MODEL_2: z.string().optional(),

  // 数据库（业务数据 + checkpoint 同库）
  DATABASE_URL: z
    .string()
    .default('postgres://postgres:postgres@localhost:5432/customer_service'),

  // 中间件参数
  SUMMARIZE_TRIGGER_FRACTION: z.coerce.number().min(0).max(1).default(0.8),
  SUMMARIZE_KEEP_FRACTION: z.coerce.number().min(0).max(1).default(0.3),
  MODEL_CALL_THREAD_LIMIT: z.coerce.number().int().positive().default(25),

  // 自建 trace / 评估输出
  TRACE_DIR: z.string().default('./data/traces'),
  EVAL_REPORT_DIR: z.string().default('./data/eval')
})

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  const detail = parsed.error.issues
    .map((i) => `${i.path.join('.')}: ${i.message}`)
    .join('\n')
  console.error(`[config] 环境变量校验失败：\n${detail}`)
  process.exit(1)
}

export const config = parsed.data
