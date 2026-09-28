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

/** Redis 固定窗口限流（FR-8）：维度 IP + 路由，超限抛 429。
 *
 * **部署前提**：本服务必须置于可信网关（反代/LB）之后——网关会覆盖/追加
 * X-Forwarded-For，首段才可信；直连暴露时客户端可伪造 XFF 轮换 IP 绕过限流
 * （登录撞库防线失效）。与部署拓扑冲突时需先改 clientIp 的信任策略。
 *
 * 原子性：`SET key 0 EX window NX` 占位（首个请求原子写入并带上 TTL），
 * 后续 INCR 计数——避免教程 §7.4 的 INCR+EXPIRE 两步写法在进程崩溃于两步
 * 之间时留下无 TTL 的 key，导致该 IP+路由永久 429。
 */
export const rateLimit = (options: RateLimitOptions) =>
  createMiddleware<Env>(async (c, next) => {
    const key = `rl:${options.prefix ?? 'g'}:${clientIp(c)}:${c.req.path}`
    await redis.set(key, '0', 'EX', options.windowSec, 'NX')
    const hits = await redis.incr(key)
    if (hits > options.max) throw apiError.rateLimited()
    await next()
  })
