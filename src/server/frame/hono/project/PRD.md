# 实战B：企业级 REST API —— 需求文档（PRD）

> 源教程：[10-实战B-企业级REST-API.md](../doc/10-实战B-企业级REST-API.md) ｜ 配套计划：[TODO.md](./TODO.md) ｜ 状态：待开发
> 项目位置：本目录（与主仓库一体化，不设独立 git 仓库）

---

## 1. 目标与定位

把 10 篇教程落成**可运行的代码**：一个博客域（用户 + 文章 + 评论）的企业级 REST API，具备认证、权限、文档、测试与生产加固全套工程能力。

> **业务深度说明**：教程示例用 `published` 布尔做演示，保持精简不动；本项目在教程之上做**业务规则增强**——状态机、评论计数、乐观锁、软删除，让事务/幂等/权限这些企业级技术点有真实触发场景。代码与教程示例的差异以本 PRD 为准。

**成功定义**：教程第 9 节验收清单逐项打勾 + `bun test` 全绿 + `docker compose up` 一键起全栈。

## 2. 技术栈

| 层面 | 选型 | 说明 |
|------|------|------|
| 运行时 / 包管理 | Bun | `bun run dev` / `bun test` |
| 语言 | TypeScript strict + ESM | Prisma 7 要求 `type: module` |
| 框架 | Hono ≥ 4.13 | 安全基线见大纲「版本与安全基线」 |
| ORM | Prisma 7 + `@prisma/adapter-pg` | Rust-free、driver adapter、`prisma.config.ts` |
| 数据库 | PostgreSQL 17 | compose 起 |
| 缓存 / 限流 | Redis 7 + ioredis | cache-aside + INCR 限流 |
| 校验 | Zod | env / 请求体 / OpenAPI 三处同源 |
| 文档 | @hono/zod-openapi + Scalar | `/doc` + `/ui` |
| 日志 | pino | JSON 结构化 + 请求 ID |
| 风格工具链 | oxlint / oxfmt | agents.md §5.6 参考配置 |

### 2.1 分层约定

| 层 | 职责 | 禁止 |
|----|------|------|
| `routes/` | HTTP 编排：解析、校验、调业务、响应信封 | 不写业务规则、不直接拼 ORM 查询 |
| `domain/` | 纯业务规则（状态机判定、权限矩阵），纯函数不碰 DB，可独立单测 | 不 import db/redis/env |
| `services/` | 碰 DB 的事务编排（评论计数、乐观锁更新、级联软删、流转+审计同事务） | 不解析 HTTP 输入 |
| `middleware/` `lib/` `schemas/` | 横切关注（认证/日志/限流）、基础设施（db/env/redis）、校验 Schema | — |

> 不引入 MVC 术语：REST API 无 View，handler/middleware 是 Hono 生态惯例；本表只回答「哪层放什么」，防止逻辑全堆进 route handler。

## 3. 功能需求（FR）

优先级：P0 = 无它不算完成；P1 = 生产加固必做；P2 = 可后置。

| 编号 | 需求 | 验收要点 | 优先级 | 教程 |
|------|------|----------|:---:|------|
| FR-1 | 认证 | 注册/登录/刷新/登出；JWT 双 token 轮换 + httpOnly Cookie（httpOnly+secure+sameSite）；密码 `Bun.password`（argon2id） | P0 | §3 |
| FR-2 | RBAC | `requireRole()` 中间件工厂做角色级把关；越权操作得 403 | P0 | §3 |
| FR-3 | 文章 CRUD + 状态机 | CRUD 分页/过滤/排序；状态流转（提交/审核/驳回/归档）按「角色 × 状态 × 操作」判定，非法流转 422；表驱动状态机元数据（呼应教程「元数据 + 中间件工厂」） | P0 | §2/§5 + 增强 |
| FR-4 | 统一响应与错误 | 信封：成功 `{ code:'OK', data }`、失败 `{ code, message, details? }`；onError 全局兜底；zValidator hook 转校验错误 | P0 | §4 |
| FR-5 | 配置校验 | Zod 校验 env（DATABASE_URL/JWT_SECRET/REDIS_URL），缺项启动即崩并指出缺哪项 | P0 | §7.2 |
| FR-6 | 可观测 | `X-Request-ID` 中间件 + pino 结构化访问/错误日志；敏感操作与状态流转（who/from/to/result）写审计 | P1 | §7.1 |
| FR-7 | 缓存 | 公开列表 Cache-Control + etag；热点读 Redis cache-aside；文章更新/评论增删触发缓存失效（先更库再删缓存；SCAN 禁 KEYS） | P1 | §7.3 |
| FR-8 | 限流 | Redis `INCR + EXPIRE`（IP + 路由维度）；登录接口更严阈值；超限 429 | P1 | §7.4 |
| FR-9 | 健康与停机 | `/healthz`（liveness）+ `/readyz`（`SELECT 1`）；SIGTERM → `server.stop()` 等在途请求 → `$disconnect` | P1 | §7.6 |
| FR-10 | OpenAPI 文档 | `createRoute` 三同源（校验/类型/文档）；`/doc` JSON + `/ui` Scalar 可调试 | P0 | §5 |
| FR-11 | 集成测试 | `bun test` + `app.request()`；2xx 与 4xx 全覆盖（含非法流转 422、并发冲突 409、幂等重放 200）；独立测试库，套件间 TRUNCATE 重置（外层事务回滚与 Prisma 连接池模型冲突，不可用） | P0 | §6 |
| FR-12 | 中间件组装 | 按 §7.5 顺序模板组装入口：onError → requestContext → secureHeaders → cors → csrf → bodyLimit → rateLimit → 路由 | P0 | §7.5 |
| FR-13 | 部署 | 多阶段 Dockerfile（generate → build）；compose 起 app+db+redis（环境变量齐、过 fail-fast）；CI：lint→test→build | P2 | §8 |
| FR-14 | 评论与计数 | 评论增/删/查（仅 PUBLISHED 可评）；评论计数随增删在同一事务内维护；删文章级联软删评论 | P0 | 业务增强 |
| FR-15 | 并发与幂等 | 更新走乐观锁（version 条件更新，冲突 409）；流转 0 行判定规则见 §4.1；流转更新与审计写入同事务 | P1 | 业务增强 |
| FR-16 | 软删除 | Post/Comment 带 deletedAt，软删后列表/详情不可见；本版 User 不软删（email 唯一约束无冲突），决策点：未来若引入用户软删用部分唯一索引（Prisma 7.4+ `partialIndexes` preview / Prisma 8 GA） | P1 | 业务增强 |
| FR-17 | 角色管理 | 仅 admin 可 `PATCH /users/:id/role`；禁止改自己；写审计（CHANGE_ROLE）——RBAC 闭环 | P2 | 业务增强 |
| FR-18 | Refresh 吊销 | RefreshToken 表（轮换 + 服务端吊销）：登出/刷新时校验，泄露可撤销。**P1（review 提级）**：无吊销则登出后旧 refresh 仍有效 7 天，属被动安全缺口而非功能缺失 | P1 | 业务增强 |

## 4. 业务规则与数据模型

### 4.1 文章状态机（表驱动元数据）

| from | 操作 | to | 允许者 | 备注 |
|------|------|----|--------|------|
| DRAFT | submit | PENDING_REVIEW | 作者本人 | — |
| PENDING_REVIEW | approve | PUBLISHED | editor / admin | — |
| PENDING_REVIEW | reject | DRAFT | editor / admin | 驳回原因入审计 |
| PUBLISHED | archive | ARCHIVED | editor / admin 或作者本人 | — |

实现为**元数据表** `transitions: Record<Status, Rule[]>`——与教程「元数据 + 中间件工厂」同款思路，权限判定从「角色字符串」升级为「角色 × 状态 × 操作」。流转统一走条件更新 `where: { id, status: from, deletedAt: null }`。

**0 行判定规则**：条件更新命中 0 行 → 回查当前状态——已是目标态 → 幂等成功（200 返回当前资源）；否则 → 422 非法流转。（这条区分「重复提交」与「真正非法」，否则两者都是 0 行无法判定）

### 4.1.1 列表/详情可见性矩阵

| 访问者 | 可见范围 |
|--------|----------|
| 匿名 | 仅 `PUBLISHED` 且未软删 |
| 登录（他人资源） | `PUBLISHED` + 自己的全部状态文章 |
| 登录（自己资源） | 任意状态（含自己的 DRAFT / PENDING_REVIEW / ARCHIVED） |
| editor / admin | 任意状态任意作者（待审队列 = 列表按 `PENDING_REVIEW` 过滤） |

详情对不可见资源返回 **404**（不泄露存在性）；列表按矩阵过滤。

### 4.1.2 编辑与删除权限

| 操作 | 允许者 |
|------|--------|
| 创建（生成 DRAFT） | 任意登录用户 |
| 编辑内容 | 作者本人：DRAFT / PENDING_REVIEW / PUBLISHED 可编辑（PUBLISHED 修改直接生效并记审计），ARCHIVED 不可编辑；editor / admin：任意状态 |
| 删除（软删） | 作者删自己的；editor / admin 删任意 |

### 4.2 Prisma 模型

```prisma
enum PostStatus {
  DRAFT
  PENDING_REVIEW
  PUBLISHED
  ARCHIVED
}

model User {
  id           String    @id @default(uuid())
  email        String    @unique
  passwordHash String
  role         String    @default("reader") // reader | editor | admin
  posts        Post[]
  comments     Comment[]
  createdAt    DateTime  @default(now())
}

model Post {
  id          Int        @id @default(autoincrement())
  title       String
  content     String     @default("")
  status      PostStatus @default(DRAFT)
  version     Int        @default(1) // 乐观锁：条件更新 + 递增
  commentCount Int       @default(0) // 与评论增删同事务维护（FR-14）
  deletedAt   DateTime?
  author      User       @relation(fields: [authorId], references: [id])
  authorId    String
  comments    Comment[]
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt

  @@index([status, deletedAt])
  @@index([authorId, status])
}

model Comment {
  id        Int       @id @default(autoincrement())
  content   String
  post      Post      @relation(fields: [postId], references: [id])
  postId    Int
  author    User      @relation(fields: [authorId], references: [id])
  authorId  String
  deletedAt DateTime?
  createdAt DateTime  @default(now())

  @@index([postId, deletedAt])
}

// FR-6 审计：敏感操作 + 状态流转
model AuditLog {
  id        Int      @id @default(autoincrement())
  userId    String
  action    String   // DELETE_POST / CHANGE_ROLE / POST_TRANSITION
  resource  String
  detail    String?  // 流转：from → to；驳回原因等
  result    String   // OK / DENIED
  createdAt DateTime @default(now())
}
```

## 5. 环境变量

| 变量 | 约束 | 来源 |
|------|------|------|
| `DATABASE_URL` | 必填 | 本地 compose / CI 测试库 |
| `JWT_SECRET` | ≥ 32 字节 | 本地 `.env`（不入库） |
| `REDIS_URL` | 必填 | compose `redis://redis:6379` |
| `PORT` | 默认 3000 | 可选 |

## 6. 非功能需求（NFR）

- **安全**：Cookie 三件套；密码/ token 不落日志；secureHeaders + bodyLimit 1MB；Cookie 认证场景挂 csrf
- **质量节奏**：先单测通过再提 PR；提交前钩子过 tsc + oxlint + oxfmt；原子提交、按里程碑批量写 commit message
- **一致性**：全站响应信封唯一；错误码与 06 篇分层一致
- **工程**：ESM（`type: module`）；Prisma 生成物 `src/generated/prisma` 进源码树（gitignore 视团队约定，教程按源码树管理）

## 7. 里程碑总览

M0 脚手架 → M1 数据层 → M2 响应/错误/配置 → M3 可观测/Redis → M4 认证+RBAC → M5 文章 CRUD+状态机+OpenAPI → M6 评论与并发控制 → M7 生产加固 → M8 测试与验收 → M9 部署。任务分解见 [TODO.md](./TODO.md)。

## 8. 范围外（Out of Scope）

邮件验证、文件上传、WebSocket、定时任务、前端页面、多实例部署调优、i18n、MongoDB（Prisma 7 暂不支持）。
