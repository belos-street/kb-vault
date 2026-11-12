import { describe, expect, test } from 'bun:test'
import { createApp } from './app.ts'
import { AppError } from './lib/errors.ts'

const authHeaders = {
  authorization: 'Bearer test-key',
  'content-type': 'application/json'
}

function createTestApp(
  ask: (question: string) => Promise<string> = async () => '你好'
) {
  return createApp({ ask, serviceApiKey: 'test-key' })
}

describe('HTTP 适配层', () => {
  test('合法请求返回 reply', async () => {
    const app = createTestApp(async (question) => '回答:' + question)
    const response = await app.request('/api/chat', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ threadId: 't1', message: '在吗' })
    })
    const body = (await response.json()) as { reply: string }

    expect(response.status).toBe(200)
    expect(body.reply).toBe('回答:在吗')
  })

  test('非法入参返回 400 invalid_input', async () => {
    const app = createTestApp()
    const response = await app.request('/api/chat', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ threadId: 't1', message: '' })
    })
    const body = (await response.json()) as { code: string }

    expect(response.status).toBe(400)
    expect(body.code).toBe('invalid_input')
  })

  test('缺少 API Key 返回 401', async () => {
    const app = createTestApp()
    const response = await app.request('/api/chat', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ threadId: 't1', message: '你好' })
    })

    expect(response.status).toBe(401)
  })

  test('AppError 映射为对应状态码', async () => {
    const app = createTestApp(async () => {
      throw new AppError('upstream_timeout', 504, '模型超时')
    })
    const response = await app.request('/api/chat', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ threadId: 't1', message: '你好' })
    })
    const body = (await response.json()) as { code: string }

    expect(response.status).toBe(504)
    expect(body.code).toBe('upstream_timeout')
  })

  test('未知错误返回 500', async () => {
    const app = createTestApp(async () => {
      throw new Error('boom')
    })
    const response = await app.request('/api/chat', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ threadId: 't1', message: '你好' })
    })
    const body = (await response.json()) as { code: string }

    expect(response.status).toBe(500)
    expect(body.code).toBe('internal_error')
  })
})
