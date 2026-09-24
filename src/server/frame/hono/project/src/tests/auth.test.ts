import { describe, expect, it } from 'bun:test'
import { app } from '../index'

type Envelope = { code: string; message?: string; data?: Record<string, unknown> }

const JSON_HEADERS = { 'Content-Type': 'application/json' }

const cookieHeaderOf = (res: Response) =>
  res.headers
    .getSetCookie()
    .map((c) => c.split(';')[0]!)
    .join('; ')

let seq = 0
const uniqueEmail = () => `u${Date.now()}_${seq++}@test.dev`

const register = (email: string, password = 'Passw0rd!x') =>
  app.request('/api/auth/register', {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify({ email, password }),
  })

const login = (email = 'alice@blog.dev', password = 'Passw0rd!123') =>
  app.request('/api/auth/login', {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify({ email, password }),
  })

describe('POST /api/auth/register', () => {
  it('201 注册成功，默认 reader 角色', async () => {
    const res = await register(uniqueEmail())
    expect(res.status).toBe(201)
    const body = (await res.json()) as Envelope
    expect(body.code).toBe('OK')
    expect(body.data?.role).toBe('reader')
  })

  it('400 非法邮箱 → VALIDATION_ERROR 信封', async () => {
    const res = await register('not-an-email')
    expect(res.status).toBe(400)
    expect(((await res.json()) as Envelope).code).toBe('VALIDATION_ERROR')
  })

  it('409 重复邮箱 → CONFLICT', async () => {
    const email = uniqueEmail()
    await register(email)
    const res = await register(email)
    expect(res.status).toBe(409)
    expect(((await res.json()) as Envelope).code).toBe('CONFLICT')
  })
})

describe('POST /api/auth/login', () => {
  it('200 登录成功并下发双 Cookie', async () => {
    const res = await login()
    expect(res.status).toBe(200)
    const cookie = cookieHeaderOf(res)
    expect(cookie).toContain('access_token=')
    expect(cookie).toContain('refresh_token=')
    expect(res.headers.get('x-request-id')).toBeTruthy()
  })

  it('401 密码错误', async () => {
    const res = await login('alice@blog.dev', 'wrong-password')
    expect(res.status).toBe(401)
    expect(((await res.json()) as Envelope).code).toBe('UNAUTHORIZED')
  })
})

describe('GET /api/auth/me', () => {
  it('401 无 token', async () => {
    const res = await app.request('/api/auth/me')
    expect(res.status).toBe(401)
    expect(((await res.json()) as Envelope).code).toBe('UNAUTHORIZED')
  })

  it('200 带 access token 返回当前用户', async () => {
    const loginRes = await login()
    const res = await app.request('/api/auth/me', {
      headers: { Cookie: cookieHeaderOf(loginRes) },
    })
    expect(res.status).toBe(200)
    const body = (await res.json()) as Envelope
    expect(body.data?.role).toBe('reader')
  })
})

describe('POST /api/auth/refresh', () => {
  it('401 缺 refresh cookie', async () => {
    const res = await app.request('/api/auth/refresh', { method: 'POST' })
    expect(res.status).toBe(401)
  })

  it('200 双 token 轮换', async () => {
    const loginRes = await login()
    const res = await app.request('/api/auth/refresh', {
      method: 'POST',
      headers: { Cookie: cookieHeaderOf(loginRes) },
    })
    expect(res.status).toBe(200)
    const newCookie = cookieHeaderOf(res)
    expect(newCookie).toContain('access_token=')
    expect(newCookie).toContain('refresh_token=')
  })
})

describe('POST /api/auth/logout', () => {
  it('200 清除 Cookie', async () => {
    const res = await app.request('/api/auth/logout', { method: 'POST' })
    expect(res.status).toBe(200)
    const cleared = res.headers.getSetCookie().join('; ')
    expect(cleared).toContain('access_token=;')
    expect(cleared).toContain('refresh_token=;')
  })
})
