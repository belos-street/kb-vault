# 10 实战B：企业级 REST API

> 所属大纲：[readme.md](../readme.md) ｜ 预计：2~3 天 ｜ 前置：04~06（中间件/校验/错误处理）

**一句话定位**：补齐生产级后端全套工程能力——认证、权限、校验、文档、测试、数据库、部署。

**面试可答**：JWT 双 token（access/refresh）+ httpOnly Cookie 传递；RBAC 用「元数据 + 中间件工厂」实现；`@hono/zod-openapi` 让 Schema 与文档同源；`app.request()` 免起服务器做集成测试。

---

## 1. 项目蓝图

**技术栈**：Bun + TypeScript strict + Drizzle ORM + PostgreSQL + Zod + oxlint/oxfmt

```
/src
  index.ts            # 入口：中间件、路由、OpenAPI 文档
  routes/
    auth.ts           # 注册/登录/刷新/登出
    users.ts  posts.ts
  middleware/
    auth.ts           # JWT 校验 + RBAC
  lib/
    db.ts             # Drizzle 客户端
    response.ts       # 统一响应格式
    errors.ts         # 业务异常（06 篇）
  schemas/            # Zod Schema（校验与 OpenAPI 同源）
  tests/              # app.request 集成测试
```

```bash
bun add drizzle-orm postgres zod @hono/zod-openapi @scalar/hono-api-reference
bun add -d drizzle-kit
```

## 2. 数据层：Drizzle + PostgreSQL

```ts
// lib/db.ts
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

const client = postgres(process.env.DATABASE_URL!)
export const db = drizzle(client)
```

```ts
// schema.ts（drizzle schema）
import { pgTable, serial, text, timestamp, boolean } from 'drizzle-orm/pg-core'

export const posts = pgTable('posts', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  content: text('content').notNull().default(''),
  published: boolean('published').notNull().default(false),
  authorId: text('author_id').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})
```

查询与事务：

```ts
import { eq, desc, and } from 'drizzle-orm'

// 分页列表（offset 分页；深分页换 cursor）
const items = await db.select().from(posts)
  .where(and(eq(posts.authorId, userId), eq(posts.published, true)))
  .orderBy(desc(posts.createdAt))
  .limit(limit).offset((page - 1) * limit)

// 事务
await db.transaction(async (tx) => {
  await tx.insert(posts).values(newPost)
  await tx.update(stats).set({ postCount: sql`${stats.postCount} + 1` })
})
```

> 💡 已熟练 Prisma 亦可直接换 `lib/db.ts`（Prisma 在 Node/Bun 长驻进程下同样成熟；Drizzle 优势是轻、无引擎、SQL 心智直译）。迁移流程：`bunx drizzle-kit generate` → `migrate`。

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

## 7. 部署：Docker 多阶段

```dockerfile
FROM oven/bun:1 AS deps
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

FROM oven/bun:1 AS build
WORKDIR /app
COPY --from=deps /app/node_modules node_modules
COPY . .
RUN bun build ./src/index.ts --target bun --outdir dist

FROM oven/bun:1-slim
WORKDIR /app
COPY --from=build /app/dist dist
EXPOSE 3000
CMD ["bun", "dist/index.js"]
```

```yaml
# docker-compose.yml
services:
  app:
    build: .
    command: sh -c "bunx drizzle-kit migrate && bun dist/index.js"   # 迁移 → 启动
    ports: ['3000:3000']
    environment: [DATABASE_URL=postgres://postgres:postgres@db:5432/blog]
    depends_on: [db]
  db:
    image: postgres:17
    environment: [POSTGRES_PASSWORD=postgres, POSTGRES_DB=blog]
```

> 💡 迁移编排：drizzle-kit、`drizzle.config.ts` 与 `drizzle` 迁移目录需保留在运行镜像（drizzle-kit 移入 dependencies，构建阶段一并 COPY）。想瘦身镜像可改用 `drizzle-orm/postgres-js/migrator` 在启动时以代码执行 migrate。

---

## 8. ✍️ 验收清单

**要求**：全部接口有测试覆盖；OpenAPI 文档可访问；错误格式全局统一。

**预期效果**（逐项打勾）：

- [ ] `docker compose up` 一键起 app + PostgreSQL
- [ ] 注册 → 登录（拿到双 Cookie）→ 建文章 → 越权删除得 403
- [ ] `/doc` 可打开、Schema 与实际行为一致；`/ui` 可调试
- [ ] `bun test` 全绿，覆盖 2xx 与 4xx 两类路径
- [ ] 任何接口的响应都是统一信封：成功 `{ code: 'OK', data }`、失败 `{ code, message, details? }`

---

## 9. 🔗 参考资料

- Drizzle ORM：https://orm.drizzle.team/docs/overview
- @hono/zod-openapi：https://github.com/honojs/middleware/tree/main/packages/zod-openapi
- Scalar for Hono：https://github.com/scalar/scalar/tree/main/integrations/hono
- Bun.password：https://bun.com/docs/api/password

---

## 📌 小结

- 认证 = 双 token 轮换 + httpOnly Cookie；RBAC = `requireRole()` 中间件工厂
- Schema 三同源：校验、类型、OpenAPI 文档
- `app.request()` 让集成测试轻到「每个接口默认都该有测试」
