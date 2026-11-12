import OpenAI from 'openai'
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions'

/** core 自己的消息结构，不把 SDK 类型泄漏到业务层 */
export type ChatMessage = {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export type Llm = {
  complete(messages: ChatMessage[]): Promise<string>
  stream(messages: ChatMessage[]): AsyncIterable<string>
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
        messages: messages as ChatCompletionMessageParam[]
      })
      return response.choices[0]?.message.content ?? ''
    },

    async *stream(messages) {
      const stream = await client.chat.completions.create({
        model,
        messages: messages as ChatCompletionMessageParam[],
        stream: true
      })

      for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content
        if (text) yield text
      }
    }
  }
}
