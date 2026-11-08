/**
 * 编排层：切块 → 建索引 → 召回 → 拼上下文 → 调模型 → 解析引用。
 * 唯一知道「一条 RAG 链路长什么样」的地方。
 */
import { DEFAULT_RAG_OPTIONS } from './types'
import type { Doc, RagAnswer, RagOptions } from './types'
import { chunkDocuments } from './chunker'
import { loadChatConfig } from './config'
import { createDefaultEmbedder, type Embedder } from './embedding'
import { invokeChat } from './model'
import { buildContext, parseCitations, SYSTEM_PROMPT } from './prompt'
import { indexChunks, search } from './retriever'

/** 检索不到任何相关内容时的固定拒答文案，不调用模型 */
export const REFUSAL = '知识库中没有找到相关内容。'

export interface AnswerDeps {
  /** 测试或换供应商时注入，默认按环境变量选择 */
  embedder?: Embedder
}

export async function answerWithCitations(
  question: string,
  docs: Doc[],
  options: RagOptions = {},
  deps: AnswerDeps = {}
): Promise<RagAnswer> {
  const topK = options.topK ?? DEFAULT_RAG_OPTIONS.topK
  const chunkSize = options.chunkSize ?? DEFAULT_RAG_OPTIONS.chunkSize
  const chunkOverlap = options.chunkOverlap ?? DEFAULT_RAG_OPTIONS.chunkOverlap
  const maxContextChars =
    options.maxContextChars ?? DEFAULT_RAG_OPTIONS.maxContextChars
  const minScore = options.minScore ?? DEFAULT_RAG_OPTIONS.minScore

  const embedder = deps.embedder ?? createDefaultEmbedder()

  const chunks = chunkDocuments(docs, chunkSize, chunkOverlap)
  const index = await indexChunks(chunks, embedder)
  const ranked = await search(index, question, embedder, { topK, minScore })

  // 没有依据就不要让模型自由发挥，省一次调用也避免幻觉
  if (ranked.length === 0) {
    return { answer: REFUSAL, citations: [], chunks: [] }
  }

  const context = buildContext(ranked, maxContextChars)
  const messages = [
    { role: 'system' as const, content: SYSTEM_PROMPT },
    {
      role: 'user' as const,
      content: `资料：\n${context.text}\n\n问题：${question}`
    }
  ]

  const { content, usage } = await invokeChat(loadChatConfig(), messages)

  return {
    answer: content,
    citations: parseCitations(content, context.used),
    chunks: context.used,
    usage
  }
}
