# 《Prisma ORM》学习大纲

> `src/server/db/` 系列教学大纲。定位：**工具级教程——入门会用即可**。Prisma 是工具不是学科，本系列只覆盖「建模 → 迁移 → CRUD → 事务 → 实战」主链路；高级特性与生产要点全部收敛到 07 速查篇「随用随查」。

---

## 1. 定位

| 项目 | 内容 |
|------|------|
| 目标读者 | 已掌握 JS/TS、Node/Bun 运行时的全栈工程师（无需 ORM 概念科普） |
| 前置要求 | TypeScript 基础；SQL 基本概念（表/字段/主外键，参考 `src/computer-science/database` 01-04）；能跑 Docker |
| 学习目标 | 会用 Prisma 7 完成「建模 → 迁移 → CRUD → 关系查询 → 事务」完整链路，并在 Bun 后端搭一个可运行的 REST API |
| 面试目标 | 只覆盖 4 组真高频点：v7 架构与选型、N+1 与分页、迁移与 drift、单例与生产迁移 |

> **教程技术栈**（遵循 `agents.md` 规范）：Bun + TypeScript(strict) + oxlint/oxfmt；数据库 **PostgreSQL 18**（docker-compose 一键起）。

### 版本基线

- **Prisma ORM 7.x**（本系列基线，等价 `prisma@prev`；Prisma 8 已于 2026-09 初 GA 成为 `prisma@latest`，官方对 v7 持续支持——本系列内容仍成立，是否升级自行评估）
- Prisma 7 关键开启项：ESM（`type: module`）、`prisma-client` provider（需 `output`）、Driver Adapters（`@prisma/adapter-pg`）、`prisma.config.ts` 配置
- ⚠️ MongoDB 在 v7 暂不支持（v8 已原生支持，early access），本系列以 PostgreSQL 为主
- 📌 各篇篇头统一标注「基于 Prisma ORM 7.x」；01 篇对照 v6 旧写法说明差异，避免照抄网上 v5/v6 教程

---

## 2. 学习路径图

```mermaid
graph LR
  A["01 快速上手<br/>定位精华 + 从零到首次查询"] --> B["02 数据建模<br/>字段/约束/枚举/索引"]
  B --> C["03 关系建模<br/>1对1/1对多/多对多/自引用"]
  C --> D["04 查询进阶<br/>筛选/排序/分页/聚合"]
  D --> E["05 迁移与事务<br/>migrate 工作流 + $transaction"]
  E --> F["06 实战整合<br/>REST API"]
  F --> G["07 速查与引子<br/>生产要点 + 生态高级特性"]
```

---

## 3. 篇目规划

| 序号 | 篇名 | 一句话定位 | 核心知识点 | 预计 |
|------|------|-----------|-----------|------|
| 01 | 快速上手-从零到首次查询 | 为什么用 ORM、Prisma 7 新口径、5 分钟建表到查询、选型结论 | ORM 三痛点；三件套与 Schema 单一数据源；v7 架构演进（Rust-free/Driver Adapter/config.ts）；`migrate dev`；与 Drizzle/raw SQL 选型 | 45 min |
| 02 | 数据建模-字段类型与约束 | 把表结构用 Schema 描述清楚 | 标量类型映射；`@id/@default/@unique/@updatedAt/@map`；枚举与数组；Json；`@@unique/@@index`；命名规范 | 45 min |
| 03 | 关系建模-从1对1到多对多 | 用外键把表串起来 | 关系两端声明与 `@relation`；1-1/1-N；`onDelete` 级联；嵌套写；隐式 vs 显式 N-N；自引用关系 | 60 min |
| 04 | 查询进阶-筛选排序分页 | 从「拿一条」到「复杂查询」 | where 操作符；orderBy；offset vs cursor 分页；`select/include` 与 N+1；`count/aggregate/groupBy` | 60 min |
| 05 | 迁移与事务 | 改表可追踪、多步写入保一致 | `migrate dev/deploy/reset` 与 `db push`；schema drift 复盘；交互式/批量事务；错误码 P2002/P2025/P2003 | 60 min |
| 06 | 实战整合-REST-API | 把全部知识点串成可跑的后端 | Bun + Hono + Prisma 单例；Repository/Service 分层；zod DTO；错误码 → HTTP 映射；cursor 分页接口 | 90 min |
| 07 | 速查-生产要点与高级特性引子 | 随用随查，不进主线 | Studio/seed；query 日志与 EXPLAIN；N+1 排查；连接池（v7 差异）；`migrate deploy` 纪律；生态引子（Accelerate/Pulse/$extends/TypedSQL…） | 随用随查 |

> **工具类教程规格**（区别于框架类教程）：练习一段式（要求+提示+预期效果合并）；面试问答只保留 4 组真高频（01/04/05/06 各一组）；三角对比只在 01 做一次选型对比；高级特性全部收敛 07。

### 文档目录

```
src/server/db/prisma/
├── readme.md                 # 本文档
└── doc/
    ├── 01-快速上手-从零到首次查询.md
    ├── 02-数据建模-字段类型与约束.md
    ├── 03-关系建模-从1对1到多对多.md
    ├── 04-查询进阶-筛选排序分页.md
    ├── 05-迁移与事务.md
    ├── 06-实战整合-REST-API.md
    └── 07-速查-生产要点与高级特性引子.md
```

---

## 4. 最小学习路径

赶时间时只读三篇即可干活：**01 → 02 → 06**（速查遇到问题再翻 03/04/05/07）。

| 阶段 | 篇目 | 练习要点 |
|------|------|---------|
| 上手 | 01 | 建表、插一条、查回，走通「改 schema → migrate → generate」闭环 |
| 建模 | 02 | 设计一张含约束/枚举/索引的表 |
| 关系 | 03 | User/Post/Tag 关系图，嵌套创建与联查 |
| 查询 | 04 | 关键词搜索 + cursor 分页列表 |
| 迁移 | 05 | 制造一次 schema drift 并复盘；事务保证多步写入 |
| 实战 | 06 | 完整 REST API：用户 + 文章 CRUD + 分页 + 标签 |

---

## 5. 面试覆盖图

| 高频面试点 | 覆盖篇目 |
|-----------|---------|
| Prisma 7 架构演进（Rust-free、Driver Adapter）、Prisma vs Drizzle 选型 | 01 |
| N+1 排查、include vs select、offset vs cursor | 04 |
| Migration 工作流、schema drift、事务与错误码 | 05 |
| 单例 PrismaClient、生产迁移纪律 | 06、07 |

---

## 6. 自检清单

- [x] 7 篇沿依赖链递进，符合「工具级教程」定位（总时长 ~4h，原 12 篇 7.5h）
- [x] 高级特性/生产要点收敛到 07 单篇引子，标注状态并附官方链接
- [x] 版本基线经官方核实（基于 v7/`prisma@prev`；Prisma 8 已 GA——MongoDB 在 v8 原生支持、MySQL/SQLite 尚未跟进，均已标注）
- [x] 面试问答只保留 4 组高频，三角对比只在 01
- [x] 学习路径图 Mermaid、命名 `XX-模块名.md` 符合仓库规范
