# 09 阶段实战：Mini 文章 API

> 所属大纲：[readme.md](../readme.md) ｜ 预计：1 天 ｜ 前置：04~08

**一句话定位**：融汇 04~08 的纵切 demo——先拼乐高小件，15 篇大实战是它的全量版。刻意不含队列/可观测/测试（10~12 篇才讲），保持切口小、可完成。

**面试可答**：（本篇是实战篇，面试点在于能完整讲出「一个功能从路由声明到数据落库穿过哪些层」——Zod 校验 → Guard 鉴权 → Service 编排 → Repository 落库 → Interceptor 包装 → Filter 兜底。）

---

## 1. 功能清单与对应篇目

| 功能 | 技术点 | 出处 |
|------|--------|------|
| 文章 CRUD + 分页过滤 | Zod schema + `StandardSchemaValidationPipe`、cursor 分页 | 04 / 08 |
| 注册 / 登录 + RolesGuard | JWT 双 token（简化版）、`@Roles()`、`@Public()` 豁免公开路由 | 07 |
| 统一响应 / 错误 / 审计 | TransformInterceptor、GlobalExceptionFilter、审计 Interceptor | 05 |
| 数据层 | PrismaService、软删除、cursor 分页、事务 | 08 |
| 文档 | Swagger 顺手生成 | 13（先尝鲜） |

刻意**不含**：队列（10）、可观测（11）、测试（12）——那些是工程层的事，本篇只验收应用层。

## 2. 项目结构

```
/src
  main.ts                    # Fastify + 全局管道 + shutdown hooks
  app.module.ts              # 装配清单
  common/
    filters/global-exception.filter.ts
    interceptors/transform.interceptor.ts
    interceptors/audit.interceptor.ts
    interceptors/timing.interceptor.ts
  config/env.schema.ts       # Zod env 校验（06）
  infra/prisma/prisma.service.ts
  modules/
    auth/                    # controller / service / jwt.strategy / roles.guard
    post/                    # controller / service / repository / post.schema.ts
```

对照自检：每一层职责是否与 01 篇生命周期表一致——**Controller 只编排、Service 编业务、Repository 管数据、横切全在 interceptor/filter**。

## 3. 关键装配点

```ts
// main.ts
async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  )
  app.useGlobalPipes(new StandardSchemaValidationPipe())   // 04：全局校验
  await app.listen(process.env.PORT ?? 3000)
}
bootstrap()

// app.module.ts —— 全局 Guard 顺序见 07 篇陷阱二：认证在前、授权在后
providers: [
  { provide: APP_GUARD, useClass: JwtAuthGuard },   // 07：全局认证（配 @Public() 豁免公开路由）
  { provide: APP_GUARD, useClass: RolesGuard },     // 07：全局授权
  { provide: APP_FILTER, useClass: GlobalExceptionFilter },
  { provide: APP_INTERCEPTOR, useClass: TransformInterceptor },
  { provide: APP_INTERCEPTOR, useClass: TimingInterceptor },
]
```

## 4. 一个功能的完整穿层示范（以「删除文章」为例）

```ts
@Delete(':id')
@Roles('admin')                                    // 07：路由声明角色
async remove(@Param('id') id: string) {
  await this.postService.remove(id)                // Service 编业务
  return { id }                                    // → Transform 包装 → { code: 'OK', data: { id } }
}

// post.service.ts —— 带审计的软删除事务（08）
async remove(id: string) {
  await this.prisma.$transaction(async (tx) => {
    const post = await tx.post.findFirst({ where: { id, deletedAt: null } })
    if (!post) throw new BizException('POST_NOT_FOUND', '文章不存在', 404)   // 05
    await tx.post.update({ where: { id }, data: { deletedAt: new Date() } })
    await tx.auditLog.create({ data: { action: 'post.remove', refId: id } })
  })
}
```

请求穿过：Zod（无 body）→ AuthGuard → RolesGuard → Controller → Service（事务 + 业务异常）→ Prisma → TransformInterceptor 包装 → 客户端；任一步抛错 → GlobalExceptionFilter。

## 5. ✍️ 练习：完成并验收

**要求**：按 1~4 节完成 Mini API（预计半天编码 + 半天修边）：

1. 全部接口过 Zod；分页 cursor 可衔接翻页
2. 认证链路四接口跑通，`@Roles('admin')` 对普通用户 403
3. 统一响应/错误格式全接口一致；审计表有「谁在何时删了什么」
4. Swagger 挂上（`@nestjs/swagger` 的 `SwaggerModule.setup` 一行级配置即可，13 篇再讲深）

**验收标准**：Swagger 可调试的完整 CRUD + 认证链路；与 Hono 实战 B **同题异构**对照——同一套业务，对比两边的架构层差异（Hono 无 DI/无 AOP 管线，横切靠中间件自觉；Nest 有容器与挂点）。

---

## 6. 💬 复盘问答

**Q1：这个 Mini API 里，去掉 Nest 的哪些部分它照样能跑？**

管线（Interceptor/Filter/Guard）都能用中间件模拟，DI 容器可以用手工 new 替代——小项目确实「能跑」。但每去掉一层，横切逻辑就多一分自觉依赖；规模上去后，自觉维护不过来，这就是回到 Nest 的理由。

**Q2：如果现在要加「注册欢迎邮件」，直接在 register 里发吗？**

不能——同步发邮件会把注册 RTT 拖长且失败会污染注册事务。正确姿势是入队（BullMQ），且要防「DB 写成功但入队失败」——Outbox 模式，10 篇第一课。

**Q3：下一阶段（10~12）补齐后，这个项目离「敢上生产」还差什么？**

队列与定时任务（10）、可观测（request id/traces/健康检查/优雅关闭，11）、测试与 CI（12）——正好是 15 篇实战的全量版清单。

---

## 7. 🔗 参考资料

- 本篇代码结构参考官方示例：https://github.com/nestjs/nest/tree/master/sample
- 与 Hono 实战 B 对照：[10-实战B-企业级REST-API.md](../../hono/doc/10-实战B-企业级REST-API.md)

---

## 📌 小结

- 应用层五篇（04~08）在这一篇完成第一次「合龙」——穿层能力是 Nest 学习的核心验收项
- 结构自检钩子：Controller 只编排、Service 编业务、Repository 管数据、横切进 interceptor/filter
- 与 Hono 同题异构的结论在此刻具象化：架构层的差异不在「能不能实现」，在「靠机制还是靠自觉」
