/**
 * 协议层：只负责"把消息发出去、把消息收回来"。
 *
 * 作用
 * - 定义消息与 tool_call 的线格式（OpenAI Chat Completions）。
 * - 一次模型调用：发请求、抽 content / tool_calls、记录 token 用量。
 *
 * 不负责
 * - 循环、工具执行、压缩、审批；也不认识订单和工单。
 *
 * 分步实现
 * - 第 1 步：先不写重试，能收发即可。
 * - 第 3 步：补 429 / 5xx / 连接错误的重试、退避与 token 计数。
 */
import OpenAI from 'openai'
import type { AppConfig } from '../config'
import type { RunEvent } from './events'
import type { ToolDefinition } from './tool'

/**
 * 模型返回的一次工具调用请求（不是执行结果）。
 * arguments 是 JSON 文本，不是对象；解析失败也要转成 observation。
 */
export interface ToolCall {
  id: string
  name: string
  arguments: string
}

/** 发给模型的一条消息，字段名对应 OpenAI 线格式。 */
export type ChatMessage =
  | { role: 'system'; content: string }
  | { role: 'user'; content: string }
  | {
      role: 'assistant'
      content: string | null
      tool_calls?: ToolCall[]
    }
  | { role: 'tool'; tool_call_id: string; content: string }

/** 一次模型调用的结果：正文 + 工具调用 + 用量。 */
export interface ModelReply {
  content: string | null
  toolCalls: ToolCall[]
  usage: {
    promptTokens: number
    completionTokens: number
  }
}

export interface CallModelOptions {
  config: AppConfig
  messages: ChatMessage[]
  tools: ToolDefinition[]
  events: RunEvent[]
  /** 测试注入的假客户端；缺省时按 config 创建真实客户端 */
  client?: OpenAI
}

/**
 * 调用一次模型。
 *
 * 要做的三件事
 * 1. 用 tool.ts 的 toOpenAiTools 把 ToolDefinition[] 转成请求体格式。
 * 2. 调 client.chat.completions.create({ model, messages, tools })。
 * 3. 把响应归一化成 ModelReply，并 push 一条 model-call 事件。
 *
 * 注意
 * - 空 tools 数组有些服务端会当成非法参数，干脆不传。
 * - SDK v7 的 tool_calls 还可能是 custom 类型，只保留 function。
 */
export async function callModel(
  _options: CallModelOptions
): Promise<ModelReply> {
  throw new Error(
    'TODO 第 1 步：调用 chat.completions.create，并归一化 tool_calls'
  )
}
