import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { Scalar } from '@scalar/hono-api-reference'
import { env } from './lib/env'
import { ApiError, codeByStatus } from './lib/errors'
import { createOpenAPI } from './lib/openapi'
import { fail } from './lib/response'
import { logger, requestContext } from './middleware/observability'
import { auth } from './routes/auth'
import { posts } from './routes/posts'
import type { Env } from './types'

/** 业务 API（OpenAPI 三同源）：路由逐个挂载 */
export const api = createOpenAPI()
api.route('/auth', auth)
api.route('/', posts)

export const app = new Hono<Env>()

app.use('*', requestContext)

app.onError((err, c) => {
  if (err instanceof ApiError) {
    return fail(c, err.code, err.message, err.status, err.details)
  }
  if (err instanceof HTTPException) {
    return fail(c, codeByStatus(err.status), err.message, err.status)
  }
  logger.error({ requestId: c.get('requestId'), err }, 'unhandled')
  return fail(c, 'INTERNAL', '服务器内部错误', 500)
})

app.notFound((c) => fail(c, 'NOT_FOUND', '路由不存在', 404))

app.get('/healthz', (c) => c.json({ ok: true }))

// 文档端点环境门禁：生产（ENABLE_DOCS=false）不上线 /api/doc 与 /ui
if (env.ENABLE_DOCS === 'true') {
  api.doc('/doc', { openapi: '3.0.0', info: { title: 'Blog API', version: '1.0.0' } })
  app.get('/ui', Scalar({ url: '/api/doc' }))
}

app.route('/api', api)

if (import.meta.main) {
  Bun.serve({ fetch: app.fetch, port: env.PORT })
  console.log(`[blog-api] listening on :${env.PORT}`)
}
