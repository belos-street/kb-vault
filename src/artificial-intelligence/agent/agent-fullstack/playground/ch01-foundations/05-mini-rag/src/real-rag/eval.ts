/**
 * 评估层：用带标注的用例衡量召回质量。
 *
 * 索引只建一次，所有用例共用——这也是评估能跑得快的前提。
 * 只评估检索，不调用对话模型，所以不需要 OPENAI_API_KEY。
 */
import {
  DEFAULT_RAG_OPTIONS,
  type Doc,
  type EvalCase,
  type EvalSummary,
  type RagOptions
} from './types'
import { chunkDocuments } from './chunker'
import { createDefaultEmbedder, type Embedder } from './embedding'
import { indexChunks, search } from './retriever'

export interface EvaluateDeps {
  embedder?: Embedder
}

export async function evaluate(
  cases: EvalCase[],
  docs: Doc[],
  options: RagOptions = {},
  deps: EvaluateDeps = {}
): Promise<EvalSummary> {
  const topK = options.topK ?? DEFAULT_RAG_OPTIONS.topK
  const chunkSize = options.chunkSize ?? DEFAULT_RAG_OPTIONS.chunkSize
  const chunkOverlap = options.chunkOverlap ?? DEFAULT_RAG_OPTIONS.chunkOverlap
  const minScore = options.minScore ?? DEFAULT_RAG_OPTIONS.minScore

  const embedder = deps.embedder ?? createDefaultEmbedder()
  const chunks = chunkDocuments(docs, chunkSize, chunkOverlap)
  const index = await indexChunks(chunks, embedder)

  let hits = 0
  const misses: EvalCase[] = []

  for (const item of cases) {
    const ranked = await search(index, item.query, embedder, { topK, minScore })
    const hit = ranked.some(
      (result) => result.chunk.docId === item.expectedDocId
    )
    if (hit) hits += 1
    else misses.push(item)
  }

  const total = cases.length
  return {
    hits,
    total,
    hitRate: total === 0 ? 0 : hits / total,
    misses
  }
}
