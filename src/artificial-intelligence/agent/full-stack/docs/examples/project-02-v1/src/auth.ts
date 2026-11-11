import type { MiddlewareHandler } from 'hono'

export type AppVariables = {
  tenantId: string
  userId: string
  role: 'agent' | 'admin'
}

/** 最小 API Key 鉴权：只做身份，不做配额；生产把 header 换成 token / session 解析 */
export function apiKeyAuth(): MiddlewareHandler<{
  Variables: AppVariables
}> {
  const expected = process.env.SERVICE_API_KEY

  return async (c, next) => {
    if (!expected) {
      return c.json({ code: 'server_misconfigured' }, 500)
    }

    const header = c.req.header('authorization') ?? ''
    const token = header.startsWith('Bearer ') ? header.slice(7) : ''
    if (!token || token !== expected) {
      return c.json({ code: 'unauthorized' }, 401)
    }

    c.set('tenantId', c.req.header('x-tenant-id') ?? 'default')
    c.set('userId', c.req.header('x-user-id') ?? 'anonymous')
    c.set('role', c.req.header('x-role') === 'admin' ? 'admin' : 'agent')
    await next()
  }
}
