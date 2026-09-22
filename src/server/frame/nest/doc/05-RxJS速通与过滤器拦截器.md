# 05 RxJS 速通与过滤器拦截器

> 所属大纲：[readme.md](../readme.md) ｜ 预计：1.5 天 ｜ 前置：04

**一句话定位**：Part 1 用 0.5 天补齐 Nest 所需的 RxJS 子集（零基础可入）；Part 2 在 Filter/Interceptor 上立刻实战——统一错误、响应包装、审计日志一次成型。

**面试可答**：Filter 处理异常统一出口，Interceptor 包裹请求前后实现 AOP（日志/缓存/超时/响应变换），两者都有全局、控制器、方法三级作用域；`handle()` 返回冷流——不订阅不执行，`tap` 埋点按订阅次数触发，日志重复/丢失多半错在订阅时机。

---

## Part 1：RxJS 速通（0.5 天，只讲 Nest 用到的子集）

### 1.1 Observable 与冷流

```ts
import { Observable, of } from 'rxjs'

const cold$ = of(1, 2, 3)          // 「菜谱」：此刻什么都没发生

cold$.subscribe(v => console.log(v))   // 订阅那一刻才执行（第一次）
cold$.subscribe(v => console.log(v))   // 再订阅 → 完整重跑一遍（第二次）
```

**冷流 = 不订阅不执行、按订阅次数独立执行。** 这是理解 Nest Interceptor 的全部前提：`next.handle()` 返回的正是冷流——框架在管道末端替你订阅了一次，所以：

- 不订阅 → handler 根本不会执行
- 两个 `tap` 打日志、结果只出现一次 → 因为整体只订阅了一次
- 日志重复出现 → 通常是你自己多订阅了一次（如把流同时赋给两个消费点）

### 1.2 操作符子集（Nest 场景够用集）

| 操作符 | 一句话 | Nest 里的位置 |
|--------|--------|--------------|
| `map` | 逐值变换 | Interceptor 响应包装 |
| `tap` | 旁路副作用（不改值） | 耗时日志、埋点 |
| `timeout` | 超时抛错 | Interceptor 接口超时 |
| `mergeMap` | 并发展平（并发可限） | 流式调用下游 |
| `catchError` | 捕获并替换/重抛 | 流内错误转统一异常 |
| `firstValueFrom` / `lastValueFrom` | 流转 Promise（只取一值） | Service 里消费流的标准姿势 |

```ts
import { firstValueFrom } from 'rxjs'

// RxJS vs async/await 的边界：
// Interceptor 的 intercept() 必须返回流（框架要求）；
// Service 是你的地盘——await 就够，不要为用 RxJS 而 RxJS。
```

> 💡 记忆锚点：**流是 Interceptor 的方言，Promise 是 Service 的母语。** 错误沿流传播（`error` 回调），最终仍会落到 ExceptionFilter——两条错误通道汇合于同一个出口。

---

## Part 2：过滤器与拦截器（1 天）

### 2.1 ExceptionFilter：统一错误出口

v12 支持 machine-readable error codes（`HttpExceptionOptions.errorCode`），配合业务异常体系：

```ts
// 业务异常基类：HTTP 语义 + 机器可读错误码
export class BizException extends HttpException {
  constructor(
    readonly code: string,          // 实例属性：Filter 侧读 e.code
    message: string,
    status = HttpStatus.BAD_REQUEST,
  ) {
    super(message, status, { errorCode: code })   // v12 machine-readable
  }
}
throw new BizException('POST_NOT_FOUND', '文章不存在', HttpStatus.NOT_FOUND)
```

```ts
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse<Response>()
    const { status, errorCode, message } = this.normalize(exception)
    res.status(status).json({ code: errorCode, message, data: null })
  }

  private normalize(e: unknown) {
    if (e instanceof BizException)
      return { status: e.getStatus(), errorCode: e.code, message: e.message }
    if (e instanceof HttpException) {
      const r = e.getResponse() as any
      // 校验类 400 单独给码（12 篇 E2E 断言依赖此处）
      const errorCode = r.errorCode ?? (e.getStatus() === 400 ? 'VALIDATION_ERROR' : 'HTTP_ERROR')
      return { status: e.getStatus(), errorCode, message: r.message ?? e.message }
    }
    // 未知异常：吞细节（不泄漏堆栈给客户端），日志侧保留全貌（11 篇）
    return { status: 500, errorCode: 'INTERNAL_ERROR', message: 'Internal Server Error' }
  }
}
```

全局注册走 `APP_FILTER` token（02 篇的字符串 token 实战）：

```ts
providers: [{ provide: APP_FILTER, useClass: GlobalExceptionFilter }]
```

### 2.2 Interceptor：AOP 三板斧

```ts
@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  intercept(ctx: ExecutionContext, next: CallHandler) {
    return next.handle().pipe(
      map(data => ({ code: 'OK', message: 'success', data })),   // 响应包装
      tap(() => {
        const req = ctx.switchToHttp().getRequest()
        Logger.log(`${req.method} ${req.url} done`)              // 埋点
      }),
      timeout(5000),                                             // 超时兜底
    )
  }
}
```

- 出参校验序列化：`StandardSchemaSerializerInterceptor` + `@SerializeOptions({ schema: userResponseSchema })`——出参也走 Zod，防止「多查了字段顺手漏给客户端」（04 篇 schema 复用的出参侧）
- **审计日志**：企业后台标配（谁在何时改了什么）——写操作 Interceptor 自动记录：

```ts
intercept(ctx: ExecutionContext, next: CallHandler) {
  const req = ctx.switchToHttp().getRequest()
  const isWrite = ['POST', 'PATCH', 'DELETE'].includes(req.method)
  if (!isWrite) return next.handle()
  return next.handle().pipe(
    tap(data => this.auditService.record({
      userId: req.user?.id, method: req.method, path: req.url,
      body: req.body, resultId: data?.id, at: new Date(),
    })),
  )
}
```

### 2.3 执行顺序验证实验（面试题实锤）

注册全局 Interceptor A、Controller 级 Interceptor B，各 `tap` 打日志：

结论（自己跑一遍验证）：**A前 → B前 → handler → B后 → A后**（洋葱模型，全局在外层）；Filter 永远最后兜底。这题口说无凭，写两个 Interceptor 打日志是唯一可信的验证方式。

> ⚠️ 全局 vs 局部的坑：方法级 > 控制器级 > 全局（越小越贴近 handler）。**DI 能力跟「注册形态」走，不跟「全局/局部」走**——类引用注册（`@UseInterceptors(ClassRef)`、`APP_*` 的 `useClass`）一律由框架经容器实例化、支持构造注入；只有手动 `new` 传入的实例不走容器。

---

## 3. ✍️ 练习：横切三件套

**要求**：给 04 篇的文章 CRUD 补齐：

1. `TransformInterceptor` 统一响应 `{ code, data, message }`
2. `GlobalExceptionFilter` 统一错误格式（`POST_NOT_FOUND` 等业务错误码 + 未知异常脱敏为 `INTERNAL_ERROR`）
3. 耗时日志 Interceptor（`tap` 内计算 `Date.now()` 差值）
4. 写操作审计 Interceptor（审计先落内存数组即可）

**预期效果**：全部用 Part 1 刚学的 `map` / `tap` 实现；成功响应与错误响应格式统一；故意抛 `BizException` 验证错误码透传；两个 Interceptor 打日志验证洋葱顺序。

---

## 4. 💬 面试问答

**Q1：Interceptor 和 Middleware 都能改响应，区别是什么？**

Middleware 基于原始 req/res、在路由匹配后执行、拿不到 handler 元信息；Interceptor 基于 RxJS 流包裹整个 handler 调用——能拿到执行上下文（路由/方法元数据）、能对返回值做变换（`map`）、能短路（缓存命中不调 `handle()`）。AOP 语义归 Interceptor，协议层预处理归 Middleware。

**Q2：handle() 返回的冷流在实践里踩过什么坑？**

订阅时机：框架只订阅一次，`tap` 按订阅次数触发——日志重复说明流被多次订阅（常见于自己又 subscribe 了一次）；日志丢失说明没到订阅点 handler 就没执行。另外 `timeout` 抛出的是 `TimeoutError`，Filter 里要按异常类型归一化。

**Q3：统一错误响应怎么设计错误码？**

v12 用 `HttpExceptionOptions.errorCode` 挂机器可读码；分层：HTTP 状态码管传输语义（404/422/500），errorCode 管业务语义（`POST_NOT_FOUND`），message 管人读。未知异常一律脱敏成 `INTERNAL_ERROR`——细节只进日志不进响应。

---

## 5. 🔗 参考资料

- Exception filters：https://docs.nestjs.com/exception-filters
- Interceptors：https://docs.nestjs.com/interceptors
- Machine-readable error codes（v12）：https://docs.nestjs.com/migration-guide#machine-readable-error-codes
- RxJS 官方文档：https://rxjs.dev/guide/overview

---

## 📌 小结

- 冷流语义 + 操作符子集 = Nest 所需 RxJS 的全部；流是 Interceptor 的方言，Promise 是 Service 的母语
- Filter 是唯一出口：BizException 带 errorCode，未知异常脱敏——错误分层（HTTP 状态 / 错误码 / message）
- Interceptor 三板斧：`map` 包装、`tap` 埋点、`timeout` 兜底；审计日志是标准 AOP 应用
- 全局在外、局部在内（洋葱）；全局注册走 `APP_*` token 才有 DI
