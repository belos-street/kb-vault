/**
 * 对外出口：只导出编排与各层的关键函数，内部实现细节不暴露。
 *
 * 目录结构：
 * - contracts/   数据类型与默认参数
 * - config/      环境变量 → 连接配置
 * - ingest/      语料加载、切块
 * - providers/   向量模型、对话模型
 * - retrieval/   建索引、检索、拼上下文
 * - generation/  整条链路编排
 * - evaluation/  召回评估
 * - cli/         命令行入口
 */
export { chunkDocuments } from './ingest/chunker'
export { loadTxtDocs } from './ingest/corpus'
export {
  createDefaultEmbedder,
  createHashEmbedder,
  createOpenAiEmbedder
} from './providers/embedding'
export type { Embedder } from './providers/embedding'
export { evaluate } from './evaluation/eval'
export type { EvaluateDeps } from './evaluation/eval'
export {
  buildContext,
  expandToDocs,
  parseCitations,
  SYSTEM_PROMPT
} from './retrieval/prompt'
export type { BuiltContext } from './retrieval/prompt'
export { answerWithCitations, REFUSAL } from './generation/rag'
export type { AnswerDeps } from './generation/rag'
export { cosineSimilarity, indexChunks, search } from './retrieval/retriever'
export type { SearchOptions } from './retrieval/retriever'
export { DEFAULT_RAG_OPTIONS } from './contracts/types'
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
} from './contracts/types'
