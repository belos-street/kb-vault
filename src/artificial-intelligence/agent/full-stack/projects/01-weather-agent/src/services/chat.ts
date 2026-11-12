import type { LlmClient } from '../llm/types.ts'

// 核心用例：只依赖 LlmClient 接口，不读 env、不 import Hono、不 import openai。
// CLI 和 HTTP 两个入口共用同一个 ask()。
export function createChatService(deps: { llm: LlmClient }) {
  return {
    async ask(question: string): Promise<string> {
      const reply = await deps.llm.complete({
        messages: [{ role: 'user', content: question }]
      })
      return reply.content ?? ''
    }
  }
}

export type ChatService = ReturnType<typeof createChatService>
