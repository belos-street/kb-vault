import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { Scalar } from '@scalar/hono-api-reference'
import { bodyLimit } from 'hono/body-limit'
import { cors } from 'hono/cors'
import { secureHeaders } from 'hono/secure-headers'
import { env } from './lib/env'
import { ApiError, codeByStatus } from './lib/errors'
import { prisma } from './lib/db'
import { createOpenAPI } from './lib/openapi'
import { redis } from './lib/redis'
import { fail } from './lib/response'
import { csrfGuard } from './middleware/csrf'
import { logger, requestContext } from './middleware/observability'
import { rateLimit } from './middleware/rate-limit'
import { auth } from './routes/auth'
import { comments } from './routes/comments'
import { posts } from './routes/posts'
import type { Env } from './types'

/** 业务 API（OpenAPI 三同源）：路由逐个挂载 */
export const api = createOpenAPI()
api.route('/auth', auth)
api.route('/', posts)
api.route('/', comments)

export const app = new Hono<Env>()

// 中间件组装顺序（教程 §7.5 / FR-12）：错误处理与请求上下文最先，
// 限流与 bodyLimit 在业务解析前拦
app.use('*', requestContext)
app.use('*', secureHeaders())
if (env.CORS_ORIGIN) {
  // 前后端分离部署才配置 CORS_ORIGIN；同源部署缺省不放开跨域（fail-safe 默认）
  app.use('/api/*', cors({ origin: env.CORS_ORIGIN, credentials: true }))
}
// csrf 只拦表单类 Content-Type 的非安全方法（JSON API 的 CSRF 主防线是 SameSite=Lax Cookie）
app.use('*', csrfGuard)
app.use('*', bodyLimit({ maxSize: 1024 * 1024 }))
app.use('/api/*', rateLimit({ max: 60, windowSec: 60 }))

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

// readiness：依赖可达才算就绪（FR-9）
app.get('/readyz', async (c) => {
  await prisma.$queryRaw`SELECT 1`
  return c.json({ ok: true })
})

// 文档端点环境门禁：生产（ENABLE_DOCS=false）不上线 /api/doc 与 /ui
if (env.ENABLE_DOCS === 'true') {
  api.doc('/doc', {
    openapi: '3.0.0',
    info: { title: 'Blog API', version: '1.0.0' }
  })
  app.get('/ui', Scalar({ url: '/api/doc' }))
}

app.route('/api', api)

if (import.meta.main) {
  const server = Bun.serve({ fetch: app.fetch, port: env.PORT })
  console.log(`[blog-api] listening on :${env.PORT}`)

  // 优雅停机（FR-9）：摘流量等在途请求跑完 → 关 DB → 关 Redis。
  // 每步打点便于在容器日志里核对链路；8s 兜底强制退出，
  // 避免任何一步挂住把 SIGTERM 拖成 SIGKILL（K8s/compose 宽限期后的宿命）
  const shutdown = async () => {
    const t0 = Date.now()
    await server.stop()
    console.log(`[blog-api] server.stop 完成 (${Date.now() - t0}ms)`)
    await prisma.$disconnect()
    console.log(`[blog-api] prisma 断连完成 (${Date.now() - t0}ms)`)
    await redis.quit()
    console.log(`[blog-api] redis 退出完成 (${Date.now() - t0}ms)`)
    process.exit(0)
  }
  process.on('SIGTERM', () => {
    console.log('[blog-api] 收到 SIGTERM，优雅停机开始')
    const bail = setTimeout(() => {
      console.error('[blog-api] 优雅停机超时，强制退出')
      process.exit(1)
    }, 8000)
    void shutdown().finally(() => clearTimeout(bail))
  })
}
