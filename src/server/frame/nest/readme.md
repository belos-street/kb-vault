# NestJS 学习大纲

面向「企业级后端」的学习路线：以 **NestJS 12**（2026-08 发布）为基线，**不做基础科普**（路由、装饰器语法等一笔带过），火力集中在三块——**IoC/DI 心智模型**、**请求生命周期**、**企业级技术栈集成**。CQRS、微服务、GraphQL 等高级低频特性以简介为主。约 **14 篇**，每天 1~2 小时，**12~15 天完成**。

---

## 🎯 定位

| 项目 | 内容 |
|------|------|
| 目标读者 | 资深前端 / 全栈（熟悉 TS 与至少一个 HTTP 框架），有 Angular/Angular-like DI 心智加分 |
| 前置要求 | TypeScript 熟练（装饰器、反射元数据概念）；用过 Express/Hono 任一框架；了解 HTTP 与 REST 基础；RxJS Observable 基础（冷流、订阅时机——Interceptor 前置，05 篇用到） |
| 学习目标 | 能独立设计并交付企业级 NestJS 服务：模块化架构、认证授权、队列、可观测、测试、部署 |
| 面试目标 | 请求生命周期全链路、DI 原理与作用域、动态模块设计（forRoot/forFeature）、Guard/Pipe/Interceptor/Filter 职责边界、微服务选型 |
| 技术基线 | Node 22 LTS + NestJS 12（ESM）+ Zod（Standard Schema）+ Vitest + oxlint + Fastify adapter + Prisma + PostgreSQL + Redis + Docker |

> 💡 与 Hono 的分工：Agent 后端 / 边缘 / 轻量 API 用 Hono；多团队协作、长周期演进的企业服务用 Nest。两套大纲互补不重叠。

---

## 🏢 企业级技术栈总表

| 能力 | 选型 | 说明 |
|------|------|------|
| 框架 | NestJS 12 | ESM 化、Standard Schema、原生可观测 |
| HTTP Adapter | **Fastify**（性能）/ Express（兼容兜底） | `NestFactory.create(AppModule, { adapter })` |
| 配置 | @nestjs/config + Zod 校验 env | v12 调整了 config validation 选项 |
| 参数校验 | **Zod**（Standard Schema，v12 一等公民） | class-validator 为存量项目兼容路线 |
| ORM | **Prisma**（主推）/ TypeORM / Drizzle | v12 注意第三方 peer 兼容滞后 |
| 数据库 | PostgreSQL + Redis | 企业默认组合 |
| 认证 | @nestjs/passport + @nestjs/jwt | access/refresh 双 token + RBAC |
| 队列 | @nestjs/bullmq | Redis 底座，重试/延迟/速率控制 |
| 定时任务 | @nestjs/schedule | cron / interval / timeout |
| 缓存 | cache-manager + Redis | 多级缓存按需 |
| 日志 | @nestjs/pino | 结构化日志（v12 增强 structured params） |
| 可观测 | **@nestjs/observe**（v12 新）+ OpenTelemetry | 原生 traces/metrics |
| 健康检查 | @nestjs/terminus | liveness/readiness |
| 限流 | @nestjs/throttler | |
| API 文档 | @nestjs/swagger | Zod schema 可直接喂 OpenAPI（v12） |
| 测试 | **Vitest**（v12 新项目默认）/ Jest（存量） | SWC 保留装饰器元数据（esbuild 不行） |
| 构建 | tsc / SWC / Rspack（v12 CLI 新默认） | webpack 已退出 CLI 默认 |
| 部署 | Docker + Node 22 LTS + 优雅关闭 | 生产基线 Node，Bun 兼容性不作生产建议 |

---

## 🗺️ 学习路径图

```mermaid
graph LR
  subgraph L1["认知层"]
    A["01 架构定位与全景"]
  end
  subgraph L2["核心层"]
    B["02 IoC 容器与 DI"] --> C["03 模块系统与动态模块"]
  end
  subgraph L3["应用层"]
    D["04 HTTP 层与请求处理"] --> E["05 过滤器与拦截器"]
    E --> F["06 配置与安全基线"]
    F --> G["07 认证与授权"]
    G --> H["08 数据访问"]
  end
  subgraph L4["工程层"]
    I["09 缓存队列与定时任务"] --> J["10 日志与可观测性"]
    J --> K["11 测试与工程化"]
    K --> L["12 Swagger 与 API 文档"]
    L --> N["13 高级特性速览"]
  end
  subgraph L5["实战层"]
    M["14 实战：企业级单体服务"]
  end
  A --> B
  C --> D
  H --> I
  N --> M
```

---

## 📋 篇目规划总览

| 序号 | 篇名 | 层 | 一句话定位 | 预计 |
|------|------|----|-----------|------|
| 01 | 架构定位与全景 | 认知层 | Nest 解决什么问题、请求生命周期全景 | 0.5 天 |
| 02 | IoC 容器与 DI | 核心层 | 一切的基础：Provider、作用域、循环依赖 | 1 天 |
| 03 | 模块系统与动态模块 | 核心层 | 读懂所有第三方集成的钥匙：forRoot/forFeature | 1 天 |
| 04 | HTTP 层与请求处理 | 应用层 | Middleware + Controller/管道 + Zod 一等公民 | 1.5 天 |
| 05 | 过滤器与拦截器 | 应用层 | 统一错误、响应变换、AOP 横切能力 | 1 天 |
| 06 | 配置与安全基线 | 应用层 | 配置管理、安全头、限流、文件上传 | 0.5 天 |
| 07 | 认证与授权 | 应用层 | Passport/JWT/RBAC 完整链路 | 1 天 |
| 08 | 数据访问 | 应用层 | Prisma 集成与 ORM 选型、事务、分页 | 1 天 |
| 09 | 缓存队列与定时任务 | 工程层 | 异步任务三件套：cache/BullMQ/schedule | 1 天 |
| 10 | 日志与可观测性 | 工程层 | pino + @nestjs/observe + 健康检查 | 1 天 |
| 11 | 测试与工程化 | 工程层 | 单测/E2E、Vitest、构建工具链 | 1 天 |
| 12 | Swagger 与 API 文档 | 工程层 | OpenAPI 自动生成：Zod schema 同源联动 + 鉴权文档化 | 1 天 |
| 13 | 高级特性速览 | 工程层 | 微服务/CQRS/GraphQL/WS——知道何时启用 | 0.5 天 |
| 14 | 实战：企业级单体服务 | 实战层 | 全栈技术点串联交付 | 2~3 天 |

---

## 📚 篇目详解

### 01 架构定位与全景（0.5 天｜认知层）

**面试可答**：Nest 是架构框架（对标 Spring Boot/Angular），在 Express/Fastify 之上提供 DI、模块化与 AOP；Hono 这类库解决 HTTP 层，Nest 解决架构层。

- 库 vs 框架的本质差异（为什么企业级需要架构约束）
- **请求生命周期全景图**：Middleware → Guard → Interceptor(前) → Pipe → Controller → Interceptor(后) → ExceptionFilter（面试高发，全大纲主线）
- Nest 12 亮点速览：ESM 化、Standard Schema、@nestjs/observe、CLI 重建（Rspack/`nest upgrade`）、新项目默认 Vitest + oxlint
- ⚖️ 对比板块：Nest vs Express/Fastify vs Hono vs AdonisJS（选型边界：什么规模上 Nest）
- 不适用场景：边缘部署、轻量 API（→ Hono）
- **参考**：[docs.nestjs.com](https://docs.nestjs.com/)、[v12 Migration Guide](https://docs.nestjs.com/migration-guide)、[GitHub Releases](https://github.com/nestjs/nest/releases)

---

### 02 IoC 容器与 DI（1 天｜核心层）

**面试可答**：Nest 通过装饰器 + `reflect-metadata` 收集类型元数据，容器按 token 解析并缓存实例；DI 让测试时可在模块级替换任意 Provider。

- Provider 与 token：class provider / value / `useFactory` / `useExisting` / `useValue`；异步 Provider
- **三种作用域**：DEFAULT / REQUEST / TRANSIENT——REQUEST 每请求重建实例的性能代价（面试追问高发）
- 循环依赖：`forwardRef` 与设计层面的解法（面试高频）
- `ModuleRef` 运行时解析；全局 Provider
- 可测试性红利：`.overrideProvider()` 模块级换 mock（呼应「关键函数依赖注入可测」原则）
- **练习**：手写一个迷你 IoC 容器（50 行内），理解 metadata 解析流程

---

### 03 模块系统与动态模块（1 天｜核心层）

**面试可答**：动态模块（`forRoot`/`forFeature`/`register`）是 Nest 生态的通用契约——ConfigModule、BullModule 全是这一模式。

- Module 边界：imports/exports/providers 的依赖图管理
- **动态模块三大模式**：`forRoot`（全局单例配置）vs `forFeature`（局部注册）vs `register`（每处独立）——以 ConfigModule / BullModule 为实例源码级拆解
- 模块生命周期钩子：`onModuleInit` / `onModuleDestroy` / `OnApplicationBootstrap` 等（v12 调整了钩子顺序，注意）
- Lazy modules；模块引用与 `ModuleRef` 联动
- **练习**：实现一个自己的 `forRoot/forFeature` 风格动态模块（如 Redis 客户端封装）

---

### 04 HTTP 层与请求处理（1.5 天｜应用层）

**面试可答**：v12 的 `@Body({ schema })` 直接接收 Standard Schema（Zod），配合 `StandardSchemaValidationPipe` 完成校验与类型收窄。

- Controller / DTO / 参数装饰器快速过（不占篇幅）
- **Middleware**（请求链第一环）：class vs functional、模块 `configure(consumer)` 注册、DI 可用但有路由粒度局限——与 Guard 的职责边界（生命周期全景收口，面试必追问）
- **管道**：内置 ValidationPipe（class-validator，存量路线）vs `StandardSchemaValidationPipe`（Zod，主推路线）
- Zod 实战：`@Body({ schema: createUserSchema })` → `StandardSchemaValidationPipe` → 拿到完整类型；schema 复用喂 OpenAPI
- 自定义参数装饰器（`createParamDecorator`）
- 文件上传：`@nestjs/platform-multer`（FileInterceptor）
- **练习**：Zod 校验的完整 CRUD 接口（与 Hono 实战 B 同一套 Schema 风格）

---

### 05 过滤器与拦截器（1 天｜应用层）

**面试可答**：Filter 处理异常统一出口，Interceptor 包裹请求前后实现 AOP（日志/缓存/超时/响应变换）；两者都有全局、控制器、方法三级作用域。

- ExceptionFilter：`HttpException` 体系、自定义业务异常、**v12 machine-readable error codes**、统一错误响应格式
- Interceptor：响应变换（`map`）、超时（`timeout`）、缓存、日志埋点；`StandardSchemaSerializerInterceptor`（v12 出参校验序列化）
- **RxJS 语义要点**：`handle()` 返回冷流——不订阅不执行；`tap` 埋点按订阅次数触发（日志重复/丢失多半错在这里）
- 执行顺序验证实验：写两个 Interceptor + 一个 Filter 打日志验证顺序（面试题实锤）
- 全局 vs 局部注册的差异与坑
- **练习**：统一响应包装 `{ code, data, message }` + 全局异常过滤器 + 耗时日志 Interceptor

---

### 06 配置与安全基线（0.5 天｜应用层）

**面试可答**：@nestjs/config 支持命名空间与 env 校验，v12 调整了 validation 选项；安全基线 = helmet + CORS + throttler。

- @nestjs/config：命名空间配置、Zod 校验环境变量（防脏启动）
- 安全头 helmet、CORS 策略、`@nestjs/throttler` 限流（全局 + 路由级）
- 敏感配置与密钥管理实践（env 分层、secrets 不进库）
- **练习**：带 env 校验的配置模块 + 全局限流

---

### 07 认证与授权（1 天｜应用层）

**面试可答**：Passport 策略封装认证方式，Guard 做授权决策；JWT 双 token + RBAC 是企业默认组合。

- @nestjs/passport：Local / JWT 策略；Passport 生命周期（策略注册 → validate）
- JWT：@nestjs/jwt 签发、access/refresh 双 token、httpOnly Cookie vs Bearer 的取舍
- Guards + RBAC：`@SetMetadata` + 自定义 `RolesGuard` + 自定义装饰器 `@Roles()`
- CASL 进阶简介（属性级权限，了解即可）
- **练习**：注册/登录/刷新/登出 + RolesGuard 的完整认证链路

---

### 08 数据访问（1 天｜应用层）

**面试可答**：Prisma 提供类型安全的 schema-first 数据层；事务用 `prisma.$transaction`；分页用游标或 offset 视场景。

- Prisma 集成：PrismaService（`onModuleInit` 连接）、schema → 迁移流程
- 事务：交互式事务、并发与隔离级别（`@nestjs-cls` 事务传播简介）
- 分页封装（offset vs cursor）、软删除策略
- ⚖️ 对比板块：Prisma vs TypeORM vs Drizzle（类型安全、迁移、生态、Nest 12 peer 兼容现状）
- **练习**：文章模块的 Repository 封装 + 事务 + 分页

---

### 09 缓存队列与定时任务（1 天｜工程层）

**面试可答**：BullMQ 基于 Redis 提供可靠异步任务（重试/延迟/速率/优先级）；进程内任务用 @nestjs/schedule。

- cache-manager + Redis：缓存装饰器式 API、失效策略
- @nestjs/bullmq：队列/Worker/Job 生命周期、重试与退避、延迟任务、速率控制、失败告警
- @nestjs/schedule：cron / interval / 分布式锁问题（多实例部署时任务去重——企业实战高频坑）
- **练习**：邮件发送队列（重试 + 延迟）+ 每日报表 cron

---

### 10 日志与可观测性（1 天｜工程层）

**面试可答**：v12 新增 @nestjs/observe 原生可观测 SDK（traces/metrics）；日志用 pino 结构化输出，链路追踪走 OpenTelemetry。

- @nestjs/pino：结构化日志、请求上下文（request id 贯穿）
- **@nestjs/observe（v12 新）**：原生 traces/metrics 接入；与 OpenTelemetry 导出（OTLP → Grafana/Jaeger）衔接
- @nestjs/terminus：liveness/readiness 探针（K8s 就绪）
- 优雅关闭：`enableShutdownHooks`、连接清理、零停机发布
- **练习**：全链路 request id + OTel traces 接入本地 Grafana 看板

---

### 11 测试与工程化（1 天｜工程层）

**面试可答**：Nest 的 DI 天然可测——`Test.createTestingModule` 换 provider 即可；v12 新项目默认 Vitest。

- 单元测试：`Test.createTestingModule` + `.overrideProvider()` mock；Service 层测试范式
- E2E 测试：supertest 起全量应用，打真实 HTTP
- **Vitest（v12 默认）**：与 Jest 差异、SWC 插件保留装饰器元数据（esbuild 不支持——选型关键）
- 构建工具链：tsc / SWC / Rspack（v12 CLI 默认）；oxlint + oxfmt
- **练习**：为 08/09 篇的模块补单测 + 一条 E2E 流程，覆盖率 > 80%

---

### 12 Swagger 与 API 文档（1 天｜工程层）

**面试可答**：@nestjs/swagger 从 DTO/Zod schema 自动生成 OpenAPI；v12 起 Standard Schema 可直接喂 OpenAPI 生成，校验与文档同源。

- @nestjs/swagger 深入：Zod schema → OpenAPI（v12 联动，与 04 篇校验同源）、装饰器补充、全局前缀与版本化
- 鉴权文档化：Bearer 认证标注、`@ApiTags` 组织、文档驱动联调
- **练习**：给实战项目全量接口生成可访问、可调试的 Swagger 文档

---

### 13 高级特性速览（0.5 天｜工程层，简介级）

**一句话定位**：知道有这些东西、知道何时启用——需要时再回来查，不在主线展开。

**面试可答**：微服务 transport 选型取决于一致性与吞吐需求；CQRS 适合读写分离的复杂域——普通 CRUD 场景是过度设计。

- 微服务 transports：Redis / Kafka / gRPC / NATS（v12 换 NATS v3 包）——选型对照表，不深入
- CQRS（@nestjs/cqrs，读写分离场景）、事件总线（EventEmitter2）
- GraphQL（@nestjs/graphql）与 WebSocket 网关：知道何时启用即可
- **练习**：无（速览篇，需要时回补）

---

### 14 实战：企业级单体服务（2~3 天｜实战层）

**一句话定位**：模块化单体——把全部技术点串成一个可交付的生产级项目。

**功能清单**：

- 业务：用户 / 文章 / 评论 CRUD + 分页过滤
- 认证授权：JWT 双 token + RBAC（07 篇落地）
- 数据层：Prisma + PostgreSQL + 事务 + 迁移（08 篇落地）
- 异步：注册欢迎邮件走 BullMQ 队列；每日统计 cron（09 篇落地）
- 横切：统一响应/错误格式（05）、Zod 校验（04）、限流（06）
- 可观测：pino + @nestjs/observe + terminus + 优雅关闭（10）
- 质量：Vitest 单测 + E2E，核心链路全覆盖（11）
- 文档与部署：Swagger + Dockerfile（多阶段构建）+ docker-compose（app/pg/redis）

**项目结构建议**：

```
/src
  main.ts                # Fastify adapter + Swagger + shutdown hooks
  app.module.ts
  common/                # filters/interceptors/dto/装饰器
  config/                # env 校验配置
  modules/
    auth/                # controller/service/guards/strategies
    user/  post/  comment/
  infra/
    prisma/  redis/  bullmq/
  health/
/test                    # E2E
```

**验收标准**：`docker compose up` 一键起全栈，Swagger 可调试，核心链路测试全绿，Grafana 能看到 traces

---

## ✅ 练习递进线

| 阶段 | 篇目 | 练习特征 |
|------|------|----------|
| 原理内化 | 01~03 | 手写迷你 IoC 容器、自实现 forRoot/forFeature——验证心智模型而非 API 记忆 |
| 能力构建 | 04~08 | 每篇一个可组合的纵向切片（校验/错误/认证/数据），互相喂给后续篇目 |
| 生产补齐 | 09~13 | 异步、可观测、测试、文档、高级特性速览——从「能跑」到「敢上生产」 |
| 实战交付 | 14 | 一键起全栈的完整单体，验收标准量化 |

---

## 🎯 面试覆盖图

| 高频面试点 | 覆盖篇目 |
|-----------|---------|
| 请求生命周期全链路（Middleware→Guard→Interceptor→Pipe→Controller→Filter） | 01、04、05 |
| DI 原理（reflect-metadata）与三种作用域、REQUEST 性能代价 | 02 |
| 循环依赖的解决 | 02 |
| 动态模块 forRoot/forFeature 原理 | 03 |
| Guard/Pipe/Interceptor/Filter 职责边界 | 04、05 |
| Nest vs Express/Fastify/Hono 选型 | 01 |
| JWT 双 token 与 RBAC 设计 | 07 |
| ORM 选型与事务 | 08 |
| BullMQ 可靠性（重试/幂等/多实例任务去重） | 09 |
| Nest 单测为什么容易（DI mock） | 11 |
| 微服务 transport 选型 | 13 |

---

## 📌 版本与安全基线

- **NestJS 12**（2026-08-27 发布）：所有示例以 12.x 为基线；`nest upgrade` 迁移；Node ≥ 20.19 / 22.12（推荐 22 LTS）
- **第三方 peer 兼容滞后**：部分生态包（如 @nestjs/typeorm）尚未跟进 12，集成前核对 peer 声明，必要时 `overrides` 锁版本
- 新项目默认 ESM + Vitest + oxlint；存量 CJS 项目靠 `require(esm)` 兼容，不强制迁移
- 生产部署以 **Node LTS** 为基线（Bun 跑 Nest 兼容性不完整，不作生产建议）
- 成文约定：各篇在版本断言与关键 API 处（如 03 的生命周期钩子顺序、12 的 Swagger 配置）附官方文档 / Migration Guide 链接

---

## 📖 学习资源

- 官方文档：https://docs.nestjs.com/
- v12 迁移指南：https://docs.nestjs.com/migration-guide
- GitHub：https://github.com/nestjs/nest（Releases 关注变更）
- 官方示例：https://github.com/nestjs/nest/tree/master/sample

---

## 📝 文档目录

| 序号 | 文件 | 内容 |
|------|------|------|
| 01 | 01-架构定位与全景.md | 理念对比、请求生命周期图、Nest 12 亮点 |
| 02 | 02-IoC容器与DI.md | Provider/作用域/循环依赖/手写迷你容器 |
| 03 | 03-模块系统与动态模块.md | forRoot/forFeature 源码级拆解、生命周期钩子 |
| 04 | 04-HTTP层与请求处理.md | Controller/DTO、Zod + Standard Schema、文件上传 |
| 05 | 05-过滤器与拦截器.md | 统一错误、AOP、执行顺序实验 |
| 06 | 06-配置与安全基线.md | config、helmet、CORS、throttler |
| 07 | 07-认证与授权.md | Passport/JWT/RBAC 完整链路 |
| 08 | 08-数据访问.md | Prisma 集成、ORM 对比、事务、分页 |
| 09 | 09-缓存队列与定时任务.md | cache-manager、BullMQ、schedule |
| 10 | 10-日志与可观测性.md | pino、@nestjs/observe、terminus、优雅关闭 |
| 11 | 11-测试与工程化.md | Vitest、单测/E2E 范式、构建工具链 |
| 12 | 12-Swagger与API文档.md | Zod schema → OpenAPI、鉴权文档化、全局前缀与版本化 |
| 13 | 13-高级特性速览.md | 微服务 transports、CQRS、GraphQL、WebSocket 简介 |
| 14 | 14-实战-企业级单体服务.md | 全技术点串联 + Docker 交付 |
