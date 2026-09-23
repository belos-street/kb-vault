# 04 HTTP 层与请求处理

> 所属大纲：[readme.md](../readme.md) ｜ 预计：1.5 天 ｜ 前置：01、02

**一句话定位**：请求进入业务前的全部加工——Middleware 管道、Zod 一等公民校验、参数装饰器与文件上传。

**面试可答**：v12 的 `@Body({ schema })` 直接接收 Standard Schema（Zod），配合 `StandardSchemaValidationPipe` 完成校验与类型收窄；Middleware 在 Guard 之前执行、只能拿到 Request/Response，与 Guard 的职责边界在于「是否感知路由上下文」。

---

## 1. Controller / DTO 速过（不占篇幅）

```ts
@Controller('posts')
export class PostController {
  constructor(private readonly postService: PostService) {}

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.postService.findOne(id)   // 只编排，不写业务
  }
}
```

- 参数装饰器：`@Param / @Query / @Body / @Headers / @Req / @Res`；业务代码**禁止直接注入 `@Res()`**（会脱离框架响应管线，Interceptor/Filter 失效——除非用 `passthrough: true`；全部 HTTP 装饰器速查见 16 篇）
- DTO 即 TS interface/class：Zod 路线下 DTO 的类型由 schema 推导（见第 3 节），不再手写两遍

## 2. Middleware：请求链第一环

class 版（依赖注入可用）与 functional 版（无依赖、更轻）：

```ts
@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    res.setHeader('x-request-id', randomUUID())
    next()                                   // 不调 next = 短路请求
  }
}

@Module({ providers: [PostService] })
export class PostModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('posts')   // 支持通配与排除 exclude
  }
}
```

**与 Guard 的职责边界**（01 篇生命周期表收口）：Middleware 拿不到「下一个执行哪个 handler」的元信息——它适合与路由无关的通用处理（日志、request id、body 解析）；凡是「这条路由允不允许过」的决策（鉴权、限流的放行判断）归 Guard。**面试必追问，答题模板：Middleware 看请求，Guard 看路由。**

## 3. 管道：两条校验路线

| 路线 | 组合 | 定位 |
|------|------|------|
| 存量兼容 | `ValidationPipe` + class-validator 装饰器 | class DTO 老项目 |
| **v12 主推** | `@Body({ schema })` + `StandardSchemaValidationPipe` | Zod / Valibot / ArkType |

```ts
// main.ts —— 注册全局管道后，路由装饰器的 schema 才真正生效
app.useGlobalPipes(new StandardSchemaValidationPipe())
```

```ts
// schema 与类型同源：定义一次，入参类型自动收窄
export const createPostSchema = z.object({
  title: z.string().min(1).max(120),
  content: z.string().min(1),
  tags: z.array(z.string()).max(5).default([]),
})
export type CreatePostDto = z.infer<typeof createPostSchema>

@Post()
create(@Body({ schema: createPostSchema }) dto: CreatePostDto) {
  return this.postService.create(dto)      // dto 已是收窄后的类型
}
```

- 校验失败 → 管道抛 `BadRequestException` → 05 篇的 ExceptionFilter 统一格式化
- `@Query` / `@Param` 同样支持：`@Param('id', { schema: z.coerce.number().int().positive() })`
- **schema 复用红利**：同一份 Zod schema 之后直接喂 OpenAPI 生成（13 篇）与出参序列化（`StandardSchemaSerializerInterceptor`，05 篇）——「校验、文档、序列化三处同源」是 v12 校验路线的核心卖点
- `z.input` vs `z.infer`：带 `.default()` 的字段在**输入**可省、在**输出**必有——`z.infer` 是输出类型（DTO 收窄用它），需要「部分输入」形状时用 `z.input<typeof schema>`
- 快捷转换：`z.coerce.number()` 处理「query 进来全是字符串」的经典脏数据问题

## 4. 自定义参数装饰器

把「从请求里取业务上下文」的模式固化下来：

```ts
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    return ctx.switchToHttp().getRequest().user   // 由 Guard 塞入（07 篇）
  },
)

@Get('me')
me(@CurrentUser() user: AuthUser) { return user }
```

## 5. 文件上传与对象存储

> ⚠️ **`@nestjs/platform-multer` 仅兼容 ExpressAdapter**——官方 file-upload 文档明确警告与 Fastify 不兼容。本教程统一 Fastify，上传走 `@fastify/multipart`（multer 路线只在 Express 存量项目里用）：

```ts
// main.ts
import multipart from '@fastify/multipart'
await app.register(multipart)
```

```ts
// controller —— Fastify 路线：直接取 Fastify 原生请求
@Post('upload')
async upload(@Req() req: FastifyRequest) {
  const data = await req.file()          // 单文件
  const buf = await data.toBuffer()
  return { key: data.filename, size: buf.length }
}
```

> ⚠️ **企业实践引子**：生产环境文件走**对象存储（S3 / OSS / MinIO）+ 预签名 URL 直传**——客户端拿预签名 URL 直接 PUT 到存储桶，服务端只签发 URL 和收回调，避免大文件过应用进程（内存与带宽双重税）。multer 仅适合本地开发与小文件。15 篇实战不含此功能，需要时回补。

---

## 6. ✍️ 练习：Zod 校验的完整 CRUD 接口

**要求**：文章模块 `POST /posts` / `GET /posts` / `GET /posts/:id` / `PATCH /posts/:id`：

1. 入参全部走 `createPostSchema` / `updatePostSchema`（update 用 `z.object({...}).partial()`）
2. `GET /posts` 的分页参数用 schema 校验：`page` / `pageSize` 经 `z.coerce.number()` 收窄且有上限
3. 故意提交非法 body，观察 400 响应的默认格式（05 篇会统一它）
4. 数据暂存内存 Map 即可（08 篇接 Prisma）

**预期效果**：Controller 里没有一行手写校验；`dto` 类型完整自动推导；用 Swagger 或 curl 验证非法参数全部被 400 拦截。

---

## 7. 💬 面试问答

**Q1：Middleware 和 Guard 的区别？为什么鉴权不用 Middleware？**

Middleware 只拿 Request/Response，不感知路由元数据（不知道下一个 handler 是谁、有什么角色要求）；Guard 拿执行上下文，能读 `@SetMetadata` 的路由级声明。所以「通用预处理」归 Middleware，「路由级准入决策」归 Guard——鉴权需要按路由声明角色，归 Guard。

**Q2：v12 的 Standard Schema 校验路线好在哪？**

`@Body({ schema })` + `StandardSchemaValidationPipe`：① 校验与 TS 类型同源（`z.infer` 单一事实）；② 同一份 schema 直接喂 OpenAPI 文档与出参序列化，消除「校验、文档、序列化三处各写一套」的漂移；③ 不绑定 Zod，Valibot/ArkType 同协议可换。（追问：存量 class-validator 怎么办？——ValidationPipe 完整保留，二者按 DTO 形态共存。）

**Q3：为什么业务代码禁止注入 @Res()？**

直接操作 Response 会绕过框架的响应管线——Interceptor 的响应变换、统一序列化、异常过滤器全部失效；需要微调响应时用 `@Res({ passthrough: true })` 拿到「还能交给框架处理」的受限对象。

---

## 8. 🔗 参考资料

- Controllers / Pipes：https://docs.nestjs.com/controllers ｜ https://docs.nestjs.com/pipes
- Route decorator schemas（v12）：https://docs.nestjs.com/migration-guide#route-decorator-schemas
- Standard Schema：https://standardschema.dev/
- File upload：https://docs.nestjs.com/techniques/file-upload

---

## 📌 小结

- Middleware 看请求、Guard 看路由——边界一句话
- v12 校验主线：`@Body({ schema })` + `StandardSchemaValidationPipe`，schema 一份喂校验/文档/序列化
- `z.coerce` 是处理 HTTP 字符串脏数据的标准姿势
- 自定义参数装饰器固化「请求 → 业务上下文」的取数模式，07 篇的 `@CurrentUser()` 会回来
- 文件生产走对象存储 + 预签名直传，multer 只是本地玩具
