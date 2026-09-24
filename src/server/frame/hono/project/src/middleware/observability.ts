import { randomUUID } from 'node:crypto'
import { createMiddleware } from 'hono/factory'
import { HTTPException } from 'hono/http-exception'
import pino from 'pino'
import type { Env } from '../types'

/** 结构化 JSON 日志：ELK/Loki 直接可收 */
export const logger = pino()

/**
 * 请求 ID（透传或生成）+ 访问日志。
 * catch-rethrow：throw 会让 next() 之后的代码被跳过，日志只写在那儿的话
 * 4xx/5xx 请求在日志里完全不可见——错误路径从异常推导 status 记一条，再原样上抛。
 */
export const requestContext = createMiddleware<Env>(async (c, next) => {
  const requestId = c.req.header('X-Request-ID') ?? randomUUID()
  c.set('requestId', requestId)
  c.header('X-Request-ID', requestId)
  const start = Date.now()
  try {
    await next()
  } catch (err) {
    const status = err instanceof HTTPException ? err.status : 500
    const body = {
      requestId,
      method: c.req.method,
      path: c.req.path,
      status,
      durationMs: Date.now() - start,
    }
    if (status >= 500) logger.error(body, 'access')
    else logger.warn(body, 'access')
    throw err
  }
  logger.info(
    {
      requestId,
      method: c.req.method,
      path: c.req.path,
      status: c.res.status,
      durationMs: Date.now() - start,
    },
    'access',
  )
})
