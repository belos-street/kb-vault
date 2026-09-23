# Mini 文章 API — TODO

> 配套需求文档：[README.md](./README.md)（FR 编号、验收清单、陷阱指引都在那里）
> 顺序执行 M0→M5；每完成一项勾一项，M5 全过才算项目完成。
> 每项标注了参考文档章节——**先读参考再动手**，陷阱指引（README §10）动工前通读一遍。

## M0 初始化（半天内）✅

- [x] `pnpm dlx @nestjs/cli@latest new <项目名> --package-manager pnpm` 创建项目，交互选 **ESM**（CLI 需 Node 22.22.3+，12 篇基线；实测 Node 24.9 可跑）
- [x] 换 Fastify adapter：`pnpm add @nestjs/platform-fastify`，main.ts 改 `NestFactory.create<NestFastifyApplication>`（doc/01 §6）
- [x] docker 起 Postgres：本机 5432/5433 已被其他容器占用，实测用 **5434**：`docker run -d --name mini-pg -e POSTGRES_PASSWORD=postgres -p 5434:5432 postgres:17`
- [x] `git init` + `.gitignore`（node_modules / .env / dist；CLI 模板已自带并含 .env）
- [x] 模板已自带 oxlint（v12 ESM 默认），补装 oxfmt 并配置单引号无分号 2 空格（对齐仓库规范）
- [x] Prisma 初始化（PostgreSQL）：`pnpm add -D prisma && pnpm add @prisma/client`（**版本须对齐**：CLI 与 client 都钉 7.10，`pnpm add -D prisma` 默认拉 8.0.0-rc）；⚠️ **Prisma 7**：schema 的 `datasource` 不写 `url`，连接配置在根目录 `prisma.config.ts`，client 构造传 `@prisma/adapter-pg` adapter（doc/08 §1 已同步）；`.env` 写 `DATABASE_URL`（端口 5434）。⚠️ pnpm 11 不再读 package.json 的 `pnpm` 字段，构建脚本批准写在 **`pnpm-workspace.yaml` 的 `allowBuilds`**（`'@prisma/engines': true` 等），否则引擎缺失 migrate 会挂
- [x] `config/env.schema.ts`：Zod 校验 `DATABASE_URL` / `JWT_SECRET`(≥32)，`ConfigModule.forRoot({ validationSchema })` + `isGlobal`（doc/06 §1）
- [x] **验证点**：删掉 `.env` 里的 `DATABASE_URL` 启动 → 必须拒启且报错可读（✅ 实测：报错精确指明缺 DATABASE_URL 与 JWT_SECRET）；正常启动 curl 200 ✅

## M1 数据层（对应 08 篇）✅（实现教程见 [docs/01-M1-数据层.md](./docs/01-M1-数据层.md)）

- [x] schema 四表补齐：User / Session / Post / AuditLog（README §5，含 Role enum 与索引；User 补 `sessions[]` 反向关系——Prisma 关系必须双向）
- [x] `pnpm prisma migrate dev --name init`（✅ 迁移 `20260923021527_init` 已应用，SQL 入库可 review）
- [x] `PrismaService extends PrismaClient` + `onModuleInit` 连库 / `onModuleDestroy` 断开（doc/08 §1 v7 范式：构造传 `PrismaPg` adapter + ConfigService 注入）
- [x] PrismaModule 注册 `@Global()`（doc/03 §4 基础设施例外条款）
- [x] `PostRepository`：create / findById（过滤 deletedAt）/ list（cursor + keyword 模糊过滤）/ softDelete，Service 不直接摸 PrismaClient（构造参数类型为 `PrismaService`——DI 按类引用精确匹配 token，写父类会解析失败，见 M2 陷阱 #8）
- [x] **验证点（关键）**：`pnpm exec tsx scripts/verify-cursor.ts` → 25 条数据翻三页 **pages=3 collected=25 unique=25 PASS**（⚠️ `take+1` 探头未配 `skip:1`，行数守恒达成；脚本留作回归工具，12 篇后收编为 spec）

## M2 横切层（对应 05/06 篇）✅（实现教程见 [docs/02-M2-横切层.md](./docs/02-M2-横切层.md)）

- [x] `BizException`：`constructor(readonly code, message, status)` —— code 必须挂实例属性（⚠️ README 陷阱 #3）
- [x] `GlobalExceptionFilter`：BizException 透传 → 无 errorCode 的 400 归 `VALIDATION_ERROR` → 未知异常脱敏 `INTERNAL_ERROR`(500)（doc/05 §2.1）
- [x] `TransformInterceptor`：`{ code, data, message }` 包装（`map`）
- [x] `TimingInterceptor`：`tap` 计算耗时
- [x] AuditInterceptor：POST/PATCH/DELETE 自动记「谁在何时对什么做了什么」（直接落 AuditLog，fire-and-forget）；**排除 `/api/auth` 前缀**（README FR-3）
- [x] main.ts 注册 `useGlobalPipes(new StandardSchemaValidationPipe())`（来源 `@nestjs/common`，Tier 1 纠正过导入位置）+ `setGlobalPrefix('api')`；app.module 用 `APP_FILTER` / `APP_INTERCEPTOR` 注册全局
- [x] **验证点**：curl 5/5 —— 成功三字段统一 ✅ / `new Error` → 500 `INTERNAL_ERROR` ✅ / BizException → 404 `POST_NOT_FOUND` ✅ / 非法 body → 400 `VALIDATION_ERROR` ✅ / 合法 body 回显 ✅
- [x] 附加：README 陷阱 #8（构造参数 token 必须值导入 + 父类类型 ≠ 可注入 token，M2 启动实测炸出）

## M3 认证（对应 07 篇，本项目最难点）

- [ ] bcrypt 装包 + `register`（email 唯一冲突 → `EMAIL_TAKEN` 409）
- [ ] `JwtStrategy` + `AuthService.issueTokens`：access 15m / refresh 30d，refresh jti 入 Session（带 family）
- [ ] `login` / `refresh` / `logout` 四接口；`refresh` 实现**轮换 + 重放检测**（旧 jti 已吊销/不存在 → revokeFamily + `TOKEN_REUSED`，参考 doc/07 §3 正确版代码）
- [ ] `@Public()` 装饰器 + `JwtAuthGuard extends AuthGuard('jwt')` 反射豁免（doc/07 §4）
- [ ] **全局 Guard 顺序**：APP_GUARD 数组 Jwt → Roles（⚠️ README 陷阱 #2，别把 AuthGuard 留在路由级）
- [ ] `@Roles()` + `RolesGuard`（`getAllAndOverride` 读方法/控制器级声明）
- [ ] **验证点**：同一 refresh 二次使用 → 401 `TOKEN_REUSED` 且全家族失效；未登录 401；普通用户 DELETE 403

## M4 文章业务（对应 04 篇）

- [ ] `post.schema.ts`：create / update（`.partial()`）/ 分页查询（`z.coerce.number()` + 上限）
- [ ] 路由五接口挂 schema（`@Body({ schema })` / `@Query({ schema })`），Controller 只编排
- [ ] 删除接口：`@Roles('admin')` + Service 事务（软删除 + auditLog 原子）+ `POST_NOT_FOUND`
- [ ] 标题模糊过滤进 list 查询
- [ ] **验证点**：非法 body → 400 `VALIDATION_ERROR`；删除后 list/detail 均不可见；auditLog 有记录

## M5 文档与总验收（对应 13 篇 + README §9）

- [ ] Swagger：`DocumentBuilder().addBearerAuth()` + `SwaggerModule.setup('docs')` + 认证路由 `@ApiBearerAuth()`（doc/13）
- [ ] `setGlobalPrefix('api')`
- [ ] 跑完 README §9 验收清单**全部 11 项**，逐项勾掉
- [ ] 写 200 字复盘：与 Hono 实战 B 对照，两边各靠什么实现横切（「机制 vs 自觉」，doc/09 §6 Q1）
- [ ] `app.factory.ts` 抽装配工厂（为 12 篇 E2E 预留）——收尾时做
- [ ] 最终 commit（分原子提交：M0/M1/M2/M3/M4/M5 各一批或按语义合并）

## 完成后

- [ ] 学完 10 篇 → 回补欢迎邮件 + Outbox（README 附录 A）
- [ ] 学完 11 篇 → 回补可观测三件套
- [ ] 学完 12 篇 → 回补测试 + CI（本项目就是现成素材）
