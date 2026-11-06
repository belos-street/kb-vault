/**
 * 控制流：唯一允许出现 for / throw / maxSteps 的地方。
 * 不关心 HTTP 怎么发，只关心什么时候问模型、什么时候执行工具、什么时候停。
 */
import { loadConfig } from './config'
import { invokeModel } from './model'
import { createRegistry } from './tools'
import type {
  AgentResult,
  AgentStep,
  ChatMessage,
  RunAgentOptions,
  Tool
} from './types'

const SYSTEM_PROMPT =
  '你是一个可以使用工具的助手。需要事实时先调用工具，拿到结果后直接回答。'

export class AgentStepLimitError extends Error {
  readonly maxSteps: number

  constructor(maxSteps: number) {
    super(`达到最大步数 ${maxSteps}，Agent 仍未给出最终答案`)
    this.name = 'AgentStepLimitError'
    this.maxSteps = maxSteps
  }
}

/**
 * ReAct 循环（真实接口版）
 *
 * 每一轮：问模型 → 没有 tool_calls 就收尾 → 有就先回填 assistant，
 * 再逐个执行工具、逐个回填 tool 消息，然后带着更长的 messages 进入下一轮。
 *
 * 只有这里允许出现 for / throw / maxSteps；invokeModel 只负责收发，
 * 参数校验在 defineTool 里，三层的边界不互相渗透。
 *
 * 进阶（先跑通再看）：
 * - 流式输出（stream: true，逐块累积 content 和 tool_calls）
 * - 重试与超时（429 / 5xx / AbortSignal.timeout）
 * - token 用量与成本统计（response.usage）
 */
export async function runAgent(
  task: string,
  tools: Tool[],
  options: RunAgentOptions = {}
): Promise<AgentResult> {
  const maxSteps = options.maxSteps ?? 5
  // 先校验再建客户端：参数不合法时模型一次都不该被调用
  if (maxSteps < 1) {
    throw new RangeError(`maxSteps 必须大于 0，收到 ${maxSteps}`)
  }

  const config = loadConfig()
  const registry = createRegistry(tools)

  const messages: ChatMessage[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: task }
  ]
  const steps: AgentStep[] = []

  for (let step = 0; step < maxSteps; step++) {
    const message = await invokeModel(config, messages, tools)
    const toolCalls = message.tool_calls ?? []

    // 没有工具调用 = 模型给出最终回答，循环到此为止
    if (toolCalls.length === 0) {
      const answer = message.content ?? ''
      messages.push({ role: 'assistant', content: message.content })
      steps.push({ type: 'final', content: answer })
      return { answer, steps, messages }
    }

    // 先把「模型想调什么」写进历史，再执行。
    // 顺序反了，服务端会因为 tool 消息找不到对应的 tool_calls 而拒绝请求。
    messages.push({
      role: 'assistant',
      content: message.content,
      tool_calls: toolCalls
    })

    for (const call of toolCalls) {
      const { args, error: parseError } = parseArguments(
        call.function.arguments
      )
      const tool = registry.get(call.function.name)

      let observation: string
      let error: string | undefined

      if (parseError) {
        error = parseError
        observation = `Error: ${parseError}`
      } else if (!tool) {
        error = `Unknown tool: ${call.function.name}`
        observation = error
      } else {
        try {
          observation = toObservation(await tool.run(args))
        } catch (err) {
          error = err instanceof Error ? err.message : String(err)
          observation = `Error: ${error}`
        }
      }

      // 每个结果单独回填一条 tool 消息，且必须带 tool_call_id
      // —— 这是与离线版最大的差异，写成工具名服务端会直接拒绝
      messages.push({
        role: 'tool',
        tool_call_id: call.id,
        content: observation
      })
      steps.push({
        type: 'tool',
        name: call.function.name,
        args,
        observation,
        error
      })
    }
  }

  throw new AgentStepLimitError(maxSteps)
}

/**
 * 模型传来的 arguments 是 JSON 文本：可能为空串，也可能不是合法 JSON。
 * 两种情况都不抛错，转成 error 文本交给循环层回填，让模型自己修。
 */
function parseArguments(raw: string): {
  args: Record<string, unknown>
  error?: string
} {
  if (raw.trim() === '') {
    return { args: {} }
  }
  try {
    return { args: JSON.parse(raw) as Record<string, unknown> }
  } catch {
    return { args: {}, error: `arguments 不是合法 JSON：${raw}` }
  }
}

/** observation 的序列化规则：string 原样，其他类型 JSON.stringify */
function toObservation(value: unknown): string {
  if (typeof value === 'string') return value
  const serialized: string | undefined = JSON.stringify(value)
  return serialized === undefined ? String(value) : serialized
}
