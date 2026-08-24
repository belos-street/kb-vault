# 00 — ORM 与 Prisma 定位

> **本系列基于 Prisma ORM 7.x**（2026-08 编写；Prisma 8 尚在 RC，未采用）。

- **所属模块**：Prisma 学习大纲 · 认知层
- **预计时间**：30 min
- **面试可答**：ORM 解决的是「对象与关系表之间的阻抗失配」；Prisma 不让你写 SQL，也不完全翻译你的对象，而是用 Prisma Schema 作为唯一数据源生成类型安全的 Client。

---

## 1. 一句话定位

这一篇不写任何代码，只回答三个问题：**为什么需要 ORM、Prisma 是什么、凭什么选它（不选它）**。想通这三件事，后面每篇都是往这个心智模型里填肉。

---

## 2. 为什么需要 ORM

先看一个用 Node + `pg` 写查询的典型场景：

```ts
// 用原生 pg 驱动查"某个作者下的文章"
const res = await client.query('SELECT * FROM posts WHERE author_id = $1', [userId])
```

三个问题肉眼可见：

1. **无类型**：`res.rows` 是 `any[]`，字段拼错了、类型不对，运行时才炸。
2. **SQL 字符串拼接是注入重灾区**：一旦需求变成「按 title 模糊搜索 + 按时间排序 + 分页」，拼接就失控。
3. **对象与关系表的「阻抗失配」**：你代码里是 `author.posts` 这样的对象结构，数据库里却是两章表 + 外键。手动把 `rows` 组装成叶子结构，是每个 Node 后端都写过一遍的 boilerplate。

> 💡 **关键事实**：ORM 的出现不是为了消灭 SQL，而是消灭这三件事——**类型丢失、字符串拼接、手工装配对象**。它把「表结构」提升为 schema 声明，把「查询」变成类型安全的 API 调用。

### N+1：ORM 的经典敌人（也是它被黑的主因）

N+1 指「查 1 次集合，又要对每条记录再查 N 次关联」：

```
for (const post of posts) {          // 第 1 次查询：拿 100 篇 post
  await db.query(`SELECT * FROM author WHERE id = $1`, [post.author_id])  // N 次查询！（db 为示意的 pg 连接对象）
}
```

好的 ORM 提供 `include`/preload，一条 SQL 用 JOIN 或预取解决；烂 ORM（和乱用 ORM 的人）才会写出 N+1。**面试要分清：N+1 是"用错了"，不是"ORM 的错"。**

---

## 3. Prisma 是什么

Prisma 是 TypeScript/Node.js 生态的 ORM + 数据层工具链，由三件套组成：

| 组件 | 作用 | 类比 |
|------|------|------|
| **Prisma Schema** | 声明式数据模型语言（`.prisma`），是数据库与应用模型的一致数据源 | 类比的 ER 图 + DDL |
| **Prisma Client** | 由 Schema 生成的类型安全查询客户端 | 类型安全版 SQL 驱动 |
| **Prisma Migrate** | 基于 Schema 的迁移系统（生成 SQL 迁移文件） | 类比的 Flyway |
| **Prisma Studio** | 可视化查看/编辑数据的 GUI | phpMyAdmin 的现代化版 |

它的核心心智模型是**「Schema 单一数据源」**：

```mermaid
graph LR
  A[prisma/schema.prisma] -->|prisma generate| B[Prisma Client<br/>类型安全的查询上下文]
  A -->|prisma migrate dev| C[数据库表结构]
  B -->|类型检查| D[业务代码]
  C -->|data| B
```

改表 → 改 Schema → 迁移表结构 + 重新 generate → 客户端类型立刻同步。**表和代码由同一份文件派生，永远不会说两套话。**

---

## 4. Prisma 7：架构演进（面试必答点）

Prisma 前几个大版本（2~6）内置一个 **Rust 写的 Query Engine**：生成代码后，运行时把查询序列化到 Rust 引擎去执行。诚然性能好，但代价是：

- 冷启动慢（serverless 场景明显）
- bundle 巨大（约 14MB）
- 部署要带二进制引擎

**Prisma 7（2025-11）是架构级换代**：

| 维度 | Prisma 5/6 | Prisma 7 |
|------|-----------|----------|
| 查询引擎 | Rust 二进制 | **纯 TypeScript + WASM Query Compiler** |
| 数据库连接 | 内置默认驱动 | **强制 Driver Adapters**（如 `@prisma/adapter-pg`） |
| 生成产物 | `@prisma/client`（写进 node_modules） | **`prisma-client` provider，指定 `output` 目录** |
| 模块格式 | CJS / 混合 | **标准 ESM** |
| 配置 | `package.json` 的 `prisma` key / `prisma.config.ts` | **统一 `prisma.config.ts`** |
| 体积/冷启动 | ~14MB / 慢 | **~1.6MB（-90%）/ 冷启动明显改善** |
| 中间件 | `$use`（v4.16 起弃用） | **v6.14 已移除，改用 Client Extensions `$extends`** |

对应到代码，Prisma 7 的客户端初始化长这样（第一篇 [01-快速上手](01-快速上手-Schema与首次查询.md) 会逐行讲）：

```ts
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "./generated/prisma/client"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })
```

> ⚠️ **版本红线**：
> - Prisma 7 **不再支持 MongoDB**（需退回 v6），本系列全程 PostgreSQL。
> - 网上大量 v5/v6 教程用 `@prisma/client` + 无 adapter 的写法，在 v7 照抄即错——本系列所有示例均按 v7 写法。
>
> 📎 参考：[v7.0.0 Release Notes](https://github.com/prisma/prisma/releases/tag/7.0.0) · [官方 v7 升级指南](https://www.prisma.io/docs/guides/upgrade-prisma-orm/v7)

---

## 5. 与同类方案对比

| 对比点 | **Prisma** | Drizzle ORM | TypeORM | raw SQL（pg 驱动） |
|--------|-----------|-------------|---------|---------------------|
| 心智模型 | Schema 声明式 → 生成类型 | TS 优先、贴近 SQL | 装饰器/实体类 | SQL 字符串 |
| 类型安全 | 强（生成式） | 强（推断式） | 中（运行时 reflect） | 无 |
| 学习成本 | 低-中（Schema 语言易读） | 中（要懂 SQL 才顺手） | 高（装饰器 + 概念多） | 低 |
| 性能 | 中（有运行时开销，已大幅优化） | **高（默认 SQL→对象零抽象）** | 中 | 最高 |
| 迁移工具 | ✅ 内置 Migrate | ✅ drizzle-kit | ❌ 需 TypeORM CLI 或外部 | ❌ 手写 |
| 适用场景 | **产品快速开发、团队协作、类型友好** | 性能敏感、数据中心化、要控 SQL | 存量项目迁移 | 极致性能/复杂 SQL |

**一句话选型结论**：手头的日常后端（CRUD、能跑、类型安全）选 Prisma 最省心；性能敏感或团队熟悉 SQL 时 Drizzle 是更强的对手；raw SQL 永远是可以退回的基线。

---

## 6. 练习

**要求**：不写代码。只用一段话分别说服三种人：① 一个只写 raw SQL 的老后端；② 一个刚入门的 junior；③ 一个在意 serverless 冷启动的架构师——为什么（或为什么不）用 Prisma 7。

**提示**：第 ① 人的痛点是类型与维护，第 ② 人的痛点不是 N+1 而是「从哪开始」，第 ③ 人的痛点直接命中 §4 的体积/冷启动数据。

**预期效果**：你能在 3 句话内说清「Prisma 解决阻抗失配 + 类型安全 + 内置迁移，Prisma 7 用 TS+WASM 换来 90% 体积缩减」。

---

## 7. 面试问答

> **问：为什么说 Prisma 类型安全，它和其他 ORM 有什么本质区别？**

**答：** 区别在「类型从哪里来」。TypeORM 靠装饰器在**运行时**反射元数据，类型安全是搭出来的；Prisma 从 **Prisma Schema 生成 TypeScript 类型**，查询 API 的入参出参都是编译期推导的字面量类型——字段改名、漏传必填、拼错关系名，都是编译错误而不是运行 bug。

> **追问：生成类型 vs 推断类型的 Drizzle，你怎么选？**

**答：** 本质是「单一数据源」之争。Prisma 的 Schema 是数据库和应用的唯一事实来源，适合团队协作、结构先行；Drizzle 的 schema 就是 TS 代码，靠近 SQL、无生成步骤，适合要完全掌控 SQL 的场景。选 Prisma 的前提是认可「消耗一次生成步骤，换取 Schema 的声明式单一数据源」。

> **追问：Prisma 7 把 Query Engine 从 Rust 换成 TS+WASM，性能没倒退吗？**

**答：** 官方口径是查询性能不降反升（up to 3x faster），换来的是 ~90% 体积缩减（14MB→~1.6MB）和更快的冷启动——它的动机是 serverless 化。代价是**数据库连接必须外置 Driver Adapter**，连接池默认值也随之改变（如 pg 驱动默认无连接超时，v6 是 5 秒），这会成为生产环境的一个坑（见 [10-调试性能与生产部署](10-调试性能与生产部署.md)）。

---

## 8. 三角对比

| 维度 | **Prisma 7** | Drizzle ORM | raw SQL 基线 |
|------|-------------|-------------|--------------|
| 开发速度 | ⭐⭐⭐⭐⭐（Schema 即文档） | ⭐⭐⭐⭐ | ⭐⭐ |
| 类型安全 | 生成式，最强 | 推断式，很强 | 无 |
| 迁移/可视化 | 内置 Migrate + Studio | drizzle-kit + 无官方 GUI | 手写 |
| 性能/体积 | 中，已大幅优化 | 高 | 最高（但要自己保证） |
| 上手门槛 | 低 | 中（要吃透 SQL） | 低（长期维护成本高） |

**本系列基线**：后面每篇的代码示例都以 PostgreSQL 18 + Prisma 7 为唯一基线，raw SQL 只在「性能/兜底」对比时出现。