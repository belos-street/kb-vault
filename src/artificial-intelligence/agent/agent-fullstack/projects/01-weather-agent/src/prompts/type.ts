/** LLM 消息角色：system/user/assistant/tool */
export type Role = 'system' | 'user' | 'assistant' | 'tool'

/** 单条对话消息，兼容 tool 调用场景 */
export interface Message {
  role: Role
  content: string
  /** tool 调用结果的 name，role 为 tool 时必填 */
  name?: string
  /** tool 调用请求，role 为 assistant 时可能包含 */
  tool_calls?: ToolCall[]
  /** tool 调用 ID，role 为 tool 时必填 */
  tool_call_id?: string
}

/** LLM 发起的工具调用请求，由 Agent 解析并执行 */
export interface ToolCall {
  id: string
  type: 'function'
  function: {
    name: string
    arguments: string // JSON 字符串，需 parse 后传入 Tool.execute
  }
}
