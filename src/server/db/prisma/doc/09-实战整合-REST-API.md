# 09 — 实战整合：REST API

> **本系列基于 Prisma ORM 7.x**（2026-08 编写）。

- **所属模块**：Prisma 学习大纲 · 工程层
- **预计时间**：90 min
- **面试可答**：把 Prisma 接入框架（Hono）做 REST API 的标准姿势是：**初始化一次 `PrismaClient` 并复用**（避免热重载/多实例耗尽连接）→ Repository/Service 分层 → 输入用类型安全 DTO 校验 → 错误统一映射成 HTTP 状态码。

---

## 1. 一句话定位

前面 8 篇是零件，这一篇把它们焊成一个**能跑的真后端**：Bun + Hono + Prisma 7 + PostgreSQL 的博客 REST API（用户 + 文章 + 标签 CRUD）。

---

## 2. 选型与项目骨架

沿用仓库规范：Bun + TypeScript(strict) + Hono（轻量、贴近 Web 标准，见 `src/server/frame/hono`）。

```bash
mkdir blog-api && cd blog-api
bun init -y
bun add hono @prisma/client @prisma/adapter-pg zod
bun add -d prisma typescript
```

```
blog-api/
├── src/
│   ├── index.ts            # Hono 入口
│   ├── lib/prisma.ts       # 单例 PrismaClient
│   ├── routes/
│   │   ├── users.ts
│   │   ├── posts.ts
│   │   └── tags.ts
│   ├── services/           # service 层
│   │   ├── post.service.ts
│   │   └── user.service.ts
│   └── types/dto.ts        # 输入 DTO（校验 + 类型）
├── prisma/schema.prisma
├── prisma.config.ts
└── .env
```

> 💡 分层为什么不是过度设计？Service 层是**业务与 ORM 之间的隔离带**：换 ORM、加缓存、加审计，只动 service 不动路由。

---

## 3. PrismaClient 单例（重要）

框架下最容易踩的坑：**每个模块 `new PrismaClient()` 会导致连接数爆炸**。

```ts
// src/lib/prisma.ts
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "../generated/prisma/client"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })

export const prisma = new PrismaClient({ adapter })
```

- 全应用**只实例化一次**并 export 复用。
- 生产关心**连接池**：v6 之前 Prisma 有内置池；v7 用 driver adapter 后，**连接池归 pg 驱动管**——直接传 `pg.Pool` 实例（`new PrismaPg(pool)`），或在构造参数里配 `max`/`connectionTimeoutMillis`（具体写法见 10 篇），默认值与 v6 不同（如无连接超时）。

---

## 4. Schema：一上来就完整

```prisma
generator client {
  provider = "prisma-client"
  output   = "../src/generated/prisma"
}

datasource db {
  provider = "postgresql"
}

model User {
  id    Int    @id @default(autoincrement())
  email String @unique
  name  String?
  posts Post[]
}

model Post {
  id        Int      @id @default(autoincrement())
  title     String
  content   String
  published Boolean  @default(false)
  views     Int      @default(0)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  author   User   @relation(fields: [authorId], references: [id], onDelete: Cascade)
  authorId Int
  tags     Tag[]
}

model Tag {
  id    Int    @id @default(autoincrement())
  name  String @unique
  posts Post[]
}
```

```bash
bunx prisma migrate dev --name init
bunx prisma db seed   # 造点数据，见 08 篇
```

---

## 5. Service + 路由：把 05 篇的查询串起来

### users.ts（路由） + user.service.ts（业务）

```ts
// src/routes/users.ts
import { Hono } from "hono"
import { createUser, getUsers, getUserPosts } from "../services/user.service"
import { CreateUserDto, pageQuery } from "../types/dto"

const users = new Hono()

users.get("/", async (c) => {
  const q = pageQuery.safeParse(c.req.query())
  if (!q.success) return c.json({ error: "bad query" }, 400)
  const data = await getUsers(q.data)   // cursor 分页在 service 里实现
  return c.json(data)
})

users.post("/", async (c) => {
  const body = await c.req.json()
  const parsed = CreateUserDto.safeParse(body)   // zod 校验输入
  if (!parsed.success) return c.json({ error: parsed.error.flatten() }, 422)
  try {
    const user = await createUser(parsed.data)
    return c.json(user, 201)
  } catch (e) {
    return handlePrismaError(c, e)      // P2002 → 409 等
  }
})

users.get("/:id/posts", async (c) => {
  const posts = await getUserPosts(Number(c.req.param("id")))
  return c.json(posts)
})

export default users
```

```ts
// src/services/user.service.ts
import { prisma } from "../lib/prisma"

export async function getUsers({ cursor, limit }: { cursor?: number; limit: number }) {
  const items = await prisma.user.findMany({
    take: limit + 1,                 // 多取一条判断"还有没有下一页"
    skip: cursor ? 1 : 0,
    ...(cursor ? { cursor: { id: cursor } } : {}),
    orderBy: { id: "desc" },
  })
  const hasNext = items.length > limit
  const page = hasNext ? items.slice(0, limit) : items
  return { users: page, nextCursor: hasNext ? page[page.length - 1].id : null }
}
```

> 💡 **`take: limit + 1`** 是"判断是否有下一页"的惯用法，比再 count 一次省一条查询；返回 `nextCursor` 给前端 `?cursor=xxx`。

### posts.ts：含关系与筛选（05 篇综合）

```ts
// src/routes/posts.ts
posts.get("/", async (c) => {
  const posts = await prisma.post.findMany({
    where: {
      published: true,
      title: c.req.query("q") ? { contains: c.req.query("q") } : undefined,
      tags: c.req.query("tag") ? { some: { name: c.req.query("tag") } } : undefined,
    },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: {
      id: true, title: true, views: true, createdAt: true,
      author: { select: { id: true, name: true } },          // 关系投影，不整行
      _count: { select: { tags: true } },                     // 标签数
    },
  })
  return c.json({ posts })
})
```

---

## 6. DTO 与错误处理（07 篇落地）

```ts
// src/types/dto.ts
import { z } from "zod"

export const CreateUserDto = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(50).optional(),
})

// 分页参数：?cursor=xx&limit=20（c.req.query() 是 string 类型，用 coerce 转换）
export const pageQuery = z.object({
  cursor: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})
```

```ts
// src/lib/error.ts —— 统一把 Prisma 错误码翻成 HTTP
import { Prisma } from "../generated/prisma/client"
import type { Context } from "hono"

export function handlePrismaError(c: Context, e: unknown) {
  if (e instanceof Prisma.PrismaClientKnownRequestError) {
    switch (e.code) {
      case "P2002": return c.json({ error: "conflict" }, 409)
      case "P2025": return c.json({ error: "not found" }, 404)
      case "P2003": return c.json({ error: "bad request: fk violation" }, 400)
    }
  }
  console.error(e)
  return c.json({ error: "internal" }, 500)
}
```

> 💡 Service 内部或不方便抛 Prisma 原错误时，可包一层自定义错误（`ConflictError`/`NotFoundError`），路由 catch 后统一 `handlePrismaError` 之外再兜一层——面试聊到"错误分层"时能给出这套方案就算过关。

---

## 7. 练习（要求 + 提示 + 预期效果）

**要求**：把上面服务跑起来，并补两个接口：① `POST /posts`（带作者与标签的嵌套创建）；② `GET /posts?tag=orm&q=prisma` 的组合筛选。用 curl 验证 CRUD 和错误码（`/posts/:id` 不存在 → 404；重复用户 → 409）。

**提示**：嵌套创建用 `tags: { connectOrCreate: [{ where: { name }, create: { name } }] }`（03/04 篇语法）；Hono `app.route("/api/users", users)` 挂载前缀。

**预期效果**：curl 全程跑通；你能把"路由 → service → Prisma → 错误映射"的链路完整讲一遍，并说清单例 PrismaClient 为何重要。

---

## 8. 面试问答

> **问：为什么全应用只初始化一个 PrismaClient？**

**答：** 每个实例都有自己的连接池/缓存/追踪标签。多实例 = 连接数翻倍、热点重复预热；在 dev 热重载（HMR）下尤其容易"每次保存都 new 一个，连接池被抽干"导致 `Too many connections`。单例是前提，配合 `$disconnect`（进程退出时）才是完整的生命周期管理。

> **追问：那 Vercel/Serverless 里怎么办？**

**答：** Serverless 每个函数实例可能单独初始化，业界惯用"模块级缓存 + 全局复用泄漏给实例"（gRPC 服务端类似的单例模式），即 **global 上挂单例**，函数每次调用复用同实例，冷启动时初始化、复用保持热连接——这是 Prisma 官方 serverless 文档的标准建议。

> **问：为什么路由要用 DTO 校验而不是直接信 `c.req.json()`？**

**答：** 输入是不可信边界。zod 校验把"字段类型、必填、长度"一次做完，类型上也有 `z.infer<typeof CreateUserDto>` 把校验后的类型拿到 TS 里用——**编译期 + 运行期双重防线**。直接信 body 的代价是脏数据进库、查询时踩类型断言错误。

> **追问：错误处理放在路由层还是 service 层合理？**

**答：** 分层原则：Service 抛**业务错误**（自定义类型或直接抛 Prisma 错误），路由层负责**翻译成 HTTP 语义**（状态码 + JSON body）。这样 service 可被 CLI/Worker 复用（不绑定 HTTP），路由只管"协议"。考试能答出"职责分离 + 复用"两点就够。

---

## 9. 三角对比

| 维度 | **Prisma + Hono（本教程）** | Prisma + Express | ORM 全手动（raw SQL） |
|------|---------------------------|------------------|----------------------|
| 分层 | routes/service 清晰 | 传统 MVC 模板多 | 全部手写 |
| 输入校验 | zod（类型 + 运行期） | 第三方/手工 | 手工 validate |
| 错误映射 | handlePrismaError 集中 | 中间件风格 | 每处 try/catch |
| 类型安全 | 端到端（DTO + Client） | 同左但样板多 | 弱 |

下一篇 [10-调试性能与生产部署](10-调试性能与生产部署.md)：把 09 的上线前"体检"做了。