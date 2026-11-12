import type { MiddlewareHandler } from 'hono'

export type AppVariables = {
  tenantId: string
}

// 入站鉴权：校验调用方是否持有本服务发放的 SERVICE_API_KEY。
// 期望值由组装根传入，中间件不直接读 process.env。
export function apiKeyAuth(
  expected: string
): MiddlewareHandler<{ Variables: AppVariables }> {
  return async (c, next) => {
    const header = c.req.header('authorization') ?? ''
    const token = header.startsWith('Bearer ') ? header.slice(7) : ''

    if (!token || token !== expected) {
      return c.json({ code: 'unauthorized' }, 401)
    }

    // 教学简化：tenantId 直接取请求头，生产应从 Key / JWT 的 claims 推导。
    c.set('tenantId', c.req.header('x-tenant-id') ?? 'default')
    await next()
  }
}
