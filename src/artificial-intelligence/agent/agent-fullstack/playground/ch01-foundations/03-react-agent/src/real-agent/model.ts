/**
 * 协议层：只负责「把消息发出去、把消息收回来」。
 * 不知道什么是 Agent、什么是循环、什么时候停。
 * 这里用 openai SDK，不再手写 fetch 和请求体。
 */
import OpenAI from 'openai'
import type {
  ChatCompletionMessageParam,
  ChatCompletionTool
} from 'openai/resources/chat/completions'
import type {
  ChatCompletionMessage,
  ChatMessage,
  ModelConfig,
  Tool
} from './types'

/**
 * TODO 1 · 把 Tool[] 转成请求体里的 tools 数组。
 *
 * 每项形如：
 * { type: 'function', function: { name, description, parameters } }
 */
export function toOpenAiTools(tools: Tool[]): ChatCompletionTool[] {
  return tools.map((tool) => ({
    type: 'function' as const,
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters
    }
  }))
}

/**
 * TODO 2 · 调用 /chat/completions（openai SDK 版）。
 *
 * - new OpenAI({ apiKey, baseURL }) 创建客户端
 * - client.chat.completions.create({ model, messages, tools })
 * - 从 choices[0].message 里只取 content 和 tool_calls
 *
 * SDK 自带 429 / 5xx / 连接错误的重试（maxRetries 默认 2），
 * 需要改超时或重试次数时，在构造参数里加 timeout / maxRetries。
 */
export async function invokeModel(
  config: ModelConfig,
  messages: ChatMessage[],
  tools: Tool[]
): Promise<ChatCompletionMessage> {
  const client = new OpenAI({
    apiKey: config.apiKey,
    baseURL: config.baseUrl
  })

  const openAiTools = toOpenAiTools(tools)

  const response = await client.chat.completions.create({
    model: config.model,
    messages: messages as ChatCompletionMessageParam[],
    // 空数组有些服务端会当成非法参数，干脆不传
    tools: openAiTools.length > 0 ? openAiTools : undefined
  })

  const message = response.choices[0]?.message
  if (!message) {
    throw new Error('模型响应缺少 choices[0].message')
  }

  // SDK v7 的 tool_calls 还可能是 custom 类型，
  // 这里只保留我们支持的 function 调用。
  const toolCalls = (message.tool_calls ?? []).flatMap((call) =>
    call.type === 'function'
      ? [
          {
            id: call.id,
            type: 'function' as const,
            function: {
              name: call.function.name,
              arguments: call.function.arguments
            }
          }
        ]
      : []
  )

  return {
    content: message.content,
    tool_calls: toolCalls
  }
}
