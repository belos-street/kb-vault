import { beforeAll, describe, expect, it } from 'bun:test'
import { app } from '../index'
import { resetTestState } from './reset-db'

beforeAll(resetTestState)

type Envelope = {
  code: string
  message?: string
  data?: Record<string, unknown> & {
    id?: number
    commentCount?: number
    version?: number
  }
}

const JSON_HEADERS = { 'Content-Type': 'application/json' }

const cookieHeaderOf = (res: Response) =>
  res.headers
    .getSetCookie()
    .map((c) => c.split(';')[0]!)
    .join('; ')

let seq = 0
let ipSeq = 0
const nextIp = () =>
  `10.${Date.now() % 256}.${Math.floor(Date.now() / 256) % 256}.${++ipSeq % 256}`

const newSession = async (): Promise<string> => {
  const email = `x${Date.now()}_${seq++}@test.dev`
  const ip = nextIp()
  await app.request('/api/auth/register', {
    method: 'POST',
    headers: { ...JSON_HEADERS, 'X-Forwarded-For': ip },
    body: JSON.stringify({ email, password: 'Passw0rd!x' })
  })
  const loginRes = await app.request('/api/auth/login', {
    method: 'POST',
    headers: { ...JSON_HEADERS, 'X-Forwarded-For': ip },
    body: JSON.stringify({ email, password: 'Passw0rd!x' })
  })
  return cookieHeaderOf(loginRes)
}

const createPost = async (cookie: string, title = '并发测试文章') => {
  const res = await app.request('/api/posts', {
    method: 'POST',
    headers: { ...JSON_HEADERS, Cookie: cookie },
    body: JSON.stringify({ title, content: '正文' })
  })
  return (await res.json()) as Envelope
}

const publishPost = async (cookie: string) => {
  const created = await createPost(cookie)
  const id = created.data!.id!
  await app.request(`/api/posts/${id}/transition`, {
    method: 'POST',
    headers: { ...JSON_HEADERS, Cookie: cookie },
    body: JSON.stringify({ action: 'submit' })
  })
  const editorRes = await app.request('/api/auth/login', {
    method: 'POST',
    headers: { ...JSON_HEADERS, 'X-Forwarded-For': nextIp() },
    body: JSON.stringify({ email: 'editor@blog.dev', password: 'Passw0rd!123' })
  })
  await app.request(`/api/posts/${id}/transition`, {
    method: 'POST',
    headers: { ...JSON_HEADERS, Cookie: cookieHeaderOf(editorRes) },
    body: JSON.stringify({ action: 'approve' })
  })
  return id
}

describe('并发与幂等（FR-15）', () => {
  it('并发双写命中乐观锁：同 version 并发 PATCH → 一 200 一 409', async () => {
    const cookie = await newSession()
    const created = await createPost(cookie)
    const id = created.data!.id!

    // 两个请求都带 version=1，只有一个能命中条件更新
    const [r1, r2] = await Promise.all([
      app.request(`/api/posts/${id}`, {
        method: 'PATCH',
        headers: { ...JSON_HEADERS, Cookie: cookie },
        body: JSON.stringify({ title: 'A 改', version: 1 })
      }),
      app.request(`/api/posts/${id}`, {
        method: 'PATCH',
        headers: { ...JSON_HEADERS, Cookie: cookie },
        body: JSON.stringify({ title: 'B 改', version: 1 })
      })
    ])
    const statuses = [r1.status, r2.status].sort()
    expect(statuses).toEqual([200, 409])
  })

  it('并发评论不丢计数：5 条并发评论 → commentCount 对账为 5', async () => {
    const owner = await newSession()
    const id = await publishPost(owner)
    const commenters = await Promise.all([
      newSession(),
      newSession(),
      newSession(),
      newSession(),
      newSession()
    ])

    const results = await Promise.all(
      commenters.map((cookie) =>
        app.request(`/api/posts/${id}/comments`, {
          method: 'POST',
          headers: { ...JSON_HEADERS, Cookie: cookie },
          body: JSON.stringify({ content: '并发评论' })
        })
      )
    )
    for (const r of results) expect(r.status).toBe(201)

    const detail = (await (
      await app.request(`/api/posts/${id}`)
    ).json()) as Envelope
    expect(detail.data?.commentCount).toBe(5)

    const list = (await (
      await app.request(`/api/posts/${id}/comments`)
    ).json()) as Envelope
    expect(list.data?.total).toBe(5)
  })
})
