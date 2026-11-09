/**
 * 检索层：建索引（只做一次）+ 查询（每次只向量化 query）。
 *
 * 这是真实 RAG 与练习版最大的性能差别：文档向量要入索引，
 * 不能每来一个问题就把全部文档重新向量化一遍。
 */
import type { Embedder } from '../providers/embedding'
import {
  DEFAULT_RAG_OPTIONS,
  type Chunk,
  type EmbeddedChunk,
  type ScoredChunk
} from '../contracts/types'

export interface SearchOptions {
  topK?: number
  minScore?: number
}

/** 余弦相似度；维度不一致直接报错，零向量返回 0 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new RangeError(`向量维度不一致：${a.length} vs ${b.length}`)
  }

  let dot = 0
  let normA = 0
  let normB = 0
  for (let i = 0; i < a.length; i += 1) {
    const x = a[i] ?? 0
    const y = b[i] ?? 0
    dot += x * y
    normA += x * x
    normB += y * y
  }

  if (normA === 0 || normB === 0) return 0
  return dot / (Math.sqrt(normA) * Math.sqrt(normB))
}

/** 批量向量化所有块，产出一个可反复查询的内存索引 */
export async function indexChunks(
  chunks: Chunk[],
  embedder: Embedder
): Promise<EmbeddedChunk[]> {
  if (chunks.length === 0) return []

  const vectors = await embedder.embed(chunks.map((chunk) => chunk.text))
  if (vectors.length !== chunks.length) {
    throw new Error(
      `向量数量与块数量不一致：${vectors.length} vs ${chunks.length}`
    )
  }

  return chunks.flatMap((chunk, i) => {
    const vector = vectors[i]
    return vector ? [{ chunk, vector }] : []
  })
}

/** 查询：向量化 query → 打分 → 过滤 → 排序 → 截断 */
export async function search(
  index: EmbeddedChunk[],
  question: string,
  embedder: Embedder,
  options: SearchOptions = {}
): Promise<ScoredChunk[]> {
  const topK = options.topK ?? DEFAULT_RAG_OPTIONS.topK
  const minScore = options.minScore ?? DEFAULT_RAG_OPTIONS.minScore

  if (topK < 1) {
    throw new RangeError(`topK 必须大于等于 1，收到 ${topK}`)
  }
  if (index.length === 0) return []

  const [queryVector] = await embedder.embed([question])
  if (!queryVector) return []

  return index
    .map((item) => ({
      chunk: item.chunk,
      score: cosineSimilarity(queryVector, item.vector)
    }))
    .filter((item) => item.score >= minScore)
    .toSorted((a, b) => b.score - a.score)
    .slice(0, topK)
}
