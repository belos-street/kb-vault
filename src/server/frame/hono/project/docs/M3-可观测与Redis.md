# M3 可观测与 Redis 接线

> 所属：[project](../) 实现教学 ｜ 前置：[M2](./M2-统一响应与错误.md) ｜ 对应代码：`src/middleware/observability.ts`、`src/lib/redis.ts`、`src/types.ts`

**一句话定位**：给每个请求发一张身份证（`X-Request-ID`），把散落的日志串成一条线；Redis 客户端先接线不上场（M7 的缓存/限流才用）。

**面试可答**：生产日志要 JSON 结构化 + 请求 ID——一次请求几十条日志靠同一个 requestId 串联才能按 ID 捞全链路；`hono/logger` 是开发期人读输出，不能当生产方案。

---

## 1. 为什么需要请求 ID

没有请求 ID 的排障体验：用户报「下单失败了」，你在百万行日志里 grep 时间窗，捞出十几条嫌疑日志但分不清哪几条属于这次请求。

有了请求 ID：

```
用户报障 → 提供 X-Request-ID（响应头里回传给他的）
        → grep requestId → 该请求从进入到响应的所有日志一串拉出
```

规则只有三条：

1. **入口生成或透传**：上游（网关/前端）带了 `X-Request-ID` 就用它的，没带就 `randomUUID()`
2. **响应头回传**：`c.header('X-Request-ID', requestId)`——用户报障时直接把 ID 给他
3. **所有日志带这个字段**：访问日志带、错误日志带（M2 onError 第三段已经接入）

## 2. `middleware/observability.ts` 逐行讲

```ts
export const logger = pino()   // JSON 行日志，ELK/Loki 直接可收

export const requestContext = createMiddleware<Env>(async (c, next) => {
  const requestId = c.req.header('X-Request-ID') ?? randomUUID()
  c.set('requestId', requestId)          // ① 存进 Context，后续所有层可取
  c.header('X-Request-ID', requestId)    // ② 响应头回传
  const start = Date.now()
  try {
    await next()                         // ③ 洋葱向内——整个业务处理
  } catch (err) {
    // ④ 错误路径也要留访问日志：throw 会让 next() 之后的代码被跳过，
    //    日志只写在那儿的话 401/403/409/422 在日志里完全不可见
    const status = err instanceof HTTPException ? err.status : 500
    const body = { requestId, method: c.req.method, path: c.req.path,
      status, durationMs: Date.now() - start }
    if (status >= 500) logger.error(body, 'access')
    else logger.warn(body, 'access')
    throw err                            // ⑤ 记完原样上抛，onError 才能兜底出信封
  }
  logger.info({                          // ⑥ 成功路径：响应已定，记访问日志
    requestId,
    method: c.req.method,
    path: c.req.path,
    status: c.res.status,
    durationMs: Date.now() - start,
  }, 'access')
})
```

几个点：

- ⭐ **catch-rethrow 的由来（review 发现的真问题）**：第一版日志写在 `await next()` 之后——而 M2 讲过「任何一层 throw，洋葱回卷会跳过 next() 之后的逻辑」，于是 401/403/409 这些业务错误在日志里完全不可见，「按 requestId 串全链路」在错误路径上落空。修法：try/catch 包住 next()，错误路径从异常推导 status（`ApiError` 继承自 `HTTPException`，401/403/422 都能拿到准确值）记一条 warn（5xx 记 error），再原样上抛
- **记字段、不拼字符串**：`logger.info({ requestId, status }, 'access')` 而不是 `logger.info(\`GET /posts 200 12ms\`)`。前者在 Loki/ELK 里 `requestId="xxx"` 精确检索，后者只能全文模糊匹配
- **`createMiddleware<Env>`**：泛型让 `c.set/c.get` 拿到完整类型提示，`requestId` 和 `user` 都是类型安全的
- 与 `onError` 的分工：中间件记 **access 流水**（成功 info / 失败 warn），onError 只对**未知异常**补一条带堆栈的 error 详情——500 会有两条日志（access + detail），这是有意为之

## 3. 挂载位置：最外层

`index.ts` 里它的位置在最前：

```ts
app.use('*', requestContext)   // 请求 ID + 访问日志，最先挂
// ...onError / notFound / 路由
```

教程 [10-实战B §7.5](../../doc/10-实战B-企业级REST-API.md) 的组装原则：**错误处理与请求上下文最先**。这样即使后面任何中间件抛错，onError 里也能拿到 requestId 记日志（M2 的 `logger.error({ requestId: c.get('requestId'), err })`）。

> ⚠️ 一个测试里验证过的细节：HTTP header 名不区分大小写——`c.req.header('X-Request-ID')` 对小写 `x-request-id` 请求头同样能读到；测试用小写/大写都能过。

## 4. pino：为什么选它

```ts
export const logger = pino()
```

一行，但选型有三条理由：

1. **快**：pino 是 Node 生态最快的一档结构化 logger（批量写 + 最小开销设计），对热路径（每个请求都打访问日志）友好
2. **JSON 原生输出**：不加 transport 直接输出 `{"level":30,"time":...,"requestId":...,"msg":"access"}`，`level: 30` 是 info 的数值编码，收集端按数值过滤比字符串快
3. **transport 是可选插件**：不上 pretty-print 时零额外线程；Bun 兼容

## 5. Redis 接线：`lib/redis.ts`

```ts
import Redis from 'ioredis'
import { env } from './env'

export const redis = new Redis(env.REDIS_URL)
```

- **单例**：模块级实例全局复用。Redis 客户端内部维护连接池，每个请求新建实例会耗尽连接数——和 PrismaClient 单例同理
- **为什么 M3 只接线不使用**：缓存与限流是 M7 的事。但接线提前到 M3 的原因是 `env.REDIS_URL` 属于启动期 fail-fast 校验的一部分——Redis 配置错误应该在启动时暴露，而不是 M7 上线那天
- 容器：`hono-blog-redis`（redis:7-alpine，端口 6379）

## 6. 对比板块：日志方案三角

| 方案 | 输出 | 排障能力 | 性能 | 适用 |
|------|------|----------|------|------|
| `console.log` | 人读字符串 | 靠肉眼 + 时间窗猜 | 无开销 | 本地调试 |
| **pino（本项目）** | JSON 字段 | 按 requestId/level 精确检索 | 最快一档 | 生产 API |
| winston | 可配 | 同 pino 但更重 | 中 | 遗留项目 / 复杂 transport 需求 |

> 💡 延伸：requestId 是单服务内的串联；跨服务要用 OpenTelemetry 的 traceId（W3C `traceparent` 头），思路一致、粒度更大——企业级演进方向，本项目点到为止。

## 7. 自测

- [ ] `await next()` 之前 `c.header()` 和之后有什么区别？（提示：响应头发出的时机）
- [ ] 为什么访问日志在 `next()` **之后**打，错误日志在 onError 里打？
- [ ] `c.set('requestId')` 存的值，M5 的 handler 里怎么拿到？

---

## 🔗 参考资料

- pino：https://github.com/pinojs/pino
- ioredis：https://github.com/redis/ioredis
- 教程对应节：[10-实战B §7.1](../../doc/10-实战B-企业级REST-API.md)

## 📌 小结

- 请求 ID 三规则：入口生成/透传、响应头回传、全日志携带
- 洋葱 `next()` 前后 = 请求前 / 响应前，计时与访问日志的挂点
- Redis 接线提前到 M3：配置错误死在启动期（fail-fast），不是上线日
