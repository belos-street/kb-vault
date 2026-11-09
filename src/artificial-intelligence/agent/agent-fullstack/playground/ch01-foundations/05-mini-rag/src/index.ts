/**
 * 05 · 迷你 RAG
 *
 * 切块 → 本地向量召回 → 拼上下文 → 假模型回答 → 解析引用。
 * 规格与验收标准见同目录 README.md。
 */
import type { ScriptedModel } from '@/shared/scripted-model'

export interface Doc {
  id: string
  text: string
}

export interface Chunk {
  id: string
  docId: string
  text: string
}

export interface RankedChunk {
  chunk: Chunk
  score: number
}

export interface RagOptions {
  topK?: number
  chunkSize?: number
  chunkOverlap?: number
  maxContextChars?: number
}

export interface RagAnswer {
  answer: string
  citations: string[]
  chunks: Chunk[]
}

export interface EvalCase {
  query: string
  expectedDocId: string
}

export interface EvalSummary {
  hits: number
  total: number
  hitRate: number
}

/**
 * 按字符窗口切块，chunk id = `${docId}#${序号}`。
 * 参数非法时抛 RangeError。
 */
export function chunkDocuments(
  _docs: Doc[], // 输入文档数组
  _chunkSize = 80, // 每个 chunk 字符数
  _chunkOverlap = 20 // 重叠字符数
 ): Chunk[] {
  if (_chunkSize <= 0 || _chunkOverlap <= 0) {
    throw new RangeError('chunkSize and chunkOverlap must be positive')
  }

  for (const doc of _docs) {
    const text = doc.text.trim()
    if (text === '') continue
  }
   throw new Error('TODO: 实现 chunkDocuments')
}

/**
 * 用本地向量召回 topK。
 * 过滤得分低于 0.1 的块；topK < 1 抛 RangeError。
 */
export function retrieve(
  _question: string,
  _chunks: Chunk[],
  _topK = 3
): RankedChunk[] {
  throw new Error('TODO: 实现 retrieve')
}

/**
 * 完整 RAG 链路：召回 → 拼上下文 → 调模型 → 解析 [n] 引用。
 * 没有召回结果时直接拒答，不调用模型。
 */
export async function answerWithCitations(
  _question: string,
  _docs: Doc[],
  _model: ScriptedModel,
  _options: RagOptions = {}
): Promise<RagAnswer> {
  throw new Error('TODO: 实现 answerWithCitations')
}

/**
 * 计算 topK 命中率：召回的任意 chunk 的 docId 等于期望 docId 即算命中。
 */
export function evaluate(
  _cases: EvalCase[],
  _docs: Doc[],
  _options: RagOptions = {}
): EvalSummary {
  throw new Error('TODO: 实现 evaluate')
}
