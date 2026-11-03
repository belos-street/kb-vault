/**
 * 03 · 手写 ReAct 循环
 *
 * 模型是剧本化的（shared/scripted-model.ts），你负责驱动循环、
 * 调用工具、把结果回填成消息。规格见同目录 README.md。
 */
import type { ScriptedModel } from '@/shared/scripted-model'

export interface Tool {
  name: string
  description: string
  run(args: Record<string, unknown>): Promise<unknown>
}

export type AgentStep =
  | {
      type: 'tool'
      name: string
      args: Record<string, unknown>
      observation?: string
      error?: string
    }
  | { type: 'final'; content: string }

export class AgentStepLimitError extends Error {
  readonly maxSteps: number

  constructor(maxSteps: number) {
    super(`达到最大步数 ${maxSteps}，Agent 仍未给出最终答案`)
    this.name = 'AgentStepLimitError'
    this.maxSteps = maxSteps
  }
}

export interface RunAgentOptions {
  maxSteps?: number
}

export interface AgentResult {
  answer: string
  steps: AgentStep[]
}

/**
 * 跑一轮 ReAct 循环。
 *
 * 约定：
 * - 初始消息是 system + user
 * - 每轮 invoke 模型；final 结束，tool_call 执行工具
 * - 未知工具 / 工具异常都转成 observation，不中断循环
 * - 超过 maxSteps 抛 AgentStepLimitError
 */
export async function runAgent(
  _task: string,
  _model: ScriptedModel,
  _tools: Tool[],
  _options: RunAgentOptions = {}
): Promise<AgentResult> {
  throw new Error('TODO: 实现 ReAct 循环')
}
