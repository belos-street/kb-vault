import { HTTPException } from 'hono/http-exception'
import { createMiddleware } from 'hono/factory'
import type { Env } from '../types'

const SAFE_METHOD_RE = /^(GET|HEAD|OPTIONS)$/
const FORM_TYPE_RE = /^\b(application\/x-www-form-urlencoded|multipart\/form-data|text\/plain)\b/i

/**
 * CSRF 防护（教程 §7.5 语义）：只拦「带表单类 Content-Type 的非安全方法」。
 *
 * 不用 hono 内置 csrf() 的原因：它对缺失 Content-Type 的请求默认按 text/plain
 * 处理，无请求体的 DELETE / refresh 会被误杀（curl 等非浏览器客户端全挂）。
 * 分层上 SameSite=Lax Cookie 才是主防线——跨站 fetch/表单 POST 本就不携带
 * Cookie；本中间件兜底老浏览器忽略 SameSite 的表单向量（表单无法伪造
 * application/json）。
 */
export const csrfGuard = createMiddleware<Env>(async (c, next) => {
  if (SAFE_METHOD_RE.test(c.req.method)) {
    await next()
    return
  }
  const contentType = c.req.header('content-type') ?? ''
  if (!FORM_TYPE_RE.test(contentType)) {
    await next()
    return
  }
  throw new HTTPException(403, { message: 'Forbidden' })
})
