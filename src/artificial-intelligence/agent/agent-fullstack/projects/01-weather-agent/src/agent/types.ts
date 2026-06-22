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
  temperature: number; // 温度，单位：摄氏度
  feelsLike: number; // 体感温度，单位：摄氏度
  humidity: number; // 湿度，单位：百分比
  windSpeed: number; // 风速
  condition: string; // 天气条件，如晴晴朗、阴雨等
  updateTime: string; // 更新时间
}

export interface AgentState {
  messages: Message[];
  lastQueryCity?: string;
}

export interface ReActStep {
  thought: string; // 思考内容
  action?: ToolCall; // 执行的操作
  observation?: string; // 观察结果
  response?: string; // 回答内容
}
