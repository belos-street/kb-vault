// 自建链路追踪：JSONL 结构化 Trace（todo Phase 4.1'，LangSmith 的本地替代）
//
// 原理（对应文档 2.7 Trace 结构）：LangChain 每次执行都会回调 BaseCallbackHandler
// 的 handleXxxStart/End，参数中的 runId / parentRunId 构成一棵 Run Tree。本 Handler 做两件事：
// 1. 每个 Run（llm / tool / chain）结束时追加一行 JSONL：名称、耗时、token、输入输出摘要
// 2. 子 Run 的 token 与调用计数向上聚合到父 Run；顶层 chain 结束时输出一行 trace_summary
//
// 用法：`agent.invoke(input, { callbacks: [traceHandler] })`，输出到 data/traces.jsonl
//（TRACE_LOG_PATH 环境变量可覆盖）。生产可用 jq / DuckDB 分析；后续接 Langfuse/OTel 时本文件可整体替换。
import { appendFileSync, mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import { BaseCallbackHandler } from '@langchain/core/callbacks/base'

/** 单字段序列化上限：messages 可能很大，超长截断避免日志爆炸 */
const MAX_FIELD_LENGTH = 2000

const DEFAULT_TRACE_PATH = './data/traces.jsonl'

type RunType = 'llm' | 'tool' | 'chain'

interface RunRecord {
  type: RunType
  name: string
  startMs: number
  input: string
  promptTokens: number
  completionTokens: number
  llmCalls: number
  toolCalls: number
}

interface TraceLine {
  ts: string
  event: string
  run_type?: RunType
  name?: string
  parent_run_id?: string
  duration_ms?: number
  prompt_tokens?: number
  completion_tokens?: number
  llm_calls?: number
  tool_calls?: number
  input?: string
  output?: string
  error?: string
}

interface LLMResultLike {
  llmOutput?: {
    tokenUsage?: { promptTokens?: number; completionTokens?: number }
  }
  generations?: {
    message?: {
      usage_metadata?: { input_tokens?: number; output_tokens?: number }
    }
  }[][]
}

/** 稳妥序列化：循环引用 / 超长都不抛错，超长截断 */
function serialize(value: unknown): string {
  try {
    const text = JSON.stringify(value) ?? String(value)
    return text.length > MAX_FIELD_LENGTH
      ? `${text.slice(0, MAX_FIELD_LENGTH)}…[截断]`
      : text
  } catch {
    return String(value).slice(0, MAX_FIELD_LENGTH)
  }
}

/** Run 名称：优先 runName（新版回调传入），其次序列化 id 末段（类名），兜底 unknown */
function resolveName(serialized: unknown, runName?: string): string {
  if (runName) return runName
  const id = (serialized as { id?: string[] } | null)?.id
  const last = Array.isArray(id) ? id.at(-1) : undefined
  return typeof last === 'string' ? last : 'unknown'
}

/** token 用量：优先 OpenAI 风格 tokenUsage，其次各模型统一的 usage_metadata（fakeModel 无 token 时返回 0） */
function extractTokens(output: LLMResultLike): {
  prompt: number
  completion: number
} {
  const usage = output?.llmOutput?.tokenUsage
  if (usage) {
    return {
      prompt: usage.promptTokens ?? 0,
      completion: usage.completionTokens ?? 0
    }
  }
  const meta = output?.generations?.[0]?.[0]?.message?.usage_metadata
  if (meta) {
    return {
      prompt: meta.input_tokens ?? 0,
      completion: meta.output_tokens ?? 0
    }
  }
  return { prompt: 0, completion: 0 }
}

interface ActiveRun extends RunRecord {
  runId: string
  parentRunId?: string
}

/**
 * JSONL 追踪 Handler：一次 invoke = 一棵 Run Tree = 一条 trace_summary。
 * 工厂签名支持依赖注入（测试传临时文件路径），默认走 TRACE_LOG_PATH。
 */
export class JsonlTraceHandler extends BaseCallbackHandler {
  name = 'jsonl_trace_handler'

  private readonly filePath: string
  /** 进行中的 Run：runId → 记录。end/error 时删除，防内存泄漏 */
  private readonly runs = new Map<string, ActiveRun>()
  private dirEnsured = false

  constructor(filePath = process.env.TRACE_LOG_PATH ?? DEFAULT_TRACE_PATH) {
    super()
    this.filePath = filePath
  }

  private append(line: Omit<TraceLine, 'ts'>, parentRunId?: string): void {
    if (!this.dirEnsured) {
      mkdirSync(dirname(this.filePath), { recursive: true })
      this.dirEnsured = true
    }
    const record: TraceLine = { ts: new Date().toISOString(), ...line }
    if (parentRunId) record.parent_run_id = parentRunId
    appendFileSync(this.filePath, `${JSON.stringify(record)}\n`, 'utf8')
  }

  private start(
    type: RunType,
    runId: string,
    parentRunId: string | undefined,
    name: string,
    input: unknown
  ): void {
    this.runs.set(runId, {
      runId,
      parentRunId,
      type,
      name,
      startMs: Date.now(),
      input: serialize(input),
      promptTokens: 0,
      completionTokens: 0,
      llmCalls: 0,
      toolCalls: 0
    })
  }

  private end(
    runId: string,
    parentRunId: string | undefined,
    event: string,
    output: unknown
  ): void {
    const run = this.runs.get(runId)
    if (!run) return
    this.runs.delete(runId)
    this.append(
      {
        event,
        run_type: run.type,
        name: run.name,
        duration_ms: Date.now() - run.startMs,
        prompt_tokens: run.promptTokens || undefined,
        completion_tokens: run.completionTokens || undefined,
        input: run.input,
        output: serialize(output)
      },
      parentRunId
    )
    if (run.type === 'chain' && !parentRunId) {
      // 顶层 chain：整次调用结束，输出汇总行（token 已由子 Run 聚合进来）
      this.append({
        event: 'trace_summary',
        name: run.name,
        duration_ms: Date.now() - run.startMs,
        prompt_tokens: run.promptTokens,
        completion_tokens: run.completionTokens,
        llm_calls: run.llmCalls,
        tool_calls: run.toolCalls
      })
      return
    }
    const parent = parentRunId ? this.runs.get(parentRunId) : undefined
    if (parent) {
      parent.promptTokens += run.promptTokens
      parent.completionTokens += run.completionTokens
      parent.llmCalls += run.type === 'llm' ? 1 : run.llmCalls
      parent.toolCalls += run.type === 'tool' ? 1 : run.toolCalls
    }
  }

  private fail(
    runId: string,
    parentRunId: string | undefined,
    event: string,
    error: unknown
  ): void {
    const run = this.runs.get(runId)
    if (run) this.runs.delete(runId)
    this.append(
      {
        event,
        run_type: run?.type,
        name: run?.name,
        duration_ms: run ? Date.now() - run.startMs : undefined,
        error: serialize(error)
      },
      parentRunId
    )
  }

  override handleLLMStart(
    llm: unknown,
    prompts: unknown,
    runId: string,
    parentRunId?: string,
    _extraParams?: unknown,
    _tags?: unknown,
    _metadata?: unknown,
    runName?: string
  ): void {
    this.start('llm', runId, parentRunId, resolveName(llm, runName), prompts)
  }

  override handleLLMEnd(
    output: unknown,
    runId: string,
    parentRunId?: string
  ): void {
    const tokens = extractTokens(output as LLMResultLike)
    const run = this.runs.get(runId)
    if (run) {
      run.promptTokens = tokens.prompt
      run.completionTokens = tokens.completion
    }
    this.end(runId, parentRunId, 'llm_end', output)
  }

  override handleLLMError(
    err: unknown,
    runId: string,
    parentRunId?: string
  ): void {
    this.fail(runId, parentRunId, 'llm_error', err)
  }

  override handleToolStart(
    tool: unknown,
    input: unknown,
    runId: string,
    parentRunId?: string,
    _tags?: unknown,
    _metadata?: unknown,
    runName?: string,
    _toolCallId?: string
  ): void {
    this.start('tool', runId, parentRunId, resolveName(tool, runName), input)
  }

  override handleToolEnd(
    output: unknown,
    runId: string,
    parentRunId?: string
  ): void {
    this.end(runId, parentRunId, 'tool_end', output)
  }

  override handleToolError(
    err: unknown,
    runId: string,
    parentRunId?: string
  ): void {
    this.fail(runId, parentRunId, 'tool_error', err)
  }

  // 注意签名差异：handleChainStart 的 parentRunId 是第 8 个参数（LLM/Tool 是第 4 个）
  override handleChainStart(
    chain: unknown,
    inputs: unknown,
    runId: string,
    _runType?: string,
    _tags?: unknown,
    _metadata?: unknown,
    _runName?: string,
    parentRunId?: string,
    _extra?: unknown
  ): void {
    this.start('chain', runId, parentRunId, resolveName(chain), inputs)
  }

  override handleChainEnd(
    outputs: unknown,
    runId: string,
    parentRunId?: string
  ): void {
    this.end(runId, parentRunId, 'chain_end', outputs)
  }

  override handleChainError(
    err: unknown,
    runId: string,
    parentRunId?: string
  ): void {
    this.fail(runId, parentRunId, 'chain_error', err)
  }
}

/** 模块级单例：CLI / 端到端共用一个输出文件 */
export const traceHandler = new JsonlTraceHandler()
