# M4 认证与 RBAC

> 对应 [TODO M4](../TODO.md) ｜ FR-1/FR-2 ｜ 教程 §3 ｜ 预计 60 分钟

## 这一步做什么

双 token（JWT access 15min + refresh 7d）+ httpOnly Cookie 三件套；注册/登录/刷新/登出；认证中间件；RBAC 判定。

## 关键实现

**1. Cookie 三件套**（lib/token.ts）：`httpOnly`（JS 读不到）+ `secure`（仅 HTTPS）+ `sameSite: Lax`（跨站请求不带 Cookie——CSRF 的主防线）。

**2. 登录时序拉平防用户枚举**（routes/auth.ts）：

```ts
const DUMMY_HASH = await Bun.password.hash('timing-equalizer-dummy')   // 模块加载期算一次
const verified = user
  ? await Bun.password.verify(password, user.passwordHash)
  : await Bun.password.verify(password, DUMMY_HASH)   // 用户不存在也跑一次 argon2
if (!user || !verified) throw apiError.unauthorized('邮箱或密码错误')
```

argon2 校验 ~100ms 量级，缺了这步「响应快 = 邮箱不存在」就是免费的枚举接口。注册接口 409 本来就泄露存在性，这里是纵深防御。

**3. 认证中间件三件**（middleware/auth.ts）：`optionalAuth`（有合法 token 就注入身份，匿名放行——公开接口的可见性矩阵依赖它）、`requireUser`（handler 内调用，永不误伤匿名路由）、`requireAuth`（严格认证）。

**4. RBAC 落在哪：单一来源，不摆两套。** 当前权限判定 = domain 表驱动「角色 × 状态 × 操作」（M5 的 canTransition）+ service 资源级 owner×staff 判定。曾按教程先写过 `requireRole(...roles)` 路由级工厂，review 后删除（YAGNI）：它零使用，与 service 层判定形成两套模型，PRD 已如实改为「路由级门槛随 FR-17（PATCH /users/:id/role）引入」。

## 踩坑实录

| 坑 | 解法 |
|----|------|
| JWT payload 的 role 是裸 string，脏数据静默通过 RBAC | `isRole()` 运行时守卫（types.ts），DB/JWT 里的非法角色在认证层就炸 401 |
| 密码哈希选型 | `Bun.password` 原生 argon2id，零依赖 |

## 验证

tests/auth.test.ts：注册 201 / 重复邮箱 409 / 密码错误 401 / 无 token 401 / 双 Cookie 下发；越权 403 在 M5 的 posts 测试覆盖。

## 面试可答

> **问：access token 短有效期 + refresh 轮换，解决的到底是什么问题？**
> 把「泄露后的暴露窗口」从 refresh 的 7 天压缩到 access 的 15 分钟，且刷新时轮换让旧 refresh 失效。但注意：纯 JWT 的 refresh 没有服务端状态，登出后旧 refresh 依然有效——所以 M6 引入 RefreshToken 表做服务端吊销，这才是闭环。
