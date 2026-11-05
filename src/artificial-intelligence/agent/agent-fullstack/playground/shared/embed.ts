/**
 * 确定性本地 embedding。
 *
 * 这不是真正的语义向量：它把文本拆成「英文单词 + 单个汉字」，
 * 用哈希散到固定维度上，只反映字面重叠。作用是让检索练习无需联网、
 * 每次运行结果完全一致，从而可以写稳定的断言。
 *
 * 只读基础设施：做题时不要修改这个文件。
 */

export const EMBED_DIM = 4096

const CJK = '\u4e00-\u9fff'
const TOKEN_PATTERN = new RegExp(`[a-z0-9]+|[${CJK}]`, 'g')

function fnv1a(token: string): number {
  let hash = 0x811c9dc5
  for (let i = 0; i < token.length; i++) {
    hash ^= token.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }
  return hash >>> 0
}

function tokenize(text: string): string[] {
  return text.toLowerCase().match(TOKEN_PATTERN) ?? []
}

function normalize(vector: number[]): number[] {
  const norm = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0))
  if (norm === 0) return vector
  return vector.map((value) => value / norm)
}

/** 把一段文本转成 4096 维、L2 归一化后的向量 */
export function embed(text: string): number[] {
  const vector = new Array<number>(EMBED_DIM).fill(0)
  for (const token of tokenize(text)) {
    const index = fnv1a(token) % EMBED_DIM
    vector[index] = (vector[index] ?? 0) + 1
  }
  return normalize(vector)
}

/** 余弦相似度；任一向量为零向量时返回 0 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new RangeError(`向量维度不一致：${a.length} vs ${b.length}`)
  }

  let dot = 0
  let normA = 0
  let normB = 0
  for (let i = 0; i < a.length; i++) {
    const x = a[i] ?? 0
    const y = b[i] ?? 0
    dot += x * y
    normA += x * x
    normB += y * y
  }

  if (normA === 0 || normB === 0) return 0
  return dot / (Math.sqrt(normA) * Math.sqrt(normB))
}
