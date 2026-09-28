# M3 可观测与 Redis 接线

> 对应 [TODO M3](../TODO.md) ｜ FR-6 前半 ｜ 教程 §7.1 ｜ 预计 30 分钟

## 这一步做什么

请求 ID 全链路 + pino 结构化访问日志 + Redis 客户端接线（M7 的缓存/限流在这里铺好底座）。

## requestContext 的 catch-rethrow 设计（middleware/observability.ts）

```ts
export const requestContext = createMiddleware<Env>(async (c, next) => {
  const requestId = c.req.header('X-Request-ID') ?? randomUUID()
  c.set('requestId', requestId)
  c.header('X-Request-ID', requestId)   // 响应头回传：用户报障直接给 ID
  const start = Date.now()
  try {
    await next()
  } catch (err) {
    const status = err instanceof HTTPException ? err.status : 500
    if (status >= 500) logger.error(body, 'access')
    else logger.warn(body, 'access')    // ← 4xx 也有日志
    throw err                            // ← 原样上抛，交给 onError
  }
  logger.info({ ... }, 'access')         // 成功路径日志
})
```

**为什么日志写在 catch 里再 throw？** 一步式的写法（`await next()` 后记日志）遇到抛错的请求会整段跳过——4xx/5xx 在日志里完全不可见，而这恰恰是最需要日志的请求。catch → 记一条 → 原样 rethrow，错误路径的 status 从异常推导。

## 接线与分级

- `X-Request-ID` 透传优先（网关/上游已生成时不覆盖）——同一请求跨服务的日志能用同一个 ID 串起来
- onError 里错误日志带 `requestId` + 堆栈，5xx 与 4xx 分级（error vs warn）
- `lib/redis.ts`：ioredis 单例走 `env.REDIS_URL`，连接惰性建立（测试环境不连也不炸）

## 验证

任意响应带 `x-request-id` 头；透传请求头时 ID 原样返回（M3 冒烟测试锁定这两个行为）。

## 面试可答

> **问：requestId 中间件为什么要 catch 之后 rethrow，而不是只包一层 finally？**
> finally 里拿不到「这次请求最终以什么状态结束」——错误信息在异常里。catch 推导 status 记日志后必须 rethrow，否则全局 onError 兜底被短路，错误响应格式就乱了。
