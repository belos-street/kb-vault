/**
 * 应用配置：从环境变量加载，zod 校验确保必填项不缺、格式正确
 *
 * 支持的变量（见 .env.example）：
 *   OPENAI_API_KEY  — LLM API 密钥
 *   OPENAI_BASE_URL — API 端点（默认 DeepSeek）
 *   DEFAULT_MODEL   — 模型名
 */
import 'dotenv/config'
import { z } from 'zod'

/** 环境变量 schema：定义每个变量的校验规则和默认值 */
const configSchema = z.object({
  OPENAI_API_KEY: z.string().min(1, 'OPENAI_API_KEY 不能为空'),
  OPENAI_BASE_URL: z.httpUrl().default('https://api.deepseek.com'),
  DEFAULT_MODEL: z.string().min(1).default('deepseek-v4-flash')
})

export type AppConfig = z.infer<typeof configSchema>

/**
 * 加载并校验环境变量
 * 校验失败时抛出详细错误信息（指出哪些变量缺失或格式错误）
 */
function loadConfig(): AppConfig {
  const raw = {
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    OPENAI_BASE_URL: process.env.OPENAI_BASE_URL,
    DEFAULT_MODEL: process.env.DEFAULT_MODEL
  }

  const result = configSchema.safeParse(raw)

  if (!result.success) {
    const issues = result.error.issues.map(
      (issue) => `  - ${issue.path.join('.')}: ${issue.message}`
    )
    throw new Error(`环境变量校验失败：\n${issues.join('\n')}`)
  }

  return result.data
}

/** 应用全局配置：模块加载时自动初始化，后续直接引用 */
export const config = loadConfig()
