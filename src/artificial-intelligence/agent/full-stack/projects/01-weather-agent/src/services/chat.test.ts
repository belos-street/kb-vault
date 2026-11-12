import { describe, expect, test } from 'bun:test'
import { createChatService } from './chat.ts'
import type { LlmClient } from '../llm/types.ts'

describe('chat 核心用例', () => {
  test('把用户消息交给 LlmClient，并返回 content', async () => {
    let received: unknown
    const llm: LlmClient = {
      async complete(input) {
        received = input.messages
        return { content: '你好', toolCalls: [] }
      }
    }

    const { ask } = createChatService({ llm })

    expect(await ask('在吗')).toBe('你好')
    expect(received).toEqual([{ role: 'user', content: '在吗' }])
  })

  test('content 为 null 时返回空字符串', async () => {
    const llm: LlmClient = {
      async complete() {
        return { content: null, toolCalls: [] }
      }
    }

    const { ask } = createChatService({ llm })

    expect(await ask('在吗')).toBe('')
  })
})
