// 教学用「确定性替身」embedding：
// 用字符 n-gram 哈希到固定维度，再 L2 归一化。
//
// ⚠️ 这不是语义模型：它只看字面重合，同义改写（"退款" vs "退钱"）召回不到。
// 放在仓库里的目的是让全链路（写入 → 建索引 → 检索 → 融合 → 评估）
// 不依赖任何 API Key 就能跑通；生产请替换为 BGE-M3 / Qwen3-Embedding /
// text-embedding-3-*，接口签名保持一致即可。

export const EMBEDDING_DIM = 256

const hash32 = (input: string): number => {
  let h = 2166136261
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

export const tokenize = (text: string): string[] => {
  const tokens: string[] = []
  const chunks = text.toLowerCase().split(/\s+/).filter(Boolean)
  for (const chunk of chunks) {
    const word = chunk.slice(0, 32)
    if (!word) continue
    tokens.push(word)
    // 中文没有空格，用字符 bigram 近似词粒度
    for (let i = 0; i < word.length - 1; i++) {
      tokens.push(word.slice(i, i + 2))
    }
  }
  return tokens
}

const normalize = (vector: number[]): number[] => {
  let sum = 0
  for (const v of vector) sum += v * v
  const norm = Math.sqrt(sum)
  return norm === 0 ? vector : vector.map((v) => v / norm)
}

export const embed = (text: string): number[] => {
  const vector = Array.from<number>({ length: EMBEDDING_DIM }).fill(0)
  for (const token of tokenize(text)) {
    const index = hash32(token) % EMBEDDING_DIM
    vector[index] = (vector[index] ?? 0) + 1
  }
  return normalize(vector)
}

export const embedBatch = (texts: string[]): number[][] => texts.map(embed)

// 入库时把标题拼进正文再向量化：标题是人工提炼的高信息密度文本，
// 能显著提升「短查询 → 长块」的召回质量（检索时只嵌入查询本身）
export const embedChunk = (title: string, text: string): number[] =>
  embed(`${title}\n${text}`)

export const cosineSimilarity = (a: number[], b: number[]): number => {
  let dot = 0
  let na = 0
  let nb = 0
  for (let i = 0; i < a.length; i++) {
    const x = a[i] ?? 0
    const y = b[i] ?? 0
    dot += x * y
    na += x * x
    nb += y * y
  }
  return na === 0 || nb === 0 ? 0 : dot / (Math.sqrt(na) * Math.sqrt(nb))
}
