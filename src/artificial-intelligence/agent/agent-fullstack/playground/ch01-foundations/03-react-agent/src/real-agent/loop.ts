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
 * TODO 3 · ReAct 循环（真实接口版）
 *
 * 规格：
 * 1. maxSteps 默认 5；小于 1 抛 RangeError（模型一次都不该被调用）
 * 2. messages = [system, user(task)]
 * 3. 每轮 invokeModel；没有 tool_calls → 记录一步 final 并返回
 * 4. 有 tool_calls：
 *    - 先追加 assistant 消息（content 原样，带 tool_calls）
 *    - 逐个执行，每个结果都要追加一条 tool 消息，
 *      且必须带上对应的 tool_call_id —— 这是与离线版最大的差异
 *    - arguments 是 JSON 字符串，解析失败也要转成 observation
 *    - 未知工具 / 工具异常都不中断循环
 * 5. observation：string 原样，其他类型 JSON.stringify
 * 6. 循环走完仍无 final → 抛 AgentStepLimitError(maxSteps)
 *
 * 进阶（先跑通再看）：
 * - 流式输出（stream: true，逐块累积 content 和 tool_calls）
 * - 重试与超时（429 / 5xx / AbortSignal.timeout）
 * - token 用量与成本统计（response.usage）
 */
export async function runAgent(
  _task: string,
  _tools: Tool[],
  _options: RunAgentOptions = {}
): Promise<AgentResult> {
  throw new Error('TODO: 实现 ReAct 循环')
}
