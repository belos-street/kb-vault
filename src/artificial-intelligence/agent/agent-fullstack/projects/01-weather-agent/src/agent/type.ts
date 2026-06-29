/** Agent 可用的工具定义，描述功能 + 参数 schema + 执行逻辑 */
export interface Tool {
  name: string
  description: string
  parameters: Record<string, unknown> // JSON Schema，用于 LLM function calling
  execute: (args: Record<string, unknown>) => Promise<string> | string
}

/** ReAct 循环的阶段事件，供 CLI 实时展示进度 */
export interface StepEvent {
  /** 阶段类型 */
  type: 'retrieve' | 'think' | 'act' | 'observe' | 'response'
  /** 工具名（act/observe 阶段） */
  tool?: string
  /** 工具参数（act 阶段） */
  args?: string
  /** 工具执行结果（observe 阶段） */
  result?: string
}
