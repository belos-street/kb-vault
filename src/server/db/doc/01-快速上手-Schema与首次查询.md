# 01 — 快速上手：Schema 与首次查询

> **本系列基于 Prisma ORM 7.x**（2026-08 编写；Prisma 8 尚在 RC，未采用。下方所有代码均为 **Prisma 7 写法**，与网上大量 v5/v6 教程不同，注意对照）。

- **所属模块**：Prisma 学习大纲 · 基础层
- **预计时间**：60 min
- **面试可答**：Prisma 7 的"连接"已经从 schema 里移到 `prisma.config.ts`，客户端必须传 Driver Adapter；建表用 `migrate dev`，查询用生成的类型安全 Client。

---

## 1. 一句话定位

目标只有一件事：**5 分钟内，用代码把一张表建出来，插入一条数据，再把它查回来**。所有概念（字段、关系、迁移、客户端）都用最简形态过一遍，细节留给后面每篇。

---

## 2. 准备工作

### 2.1 目录与运行时

遵循仓库规范：**Bun + TypeScript(strict)**

```bash
mkdir prisma-demo && cd prisma-demo
bun init -y          # 生成 package.json + tsconfig.json + src/index.ts
```

改 `package.json` 加两个关键字段：

```json
{
  "type": "module",
  "scripts": {
    "dev": "bun run src/index.ts"
  }
}
```

`type: module` 是 **Prisma 7 的硬要求**（ORM 本身已是 ESM 发行）。

### 2.2 数据库（PostgreSQL 18）

用 Docker 起一个 PG 18（与 `src/computer-science/database` 课程版本一致）：

```bash
docker run --name pg18 -e POSTGRES_USER=prisma -e POSTGRES_PASSWORD=prisma -e POSTGRES_DB=demo \
  -p 5432:5432 -d postgres:18
```

连接串写进 `.env`：

```
DATABASE_URL="postgresql://prisma:prisma@localhost:5432/demo?schema=public"
```

### 2.3 安装依赖

```bash
bun add @prisma/client@7
bun add -d prisma@7
bun add @prisma/adapter-pg        # Prisma 7 必须的 Driver Adapter（PostgreSQL 用 pg）
```

> 💡 三者的分工：`prisma`（CLI，生成/迁移工具）是开发依赖；`@prisma/client` 与 `@prisma/adapter-pg` 是运行时依赖。

---

## 3. 初始化：`prisma init`

```bash
bunx prisma init
```

它会生成：

```
prisma-demo/
├── prisma/
│   └── schema.prisma        # 数据模型声明（核心）
├── prisma.config.ts         # CLI/连接配置（Prisma 7 新增的配置入口）
├── .env                     # DATABASE_URL
└── package.json
```

> ⚠️ 如果你装的 Prisma 是 7.9+，`init` 还会往项目里装一套 `prisma/skills`（给 AI Agent 用的参考），属于可选，`--no-skills` 可以关掉。不影响本教程。

`prisma init` 生成的 `schema.prisma` 已经带好了 datasource 和 generator 的骨架，直接改造成下面这样。

---

## 4. Schema（数据模型）

把 `prisma/schema.prisma` 替换为：

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
}
```

三个要点（都是 Prisma 7 的新口径，面试常考）：

| 块 | 作用 | v7 注意点 |
|----|------|-----------|
| `generator client` | 声明生成的客户端类型与产物位置 | **provider 必须是 `prisma-client`**（旧的 `prisma-client-js` 即将移除）；**`output` 必填**，不能再丢给 node_modules |
| `datasource db` | 声明数据库类型 | **只剩 `provider`**；连接串 `url` 已移入 `prisma.config.ts` |
| `model User` | 表结构声明 | 字段：`类型 @id @default @unique` 等属性；`String?` 表示可空 |

再配 `prisma.config.ts`（`init` 已生成，核对内容）：

```ts
// prisma.config.ts
import "dotenv/config"
import { defineConfig, env } from "prisma/config"

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
})
```

> 💡 **v6 → v7 的最大区别**：v6 时代连接串写在 `datasource` 里（`url = env("DATABASE_URL")`）；v7 统一收进 `prisma.config.ts`，且**环境变量不再自动加载**，所以要 `import "dotenv/config"`。

---

## 5. 建表：`migrate dev`

```bash
bunx prisma migrate dev --name init
```

这条命令做三件事（v6 及以前还会顺带自动 `generate`/seed，**v7 起不再自动执行**，见[官方 migrate dev 文档](https://www.prisma.io/docs/cli/migrate/dev)）：

1. 把 `schema.prisma` 与数据库现状做 diff
2. 生成一个可读的 SQL 迁移文件（`prisma/migrations/<时间戳>_init/migration.sql`）
3. 执行迁移

建表后**手动补一步**（不跑它，下面 `import "./generated/prisma/client"` 会失败）：

```bash
bunx prisma generate
```

验证表已建好：

```bash
docker exec -it pg18 psql -U prisma -d demo -c '\dt'
```

> 观察迁移文件（`.sql`）是学习 Prisma 最好的方式之一——你能看到 `@default(autoincrement())` 到底翻译成了什么 SQL。

---

## 6. 类型安全的首次查询

写 `src/index.ts`（这是 Prisma 7 专属的客户端初始化方式）：

```ts
// src/index.ts
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "./generated/prisma/client"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  // 创建
  const user = await prisma.user.create({
    data: { email: "alice@example.com", name: "Alice" },
  })
  console.log("created:", user)

  // 查询
  const all = await prisma.user.findMany()
  console.log("all users:", all)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
```

运行：

```bash
bun run dev
# created: { id: 1, email: 'alice@example.com', name: 'Alice' }
# all users: [ { id: 1, email: 'alice@example.com', name: 'Alice' } ]
```

如果 `email` 写重了第二次运行，会抛 `P2002`（唯一约束冲突）——错误码体系在 [07-事务与错误处理](07-事务与错误处理.md) 讲。

> ⚠️ **v6 → v7 导入路径变了**：v6 是 `import { PrismaClient } from "@prisma/client"`；v7 必须从你写的 `output` 路径导入（这里是 `./generated/prisma/client`，具体看你在 generator 里配的 output）。

---

## 7. 零配置备选：SQLite（可选）

不想起 Docker 时，把 `schema.prisma` 的 `datasource` 换成 SQLite，连 `.env` 都不用配：

```prisma
generator client {
  provider = "prisma-client"
  output   = "../src/generated/prisma"
}

datasource db {
  provider = "sqlite"
}
```

再配 `prisma.config.ts` 的 `datasource.url` 为 `file:./dev.db`，`migrate dev` 会用内存文件建表，`PrismaPg` 换成 `@prisma/adapter-better-sqlite3`。**本系列后续仍以 PostgreSQL 为主**，这里只是让你意识到：Prisma 换数据库的成本几乎等于换一个 provider + 换一个 adapter。

---

## 8. 练习（要求 + 提示 + 预期效果）

**要求**：在你自己的 `prisma-demo` 里：① 给 `User` 加一个 `age Int?` 字段并再迁一次（`migrate dev --name add_age`）；② 写入一个 `age: 30` 的用户；③ 用 `findFirst({ where: { email: ... } })` 查回并且**只**取 `name` 字段。

**提示**：取字段用 `select`，类型会自动收缩：

```ts
const picked = await prisma.user.findFirst({
  where: { email: "alice@example.com" },
  select: { name: true },
})
// picked: { name: 'Alice' | null } —— 类型上只有 name，没有 id/email/age
```

**预期效果**：`age` 出现在迁移 SQL 里、出现在返回对象里；`select` 后对象类型精确到只含 `name`。你能复述「改字段 = 改 schema → migrate → 重新 generate，三步入一次」这个闭环。

---

## 9. 面试问答

> **问：Prisma 7 为什么要强制 Driver Adapter？**

**答：** v6 及以前，Prisma 内置了一套默认数据库驱动，连接细节被封装。v7 移除了 Rust 引擎、客户端变纯 TS 后，把「怎么连数据库」完全交给生态里的标准驱动（pg、mysql2……），Prisma 只负责查询编译与类型生成。好处是瘦身 + 能跑进 serverless/edge；代价是**连接池配置不再是 Prisma 说了算**，而由底层驱动决定（例如 pg 默认无连接超时，v6 默认 5 秒）——这是 v7 生产环境最常见的坑之一（见 10 篇）。

> **问：`migrate dev` 和 `migrate deploy` 有什么区别？**

**答：** `dev` 用于开发：会比对 schema 与数据库、生成迁移文件、**可能触发数据重置**（有破坏性变更时提示）；`deploy` 用于生产：只把已存在的迁移文件按顺序执行，**绝不碰 schema 比对、绝不重置**。一句话：`dev` 边想边写，`deploy` 照单执行。

> **追问：为什么说"表结构和代码是同一份文件派生的"？**

**答：** `schema.prisma` 是唯一数据源：`migrate` 从它生成表，`generate` 从它生成客户端类型。改字段只改这一处，不需要同步改「建表脚本」和「类型定义」两张表，从根上消灭了「代码与数据库不一致」这类问题。

---

## 10. 三角对比

| 维度 | **Prisma 7**（本教程基线） | v6（旧写法） | raw SQL（pg） |
|------|--------------------------|-------------|---------------|
| 建表 | `migrate dev`（可控、可回溯） | 同，但连接在 schema 里 | 手写 DDL |
| 初始化 | adapter + config.ts | new PrismaClient() 即用 | new Client() + 手拼 SQL |
| 类型安全 | 生成式，编译期保证 | 同 | 无 |
| 客户端体积/冷启动 | 小、快 | 大、慢 | 最小 |
| 上手成本 | 中（v7 骨架多一点） | 低 | 低但长期维护贵 |

下一篇 [02-数据建模](02-数据建模-字段类型与约束.md) 把 `schema.prisma` 的类型与约束体系讲全，让你能设计出"生产级"的表结构。