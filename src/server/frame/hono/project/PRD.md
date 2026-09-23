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
| FR-11 | 集成测试 | `bun test` + `app.request()`；2xx 与 4xx 全覆盖（含非法流转 422、并发冲突 409）；独立测试库 + 事务回滚隔离 | P0 | §6 |
| FR-12 | 中间件组装 | 按 §7.5 顺序模板组装入口：onError → requestContext → secureHeaders → cors → csrf → bodyLimit → rateLimit → 路由 | P0 | §7.5 |
| FR-13 | 部署 | 多阶段 Dockerfile（generate → build）；compose 起 app+db+redis（环境变量齐、过 fail-fast）；CI：lint→test→build | P2 | §8 |
| FR-14 | 评论与计数 | 评论增/删/查（仅 PUBLISHED 可评）；评论计数随增删在同一事务内维护；删文章级联软删评论 | P0 | 业务增强 |
| FR-15 | 并发与幂等 | 更新走乐观锁（version 条件更新，冲突 409）；状态流转以 `where: { status: from }` 条件更新实现天然幂等；发布 + 计数同事务 | P1 | 业务增强 |
| FR-16 | 软删除 | Post/Comment 带 deletedAt，软删后列表/详情不可见；email 唯一约束与软删用户的冲突处理（部分唯一索引方案，落地时写结论） | P1 | 业务增强 |

## 4. 业务规则与数据模型

### 4.1 文章状态机（表驱动元数据）

| from | 操作 | to | 允许者 | 备注 |
|------|------|----|--------|------|
| DRAFT | submit | PENDING_REVIEW | 作者本人 | — |
| PENDING_REVIEW | approve | PUBLISHED | editor / admin | — |
| PENDING_REVIEW | reject | DRAFT | editor / admin | 驳回原因入审计 |
| PUBLISHED | archive | ARCHIVED | editor / admin 或作者本人 | — |

实现为**元数据表** `transitions: Record<Status, Rule[]>`——与教程「元数据 + 中间件工厂」同款思路，权限判定从「角色字符串」升级为「角色 × 状态 × 操作」。流转统一走条件更新 `where: { id, status: from, deletedAt: null }`：非法流转命中 0 行 → 422，重复提交命中 0 行但语义幂等。

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
