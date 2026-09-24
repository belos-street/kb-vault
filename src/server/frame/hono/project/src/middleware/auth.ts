import type { Context } from 'hono'
import { createMiddleware } from 'hono/factory'
import { getCookie } from 'hono/cookie'
import { apiError } from '../lib/errors'
import { ACCESS_TOKEN, verifyToken } from '../lib/token'
import { isRole, type AuthUser, type Env, type Role } from '../types'

/** 可选认证：有合法 access_token 就注入身份，匿名放行（公开接口的可见性矩阵依赖它） */
export const optionalAuth = createMiddleware<Env>(async (c, next) => {
  const token = getCookie(c, ACCESS_TOKEN)
  const payload = token ? await verifyToken(token) : null
  if (payload && typeof payload.sub === 'string' && payload.typ === 'access' && isRole(payload.role)) {
    c.set('user', { id: payload.sub, role: payload.role })
  }
  await next()
})

/** 供 handler 内调用：确保已认证并拿到身份 */
export const requireUser = (c: Context<Env>): AuthUser => {
  const user = c.get('user')
  if (!user) throw apiError.unauthorized()
  return user
}

/** Cookie → JWT 校验 → 注入身份（c.get('user')） */
export const requireAuth = createMiddleware<Env>(async (c, next) => {
  const token = getCookie(c, ACCESS_TOKEN)
  const payload = token ? await verifyToken(token) : null
  if (
    !payload ||
    typeof payload.sub !== 'string' ||
    payload.typ !== 'access' ||
    !isRole(payload.role)
  ) {
    throw apiError.unauthorized()
  }
  c.set('user', { id: payload.sub, role: payload.role })
  await next()
})

/** RBAC：角色级把关，必须跟在 requireAuth 之后 */
export const requireRole = (...roles: Role[]) =>
  createMiddleware<Env>(async (c, next) => {
    const role = c.get('user')?.role
    if (!role || !roles.includes(role)) {
      throw apiError.forbidden()
    }
    await next()
  })
