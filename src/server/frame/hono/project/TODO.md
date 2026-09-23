# 实战B 开发 TODO

> 配套：[PRD.md](./PRD.md) ｜ 教程：[10-实战B-企业级REST-API.md](../doc/10-实战B-企业级REST-API.md)
>
> **节奏约定**：每个 M 完成 → `bunx tsc --noEmit` + oxlint + oxfmt + `bun test` 全绿 → 按任务原子提交（feat/fix/docs/chore）；先单测通过再提 PR。

---

## M0 脚手架（P0）

- [ ] `bun init`：`package.json` 确认 `type: module`（Prisma 7 ESM 要求）
- [ ] `tsconfig.json`：`strict` + `module: ESNext` + `moduleResolution: bundler`
- [ ] 装依赖：`hono`、`@prisma/client@7`、`@prisma/adapter-pg`、`zod`、`@hono/zod-openapi`、`@scalar/hono-api-reference`、`pino`、`ioredis`；dev：`prisma@7`、`oxlint`、`oxfmt`（配置复制 agents.md §5.6 参考）
- [ ] 目录骨架：`src/{routes,middleware,lib,schemas,domain,tests}` + `prisma/`（domain 放状态机等纯业务规则）
- [ ] `index.ts` 挂 `/healthz` 占位 + `bun run dev` 跑通

## M1 数据层（P0 ｜ FR-3 数据底座 ｜ 教程 §2）

- [ ] `prisma/schema.prisma`：`generator client { provider = "prisma-client", output = "../src/generated/prisma" }` + `datasource db { provider = "postgresql" }`（不写 url）
- [ ] 模型：User / Post（status enum、version、commentCount、deletedAt、复合索引）/ Comment / AuditLog（对齐 PRD §4.2）
- [ ] `prisma.config.ts`：`datasource.url = env('DATABASE_URL')` + migrations path
- [ ] `bunx prisma migrate dev --name init` + seed（admin ×1、editor ×1、reader ×2，便于审核流测试）
- [ ] `lib/db.ts`：`PrismaPg({ connectionString: env.DATABASE_URL })` → `new PrismaClient({ adapter })`
- [ ] DoD：findMany / create / `$transaction` 各跑通一次

## M2 统一响应、错误与配置（P0 ｜ FR-4/FR-5 ｜ 教程 §4/§7.2）

- [ ] `lib/env.ts`：Zod 校验 env，缺项启动即崩（JWT_SECRET min 32）
- [ ] `lib/errors.ts`：业务异常分层（UNAUTHORIZED / FORBIDDEN / NOT_FOUND / **CONFLICT 409** / **UNPROCESSABLE 422** / RATE_LIMITED / INTERNAL，继承 HTTPException）
- [ ] `lib/response.ts`：`ok()` / `fail()`
- [ ] `app.onError` + `app.notFound` 接入；`zValidator` hook → `VALIDATION_ERROR`
- [ ] 测试：错误路径冒烟（缺字段 → 400 信封；无 token → 401 信封）

## M3 可观测与 Redis 接线（P0/P1 ｜ FR-6 ｜ 教程 §7.1）

- [ ] `middleware/observability.ts`：`X-Request-ID`（透传或生成）+ pino 访问日志（requestId/method/path/status/durationMs）
- [ ] onError 内错误日志带 requestId + 堆栈
- [ ] `lib/redis.ts`：ioredis 客户端（连接走 `env.REDIS_URL`）

## M4 认证与 RBAC（P0 ｜ FR-1/FR-2 ｜ 教程 §3）

- [ ] `schemas/auth.ts`：register / login 的 Zod Schema
- [ ] `routes/auth.ts`：注册（argon2id 哈希）/ 登录（双 token + Cookie 三件套）/ `/refresh` 轮换 / 登出（清 Cookie）
- [ ] `middleware/auth.ts`：`requireAuth`（Cookie → verify → `c.set('user')`）+ `requireRole(...roles)` 工厂
- [ ] `tests/auth.test.ts`：注册成功 / 重复邮箱 / 登录错误密码 401 / 无 token 401 / 越权 403

## M5 文章 CRUD + 状态机 + OpenAPI（P0 ｜ FR-3/10/11 ｜ 教程 §5/§6）

- [ ] `domain/post-transitions.ts`：状态机元数据表 `transitions` + 纯函数 `canTransition(role, userId, post, action)`（**不碰 DB，单测友好**）
- [ ] `schemas/posts.ts`：create / update（带 version）/ 状态流转（action + 驳回原因）
- [ ] `routes/posts.ts`：`OpenAPIHono` + `createRoute`（201/400/403/409/422 全声明），CRUD + 分页 / status / author 过滤 / 排序
- [ ] 流转接口：条件更新 `where: { id, status: from, deletedAt: null }`，0 行 → 422；流转写 AuditLog（who/from/to/result）
- [ ] 删除 = 软删 `deletedAt`（作者删自己的、editor/admin 删任意）；列表/详情统一过滤 `deletedAt: null`
- [ ] `tests/posts.test.ts`：CRUD 2xx/4xx + 合法/非法流转 + 越权 + 软删后不可见
- [ ] `domain/post-transitions.test.ts`：纯函数单测（表驱动用例覆盖全流转矩阵）

## M6 评论与并发控制（P0/P1 ｜ FR-14/15/16）

- [ ] `schemas/comments.ts` + `routes/comments.ts`：仅 `PUBLISHED` 文章可评；删评论 = 作者本人或 editor/admin（软删）
- [ ] 评论增删与 `commentCount` 维护放同一 `$transaction`；删文章级联软删其评论
- [ ] 乐观锁：文章 update 走 `updateMany({ where: { id, version } })` + `version: { increment: 1 }`，0 行 → 409（提示刷新重试）
- [ ] email 唯一约束 × 软删用户：落地前写结论（恢复激活 vs 部分唯一索引），记入 PRD §4 或 ADR 注释
- [ ] `tests/comments.test.ts`：计数一致性（增删后 count 对账）、非公开文章评论 422；`tests/concurrency.test.ts`：并发双写命中 409

## M7 生产加固（P1 ｜ FR-6/7/8/9/12 ｜ 教程 §7.3~7.6）

- [ ] 缓存：公开列表 `Cache-Control` + `hono/etag`；热点读 Redis cache-aside；**失效**：文章更新/状态流转/评论增删 → `DEL` 对应缓存 key
- [ ] 限流：Redis `INCR + EXPIRE`（IP + 路由）；`/login` 更严阈值；超限 429
- [ ] `/readyz`（`SELECT 1`）+ SIGTERM：`server.stop()` → `prisma.$disconnect()` → redis quit
- [ ] `index.ts` 按 §7.5 顺序组装全部中间件
- [ ] 敏感操作（删除/改角色/流转驳回）审计收尾

## M8 测试与验收（P0 ｜ FR-11）

- [ ] 测试库隔离：独立 `DATABASE_URL_TEST` + 每套件事务回滚
- [ ] 全量 `bun test` 全绿：2xx + 4xx 双路径，覆盖 409/422、流转矩阵、计数一致性
- [ ] 教程第 9 节验收清单逐项打勾（含 fail-fast：清空 JWT_SECRET 启动报错退出）

## M9 部署（P2 ｜ FR-13 ｜ 教程 §8）

- [ ] `Dockerfile` 多阶段：build 阶段 `bunx prisma generate` → `bun build`；运行镜像 COPY dist + prisma/ + prisma.config.ts + node_modules（prisma CLI 移入 dependencies）
- [ ] `docker-compose.yml`：app + db(postgres:17) + redis:7-alpine，环境变量齐（过 fail-fast）
- [ ] `docker compose up` → 验收清单第 1、8 项实测；`docker compose stop` 验证优雅停机
- [ ] `.github/workflows/ci.yml`：lint → test → docker build

---

## 完成定义（全局 DoD）

1. 教程 §9 验收清单 8 项全部打勾
2. `bunx tsc --noEmit` / oxlint / oxfmt / `bun test` 四项全绿
3. PRD 无未实现的 P0/P1 条目（P2 允许缓一期）
