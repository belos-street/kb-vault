# 06 — 实战整合：REST API

> **本系列基于 Prisma ORM 7.x**（2026-08 编写）。

- **预计时间**：90 min ｜ **前置**：03、04、05

**一句话定位**：把全部知识点焊成一个能跑的真后端：Bun + Hono + Prisma 7 + PostgreSQL 的博客 API（用户 + 文章 + 标签）。

**面试可答**：接入框架的标准姿势——PrismaClient 全应用单例（防连接数爆炸）→ Service 分层隔离业务 → zod 校验输入 → 错误码统一映射 HTTP 状态码。

---

## 1. 项目骨架

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
│   ├── lib/error.ts        # Prisma 错误码 → HTTP
│   ├── routes/users.ts  posts.ts  tags.ts
│   ├── services/           # 业务层（换 ORM/加缓存只动这里）
│   └── types/dto.ts        # zod 输入校验
├── prisma/schema.prisma
├── prisma.config.ts
└── .env
```

## 2. PrismaClient 单例（最重要的工程纪律）

```ts
// src/lib/prisma.ts
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "../generated/prisma/client"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
export const prisma = new PrismaClient({ adapter })
```

每个实例都有自己的连接池——**多实例 = 连接数翻倍**，dev 热重载下尤其容易 `Too many connections`。全应用只实例化一次并 export 复用。

## 3. Schema 与迁移

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
  author    User     @relation(fields: [authorId], references: [id], onDelete: Cascade)
  authorId  Int
  tags      Tag[]
}

model Tag {
  id    Int    @id @default(autoincrement())
  name  String @unique
  posts Post[]
}
```

```bash
bunx prisma migrate dev --name init
bunx prisma generate
bunx prisma db seed    # seed 写法见 07 篇速查
```

## 4. 路由 + Service：把 04 篇查询串起来

```ts
// src/services/user.service.ts —— cursor 分页（04 篇落地）
import { prisma } from "../lib/prisma"

export async function getUsers({ cursor, limit }: { cursor?: number; limit: number }) {
  const items = await prisma.user.findMany({
    take: limit + 1,                 // 多取一条判断有没有下一页
    skip: cursor ? 1 : 0,
    ...(cursor ? { cursor: { id: cursor } } : {}),
    orderBy: { id: "desc" },
  })
  const hasNext = items.length > limit
  const page = hasNext ? items.slice(0, limit) : items
  return { users: page, nextCursor: hasNext ? page[page.length - 1].id : null }
}

export async function createUser(data: { email: string; name?: string }) {
  return prisma.user.create({ data })
}
```

```ts
// src/routes/users.ts
import { Hono } from "hono"
import { z } from "zod"
import { createUser, getUsers } from "../services/user.service"
import { handlePrismaError } from "../lib/error"

const CreateUserDto = z.object({
  email: z.email(), // zod v4 顶层 API（v3 写 z.string().email()）
  name: z.string().min(1).max(50).optional(),
})
const pageQuery = z.object({
  cursor: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

const users = new Hono()

users.get("/", async (c) => {
  const q = pageQuery.safeParse(c.req.query())
  if (!q.success) return c.json({ error: "bad query" }, 400)
  return c.json(await getUsers(q.data))
})

users.post("/", async (c) => {
  const parsed = CreateUserDto.safeParse(await c.req.json())
  if (!parsed.success) return c.json({ error: parsed.error.flatten() }, 422)
  try {
    return c.json(await createUser(parsed.data), 201)
  } catch (e) {
    return handlePrismaError(c, e)     // P2002 → 409 等
  }
})

export default users
```

```ts
// src/routes/posts.ts —— 筛选 + 关系投影（04 篇综合）
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
      author: { select: { id: true, name: true } },
      _count: { select: { tags: true } },
    },
  })
  return c.json({ posts })
})
```

## 5. 错误码 → HTTP 映射（05 篇落地）

```ts
// src/lib/error.ts
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

分层原则：Service 抛业务/Prisma 错误，路由层只做「翻译成 HTTP」——service 可被 CLI/Worker 复用，不绑定 HTTP。

---

## 6. ✍️ 练习

**要求**：跑通全链路并补两个接口——`POST /posts`（嵌套创建带作者与标签，标签用 `connectOrCreate`）、`GET /posts?tag=orm&q=prisma` 组合筛选；curl 验证 404（不存在）与 409（重复邮箱）。**提示**：`tags: { connectOrCreate: [{ where: { name }, create: { name } }] }`；`app.route("/api/users", users)` 挂载。**预期效果**：能完整讲出「路由 → service → Prisma → 错误映射」链路，并说清单例 PrismaClient 为什么是纪律。

---

## 7. 💬 面试问答（本系列 4 组之四）

> **问：为什么全应用只初始化一个 PrismaClient？Serverless 里怎么办？**

**答**：每个实例自带连接池，多实例 = 连接数翻倍，dev 热重载下每次保存 new 一个会把池抽干（`Too many connections`）；配 `$disconnect`（进程退出时）才是完整生命周期。Serverless 每个函数实例可能独立初始化，标准解法是**模块级缓存 + 挂到 global 上跨调用复用**——冷启动初始化一次，后续热复用（Prisma 官方 serverless 文档的标准建议）。

---

## 8. 🔗 参考资料

- Hono：https://hono.dev/docs/
- Prisma Client 参考：https://www.prisma.io/docs/orm/reference/prisma-client-reference
- Zod：https://zod.dev/

---

## 📌 小结

- 单例 Client + Service 分层 + zod DTO + 错误码映射 = 四件套
- `take: limit + 1` 判断下一页，`nextCursor` 交给前端
- Schema 一上来就写完整（含关系与级联），一次迁移到位
