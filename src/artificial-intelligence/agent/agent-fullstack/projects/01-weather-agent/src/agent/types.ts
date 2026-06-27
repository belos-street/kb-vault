/**
 * Agent 核心类型定义
 *
 * 定义了 LLM Agent 对话、工具调用、状态追踪的完整类型体系，
 * 兼容 OpenAI Chat Completions API 的消息格式。
 */

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

/** Agent 可用的工具定义，描述功能 + 参数 schema + 执行逻辑 */
export interface Tool {
  name: string
  description: string
  parameters: Record<string, unknown> // JSON Schema，用于 LLM function calling
  execute: (args: Record<string, unknown>) => Promise<string> | string
}

/** 天气预报 API 返回的结构化数据 */
export interface WeatherData {
  city: string
  temperature: number // 温度，单位：摄氏度
  feelsLike: number // 体感温度，单位：摄氏度
  humidity: number // 湿度，单位：百分比
  windSpeed: number // 风速，单位：km/h
  condition: string // 天气条件，如晴朗、阴雨等
  updateTime: string // 更新时间，ISO 8601 格式
}

/** Agent 运行时的内部状态，用于多轮对话追踪 */
export interface AgentState {
  messages: Message[]
  lastQueryCity?: string // 上次查询的城市，用于追问场景
}

/** ReAct（Reasoning + Acting）单步记录，可用于调试或可视化 */
export interface ReActStep {
  thought: string; // 思考内容
  actions: ToolCall[]; // 执行的操作（可能多个）
  observations: string[]; // 观察结果（与操作一一对应）
  response: string; // 最终回复
}
