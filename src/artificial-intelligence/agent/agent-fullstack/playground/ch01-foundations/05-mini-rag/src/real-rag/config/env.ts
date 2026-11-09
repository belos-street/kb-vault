/**
 * 配置层：环境变量 → ModelConfig。
 *
 * 对话模型和向量模型分开配置，因为多数国产 API 只提供 chat，
 * 不提供 /embeddings。没有配 EMBEDDING_API_KEY 时自动退回本地哈希向量。
 */
import type { ModelConfig } from '../contracts/types'

function trimTrailingSlash(url: string): string {
  return url.replace(/\/+$/, '')
}

/** 对话模型配置，缺失 Key 时直接失败，不要等到第一次调用 */
export function loadChatConfig(): ModelConfig {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error('缺少 OPENAI_API_KEY：在 real-rag/.env 里配置后重试')
  }

  return {
    apiKey,
    baseUrl: trimTrailingSlash(
      process.env.OPENAI_BASE_URL ?? 'https://api.deepseek.com'
    ),
    model: process.env.DEFAULT_MODEL ?? 'deepseek-v4-flash'
  }
}

/** 向量模型配置；没有配置返回 null，由调用方退回本地实现 */
export function loadEmbeddingConfig(): ModelConfig | null {
  const apiKey = process.env.EMBEDDING_API_KEY
  if (!apiKey) return null

  return {
    apiKey,
    baseUrl: trimTrailingSlash(
      process.env.EMBEDDING_BASE_URL ?? 'https://api.openai.com/v1'
    ),
    model: process.env.EMBEDDING_MODEL ?? 'text-embedding-3-small'
  }
}
