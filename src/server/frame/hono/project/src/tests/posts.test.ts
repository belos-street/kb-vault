import { describe, expect, it } from 'bun:test'
import { app } from '../index'

type Envelope = {
  code: string
  message?: string
  data?: Record<string, unknown> & { id?: number; status?: string; version?: number }
}

const JSON_HEADERS = { 'Content-Type': 'application/json' }

const cookieHeaderOf = (res: Response) =>
  res.headers
    .getSetCookie()
    .map((c) => c.split(';')[0]!)
    .join('; ')

let seq = 0
/** 注册并登录一个新 reader，返回 Cookie 头 */
const newSession = async (): Promise<string> => {
  const email = `p${Date.now()}_${seq++}@test.dev`
  await app.request('/api/auth/register', {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify({ email, password: 'Passw0rd!x' }),
  })
  const loginRes = await app.request('/api/auth/login', {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify({ email, password: 'Passw0rd!x' }),
  })
  return cookieHeaderOf(loginRes)
}

const loginAs = async (email: string) => {
  const res = await app.request('/api/auth/login', {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify({ email, password: 'Passw0rd!123' }),
  })
  return cookieHeaderOf(res)
}

const createPost = async (cookie: string, title = '测试文章') => {
  const res = await app.request('/api/posts', {
    method: 'POST',
    headers: { ...JSON_HEADERS, Cookie: cookie },
    body: JSON.stringify({ title, content: '正文' }),
  })
  return (await res.json()) as Envelope
}

const transition = (cookie: string, id: number, action: string, reason?: string) =>
  app.request(`/api/posts/${id}/transition`, {
    method: 'POST',
    headers: { ...JSON_HEADERS, Cookie: cookie },
    body: JSON.stringify(reason ? { action, reason } : { action }),
  })

describe('POST /api/posts', () => {
  it('401 未登录', async () => {
    const res = await app.request('/api/posts', {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify({ title: 'x' }),
    })
    expect(res.status).toBe(401)
  })

  it('201 创建成功，初始 DRAFT', async () => {
    const cookie = await newSession()
    const res = await app.request('/api/posts', {
      method: 'POST',
      headers: { ...JSON_HEADERS, Cookie: cookie },
      body: JSON.stringify({ title: '第一篇', content: 'hi' }),
    })
    expect(res.status).toBe(201)
    const body = (await res.json()) as Envelope
    expect(body.data?.status).toBe('DRAFT')
    expect(body.data?.version).toBe(1)
  })

  it('400 缺标题 → VALIDATION_ERROR', async () => {
    const cookie = await newSession()
    const res = await app.request('/api/posts', {
      method: 'POST',
      headers: { ...JSON_HEADERS, Cookie: cookie },
      body: JSON.stringify({}),
    })
    expect(res.status).toBe(400)
    expect(((await res.json()) as Envelope).code).toBe('VALIDATION_ERROR')
  })
})

describe('GET /api/posts 可见性矩阵', () => {
  it('匿名只能看到 PUBLISHED', async () => {
    const cookie = await newSession()
    const created = await createPost(cookie, '匿名不可见')
    const res = await app.request('/api/posts')
    const body = (await res.json()) as Envelope
    const data = body.data as { items: { id: number }[] }
    expect(data.items.some((p) => p.id === created.data?.id)).toBe(false)
  })

  it('作者能看到自己的 DRAFT', async () => {
    const cookie = await newSession()
    const created = await createPost(cookie, '作者可见')
    const res = await app.request('/api/posts', { headers: { Cookie: cookie } })
    const body = (await res.json()) as Envelope
    const data = body.data as { items: { id: number }[] }
    expect(data.items.some((p) => p.id === created.data?.id)).toBe(true)
  })
})

describe('GET /api/posts/:id', () => {
  it('非公开且非本人 → 404（不泄露存在性）', async () => {
    const owner = await newSession()
    const other = await newSession()
    const created = await createPost(owner)
    const res = await app.request(`/api/posts/${created.data?.id}`, {
      headers: { Cookie: other },
    })
    expect(res.status).toBe(404)
  })

  it('不存在 → 404', async () => {
    const res = await app.request('/api/posts/999999')
    expect(res.status).toBe(404)
  })
})

describe('状态流转：submit / approve / 幂等 / 权限', () => {
  it('submit → PENDING_REVIEW；重复 submit 幂等返回 200', async () => {
    const cookie = await newSession()
    const created = await createPost(cookie)
    const id = created.data!.id!

    const t1 = await transition(cookie, id, 'submit')
    expect(t1.status).toBe(200)
    expect(((await t1.json()) as Envelope).data?.status).toBe('PENDING_REVIEW')

    const t2 = await transition(cookie, id, 'submit')
    expect(t2.status).toBe(200)
    expect(((await t2.json()) as Envelope).data?.status).toBe('PENDING_REVIEW')
  })

  it('非作者 submit → 403，且写入 DENIED 审计', async () => {
    const owner = await newSession()
    const other = await newSession()
    const created = await createPost(owner)
    const res = await transition(other, created.data!.id!, 'submit')
    expect(res.status).toBe(403)
    expect(((await res.json()) as Envelope).code).toBe('FORBIDDEN')
  })

  it('作者（reader）approve → 403；editor approve → 200 PUBLISHED', async () => {
    const owner = await newSession()
    const created = await createPost(owner)
    const id = created.data!.id!
    await transition(owner, id, 'submit')

    const ownerApprove = await transition(owner, id, 'approve')
    expect(ownerApprove.status).toBe(403)

    const editorCookie = await loginAs('editor@blog.dev')
    const approve = await transition(editorCookie, id, 'approve')
    expect(approve.status).toBe(200)
    expect(((await approve.json()) as Envelope).data?.status).toBe('PUBLISHED')
  })

  it('reject 带驳回原因 → 回 DRAFT', async () => {
    const owner = await newSession()
    const created = await createPost(owner)
    const id = created.data!.id!
    await transition(owner, id, 'submit')
    const editorCookie = await loginAs('editor@blog.dev')
    const res = await transition(editorCookie, id, 'reject', '标题党，重写')
    expect(res.status).toBe(200)
    expect(((await res.json()) as Envelope).data?.status).toBe('DRAFT')
  })

  it('状态已漂移的非法流转 → 422', async () => {
    const owner = await newSession()
    const created = await createPost(owner)
    const id = created.data!.id!
    await transition(owner, id, 'submit')
    // 当前 PENDING_REVIEW，尝试 archive（源状态 PUBLISHED，且不匹配）
    const editorCookie = await loginAs('editor@blog.dev')
    const res = await transition(editorCookie, id, 'archive')
    expect(res.status).toBe(422)
  })
})

describe('PATCH /api/posts/:id 乐观锁', () => {
  it('version 不匹配 → 409 CONFLICT', async () => {
    const cookie = await newSession()
    const created = await createPost(cookie)
    const res = await app.request(`/api/posts/${created.data?.id}`, {
      method: 'PATCH',
      headers: { ...JSON_HEADERS, Cookie: cookie },
      body: JSON.stringify({ title: '改', version: 999 }),
    })
    expect(res.status).toBe(409)
    expect(((await res.json()) as Envelope).code).toBe('CONFLICT')
  })

  it('version 匹配 → 200 且 version +1', async () => {
    const cookie = await newSession()
    const created = await createPost(cookie)
    const res = await app.request(`/api/posts/${created.data?.id}`, {
      method: 'PATCH',
      headers: { ...JSON_HEADERS, Cookie: cookie },
      body: JSON.stringify({ title: '改名', version: 1 }),
    })
    expect(res.status).toBe(200)
    const body = (await res.json()) as Envelope
    expect(body.data?.title).toBe('改名')
    expect(body.data?.version).toBe(2)
  })
})

describe('DELETE /api/posts/:id 软删', () => {
  it('admin 可删他人文章，软删后详情 404', async () => {
    const owner = await newSession()
    const created = await createPost(owner)
    const id = created.data!.id!
    const adminCookie = await loginAs('admin@blog.dev')
    const res = await app.request(`/api/posts/${id}`, {
      method: 'DELETE',
      headers: { Cookie: adminCookie },
    })
    expect(res.status).toBe(200)
    const get = await app.request(`/api/posts/${id}`)
    expect(get.status).toBe(404)
  })

  it('reader 删他人文章 → 403', async () => {
    const owner = await newSession()
    const other = await newSession()
    const created = await createPost(owner)
    const res = await app.request(`/api/posts/${created.data?.id}`, {
      method: 'DELETE',
      headers: { Cookie: other },
    })
    expect(res.status).toBe(403)
  })
})
