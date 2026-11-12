import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { callModel } from './agents/chat.ts'
import { AppError } from './lib/errors.ts'
import { app } from './server.ts'
import { chat } from './services/chat.ts'

const originalFetch = globalThis.fetch
const savedEnv = { ...process.env }

function restoreEnv() {
  for (const key of Object.keys(process.env)) {
    if (!(key in savedEnv)) delete process.env[key]
  }
  Object.assign(process.env, savedEnv)
}

function jsonResponse(content: string, status = 200): Response {
  return new Response(
    JSON.stringify({ choices: [{ message: { content } }] }),
    {
      status,
      headers: { 'content-type': 'application/json' }
    }
  )
}

function authHeaders(): Record<string, string> {
  return {
    authorization: 'Bearer test-key',
    'content-type': 'application/json'
  }
}

beforeEach(() => {
  process.env.SERVICE_API_KEY = 'test-key'
  process.env.OPENAI_API_KEY = 'test-key'
  process.env.OPENAI_BASE_URL = 'https://example.test/v1'
  process.env.DEFAULT_MODEL = 'test-model'
})

afterEach(() => {
  globalThis.fetch = originalFetch
  restoreEnv()
})

describe('agent 层', () => {
  test('callModel 返回模型文本，并使用 OpenAI 兼容请求', async () => {
    let capturedUrl = ''
    let capturedBody = ''
    globalThis.fetch = (async (input, init) => {
      capturedUrl = String(input)
      capturedBody = String(init?.body ?? '')
      return jsonResponse('你好')
    }) as typeof fetch

    const text = await callModel({
      messages: [{ role: 'user', content: '你好' }],
      signal: new AbortController().signal
    })

    expect(text).toBe('你好')
    expect(capturedUrl).toBe('https://example.test/v1/chat/completions')
    expect(JSON.parse(capturedBody).model).toBe('test-model')
  })

  test('上游非 2xx 时把 status 挂在 error 上', async () => {
    globalThis.fetch = (async () =>
      new Response('', { status: 500 })) as unknown as typeof fetch

    await expect(
      callModel({
        messages: [{ role: 'user', content: '你好' }],
        signal: new AbortController().signal
      })
    ).rejects.toMatchObject({ status: 500 })
  })
})

describe('service 层', () => {
  test('429 映射为 upstream_rate_limited', async () => {
    globalThis.fetch = (async () =>
      new Response('', { status: 429 })) as unknown as typeof fetch

    await expect(chat({ message: '你好' })).rejects.toMatchObject({
      code: 'upstream_rate_limited',
      status: 429
    })
  })

  test('超时映射为 upstream_timeout', async () => {
    globalThis.fetch = (async (_input, init) => {
      return new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => {
          const error = new Error('aborted')
          error.name = 'AbortError'
          reject(error)
        })
      })
    }) as typeof fetch

    await expect(chat({ message: '慢请求', timeoutMs: 10 })).rejects.toMatchObject({
      code: 'upstream_timeout',
      status: 504
    })
  })

  test('缺少 Key 映射为 server_misconfigured', async () => {
    delete process.env.OPENAI_API_KEY

    await expect(chat({ message: '你好' })).rejects.toBeInstanceOf(AppError)
    await expect(chat({ message: '你好' })).rejects.toMatchObject({
      code: 'server_misconfigured',
      status: 500
    })
  })
})

describe('HTTP 层', () => {
  test('非法入参返回 400 invalid_input', async () => {
    const response = await app.request('/api/chat', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ threadId: 't1', message: '' })
    })
    const body = (await response.json()) as { code?: string }

    expect(response.status).toBe(400)
    expect(body.code).toBe('invalid_input')
  })

  test('缺少 API Key 返回 401', async () => {
    const response = await app.request('/api/chat', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ threadId: 't1', message: '你好' })
    })

    expect(response.status).toBe(401)
  })

  test('SSE 按 meta → delta → done 输出', async () => {
    const response = await app.request('/api/chat/stream', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ threadId: 't1', message: '杭州天气' })
    })
    const text = await response.text()
    const events = [...text.matchAll(/event: ([a-z]+)/g)].map(
      (match) => match[1]
    )

    expect(response.status).toBe(200)
    expect(events[0]).toBe('meta')
    expect(events).toContain('delta')
    expect(events.at(-1)).toBe('done')
  })
})
