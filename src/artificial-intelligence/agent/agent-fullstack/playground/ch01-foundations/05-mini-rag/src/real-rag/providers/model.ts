/**
 * 协议层：一次对话调用，只负责发出去、收回来。
 * 不知道 RAG，也不知道循环。
 */
import OpenAI from 'openai'
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions'
import type { ChatMessage, ModelConfig, TokenUsage } from '../contracts/types'

export interface ChatResult {
  content: string
  usage?: TokenUsage
}

export async function invokeChat(
  config: ModelConfig,
  messages: ChatMessage[],
  temperature = 0
): Promise<ChatResult> {
  const client = new OpenAI({
    apiKey: config.apiKey,
    baseURL: config.baseUrl
  })

  const response = await client.chat.completions.create({
    model: config.model,
    messages: messages as ChatCompletionMessageParam[],
    // 问答场景要稳定复现，默认关掉随机性
    temperature
  })

  const message = response.choices[0]?.message
  if (!message) {
    throw new Error('模型响应缺少 choices[0].message')
  }

  const usage = response.usage
  return {
    content: message.content ?? '',
    usage: usage
      ? {
          promptTokens: usage.prompt_tokens,
          completionTokens: usage.completion_tokens,
          totalTokens: usage.total_tokens
        }
      : undefined
  }
}
