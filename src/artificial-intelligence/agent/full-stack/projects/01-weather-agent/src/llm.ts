import OpenAI from 'openai'
import type {
  ChatCompletionMessageFunctionToolCall,
  ChatCompletionMessageParam,
  ChatCompletionTool
} from 'openai/resources/chat/completions'

/** core 自己的消息结构，不把 SDK 类型泄漏到业务层 */
export type ChatMessage =
  | { role: 'system' | 'user'; content: string }
  | { role: 'assistant'; content: string | null; toolCalls?: ToolCall[] }
  | { role: 'tool'; toolCallId: string; content: string }

export type ToolSpec = {
  name: string
  description: string
  parameters: Record<string, unknown>
}

export type ToolCall = {
  id: string
  name: string
  arguments: string
}

export type LlmReply = {
  content: string | null
  toolCalls: ToolCall[]
}

export type Llm = {
  complete(messages: ChatMessage[]): Promise<string>
  stream(messages: ChatMessage[]): AsyncIterable<string>
  chat(messages: ChatMessage[], tools: ToolSpec[]): Promise<LlmReply>
}

/** 内部 camelCase 只在这里翻译成 SDK 的 snake_case */
function toSdkMessages(
  messages: ChatMessage[]
): ChatCompletionMessageParam[] {
  return messages.map((message) => {
    if (message.role === 'tool') {
      return {
        role: 'tool',
        tool_call_id: message.toolCallId,
        content: message.content
      }
    }

    if (message.role === 'assistant') {
      return {
        role: 'assistant',
        content: message.content,
        ...(message.toolCalls?.length
          ? { tool_calls: message.toolCalls.map(toSdkToolCall) }
          : {})
      }
    }

    return { role: message.role, content: message.content }
  })
}

function toSdkToolCall(call: ToolCall): ChatCompletionMessageFunctionToolCall {
  return {
    id: call.id,
    type: 'function',
    function: { name: call.name, arguments: call.arguments }
  }
}

function toSdkTool(tool: ToolSpec): ChatCompletionTool {
  return {
    type: 'function',
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters
    }
  }
}

/** 唯一 import 'openai' 的地方：SDK 只在这里出现 */
export function createLlm(
  env: Record<string, string | undefined> = process.env
): Llm {
  const apiKey = env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error('缺少 OPENAI_API_KEY')
  }

  const client = new OpenAI({
    apiKey,
    baseURL: env.OPENAI_BASE_URL ?? 'https://api.openai.com/v1',
    timeout: Number(env.LLM_TIMEOUT_MS ?? 30_000),
    maxRetries: 2
  })

  const model = env.DEFAULT_MODEL ?? 'gpt-4o-mini'

  return {
    async complete(messages) {
      const response = await client.chat.completions.create({
        model,
        messages: toSdkMessages(messages)
      })
      return response.choices[0]?.message.content ?? ''
    },

    async *stream(messages) {
      const stream = await client.chat.completions.create({
        model,
        messages: toSdkMessages(messages),
        stream: true
      })

      for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content
        if (text) yield text
      }
    },

    async chat(messages, tools) {
      const response = await client.chat.completions.create({
        model,
        messages: toSdkMessages(messages),
        tools: tools.map(toSdkTool)
      })

      const reply = response.choices[0]?.message
      return {
        content: reply?.content ?? null,
        toolCalls: (reply?.tool_calls ?? [])
          .filter(
            (call): call is ChatCompletionMessageFunctionToolCall =>
              call.type === 'function'
          )
          .map((call) => ({
            id: call.id,
            name: call.function.name,
            arguments: call.function.arguments
          }))
      }
    }
  }
}
