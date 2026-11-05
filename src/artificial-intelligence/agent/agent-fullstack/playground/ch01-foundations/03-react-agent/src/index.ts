/**
 * 03 · 手写 ReAct 循环
 *
 * 模型是剧本化的（shared/scripted-model.ts），你负责驱动循环、
 * 调用工具、把结果回填成消息。规格见同目录 README.md。
 */
import type { ChatMessage, ScriptedModel } from '@/shared/scripted-model'

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
  task: string,
  model: ScriptedModel,
  tools: Tool[],
  options: RunAgentOptions = {}
): Promise<AgentResult> {
  const maxSteps = options.maxSteps ?? 5
  if (maxSteps < 1) {
    throw new RangeError(`maxSteps 必须大于等于 1，收到 ${maxSteps}`)
  }

  const registry = new Map(tools.map((tool) => [tool.name, tool]))
  const messages: ChatMessage[] = [
    { role: 'system', content: '你是一个可以调用工具的 Agent。' },
    { role: 'user', content: task }
  ]
  const steps: AgentStep[] = []

  for (let i = 0; i < maxSteps; i += 1) {
    const turn = await model.invoke(messages)

    if (turn.type === 'final') {
      steps.push({ type: 'final', content: turn.content })
      return { answer: turn.content, steps }
    }

    const { name, args } = turn.toolCall
    messages.push({ role: 'assistant', content: '', toolCall: turn.toolCall })

    const tool = registry.get(name)
    let observation: string
    let error: string | undefined

    if (!tool) {
      observation = `Unknown tool: ${name}`
      error = observation
    } else {
      try {
        const result = await tool.run(args)
        observation =
          typeof result === 'string' ? result : JSON.stringify(result)
      } catch (cause) {
        const message = cause instanceof Error ? cause.message : String(cause)
        observation = `Error: ${message}`
        error = message
      }
    }

    messages.push({ role: 'tool', toolName: name, content: observation })
    steps.push({ type: 'tool', name, args, observation, error })
  }

  throw new AgentStepLimitError(maxSteps)
}
