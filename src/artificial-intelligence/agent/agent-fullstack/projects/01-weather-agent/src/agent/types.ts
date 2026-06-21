/**
 * Agent 核心类型定义
 */

export type Role = "system" | "user" | "assistant" | "tool";

export interface Message {
  role: Role;
  content: string;
  /** tool 调用结果的 name，role 为 tool 时必填 */
  name?: string;
  /** tool 调用请求，role 为 assistant 时可能包含 */
  tool_calls?: ToolCall[];
  /** tool 调用 ID，role 为 tool 时必填 */
  tool_call_id?: string;
}

export interface ToolCall {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
}

export interface Tool {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  execute: (args: Record<string, unknown>) => Promise<string> | string;
}

export interface WeatherData {
  city: string;
  temperature: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  condition: string;
  updateTime: string;
}

export interface AgentState {
  messages: Message[];
  lastQueryCity?: string;
}

export interface ReActStep {
  thought: string;
  action?: ToolCall;
  observation?: string;
  response?: string;
}
