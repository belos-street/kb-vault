/**
 * 契约层：RAG 链路里流转的数据形状，不写逻辑。
 */

/** 一篇原始文档 */
export interface Doc {
  id: string
  text: string
}

/** 切块后的最小检索单元 */
export interface Chunk {
  id: string
  docId: string
  text: string
}

/** 召回结果：块 + 相似度 */
export interface ScoredChunk {
  chunk: Chunk
  score: number
}

/** 已向量化的块，建索引时使用 */
export interface EmbeddedChunk {
  chunk: Chunk
  vector: number[]
}

export interface RagOptions {
  /** 召回条数，默认 3 */
  topK?: number
  /** 每块字符数，默认 400 */
  chunkSize?: number
  /** 相邻块重叠字符数，默认 80 */
  chunkOverlap?: number
  /** 拼进 prompt 的上下文上限（字符），默认 2000 */
  maxContextChars?: number
  /** 相似度下限，低于它视为不相关，默认 0.1 */
  minScore?: number
}

export const DEFAULT_RAG_OPTIONS: Required<RagOptions> = {
  topK: 3,
  chunkSize: 400,
  chunkOverlap: 80,
  maxContextChars: 2000,
  minScore: 0.1
}

/** 模型连接配置，由 config.ts 从环境变量组装 */
export interface ModelConfig {
  apiKey: string
  baseUrl: string
  model: string
}

export type ChatMessage =
  | { role: 'system' | 'user'; content: string }
  | { role: 'assistant'; content: string }

/** token 用量，用来估算成本 */
export interface TokenUsage {
  promptTokens: number
  completionTokens: number
  totalTokens: number
}

export interface RagAnswer {
  answer: string
  /** 答案里 [n] 反射出的 chunk id，去重后按出现顺序 */
  citations: string[]
  /** 实际进入上下文的块，下标对应 [1] [2] ... */
  chunks: Chunk[]
  usage?: TokenUsage
}

export interface EvalCase {
  query: string
  expectedDocId: string
}

export interface EvalSummary {
  hits: number
  total: number
  hitRate: number
  /** 未命中的用例，用来定位检索短板 */
  misses: EvalCase[]
}
