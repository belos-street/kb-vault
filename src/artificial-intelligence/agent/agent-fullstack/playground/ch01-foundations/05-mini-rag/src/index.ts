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
 *
 * 窗口大小是 chunkSize，相邻块共享 chunkOverlap 个字符；
 * 所以窗口每次只前进 step = chunkSize - chunkOverlap。
 * 例：chunkSize=10、overlap=2 时，起点是 0、8、16……，
 * 前两块共享位置 8-9 的两个字符。
 * 参数非法时抛 RangeError。
 */
export function chunkDocuments(
  _docs: Doc[], // 原始文档数组，每篇文档独立编号
  _chunkSize = 80, // 窗口大小：每块最多取多少个字符
  _chunkOverlap = 20 // 相邻块共享的字符数，用来保住边界上下文
): Chunk[] {
  // overlap 必须落在 [0, chunkSize) 区间；
  // 等于 chunkSize 会让 step 变成 0，窗口原地不动。
  if (_chunkSize <= 0) {
    throw new RangeError('chunkSize 必须大于 0')
  }
  if (_chunkOverlap < 0) {
    throw new RangeError('chunkOverlap 不能为负')
  }
  if (_chunkOverlap >= _chunkSize) {
    throw new RangeError('chunkOverlap 必须小于 chunkSize')
  }

  // 窗口每次前进的距离；因为块间要重叠，所以小于 chunkSize
  const step = _chunkSize - _chunkOverlap
  const chunks: Chunk[] = []

  for (const doc of _docs) {
    // 去掉首尾空白；空文档不产生任何块
    const text = doc.text.trim()
    if (text === '') continue

    // 每篇文档从 0 开始编号，保证 id 稳定且与字符偏移无关
    let chunkIndex = 0
    // start 是窗口起点，窗口内容是 [start, start + chunkSize)
    for (let start = 0; start < text.length; start += step) {
      const piece = text.slice(start, start + _chunkSize)
      // 纯空白块没有检索价值；跳过时不要占用 chunkIndex
      if (piece.trim() === '') continue

      chunks.push({
        id: `${doc.id}#${chunkIndex}`,
        docId: doc.id,
        text: piece
      })
      chunkIndex += 1
    }
  }

  return chunks
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
