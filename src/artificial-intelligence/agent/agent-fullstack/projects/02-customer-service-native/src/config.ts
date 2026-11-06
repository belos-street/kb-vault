/**
 * 配置边界：所有环境变量只在这里读取和校验。
 *
 * 作用
 * - 把 process.env 收敛成一个只读对象，其他模块不直接碰环境变量。
 * - 缺 Key 时在启动阶段就失败，不要带着空 Key 去请求模型。
 *
 * 为什么导出函数而不是模块级常量
 * - 测试可以在调用 loadConfig() 之前改 env，离线测试不需要真实 Key。
 * - 模块级常量会在 import 时就执行，任何一个测试文件 import 到都会被迫带 Key。
 */
import { z } from 'zod'

const EnvSchema = z.object({
  OPENAI_API_KEY: z.string().min(1, '缺少 OPENAI_API_KEY'),
  OPENAI_BASE_URL: z.url().default('https://api.deepseek.com'),
  DEFAULT_MODEL: z.string().min(1).default('deepseek-v4-flash'),
  CURRENT_USER_ID: z.string().min(1).default('u_001'),
  MAX_MODEL_CALLS: z.coerce.number().int().min(1).default(8),
  MAX_RETRIES: z.coerce.number().int().min(0).default(2),
  COMPACT_TRIGGER_TOKENS: z.coerce.number().int().min(100).default(6000),
  COMPACT_KEEP_MESSAGES: z.coerce.number().int().min(2).default(8)
})

export interface AppConfig {
  apiKey: string
  baseUrl: string
  model: string
  userId: string
  maxModelCalls: number
  maxRetries: number
  compactTriggerTokens: number
  compactKeepMessages: number
}

export function loadConfig(): AppConfig {
  const parsed = EnvSchema.safeParse(process.env)
  if (!parsed.success) {
    const detail = parsed.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('; ')
    throw new Error(`环境变量不合法：${detail}`)
  }

  const env = parsed.data
  return {
    apiKey: env.OPENAI_API_KEY,
    // 去掉末尾斜杠，避免拼出 //chat/completions
    baseUrl: env.OPENAI_BASE_URL.replace(/\/+$/, ''),
    model: env.DEFAULT_MODEL,
    userId: env.CURRENT_USER_ID,
    maxModelCalls: env.MAX_MODEL_CALLS,
    maxRetries: env.MAX_RETRIES,
    compactTriggerTokens: env.COMPACT_TRIGGER_TOKENS,
    compactKeepMessages: env.COMPACT_KEEP_MESSAGES
  }
}
