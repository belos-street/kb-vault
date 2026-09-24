# 实战B 开发 TODO

> 配套：[PRD.md](./PRD.md) ｜ 教程：[10-实战B-企业级REST-API.md](../doc/10-实战B-企业级REST-API.md)
>
> **节奏约定**：每个 M 完成 → `bunx tsc --noEmit` + oxlint + oxfmt + `bun test` 全绿 → 按任务原子提交（feat/fix/docs/chore）；先单测通过再提 PR。

---

## M0 脚手架（P0）✅

- [x] `bun init`：`package.json` 确认 `type: module`（Prisma 7 ESM 要求）
- [x] `tsconfig.json`：`strict` + `module: ESNext` + `moduleResolution: bundler`（+ `types: ["bun"]`，TS7 需显式）
- [x] 装依赖：`hono`、`@prisma/client@7`、`@prisma/adapter-pg`、`zod`、`@hono/zod-openapi`、`@scalar/hono-api-reference`、`pino`、`ioredis`；dev：`prisma@7`、`oxlint`、`oxfmt`（配置复制 agents.md §5.6 参考）
- [x] 目录骨架：`src/{routes,middleware,lib,schemas,domain,tests}` + `prisma/`（domain 放状态机等纯业务规则）
- [x] `lib/env.ts`：Zod 校验 env（DATABASE_URL/JWT_SECRET/REDIS_URL，缺项启动即崩）——从 M2 提前，M1 的 db.ts 依赖它
- [x] `index.ts` 挂 `/healthz` 占位 + `bun run dev` 跑通

## M1 数据层（P0 ｜ FR-3 数据底座 ｜ 教程 §2）✅

- [x] `prisma/schema.prisma`：`generator client { provider = "prisma-client", output = "../src/generated/prisma" }` + `datasource db { provider = "postgresql" }`（不写 url）
- [x] 模型：User / Post（status enum、version、commentCount、deletedAt、复合索引）/ Comment / AuditLog（对齐 PRD §4.2）
- [x] `prisma.config.ts`：`datasource.url = env('DATABASE_URL')` + migrations path（需 `import 'dotenv/config'`——Prisma CLI 沙箱不走 Bun 的 .env 自动加载）
- [x] `bunx prisma migrate dev --name init` + seed（admin ×1、editor ×1、reader ×2，便于审核流测试）；本地容器 hono-blog-pg(:5435) / hono-blog-redis(:6379)
- [x] `lib/db.ts`：`PrismaPg({ connectionString: env.DATABASE_URL })` → `new PrismaClient({ adapter })`
- [x] DoD：findMany / create / `$transaction` 各跑通一次（含回滚自清理）

## M2 统一响应与错误（P0 ｜ FR-4 ｜ 教程 §4 + 06 篇）✅

- [x] `lib/errors.ts`：业务异常分层（UNAUTHORIZED / FORBIDDEN / NOT_FOUND / **CONFLICT 409** / **UNPROCESSABLE 422** / RATE_LIMITED / INTERNAL，继承 HTTPException）
- [x] `lib/response.ts`：`ok()` / `fail()`（ok 带重载：status 字面量推断保住 OpenAPI 类型对齐）
- [x] `app.onError` + `app.notFound` 接入；defaultHook（zValidator hook）→ `VALIDATION_ERROR`
- [x] 测试：错误路径冒烟（404 信封；缺字段 400 / 无 token 401 在 M4/M5 测试覆盖）

## M3 可观测与 Redis 接线（P0/P1 ｜ FR-6 ｜ 教程 §7.1）✅

- [x] `middleware/observability.ts`：`X-Request-ID`（透传或生成）+ pino 访问日志（requestId/method/path/status/durationMs）
- [x] onError 内错误日志带 requestId + 堆栈
- [x] `lib/redis.ts`：ioredis 客户端（连接走 `env.REDIS_URL`）

## M4 认证与 RBAC（P0 ｜ FR-1/FR-2 ｜ 教程 §3）✅

- [x] `schemas/auth.ts`：register / login 的 Zod Schema
- [x] `routes/auth.ts`（**OpenAPIHono + createRoute 三同源**）：注册（argon2id 哈希）/ 登录（双 token + Cookie 三件套）/ `/refresh` 轮换 / 登出（清 Cookie）+ `/me`
- [x] `middleware/auth.ts`：`requireAuth` + `requireRole(...roles)` 工厂 + `optionalAuth` / `requireUser`（公开接口可见性矩阵用）
- [x] `tests/auth.test.ts`：注册成功 / 重复邮箱 409 / 密码错误 401 / 无 token 401 / 越权 403（在 posts 测试覆盖）
- [ ] （P2 ｜ FR-17）`PATCH /users/:id/role`：仅 admin、禁止改自己、写审计

## M5 文章 CRUD + 状态机 + OpenAPI（P0 ｜ FR-3/10/11 ｜ 教程 §5/§6）✅

- [x] `domain/post-transitions.ts`：状态机元数据表 + `actionOrigin`（动作源状态）+ 纯函数 `canTransition`（不碰 DB，单测友好）
- [x] `schemas/posts.ts`：create / update（带 version）/ 状态流转（action + 驳回原因）/ 分页查询
- [x] `services/posts.ts`：listPosts / getVisiblePost / createPost / updatePost / transitionPost / softDeletePost（routes 只做 HTTP 编排，对齐 PRD §2.1 分层）
- [x] `routes/posts.ts`：`createRoute`（201/400/401/403/404/409/422 全声明），CRUD + 分页 / status / author 过滤 / 排序
- [x] 流转接口：条件更新 `where: { id, status: from, deletedAt: null }`；**0 行 → 回查当前状态**（已为目标态 → 200 幂等；否则 422）；流转更新与审计同事务（含 DENIED 审计）
- [x] 删除 = 软删 + 级联软删评论 + 审计（同事务）；列表/详情统一过滤 `deletedAt: null`
- [x] 可见性矩阵 + 编辑权限落地：匿名仅 PUBLISHED、不可见详情 404、ARCHIVED 不可编辑
- [x] 乐观锁：update 走 `updateMany({ where: { id, version } })` + `version: { increment: 1 }`，0 行 → 409
- [x] `tests/posts.test.ts`：CRUD 2xx/4xx + 幂等重放 + 非法流转 422 + 越权 403 + 软删后不可见
- [x] `domain/post-transitions.test.ts`：纯函数单测（表驱动用例覆盖全流转矩阵）
- [x] `/api/doc`（OpenAPI 3.0.0，8 条路径）+ `/ui`（Scalar）可访问（FR-10）

## M6 评论、并发与 Refresh 吊销（P0/P1 ｜ FR-14/15/16/18）

- [ ] （P1 ｜ FR-18 提前，review 定级）RefreshToken 表：登录写行、刷新轮换替换旧行、登出/被盗删行吊销——「登出后旧 refresh 仍有效 7 天」是被动安全缺口，先于评论做
- [ ] `schemas/comments.ts` + `routes/comments.ts`：仅 `PUBLISHED` 文章可评；删评论 = 作者本人或 editor/admin（软删）
- [ ] 评论增删与 `commentCount` 维护放同一 `$transaction`；删文章级联软删其评论
- [ ] 决策记录（ADR 注释）：本版 User 不软删，email 唯一约束无冲突；未来引入用户软删 → Prisma 7.4+ `partialIndexes`（`@@unique([email], where: ...)`）
- [ ] `tests/comments.test.ts`：计数一致性（增删后 count 对账）、非公开文章评论 422；`tests/concurrency.test.ts`：并发双写命中 409

## M7 生产加固（P1 ｜ FR-6/7/8/9/12 ｜ 教程 §7.3~7.6）

- [ ] 缓存：公开列表 `Cache-Control` + `hono/etag`；热点读 Redis cache-aside；**失效**：文章更新/状态流转/评论增删 → `DEL` 对应缓存 key
- [ ] 限流：Redis `INCR + EXPIRE`（IP + 路由）；`/login` 更严阈值；超限 429
- [ ] `/readyz`（`SELECT 1`）+ SIGTERM：`server.stop()` → `prisma.$disconnect()` → redis quit
- [ ] `index.ts` 按 §7.5 顺序组装全部中间件
- [ ] doc/ui 环境门禁：生产设 `ENABLE_DOCS=false` 不上线 `/api/doc` 与 `/ui`（代码已实现于 index.ts，部署时配置）
- [ ] 敏感操作（删除/改角色/流转驳回）审计收尾

## M8 测试与验收（P0 ｜ FR-11）

- [ ] 测试隔离：独立 `DATABASE_URL_TEST`；套件间 TRUNCATE 重置（外层事务回滚与 Prisma 连接池模型冲突，不可用）；测试用 Redis（本地实例或独立 DB 下标）——限流中间件测试需要
- [ ] 全量 `bun test` 全绿：2xx + 4xx 双路径，覆盖 409/422、流转矩阵、计数一致性
- [ ] 教程第 9 节验收清单逐项打勾（含 fail-fast：清空 JWT_SECRET 启动报错退出）

## M9 部署（P2 ｜ FR-13 ｜ 教程 §8）

- [ ] `Dockerfile` 多阶段：build 阶段 `bunx prisma generate` → `bun build`；运行镜像 COPY dist + prisma/ + prisma.config.ts + node_modules（prisma CLI 移入 dependencies）
- [ ] `docker-compose.yml`：app + db(postgres:17) + redis:7-alpine，环境变量齐（过 fail-fast）；启动前置迁移 `command: sh -c "bunx prisma migrate deploy && bun dist/index.js"`（教程 §8 原样）
- [ ] `docker compose up` → 验收清单第 1、8 项实测；`docker compose stop` 验证优雅停机
- [ ] `.github/workflows/ci.yml`：lint → test → docker build

---

## 完成定义（全局 DoD）

1. 教程 §9 验收清单 8 项全部打勾
2. `bunx tsc --noEmit` / oxlint / oxfmt / `bun test` 四项全绿
3. PRD 无未实现的 P0/P1 条目（P2 允许缓一期）
