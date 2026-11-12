import type { Llm } from './llm.ts'

/** core：只组织消息，不关心调用方是 CLI 还是 HTTP */
export function createChat(llm: Llm) {
  return {
    ask(question: string): Promise<string> {
      return llm.complete([{ role: 'user', content: question }])
    },

    stream(question: string): AsyncIterable<string> {
      return llm.stream([{ role: 'user', content: question }])
    }
  }
}
