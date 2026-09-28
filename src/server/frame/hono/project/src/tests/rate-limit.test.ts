import { beforeAll, describe, expect, it } from 'bun:test'
import { app } from '../index'
import { resetTestState } from './reset-db'

beforeAll(resetTestState)

let ipSeq = 0
/** 唯一 IP：每个用例独立键空间，不受其他用例/其他文件计数影响 */
const nextIp = () =>
  `10.${Date.now() % 256}.${Math.floor(Date.now() / 256) % 256}.${++ipSeq % 256}`

describe('限流（FR-8）', () => {
  it('429 登录超过严格阈值（10 次/分钟）', async () => {
    const ip = nextIp()
    let last!: Response
    for (let i = 0; i < 11; i++) {
      last = await app.request('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': ip },
        body: JSON.stringify({ email: 'nobody@test.dev', password: 'wrong' })
      })
    }
    expect(last.status).toBe(429)
    const body = (await last.json()) as { code: string; message: string }
    expect(body.code).toBe('RATE_LIMITED')
  })

  it('429 超过全局阈值（60 次/分钟，IP+路由维度）', async () => {
    const ip = nextIp()
    let last!: Response
    for (let i = 0; i < 61; i++) {
      last = await app.request('/api/auth/me', {
        headers: { 'X-Forwarded-For': ip }
      })
    }
    expect(last.status).toBe(429)
  })

  it('不同路由各自计数，互不挤占', async () => {
    const ip = nextIp()
    for (let i = 0; i < 15; i++) {
      await app.request('/api/auth/me', { headers: { 'X-Forwarded-For': ip } })
    }
    // /api/auth/me 已计 15 次，但 /api/posts 是独立键
    const res = await app.request('/api/posts', {
      headers: { 'X-Forwarded-For': ip }
    })
    expect(res.status).toBe(200)
  })
})
