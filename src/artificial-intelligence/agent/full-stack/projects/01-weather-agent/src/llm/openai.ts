import OpenAI from 'openai'
import type {
  ChatCompletionCreateParamsNonStreaming,
  ChatCompletionMessage,
  ChatCompletionMessageParam,
  ChatCompletionTool
} from 'openai/resources/chat/completions'
import { AppError } from '../lib/errors.ts'
import type { ChatMessage, LlmClient, ToolCall, ToolSpec } from './types.ts'

export type OpenAiClientConfig = {
  openaiApiKey: string
  openaiBaseUrl: string
  model: string
  llmTimeoutMs: number
  maxRetries?: number
}

export function createOpenAiClient(config: OpenAiClientConfig): LlmClient {
  const client = new OpenAI({
    apiKey: config.openaiApiKey,
    baseURL: config.openaiBaseUrl,
    timeout: config.llmTimeoutMs,
    maxRetries: config.maxRetries ?? 2
  })

  return {
    async complete(input) {
      const params: ChatCompletionCreateParamsNonStreaming = {
        model: config.model,
        messages: input.messages.map(toSdkMessage)
      }
      if (input.tools?.length) {
        params.tools = input.tools.map(toSdkTool)
      }

      try {
        const response = await client.chat.completions.create(
          params,
          input.signal ? { signal: input.signal } : {}
        )
        const message = response.choices[0]?.message
        return {
          content: message?.content ?? null,
          toolCalls: message ? toToolCalls(message) : []
        }
      } catch (error) {
        throw toAppError(error)
      }
    }
  }
}

function toSdkMessage(message: ChatMessage): ChatCompletionMessageParam {
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
        ? {
            tool_calls: message.toolCalls.map((call) => ({
              id: call.id,
              type: 'function' as const,
              function: {
                name: call.name,
                arguments: call.arguments
              }
            }))
          }
        : {})
    }
  }

  return { role: message.role, content: message.content }
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

function toToolCalls(message: ChatCompletionMessage): ToolCall[] {
  return (message.tool_calls ?? []).flatMap((call) => {
    if (call.type !== 'function') return []
    return [
      {
        id: call.id,
        name: call.function.name,
        arguments: call.function.arguments
      }
    ]
  })
}

function toAppError(error: unknown): AppError {
  if (error instanceof AppError) return error
  if (error instanceof OpenAI.APIUserAbortError) {
    return new AppError('upstream_timeout', 504, '模型超时')
  }
  if (error instanceof OpenAI.APIConnectionTimeoutError) {
    return new AppError('upstream_timeout', 504, '模型超时')
  }
  if (error instanceof OpenAI.RateLimitError) {
    return new AppError('upstream_rate_limited', 429, '稍后重试')
  }
  if (
    error instanceof OpenAI.AuthenticationError ||
    error instanceof OpenAI.PermissionDeniedError
  ) {
    return new AppError('server_misconfigured', 500, '模型鉴权失败')
  }
  if (error instanceof OpenAI.APIError) {
    return new AppError(
      'upstream_error',
      502,
      '上游返回 ' + (error.status ?? 'unknown')
    )
  }
  if (error instanceof Error && error.name === 'AbortError') {
    return new AppError('upstream_timeout', 504, '模型超时')
  }
  return new AppError('internal_error', 500, '服务内部错误')
}
