import { describe, expect, it } from 'bun:test'
import { app } from '../index'

type Envelope = {
  code: string
  message?: string
  data?: Record<string, unknown> & {
    id?: number
    postId?: number
    commentCount?: number
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
/** 唯一 IP：限流（M7）按 IP+路由计数，测试间互不污染 */
const nextIp = () =>
  `10.${Date.now() % 256}.${Math.floor(Date.now() / 256) % 256}.${++ipSeq % 256}`

/** 注册并登录一个新 reader，返回 Cookie 头 */
const newSession = async (): Promise<string> => {
  const email = `c${Date.now()}_${seq++}@test.dev`
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

const loginAs = async (email: string) => {
  const res = await app.request('/api/auth/login', {
    method: 'POST',
    headers: { ...JSON_HEADERS, 'X-Forwarded-For': nextIp() },
    body: JSON.stringify({ email, password: 'Passw0rd!123' })
  })
  return cookieHeaderOf(res)
}

const createPost = async (cookie: string, title = '测试文章') => {
  const res = await app.request('/api/posts', {
    method: 'POST',
    headers: { ...JSON_HEADERS, Cookie: cookie },
    body: JSON.stringify({ title, content: '正文' })
  })
  return (await res.json()) as Envelope
}

/** 创建 → submit → editor approve，返回已发布文章 id */
const publishPost = async (cookie: string, title = '可评文章') => {
  const created = await createPost(cookie, title)
  const id = created.data!.id!
  await app.request(`/api/posts/${id}/transition`, {
    method: 'POST',
    headers: { ...JSON_HEADERS, Cookie: cookie },
    body: JSON.stringify({ action: 'submit' })
  })
  const editorCookie = await loginAs('editor@blog.dev')
  await app.request(`/api/posts/${id}/transition`, {
    method: 'POST',
    headers: { ...JSON_HEADERS, Cookie: editorCookie },
    body: JSON.stringify({ action: 'approve' })
  })
  return id
}

const comment = (cookie: string, postId: number, content = '好文！') =>
  app.request(`/api/posts/${postId}/comments`, {
    method: 'POST',
    headers: { ...JSON_HEADERS, Cookie: cookie },
    body: JSON.stringify({ content })
  })

const getPost = (id: number) => app.request(`/api/posts/${id}`)

describe('POST /api/posts/:postId/comments', () => {
  it('401 未登录', async () => {
    const owner = await newSession()
    const id = await publishPost(owner)
    const res = await comment('', id)
    expect(res.status).toBe(401)
    expect(((await res.json()) as Envelope).code).toBe('UNAUTHORIZED')
  })

  it('201 评论成功，详情 commentCount 同步 +1', async () => {
    const owner = await newSession()
    const commenter = await newSession()
    const id = await publishPost(owner)
    const res = await comment(commenter, id)
    expect(res.status).toBe(201)
    const created = (await res.json()) as Envelope
    expect(created.data?.postId).toBe(id)

    const detail = (await (await getPost(id)).json()) as Envelope
    expect(detail.data?.commentCount).toBe(1)
  })

  it('422 作者评论自己未发布文章', async () => {
    const owner = await newSession()
    const created = await createPost(owner, 'DRAFT 不可评')
    const res = await comment(owner, created.data!.id!)
    expect(res.status).toBe(422)
    expect(((await res.json()) as Envelope).code).toBe('UNPROCESSABLE')
  })

  it('404 评论他人未发布文章（不泄露存在性）', async () => {
    const owner = await newSession()
    const other = await newSession()
    const created = await createPost(owner)
    const res = await comment(other, created.data!.id!)
    expect(res.status).toBe(404)
  })

  it('400 空内容 → VALIDATION_ERROR', async () => {
    const owner = await newSession()
    const id = await publishPost(owner)
    const res = await comment(owner, id, '')
    expect(res.status).toBe(400)
    expect(((await res.json()) as Envelope).code).toBe('VALIDATION_ERROR')
  })
})

describe('GET /api/posts/:postId/comments', () => {
  it('匿名可读已发布文章评论，软删评论不可见', async () => {
    const owner = await newSession()
    const a = await newSession()
    const b = await newSession()
    const id = await publishPost(owner)
    const c1 = (await (await comment(a, id, '第一条')).json()) as Envelope
    await comment(b, id, '第二条')

    const list = (await (
      await app.request(`/api/posts/${id}/comments`)
    ).json()) as Envelope
    const items = list.data?.items as { id: number }[]
    expect(items).toHaveLength(2)

    // 作者本人软删第一条
    await app.request(`/api/posts/${id}/comments/${c1.data?.id}`, {
      method: 'DELETE',
      headers: { Cookie: a }
    })
    const after = (await (
      await app.request(`/api/posts/${id}/comments`)
    ).json()) as Envelope
    const afterItems = (after.data?.items ?? []) as unknown[]
    expect(afterItems).toHaveLength(1)
    expect(after.data?.total).toBe(1)
  })

  it('404 不可见文章的评论列表', async () => {
    const owner = await newSession()
    const other = await newSession()
    const created = await createPost(owner)
    const res = await app.request(`/api/posts/${created.data!.id}/comments`, {
      headers: { Cookie: other }
    })
    expect(res.status).toBe(404)
  })
})

describe('DELETE /api/posts/:postId/comments/:commentId', () => {
  it('200 作者本人删自己的评论，commentCount 同步 -1', async () => {
    const owner = await newSession()
    const a = await newSession()
    const id = await publishPost(owner)
    const created = (await (await comment(a, id)).json()) as Envelope

    const res = await app.request(
      `/api/posts/${id}/comments/${created.data?.id}`,
      {
        method: 'DELETE',
        headers: { Cookie: a }
      }
    )
    expect(res.status).toBe(200)
    const detail = (await (await getPost(id)).json()) as Envelope
    expect(detail.data?.commentCount).toBe(0)
  })

  it('200 editor 可删他人评论', async () => {
    const owner = await newSession()
    const a = await newSession()
    const id = await publishPost(owner)
    const created = (await (await comment(a, id)).json()) as Envelope

    const editorCookie = await loginAs('editor@blog.dev')
    const res = await app.request(
      `/api/posts/${id}/comments/${created.data?.id}`,
      {
        method: 'DELETE',
        headers: { Cookie: editorCookie }
      }
    )
    expect(res.status).toBe(200)
  })

  it('403 无关 reader 删他人评论', async () => {
    const owner = await newSession()
    const a = await newSession()
    const other = await newSession()
    const id = await publishPost(owner)
    const created = (await (await comment(a, id)).json()) as Envelope

    const res = await app.request(
      `/api/posts/${id}/comments/${created.data?.id}`,
      {
        method: 'DELETE',
        headers: { Cookie: other }
      }
    )
    expect(res.status).toBe(403)
  })

  it('404 重复删除（软删后不可再删）', async () => {
    const owner = await newSession()
    const a = await newSession()
    const id = await publishPost(owner)
    const created = (await (await comment(a, id)).json()) as Envelope
    const url = `/api/posts/${id}/comments/${created.data?.id}`
    await app.request(url, { method: 'DELETE', headers: { Cookie: a } })
    const res = await app.request(url, {
      method: 'DELETE',
      headers: { Cookie: a }
    })
    expect(res.status).toBe(404)
  })
})

describe('删文章级联（FR-14）', () => {
  it('软删文章后其评论列表随文章 404 不可达', async () => {
    const owner = await newSession()
    const a = await newSession()
    const id = await publishPost(owner)
    await comment(a, id)

    await app.request(`/api/posts/${id}`, {
      method: 'DELETE',
      headers: { Cookie: owner }
    })
    const list = await app.request(`/api/posts/${id}/comments`)
    expect(list.status).toBe(404)
  })
})
