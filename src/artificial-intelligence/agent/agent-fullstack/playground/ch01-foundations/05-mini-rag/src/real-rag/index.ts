/**
 * 对外出口：只导出编排与各层的关键函数，内部实现细节不暴露。
 */
export { chunkDocuments } from './chunker'
export {
  createDefaultEmbedder,
  createHashEmbedder,
  createOpenAiEmbedder
} from './embedding'
export type { Embedder } from './embedding'
export { evaluate } from './eval'
export type { EvaluateDeps } from './eval'
export { buildContext, parseCitations, SYSTEM_PROMPT } from './prompt'
export type { BuiltContext } from './prompt'
export { answerWithCitations, REFUSAL } from './rag'
export type { AnswerDeps } from './rag'
export { cosineSimilarity, indexChunks, search } from './retriever'
export type { SearchOptions } from './retriever'
export { DEFAULT_RAG_OPTIONS } from './types'
export type {
  ChatMessage,
  Chunk,
  Doc,
  EmbeddedChunk,
  EvalCase,
  EvalSummary,
  ModelConfig,
  RagAnswer,
  RagOptions,
  ScoredChunk,
  TokenUsage
} from './types'
