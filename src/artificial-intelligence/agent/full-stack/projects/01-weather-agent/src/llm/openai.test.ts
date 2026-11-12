import { afterEach, describe, expect, test } from 'bun:test'
import { createOpenAiClient } from './openai.ts'

const originalFetch = globalThis.fetch

function createClient() {
  return createOpenAiClient({
    openaiApiKey: 'test-key',
    openaiBaseUrl: 'https://example.test/v1',
    model: 'test-model',
    llmTimeoutMs: 1000,
    maxRetries: 0
  })
}

function chatResponse(message: Record<string, unknown>): Response {
  return new Response(
    JSON.stringify({
      id: 'chatcmpl-test',
      object: 'chat.completion',
      created: 0,
      model: 'test-model',
      choices: [{ index: 0, message, finish_reason: 'stop' }]
    }),
    { status: 200, headers: { 'content-type': 'application/json' } }
  )
}

afterEach(() => {
  globalThis.fetch = originalFetch
})

describe('OpenAI SDK 适配器', () => {
  test('把文本响应映射为 LlmReply', async () => {
    let capturedUrl = ''
    let capturedBody: Record<string, unknown> = {}
    globalThis.fetch = (async (input, init) => {
      capturedUrl = String(input)
      capturedBody = JSON.parse(String(init?.body)) as Record<string, unknown>
      return chatResponse({ role: 'assistant', content: '你好' })
    }) as typeof fetch

    const reply = await createClient().complete({
      messages: [{ role: 'user', content: '在吗' }]
    })

    expect(reply).toEqual({ content: '你好', toolCalls: [] })
    expect(capturedUrl).toBe('https://example.test/v1/chat/completions')
    expect(capturedBody.model).toBe('test-model')
  })

  test('把 tool_calls 映射为自己的 ToolCall', async () => {
    globalThis.fetch = (async () =>
      chatResponse({
        role: 'assistant',
        content: null,
        tool_calls: [
          {
            id: 'call_1',
            type: 'function',
            function: { name: 'weather', arguments: '{"city":"杭州"}' }
          }
        ]
      })) as unknown as typeof fetch

    const reply = await createClient().complete({
      messages: [{ role: 'user', content: '杭州天气' }]
    })

    expect(reply.content).toBeNull()
    expect(reply.toolCalls).toEqual([
      { id: 'call_1', name: 'weather', arguments: '{"city":"杭州"}' }
    ])
  })

  test('429 映射为 upstream_rate_limited', async () => {
    globalThis.fetch = (async () =>
      new Response(
        JSON.stringify({
          error: { message: 'rate limited', type: 'rate_limit_error' }
        }),
        { status: 429, headers: { 'content-type': 'application/json' } }
      )) as unknown as typeof fetch

    await expect(
      createClient().complete({
        messages: [{ role: 'user', content: '你好' }]
      })
    ).rejects.toMatchObject({
      code: 'upstream_rate_limited',
      status: 429
    })
  })

  test('已 abort 的 signal 映射为 upstream_timeout', async () => {
    const controller = new AbortController()
    controller.abort()

    await expect(
      createClient().complete({
        messages: [{ role: 'user', content: '你好' }],
        signal: controller.signal
      })
    ).rejects.toMatchObject({
      code: 'upstream_timeout',
      status: 504
    })
  })
})
