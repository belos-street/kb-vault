# M4 认证与 RBAC

> 所属：[project](../) 实现教学 ｜ 前置：[M2](./M2-统一响应与错误.md)、[M3](./M3-可观测与Redis.md) ｜ 对应代码：`src/lib/token.ts`、`src/middleware/auth.ts`、`src/routes/auth.ts`、`src/schemas/auth.ts`

**一句话定位**：JWT 双 token（access 15min + refresh 7d）+ httpOnly Cookie 全链路——注册、登录、轮换、登出、me 五个接口三同源落地。

**面试可答**：access 短寿命 + refresh 长寿命，被盗的 access 窗口只有 15 分钟；refresh 轮换让旧 refresh 失效；Cookie 用 httpOnly 让 XSS 拿不到 token、sameSite + csrf 中间件挡 CSRF。

---

## 1. 双 token 模型

```
注册 POST /auth/register ──→ 建用户（role=reader），不下发 token
登录 POST /auth/login    ──→ 校验 argon2id ──→ Set-Cookie: access_token(15m) + refresh_token(7d)
      GET  /auth/me      ──→ requireAuth 校验 access ──→ 当前用户
      POST /auth/refresh ──→ 校验 refresh ──→ 双 token 轮换（新旧替换）
      POST /auth/logout  ──→ 清两个 Cookie
```

为什么是两个 token：

- **access 短寿命**：无状态 JWT 一旦签发无法撤销（M4 版本没有吊销表），短寿命把「被盗窗口」压到 15 分钟
- **refresh 长寿命**：只用来换新 access，暴露面小；轮换时旧的被覆盖，重放旧 refresh 拿到的还是有效新 token——**本版的轮换只是替换不下线**，服务端吊销是 FR-18（P2）

## 2. `lib/token.ts`：签发与校验

```ts
export const signAccessToken = (userId: string, role: Role) =>
  sign({ sub: userId, role, typ: 'access', exp: now() + ACCESS_TTL }, env.JWT_SECRET, 'HS256')
```

payload 三个业务字段：`sub`（用户 id）、`role`（RBAC 直接从 token 读，免查库）、`typ`（区分 access/refresh——refresh 接口会校验 `typ === 'refresh'`，防止拿 access 去刷）。

### ⭐ 踩坑实录：hono 4.13 的 verify 强制要求 alg

这是本项目排查最久的一个坑，现象与教训都值得记：

- **现象**：登录测试通过（Cookie 正常下发），但带着 Cookie 访问 `/me` 一律 401
- **根因**：hono 4.13 修复 JWT 安全漏洞后，`verify` **运行时强制要求第三个参数 alg**——`verify(token, secret)` 抛 `JWT verification requires "alg" option to be specified`。而我们的 `verifyToken` 把异常吞成 `null` 返回（这是设计好的），401 于是「看起来一切正常地」发生
- **教训**：**吞错 + 中间件 = 静默失败**。`verifyToken` 返回 null 的设计没错（调用方决定 401 语义），但排障时先验证最底层原语（用 `bun -e` 单测 sign/verify），不要在中层猜

```ts
export const verifyToken = async (token: string) => {
  try {
    return await verify(token, env.JWT_SECRET, 'HS256')  // alg 必须显式
  } catch {
    return null
  }
}
```

### Cookie 三件套

```ts
const cookieBase = { httpOnly: true, secure: true, sameSite: 'Lax' as const, path: '/' }
```

| 属性 | 防什么 | 备注 |
|------|--------|------|
| `httpOnly` | XSS 用 `document.cookie` 偷 token | JS 完全读不到 |
| `secure` | 明文网络截获 | 仅 HTTPS 发送；`localhost` 被浏览器视为安全上下文，本地开发不受影响 |
| `sameSite: 'Lax'` | 跨站表单携带 Cookie（CSRF 主通道） | Lax 放行顶级导航 GET，挡住跨站 POST |

## 3. `middleware/auth.ts`：认证四件套

本项目其实有**四种**身份工具，对应不同场景——这个区分是 M5 可见性矩阵的地基：

```ts
// ① requireAuth：中间件版，强制认证（/me 用）
export const requireAuth = createMiddleware<Env>(async (c, next) => {
  const token = getCookie(c, ACCESS_TOKEN)
  const payload = token ? await verifyToken(token) : null
  if (
    !payload ||
    typeof payload.sub !== 'string' ||
    payload.typ !== 'access' ||
    !isRole(payload.role)          // 运行时守卫：脏 role 不得静默通过 RBAC
  ) {
    throw apiError.unauthorized()
  }
  c.set('user', { id: payload.sub, role: payload.role })
  await next()
})

// ② optionalAuth：可选认证——有合法 token 就注入身份，匿名放行
//    GET /posts 的可见性矩阵依赖它：同一个接口，匿名和登录看到不同结果
export const optionalAuth = createMiddleware<Env>(async (c, next) => { /* 同上但不 throw */ })

// ③ requireUser：handler 内取身份，未认证 throw 401
export const requireUser = (c: Context<Env>): AuthUser => {
  const user = c.get('user')
  if (!user) throw apiError.unauthorized()
  return user
}

// ④ requireRole：RBAC 中间件工厂（元数据模式）
export const requireRole = (...roles: Role[]) =>
  createMiddleware<Env>(async (c, next) => {
    const role = c.get('user')?.role
    if (!role || !roles.includes(role)) throw apiError.forbidden()
    await next()
  })
```

> 💡 `isRole` 运行时守卫（`src/types.ts`）：JWT payload 和 DB 里的 role 都是裸 string，脏数据在认证层就按 401 拦下，而不是等到 RBAC 判断时静默通过——全项目的 `as Role` 断言由此消灭。

`requireRole('admin')` 返回的是中间件——「元数据 + 中间件工厂」，跟教程 [10-实战B §3](../../doc/10-实战B-企业级REST-API.md) 同款。`role` 直接从 JWT payload 读（登录时写进 token），**权限判断零查库**。

## 4. `routes/auth.ts`：三同源落地

每个接口都是 `createRoute` 声明 + `openapi()` 实现，以注册为例：

```ts
const register = createRoute({
  method: 'post',
  path: '/register',
  request: { body: { content: { 'application/json': { schema: registerSchema } } } },
  responses: {
    201: { description: '注册成功', content: jsonContent(okEnvelope(authUserSchema)) },
    400: { description: '参数校验失败', content: jsonContent(failEnvelope) },
    409: { description: '邮箱已被注册', content: jsonContent(failEnvelope) },
  },
})

auth.openapi(register, async (c) => {
  const { email, password } = c.req.valid('json')
  try {
    const user = await prisma.user.create({
      data: { email, passwordHash: await Bun.password.hash(password) },
    })
    return ok(c, { id: user.id, email: user.email, role: user.role }, 201)
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      throw apiError.conflict('邮箱已被注册')   // 唯一约束冲突 → 409
    }
    throw e
  }
})
```

四个值得学的点：

1. **`Bun.password` 原生 argon2id**：`hash` 自动加盐、`verify` 常数时间比较，零依赖免原生编译
2. **P2002 → 409**：Prisma 唯一约束冲突的错误码是 `P2002`，映射成业务 `CONFLICT`——数据库约束就是最后防线，应用层不抢它的活（并发注册竞态天然正确）
3. **登录失败统一文案**：`'邮箱或密码错误'`——不区分「邮箱不存在」和「密码错误」，不给撞库者枚举信号
4. **`openapi()` 的第三个参数是 hook，不是中间件链** ⭐：想给 `/me` 挂认证，正确写法是先 `auth.use('/me', requireAuth)` 再 `auth.openapi(me, handler)`——直接 `openapi(me, requireAuth, handler)` 会把 `requireAuth` 当 handler 做类型检查，编译报错

## 5. 面试常问

> **问：JWT 放 Cookie 还是 Authorization header？**
> 看客户端。浏览器 Web 应用放 httpOnly Cookie——XSS 偷不走，CSRF 用 sameSite + csrf 中间件补；非浏览器客户端（App/第三方）用 Bearer header。本项目是 Web API，选 Cookie。

> **问：access token 泄露了怎么办？**
> 本版：等它 15 分钟自然过期。完整方案是 FR-18 的 RefreshToken 表——服务端可吊销，登出/被盗时删行即失效，代价是多一张表和每请求一次查询（或缓存）。

## 6. 对比板块：认证方案三角

| 方案 | 状态 | 撤销 | XSS | 适用 |
|------|------|------|-----|------|
| **JWT + httpOnly Cookie（本项目）** | 无状态 | 难（需吊销表） | 安全 | Web API，多端共享签名密钥 |
| Session + Cookie | 服务端有状态 | 容易（删 Session 行） | 安全 | 单体传统 Web |
| JWT + Bearer header | 无状态 | 难 | header 可被 JS 读（内存存放） | App / 服务间调用 |

## 7. 自测

- [ ] refresh 接口为什么校验 `typ === 'refresh'`？不校验会怎样？
- [ ] `optionalAuth` 和 `requireAuth` 的区别，各用一个接口举例
- [ ] P2002 为什么不需要先 `findUnique` 再 `create`？

---

## 🔗 参考资料

- Bun.password：https://bun.com/docs/api/password
- hono JWT：https://hono.dev/docs/middleware/builtin/jwt
- 教程对应节：[10-实战B §3](../../doc/10-实战B-企业级REST-API.md)

## 📌 小结

- 双 token = 盗用窗口短 + 续期体验好；`typ` 字段隔离两类 token
- Cookie 三件套各防一枪；`openapi()` 第三参是 hook，中间件走 `use()`
- 吞错中间件的静默失败——先单测最底层原语再查上层
