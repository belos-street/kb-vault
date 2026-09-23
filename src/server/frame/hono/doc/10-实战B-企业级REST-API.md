# 10 实战B：企业级 REST API

> 所属大纲：[readme.md](../readme.md) ｜ 预计：2~3 天 ｜ 前置：04~06（中间件/校验/错误处理）

**一句话定位**：补齐生产级后端全套工程能力——认证、权限、校验、文档、测试、数据库、部署。

**面试可答**：JWT 双 token（access/refresh）+ httpOnly Cookie 传递；RBAC 用「元数据 + 中间件工厂」实现；`@hono/zod-openapi` 让 Schema 与文档同源；`app.request()` 免起服务器做集成测试；生产加固 = 请求 ID 日志、env fail-fast、双层缓存、Redis 限流、优雅停机。

---

## 1. 项目蓝图

**技术栈**：Bun + TypeScript strict + Prisma 7 + PostgreSQL + Redis + Zod + pino + oxlint/oxfmt

```
/prisma
  schema.prisma       # Prisma schema + migrations
/src
  index.ts            # 入口：中间件、路由、OpenAPI 文档
  routes/
    auth.ts           # 注册/登录/刷新/登出
    users.ts  posts.ts
  middleware/
    auth.ts           # JWT 校验 + RBAC
    observability.ts  # 请求 ID + 结构化日志（第 7 节）
    rate-limit.ts     # Redis 限流（第 7 节）
  lib/
    db.ts             # Prisma 客户端（driver adapter）
    env.ts            # 环境变量校验（启动 fail-fast）
    redis.ts          # Redis 客户端（缓存/限流）
    response.ts       # 统一响应格式
    errors.ts         # 业务异常（06 篇）
  generated/prisma/   # prisma generate 产物（进源码树，随构建打包）
  schemas/            # Zod Schema（校验与 OpenAPI 同源）
  tests/              # app.request 集成测试
```

```bash
bun add @prisma/client@7 @prisma/adapter-pg zod @hono/zod-openapi @scalar/hono-api-reference pino ioredis
bun add -d prisma@7
```

## 2. 数据层：Prisma 7 + PostgreSQL

Prisma 7 是 Rust-free 架构：客户端经 **driver adapter** 连库，`url` 从 schema 移入 `prisma.config.ts`，生成物进源码树。

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client"            // 新 Rust-free 生成器（ESM）
  output   = "../src/generated/prisma"  // output 必填：随 bun build 一起打包
}

datasource db {
  provider = "postgresql"               // 7.x 起 url 不写在 schema，见 prisma.config.ts
}

model Post {
  id        Int      @id @default(autoincrement())
  title     String
  content   String   @default("")
  published Boolean  @default(false)
  authorId  String
  createdAt DateTime @default(now())
}
```

```ts
// prisma.config.ts —— Prisma CLI 的配置家（Bun 自动加载 .env，无需 dotenv）
import { defineConfig, env } from 'prisma/config'

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations' },
  datasource: { url: env('DATABASE_URL') },
})
```

```ts
// lib/db.ts —— adapter 接线（7.x 起构造必须传 adapter）
import { PrismaClient } from '../generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { env } from './env'

const adapter = new PrismaPg({ connectionString: env.DATABASE_URL })
export const prisma = new PrismaClient({ adapter })
```

查询与事务：

```ts
// 分页列表（offset 分页；深分页换 cursor）
const items = await prisma.post.findMany({
  where: { authorId: userId, published: true },
  orderBy: { createdAt: 'desc' },
  take: limit,
  skip: (page - 1) * limit,
})

// 事务（stats 表略）
await prisma.$transaction([
  prisma.post.create({ data: newPost }),
  prisma.stats.update({ where: { id: 1 }, data: { postCount: { increment: 1 } } }),
])
```

迁移流程：`bunx prisma migrate dev --name init`（开发）→ `bunx prisma migrate deploy`（生产，第 8 节）。

> 💡 已熟练 Drizzle 亦可换回 `lib/db.ts`（优势是轻、无生成物、SQL 心智直译、冷启动快，对 Workers/边缘更友好；Prisma 7 Rust-free 后体积差距已大幅缩小）。ORM 只是数据层一层的替换，Hono 不感知。

## 3. 认证：JWT 双 token + httpOnly Cookie

```ts
// routes/auth.ts（节选核心）
import { Hono, type Context } from 'hono'
import { setCookie } from 'hono/cookie'
import { sign } from 'hono/jwt'
import { UnauthorizedError } from '../lib/errors'

const ACCESS_TTL = 60 * 15          // 15 分钟
const REFRESH_TTL = 60 * 60 * 24 * 7

const jwtOf = (c: Context, payload: object, ttl: number) =>
  sign({ ...payload, exp: Math.floor(Date.now() / 1000) + ttl }, c.env.JWT_SECRET)

app.post('/login', zValidator('json', loginSchema), async (c) => {
  const { email, password } = c.req.valid('json')
  const user = await findUserByEmail(email)
  if (!user || !(await Bun.password.verify(password, user.passwordHash))) {
    throw new UnauthorizedError('邮箱或密码错误')
  }
  const at = await jwtOf(c, { sub: user.id, role: user.role }, ACCESS_TTL)
  const rt = await jwtOf(c, { sub: user.id, typ: 'refresh' }, REFRESH_TTL)
  setCookie(c, 'access_token', at, cookieOpts(ACCESS_TTL))
  setCookie(c, 'refresh_token', rt, cookieOpts(REFRESH_TTL))
  return c.json({ ok: true })
})
```

```ts
// middleware/auth.ts：从 Cookie 校验 + 注入身份
// （app 为 new Hono<Env>：Bindings 含 JWT_SECRET，Variables 含 user）
import { createMiddleware } from 'hono/factory'
import { getCookie } from 'hono/cookie'
import { verify } from 'hono/jwt'

export const requireAuth = createMiddleware(async (c, next) => {
  const token = getCookie(c, 'access_token')
  try {
    const payload = await verify(token ?? '', c.env.JWT_SECRET)
    c.set('user', { id: payload.sub as string, role: payload.role })
    await next()
  } catch {
    throw new UnauthorizedError()
  }
})

// RBAC：元数据 + 中间件工厂
export const requireRole = (...roles: string[]) =>
  createMiddleware(async (c, next) => {
    if (!roles.includes(c.get('user')?.role ?? '')) {
      throw new ForbiddenError()
    }
    await next()
  })

// 使用：app.delete('/posts/:id', requireAuth, requireRole('admin', 'editor'), handler)
```

要点：access 短寿命 + refresh 长寿命（`/refresh` 轮换）；Cookie 三件套 `httpOnly + secure + sameSite`（04 篇）；`Bun.password` 原生做密码哈希（默认 argon2id，免原生依赖）。

## 4. 统一响应与错误（06 篇直接落地）

```ts
// lib/response.ts —— 统一信封：code 必有，成功 { code, data }，失败 { code, message, details? }
export const ok = (c: Context, data: unknown, status = 200) =>
  c.json({ code: 'OK', data }, status)
export const fail = (c: Context, code: string, message: string, status: number, details?: unknown) =>
  c.json({ code, message, details }, status)
```

`app.onError` 按 06 篇接入；`zValidator` hook 把校验失败也转成 `fail(c, 'VALIDATION_ERROR', ...)`——全站格式唯一。

## 5. OpenAPI 文档：`@hono/zod-openapi`

```ts
import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { Scalar } from '@scalar/hono-api-reference'

const api = new OpenAPIHono()

const createPost = createRoute({
  method: 'post', path: '/posts',
  request: { body: { content: { 'application/json': { schema: createPostSchema } } } },
  responses: {
    201: { description: 'created', content: { 'application/json': { schema: postSchema } } },
    400: { description: 'validation failed', content: { 'application/json': { schema: errorSchema } } },
  },
})

api.openapi(createPost, (c) => {
  const body = c.req.valid('json')      // 与普通 zValidator 同款类型收窄
  return ok(c, body, 201)
})

api.doc('/doc', { openapi: '3.0.0', info: { title: 'Blog API', version: '1.0.0' } })
api.get('/ui', Scalar({ url: '/doc' }))
```

**价值**：请求/响应 Schema 就是校验 Schema——校验、类型、文档三同源，接口永远不会「文档和实现对不上」。

> **面试常问：OpenAPI 和 Swagger 是什么关系？** 不是二选一——Swagger 规范 2015 年捐给 OpenAPI Initiative 后更名为 OpenAPI Specification，此后 Swagger 只是工具品牌（UI/Editor/Codegen）。本文产出的是 OpenAPI 3.0 文档（`/doc` 的 JSON），Scalar 只是消费这份 JSON 的展示 UI 之一；想换 Swagger UI 装 `@hono/swagger-ui` 即可，文档本体不动。

## 6. 集成测试：`bun test` + `app.request`

```ts
// tests/posts.test.ts
import { describe, it, expect } from 'bun:test'
import { app } from '../src/index'

describe('POST /posts', () => {
  it('201 创建文章', async () => {
    const res = await app.request('/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: 'access_token=<测试签发>' },
      body: JSON.stringify({ title: 'hello' }),
    })
    expect(res.status).toBe(201)
    const { code, data } = await res.json()
    expect(code).toBe('OK')
  })

  it('400 缺标题', async () => {
    const res = await app.request('/posts', { method: 'POST', body: '{}' })
    expect(res.status).toBe(400)
    expect((await res.json()).code).toBe('VALIDATION_ERROR')
  })
})
```

不需要起服务器、不需要端口——`app.request` 直接喂标准 Request（01 篇心智模型的兑现）。测试间数据隔离用独立测试库 + 每套件事务回滚。

## 7. 生产加固：日志、缓存、限流、优雅停机

> 前面六节解决「功能能用」，这一节补「企业级」的底座——功能与生产之间差的往往就是这几件。

### 7.1 请求 ID + 结构化日志

`hono/logger` 是开发期人读输出；生产要 **JSON 结构化日志 + 请求 ID**——一次请求散落几十条日志，靠同一个 requestId 串起来才能按 ID 捞全链路。

```ts
// middleware/observability.ts
import { createMiddleware } from 'hono/factory'
import { randomUUID } from 'node:crypto'
import pino from 'pino'

export const logger = pino()   // JSON 行日志，ELK/Loki 直接可收

export const requestContext = createMiddleware(async (c, next) => {
  const requestId = c.req.header('X-Request-ID') ?? randomUUID()
  c.set('requestId', requestId)
  c.header('X-Request-ID', requestId)   // 响应头回传：用户报障直接给 ID
  const start = Date.now()
  await next()
  logger.info({ requestId, method: c.req.method, path: c.req.path,
    status: c.res.status, durationMs: Date.now() - start }, 'access')
})
```

要点：记字段、不拼字符串（可检索的前提）；`onError` 的错误日志带 requestId + 堆栈（06 篇）；密码/token 不落日志；删除文章、改角色这类敏感操作另写**审计记录**（谁、何时、对什么、结果）。

### 7.2 配置校验：启动时 fail-fast

```ts
// lib/env.ts
import { z } from 'zod'

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(32),   // 密钥强度下限
  REDIS_URL: z.string().min(1),
})

export const env = envSchema.parse(process.env)   // 缺配置 → 启动即崩，并指出缺哪项
```

`index.ts` 第一行就 `import { env }`——错误配置死在启动阶段，而不是线上第一个 500。

### 7.3 缓存：两层各管一层

| 层 | 手段 | 适用 |
|----|------|------|
| HTTP 缓存 | `Cache-Control` 头 + `hono/etag` 协商缓存 | 公开列表/静态资源——浏览器与 CDN 帮你扛 |
| 应用层缓存 | Redis + TTL（cache-aside） | 需主动失效的热点业务数据 |

```ts
import { etag } from 'hono/etag'

// 公开列表：让浏览器/CDN 扛读流量（Node/Bun 用响应头方案）
api.get('/posts', async (c, next) => {
  await next()
  c.header('Cache-Control', 'public, max-age=60')
}, etag(), listPosts)
```

> ⚠️ `hono/cache` 中间件基于 Web Cache API，目前仅 Cloudflare Workers / Deno 可用；Node/Bun 部署用上面的响应头 + Redis 方案。

Redis 侧三条纪律：读走 cache-aside（miss 回源回填）；写先更库再删缓存；排查用 `SCAN` 严禁 `KEYS *`（阻塞生产实例）。

### 7.4 限流：从单机 Map 升级 Redis

09 篇的内存 Map 版多实例即失效——各实例各算各的。生产用 Redis `INCR + EXPIRE`，维度取「IP + 路由」：

```ts
// middleware/rate-limit.ts（生产版节选：ioredis）
const key = `rl:${ip}:${c.req.path}`   // ip 取 X-Forwarded-For（网关后）或 getConnInfo
const hits = await redis.incr(key)
if (hits === 1) await redis.expire(key, windowSec)
if (hits > max) return fail(c, 'RATE_LIMITED', 'too many requests', 429)
```

登录类接口另设更严阈值（防撞库）；限流放在解析请求体之前，越省越好。

### 7.5 中间件组装顺序（入口模板）

顺序即语义，照此从外到内：

```ts
app.onError(errorHandler)                          // 最外层兜底（06 篇）
app.use('*', requestContext)                       // 请求 ID + 访问日志
app.use('*', secureHeaders())                      // 安全响应头
app.use('/api/*', cors({ origin, credentials: true }))
app.use('*', csrf())                               // Cookie 认证才需要（04 篇）
app.use('*', bodyLimit({ maxSize: 1024 * 1024 }))  // 1MB
app.use('/api/*', rateLimit({ max: 60, windowSec: 60 }))
app.route('/api', api)
```

原则：错误处理与请求上下文最先；限流与 bodyLimit 在业务解析前拦。`csrf()` 只校验带表单类 Content-Type 的非安全方法，纯 JSON API 下它管的是 Cookie 认证那部分风险。

### 7.6 健康检查与优雅停机

```ts
app.get('/healthz', (c) => c.json({ ok: true }))   // liveness：进程活着
app.get('/readyz', async (c) => {                  // readiness：依赖可达
  await prisma.$queryRaw`SELECT 1`
  return c.json({ ok: true })
})

const server = Bun.serve({ fetch: app.fetch, port: 3000 })
process.on('SIGTERM', async () => {
  await server.stop()        // 停止接新请求，等在途请求处理完
  await prisma.$disconnect() // 再关 postgres / redis 连接
})
```

Docker/K8s 滚动更新不掉请求的三个前提：`/healthz`、`/readyz`、优雅停机——编排器先摘流量（SIGTERM），实例处理完在途请求再退出。

---

## 8. 部署：Docker 多阶段

```dockerfile
FROM oven/bun:1 AS deps
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

FROM oven/bun:1 AS build
WORKDIR /app
COPY --from=deps /app/node_modules node_modules
COPY . .
RUN bunx prisma generate                         # 生成物进 src/generated/prisma
RUN bun build ./src/index.ts --target bun --outdir dist

FROM oven/bun:1-slim
WORKDIR /app
COPY --from=build /app/dist dist
COPY --from=build /app/prisma prisma             # 迁移目录：migrate deploy 需要
COPY --from=build /app/prisma.config.ts ./
COPY --from=build /app/node_modules node_modules # prisma CLI（见下方迁移编排）
EXPOSE 3000
CMD ["bun", "dist/index.js"]
```

```yaml
# docker-compose.yml
services:
  app:
    build: .
    command: sh -c "bunx prisma migrate deploy && bun dist/index.js"   # 迁移 → 启动
    ports: ['3000:3000']
    environment:
      - DATABASE_URL=postgres://postgres:postgres@db:5432/blog
      - JWT_SECRET=change-me-at-least-32-bytes-long!!
      - REDIS_URL=redis://redis:6379
    depends_on: [db, redis]
  db:
    image: postgres:17
    environment: [POSTGRES_PASSWORD=postgres, POSTGRES_DB=blog]
  redis:
    image: redis:7-alpine
```

> 💡 迁移编排：`prisma` CLI 默认在 devDependencies——运行镜像要跑 `migrate deploy` 就把它移入 dependencies 并 COPY node_modules（上例）；`prisma/` 迁移目录与 `prisma.config.ts` 必须进运行镜像。Prisma 7 无 Rust 引擎：generate 产物随 `bun build` 打进 dist，运行时不再下载 binary engines，镜像比 6.x 瘦不少。想进一步瘦身可在启动脚本里以 `prisma migrate deploy` 前置迁移、或改用独立 migrate job。

> 💡 CI 串成一条流水线：lint → `bun test` → docker build → push → 部署（GitHub Actions 一份 workflow 即可）；compose 可给 app 加 healthcheck 指向 `/healthz`（7.6 节），编排器靠它 + SIGTERM 优雅停机做无损重启。

---

## 9. ✍️ 验收清单

**要求**：全部接口有测试覆盖；OpenAPI 文档可访问；错误格式全局统一。

**预期效果**（逐项打勾）：

- [ ] `docker compose up` 一键起 app + PostgreSQL + Redis
- [ ] 注册 → 登录（拿到双 Cookie）→ 建文章 → 越权删除得 403
- [ ] `/doc` 可打开、Schema 与实际行为一致；`/ui` 可调试
- [ ] `bun test` 全绿，覆盖 2xx 与 4xx 两类路径
- [ ] 任何接口的响应都是统一信封：成功 `{ code: 'OK', data }`、失败 `{ code, message, details? }`
- [ ] 每个响应带 `X-Request-ID`；错误日志能按 requestId 串联检索
- [ ] 清空 `JWT_SECRET` 再启动：进程指出缺哪项配置后退出（fail-fast）
- [ ] 超过限流阈值得 429（Redis 计数）；`docker compose stop` 时在途请求处理完才退出（优雅停机）

---

## 10. 🔗 参考资料

- Prisma ORM：https://www.prisma.io/docs/orm
- Prisma 7 升级指南（config/adapter/生成器变更）：https://www.prisma.io/docs/orm/v6/more/upgrades/to-v7
- @hono/zod-openapi：https://github.com/honojs/middleware/tree/main/packages/zod-openapi
- Scalar for Hono：https://github.com/scalar/scalar/tree/main/integrations/hono
- Bun.password：https://bun.com/docs/api/password
- Bun.serve（stop 与优雅停机）：https://bun.com/docs/api/http
- pino（Bun 兼容）：https://github.com/pinojs/pino
- ioredis：https://github.com/redis/ioredis

---

## 📌 小结

- 认证 = 双 token 轮换 + httpOnly Cookie；RBAC = `requireRole()` 中间件工厂
- Schema 三同源：校验、类型、OpenAPI 文档
- `app.request()` 让集成测试轻到「每个接口默认都该有测试」
- 生产加固四件套：请求 ID + 结构化日志、env fail-fast、双层缓存（HTTP/Redis）、Redis 限流；中间件组装顺序即语义
- 健康检查 + 优雅停机 = 滚动更新不掉请求
