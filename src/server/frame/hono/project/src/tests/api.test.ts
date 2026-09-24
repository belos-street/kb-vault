import { describe, expect, it } from 'bun:test'
import { app } from '../index'

describe('统一响应信封（M2 冒烟）', () => {
  it('404 未知名路由 → NOT_FOUND 信封', async () => {
    const res = await app.request('/nope')
    expect(res.status).toBe(404)
    const body = (await res.json()) as { code: string; message: string }
    expect(body.code).toBe('NOT_FOUND')
    expect(typeof body.message).toBe('string')
  })

  it('未知 API 路由同样走信封', async () => {
    const res = await app.request('/api/nope')
    expect(res.status).toBe(404)
    expect(((await res.json()) as { code: string }).code).toBe('NOT_FOUND')
  })
})

describe('可观测性（M3 冒烟）', () => {
  it('每个响应带 X-Request-ID（透传或生成）', async () => {
    const res = await app.request('/healthz', { headers: { 'X-Request-ID': 'test-rid-1' } })
    expect(res.status).toBe(200)
    expect(res.headers.get('x-request-id')).toBe('test-rid-1')
  })

  it('未带请求头时生成 UUID', async () => {
    const res = await app.request('/healthz')
    const rid = res.headers.get('x-request-id') ?? ''
    expect(rid).toMatch(/^[0-9a-f-]{36}$/)
  })
})
