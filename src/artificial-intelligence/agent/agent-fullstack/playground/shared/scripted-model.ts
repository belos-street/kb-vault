/**
 * 脚本化假模型：按事先写好的剧本，一次 invoke 返回一步。
 *
 * 练习里所有「模型决策」都由你写进剧本，这样断言是确定的：
 * 可以精确检查第几步调了哪个工具、拿到了什么 observation。
 *
 * 只读基础设施：做题时不要修改这个文件。
 */

export interface ToolCall {
  name: string
  args: Record<string, unknown>
}

export type ChatMessage =
  | { role: 'system'; content: string }
  | { role: 'user'; content: string }
  | { role: 'assistant'; content: string; toolCall?: ToolCall }
  | { role: 'tool'; toolName: string; content: string }

export type ModelTurn =
  | { type: 'tool_call'; toolCall: ToolCall }
  | { type: 'final'; content: string }

export interface ScriptedModel {
  /** 每次 invoke 收到的完整消息列表，按调用顺序记录，方便断言 */
  readonly calls: ChatMessage[][]
  invoke(messages: ChatMessage[]): Promise<ModelTurn>
}

/** 剧本里的一步：调用工具 */
export function toolCall(
  name: string,
  args: Record<string, unknown> = {}
): ModelTurn {
  return { type: 'tool_call', toolCall: { name, args } }
}

/** 剧本里的一步：给出最终回答，循环结束 */
export function final(content: string): ModelTurn {
  return { type: 'final', content }
}

/**
 * 创建一个按剧本顺序返回的模型。
 * 剧本用完还在被调用，会抛错 —— 这通常说明循环没有按预期终止。
 */
export function createScriptedModel(turns: ModelTurn[]): ScriptedModel {
  let cursor = 0
  const calls: ChatMessage[][] = []

  return {
    calls,
    async invoke(messages) {
      calls.push([...messages])
      const turn = turns[cursor]
      cursor += 1
      if (!turn) {
        throw new Error(
          `ScriptedModel 剧本已用完：第 ${cursor} 次调用没有对应步骤`
        )
      }
      return turn
    }
  }
}
