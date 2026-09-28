import type { Context } from 'hono'
import { createMiddleware } from 'hono/factory'
import { getConnInfo } from 'hono/bun'
import { apiError } from '../lib/errors'
import { redis } from '../lib/redis'
import type { Env } from '../types'

export type RateLimitOptions = {
  max: number
  windowSec: number
  /** 键空间前缀：全局与登录严格阈值分开计数，同一请求不会双扣同一个键 */
  prefix?: string
}

/** IP 取值：网关后信任 X-Forwarded-For 首段；直连取 connInfo；测试（app.request 无连接信息）落 unknown */
const clientIp = (c: Context<Env>) => {
  const forwarded = c.req.header('X-Forwarded-For')
  if (forwarded) return forwarded.split(',')[0]!.trim()
  try {
    return getConnInfo(c).remote.address
  } catch {
    return 'unknown'
  }
}

/** Redis INCR + EXPIRE 固定窗口限流（FR-8）：维度 IP + 路由，超限抛 429 */
export const rateLimit = (options: RateLimitOptions) =>
  createMiddleware<Env>(async (c, next) => {
    const key = `rl:${options.prefix ?? 'g'}:${clientIp(c)}:${c.req.path}`
    const hits = await redis.incr(key)
    if (hits === 1) await redis.expire(key, options.windowSec)
    if (hits > options.max) throw apiError.rateLimited()
    await next()
  })
