import type { Chunk } from './corpus.ts'
import { loadChunks } from './corpus.ts'
import { cosineSimilarity, embed, embedChunk, tokenize } from './embedding.ts'

// 4.3 主示例：BM25 + 稠密双路召回、RRF / 加权融合、重排序、检索评估。
// 纯内存实现，不依赖任何服务：bun run demo:hybrid

type Ranked = { chunk: Chunk; score: number }

const assert = (condition: boolean, message: string): void => {
  if (!condition) throw new Error(`断言失败：${message}`)
  console.log(`✅ ${message}`)
}

// ---------------------------------------------------------------- BM25
interface Bm25Index {
  df: Map<string, number>
  tfs: Array<Map<string, number>>
  lengths: number[]
  avgdl: number
  chunks: Chunk[]
}

const buildBm25 = (chunks: Chunk[]): Bm25Index => {
  const df = new Map<string, number>()
  const tfs: Array<Map<string, number>> = []
  const lengths: number[] = []

  for (const chunk of chunks) {
    const tokens = tokenize(chunk.text)
    const tf = new Map<string, number>()
    for (const token of tokens) tf.set(token, (tf.get(token) ?? 0) + 1)
    for (const token of tf.keys()) df.set(token, (df.get(token) ?? 0) + 1)
    tfs.push(tf)
    lengths.push(tokens.length)
  }

  const total = lengths.reduce((acc, len) => acc + len, 0)
  return {
    df,
    tfs,
    lengths,
    avgdl: total / Math.max(chunks.length, 1),
    chunks
  }
}

const searchBm25 = (
  index: Bm25Index,
  query: string,
  limit: number
): Ranked[] => {
  const k1 = 1.5
  const b = 0.75
  const n = index.chunks.length
  const terms = [...new Set(tokenize(query))]

  const scored = index.chunks.map((chunk, i) => {
    const tf = index.tfs[i] ?? new Map<string, number>()
    const dl = index.lengths[i] ?? 0
    let score = 0
    for (const term of terms) {
      const freq = tf.get(term) ?? 0
      if (freq === 0) continue
      const df = index.df.get(term) ?? 0
      const idf = Math.log(1 + (n - df + 0.5) / (df + 0.5))
      score +=
        (idf * (freq * (k1 + 1))) /
        (freq + k1 * (1 - b + (b * dl) / index.avgdl))
    }
    return { chunk, score }
  })

  return scored
    .filter((item) => item.score > 0)
    .sort((a, b2) => b2.score - a.score)
    .slice(0, limit)
}

// ---------------------------------------------------------------- 稠密召回
const searchDense = (
  chunks: Chunk[],
  query: string,
  limit: number
): Ranked[] => {
  const queryVector = embed(query)
  return chunks
    .map((chunk) => ({
      chunk,
      score: cosineSimilarity(queryVector, embedChunk(chunk.title, chunk.text))
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
}

// ---------------------------------------------------------------- 融合
const rrfFuse = (lists: Ranked[][], k = 60, limit = 5): Ranked[] => {
  const scores = new Map<string, { chunk: Chunk; score: number }>()
  for (const list of lists) {
    list.forEach((item, index) => {
      const rank = index + 1
      const current = scores.get(item.chunk.id)
      const delta = 1 / (k + rank)
      if (current) current.score += delta
      else scores.set(item.chunk.id, { chunk: item.chunk, score: delta })
    })
  }
  return [...scores.values()].sort((a, b) => b.score - a.score).slice(0, limit)
}

const minMax = (list: Ranked[]): Map<string, number> => {
  const values = list.map((item) => item.score)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1
  return new Map(list.map((item) => [item.chunk.id, (item.score - min) / span]))
}

const weightedFuse = (
  dense: Ranked[],
  sparse: Ranked[],
  weights: { dense: number; sparse: number },
  limit = 5
): Ranked[] => {
  const denseNorm = minMax(dense)
  const sparseNorm = minMax(sparse)
  const merged = new Map<string, { chunk: Chunk; score: number }>()

  for (const [id, norm] of denseNorm) {
    const chunk = dense.find((item) => item.chunk.id === id)?.chunk
    if (!chunk) continue
    merged.set(id, { chunk, score: norm * weights.dense })
  }
  for (const [id, norm] of sparseNorm) {
    const chunk = sparse.find((item) => item.chunk.id === id)?.chunk
    if (!chunk) continue
    const current = merged.get(id)
    const delta = norm * weights.sparse
    if (current) current.score += delta
    else merged.set(id, { chunk, score: delta })
  }

  return [...merged.values()].sort((a, b) => b.score - a.score).slice(0, limit)
}

// ---------------------------------------------------------------- 重排序（替身）
// 生产用 BGE-reranker / Cohere Rerank 这类 cross-encoder：
// 把 query 与每个候选拼成一对打分，精度高于向量内积，代价是逐条推理。
// 这里用「字符 bigram 重合度」做确定性替身，只为演示「先召回 10 → 再精排 3」的两段式结构。
const lexicalOverlap = (query: string, text: string): number => {
  const queryGrams = new Set(tokenize(query))
  const textGrams = new Set(tokenize(text))
  if (queryGrams.size === 0) return 0
  let hit = 0
  for (const gram of queryGrams) if (textGrams.has(gram)) hit++
  return hit / queryGrams.size
}

const rerank = (query: string, candidates: Ranked[], limit: number): Ranked[] =>
  candidates
    .map((item) => ({
      chunk: item.chunk,
      score: lexicalOverlap(query, item.chunk.text)
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)

// ---------------------------------------------------------------- 评估
interface GoldenItem {
  query: string
  expectedDoc: string
}

const recallAt = (results: Ranked[], expectedDoc: string, k: number): number =>
  results.slice(0, k).some((item) => item.chunk.docId === expectedDoc) ? 1 : 0

const reciprocalRank = (results: Ranked[], expectedDoc: string): number => {
  const index = results.findIndex((item) => item.chunk.docId === expectedDoc)
  return index === -1 ? 0 : 1 / (index + 1)
}

const evaluate = (
  name: string,
  golden: GoldenItem[],
  retrieve: (query: string) => Ranked[]
): { name: string; recall: string; mrr: string } => {
  const k = 3
  let recallSum = 0
  let rrSum = 0
  for (const item of golden) {
    const results = retrieve(item.query)
    recallSum += recallAt(results, item.expectedDoc, k)
    rrSum += reciprocalRank(results, item.expectedDoc)
  }
  return {
    name,
    recall: (recallSum / golden.length).toFixed(2),
    mrr: (rrSum / golden.length).toFixed(2)
  }
}

// ---------------------------------------------------------------- 主流程
const main = async (): Promise<void> => {
  const chunks = await loadChunks()
  const bm25 = buildBm25(chunks)
  console.log(
    `语料 ${chunks.length} 块，${new Set(chunks.map((c) => c.docId)).size} 篇文档`
  )

  const golden: GoldenItem[] = [
    { query: '退款多久到账', expectedDoc: '01-退款政策' },
    // 改写型查询：字面与文档重合极少，用来暴露「字面替身 embedding」的短板
    { query: '退钱要等几天', expectedDoc: '01-退款政策' },
    { query: '增值税专用发票怎么开', expectedDoc: '02-发票与对公转账' },
    { query: '忘记密码怎么重置', expectedDoc: '03-账号与登录' },
    { query: '成员离职笔记怎么交接', expectedDoc: '04-团队与权限' },
    { query: '备份保留多少天', expectedDoc: '05-数据导出与备份' },
    { query: '接口调用每分钟限流多少次', expectedDoc: '06-开放API与限流' }
  ]

  const denseTop = (query: string): Ranked[] => searchDense(chunks, query, 10)
  const sparseTop = (query: string): Ranked[] => searchBm25(bm25, query, 10)
  const rrfTop = (query: string): Ranked[] =>
    rrfFuse([denseTop(query), sparseTop(query)], 60, 10)
  const weightedTop = (query: string): Ranked[] =>
    weightedFuse(
      denseTop(query),
      sparseTop(query),
      { dense: 0.6, sparse: 0.4 },
      10
    )
  const rerankTop = (query: string): Ranked[] =>
    rerank(query, rrfTop(query), 10)

  const report = [
    evaluate('dense only', golden, denseTop),
    evaluate('bm25 only', golden, sparseTop),
    evaluate('rrf(dense+bm25)', golden, rrfTop),
    evaluate('weighted 0.6/0.4', golden, weightedTop),
    evaluate('rrf + rerank', golden, rerankTop)
  ]
  console.table(report)

  const denseRecall = Number(report[0]?.recall)
  const bm25Recall = Number(report[1]?.recall)
  const rrfRecall = Number(report[2]?.recall)
  assert(
    rrfRecall >= Math.max(denseRecall, bm25Recall),
    'RRF 融合的 Recall@3 不低于任一单路'
  )

  // 评估的价值在于暴露盲区：唯一未命中的应该是字面模型无解的改写型查询
  const failed = golden
    .filter((item) => recallAt(rrfTop(item.query), item.expectedDoc, 3) === 0)
    .map((item) => item.query)
  console.log('\n[失败 query]', failed.length > 0 ? failed.join(' | ') : '无')
  assert(
    failed.length === 1 && failed[0] === '退钱要等几天',
    '评估集仅改写型查询未命中，其余全部召回'
  )

  // 两段式：先宽召回，再精排，观察候选集变化
  const query = '发票红冲怎么操作'
  const candidates = rrfTop(query).slice(0, 10)
  const reranked = rerank(query, candidates, 3)
  console.log(`\n[两段式] ${query}`)
  console.log('召回 10 →', candidates.map((c) => c.chunk.id).join(', '))
  console.log('精排 3  →', reranked.map((c) => c.chunk.id).join(', '))
  assert(reranked.length > 0, '重排序输出非空')
  assert(
    reranked[0]?.chunk.docId === '02-发票与对公转账',
    '重排序后 top1 命中《发票与对公转账》'
  )
}

await main()
