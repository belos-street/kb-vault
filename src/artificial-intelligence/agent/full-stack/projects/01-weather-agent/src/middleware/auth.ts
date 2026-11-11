import type { MiddlewareHandler } from 'hono'

export type AppVariables = {
  tenantId: string
}

export function apiKeyAuth(): MiddlewareHandler<{ Variables: AppVariables }> {
  return async (c, next) => {
    const expected = process.env.SERVICE_API_KEY
    if (!expected) {
      return c.json({ code: 'server_misconfigured' }, 500)
    }

    const header = c.req.header('authorization') ?? ''
    const token = header.startsWith('Bearer ') ? header.slice(7) : ''

    if (!token || token !== expected) {
      return c.json({ code: 'unauthorized' }, 401)
    }

    c.set('tenantId', c.req.header('x-tenant-id') ?? 'default')
    await next()
  }
}
