/**
 * 向量层：把文本转成向量。
 *
 * 两种实现同一个接口：
 * - OpenAI 兼容 /embeddings：真实语义向量，需要 EMBEDDING_API_KEY
 * - 本地哈希词袋：零依赖、结果确定，用来离线跑通链路
 *
 * 注意：DeepSeek 目前只有 chat，没有 embeddings，
 * 所以向量服务要单独配 EMBEDDING_BASE_URL / EMBEDDING_API_KEY。
 */
import OpenAI from 'openai'
import { loadEmbeddingConfig } from '../config/env'
import type { ModelConfig } from '../contracts/types'

export interface Embedder {
  /** 标识当前用的向量模型，打日志时用 */
  readonly id: string
  /** 批量转向量，顺序必须与输入一致 */
  embed(texts: string[]): Promise<number[][]>
}

const CJK = '\u4e00-\u9fff'
const TOKEN_PATTERN = new RegExp(`[a-z0-9]+|[${CJK}]`, 'g')

function fnv1a(token: string): number {
  let hash = 0x811c9dc5
  for (let i = 0; i < token.length; i += 1) {
    hash ^= token.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }
  return hash >>> 0
}

function normalize(vector: number[]): number[] {
  const norm = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0))
  if (norm === 0) return vector
  return vector.map((value) => value / norm)
}

/** 本地哈希词袋向量：只反映字面重叠，不联网 */
export function createHashEmbedder(dimension = 1024): Embedder {
  return {
    id: `local-hash-${dimension}`,
    async embed(texts) {
      return texts.map((text) => {
        const vector = new Array<number>(dimension).fill(0)
        const tokens = text.toLowerCase().match(TOKEN_PATTERN) ?? []
        for (const token of tokens) {
          const index = fnv1a(token) % dimension
          vector[index] = (vector[index] ?? 0) + 1
        }
        return normalize(vector)
      })
    }
  }
}

/** 单次请求的文本条数：整本书几千块，一次发完会超限也会超时 */
const EMBED_BATCH_SIZE = 64

/** OpenAI 兼容向量接口 */
export function createOpenAiEmbedder(config: ModelConfig): Embedder {
  const client = new OpenAI({
    apiKey: config.apiKey,
    baseURL: config.baseUrl
  })

  return {
    id: config.model,
    async embed(texts) {
      if (texts.length === 0) return []

      const vectors: number[][] = []
      for (let start = 0; start < texts.length; start += EMBED_BATCH_SIZE) {
        const batch = texts.slice(start, start + EMBED_BATCH_SIZE)
        const response = await client.embeddings.create({
          model: config.model,
          input: batch
        })

        // 服务端不保证返回顺序，按 index 排回来
        vectors.push(
          ...response.data
            .toSorted((a, b) => a.index - b.index)
            .map((item) => item.embedding)
        )
      }

      return vectors
    }
  }
}

/**
 * 按配置选择向量实现：配了向量 Key 用 API，否则用本地哈希。
 * 返回的 id 会写进日志，方便确认到底走的哪条路。
 */
export function createDefaultEmbedder(): Embedder {
  const config = loadEmbeddingConfig()
  return config ? createOpenAiEmbedder(config) : createHashEmbedder()
}
