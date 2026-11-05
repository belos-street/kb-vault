/**
 * 环境边界：缺 Key 就直接失败，不要带着空 Key 去请求。
 * Bun 会自动加载 .env，不需要 dotenv。
 */
import type { ModelConfig } from './types'

export function loadConfig(): ModelConfig {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error('缺少 OPENAI_API_KEY：在 .env 里配置后重试')
  }

  return {
    apiKey,
    // 去掉末尾斜杠，避免拼出 //chat/completions
    baseUrl: (
      process.env.OPENAI_BASE_URL ?? 'https://api.deepseek.com'
    ).replace(/\/+$/, ''),
    model: process.env.DEFAULT_MODEL ?? 'deepseek-v4-flash'
  }
}
