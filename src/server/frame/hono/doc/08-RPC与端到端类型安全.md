# 08 RPC 与端到端类型安全

> 所属大纲：[readme.md](../readme.md) ｜ 预计：1 天 ｜ 前置：07

**一句话定位**：Hono 的杀手锏——服务端路由定义即客户端 SDK，改接口编译期报错。

**面试可答**：RPC 模式把路由链的类型导出为 `AppType`，客户端 `hc<AppType>` 用 Proxy 按路径生成调用，请求与响应全链路类型自动推导。

---

## 1. 服务端：导出 AppType

```ts
// src/server/index.ts
import { Hono } from 'hono'

const app = new Hono()

// 关键：路由必须链式接住，类型才会累积（02 篇的类型机制在这里兑现）
const routes = app
  .get('/users', (c) => c.json([{ id: 1, name: 'Ada' }]))
  .get('/users/:id', (c) => c.json({ id: c.req.param('id') }))
  .post('/users', async (c) => {
    const body = await c.req.json<{ name: string }>()
    return c.json({ created: true, name: body.name }, 201)
  })

export type AppType = typeof routes
export default app
```

- `AppType` 是**纯类型导出**，客户端 import type 不引入任何运行时代码（前后端可分仓库）
- 配合 `app.route('/api', sub)` 时，从子应用开始链：`const routes = app.route('/api', users).post(...)`，客户端路径随之变成 `client.api.users`

## 2. 客户端：hc 按路径生成调用

```bash
bun add hono   # 客户端也要装（只用 hc + 类型）
```

```ts
// src/client/index.ts
import { hc } from 'hono/client'
import type { AppType } from '../server/index'

const client = hc<AppType>('http://localhost:3000')

// GET /users —— 返回类型自动推导
const res = await client.users.$get()
const users = await res.json()   // { id: number; name: string }[]

// POST /users —— json/param/query 参数都是类型化的
const created = await client.users.$post({ json: { name: 'Linus' } })
if (created.status === 201) {
  const data = await created.json()   // { created: boolean; name: string }
}

// 动态段用字符串键访问
const one = await client.users[':id'].$get({ param: { id: '1' } })
```

辅助方法：`client.users.$url()` 取 URL 对象、`$path()` 取路径字符串（构造 `<a href>` / 缓存键用）。

## 3. 错误处理：判别联合，不是异常

`hc` 对 4xx/5xx **不抛异常**——它返回的 `ClientResponse` 是按服务端每个 `c.json(body, status)` 推导出的联合类型，客户端必须显式判别：

```ts
const res = await client.users[':id'].$get({ param: { id: '999' } })

if (res.ok) {
  const user = await res.json()          // 用户类型
} else {
  const err = await res.json()           // 错误体类型（与服务端 404 响应对应）
  console.error(res.status, err)
}
```

实战纪律：**服务端错误响应也要用 `c.json(错误体, status)` 显式返回**（06 篇统一格式），这样错误体的类型才会进入联合——客户端 `res.json()` 才有准确的错误类型。

## 4. ⚖️ 对比板块：Hono RPC vs tRPC

| 维度 | Hono RPC | tRPC |
|------|----------|------|
| 传输语义 | 标准 REST（HTTP 动词 + 路径） | 自有 RPC 协议（query 上的 procedure） |
| 代码生成 | 无 | 无 |
| 服务端 | 就是普通 Hono 路由 | 需要按 tRPC router 组织 |
| 客户端 | fetch 派生，可换 fetch 实现 | 专属 client |
| 批量请求 | 无内建 | 有（batch link） |
| 适用 | 前后端同构/同仓库、与 REST 共存 | 前后端分离、重 procedure 域模型 |

结论：API 本来就要 REST 对外（有第三方消费、网关、缓存）→ Hono RPC 零额外成本；纯内部前后端且想要 procedure/batch 语义 → tRPC 合理。两者解决的是同一件事：**类型在 HTTP 边界不断裂**。

## 5. JSX SSR 与 SSG：了解即可

Hono 也支持 JSX 服务端渲染与静态站点生成（`@hono/zod-openapi` 同门的 helper 体系），但你已有 React 前端栈，服务端渲染不是 Hono 主战场，知道入口在 [官方 JSX/SSG 文档](https://hono.dev/docs/guides/jsx) 即可。

---

## 6. ✍️ 练习：类型共享 Todo

**要求**：服务端实现 `GET /todos`、`POST /todos`（`{ title }`）、`PATCH /todos/:id`（`{ done }`）；客户端 import AppType 完成三个调用，所有类型零手写。

**提示**：`PATCH` 用 `client.todos[':id'].$patch({ json: { done: true }, param: { id } })`；POST 后观察 `created.json()` 的返回类型是否与 `c.json()` 一致。

**预期效果**：把服务端某字段改名 → 客户端对应调用处**编译报错**（tsc 直接红），证明类型贯通；故意不打 `res.ok` 判别也能通过编译——联合类型判别是纪律而非语法强制。

---

## 7. 💬 面试问答

**Q1：端到端类型安全是怎么实现的，有运行时代价吗？**

`typeof routes` 把服务端每个 handler 的响应类型（由各 `c.json()` 实参自动推断，需要固定契约时显式标注）编码进 AppType；客户端 `hc` 在类型层用 Proxy 把调用路径映射回路由字符串。**运行时零开销**——它只是一次普通 fetch + 标准 JSON。

（追问：接口改了客户端哪里会报错？——路径/参数变化：调用处编译报错；响应 shape 由 `c.json()` 实参自动推断、消费方类型随之更新，需要固定契约（空响应、多态返回）时才显式标注 `c.json<T, Status>()`。）

**Q2：Hono RPC 和 tRPC 的本质差异？**

Hono RPC 不发明协议：类型推导架在标准 REST 之上，API 天然可被第三方/curl/网关消费；tRPC 换来了 procedure 语义与 batch，代价是自有协议与客户端绑定。选型看 API 是否需要对外保持 REST 语义。

**Q3：动态路由在客户端怎么调用、类型从哪来？**

`:id` 段在客户端对象上以 `[':id']` 字符串键访问，`$get({ param: { id } })` 传值；段名与服务端路由字符串同源，所以参数类型是服务端定义的直接映射。

---

## 8. 🔗 参考资料

- RPC 指南：https://hono.dev/docs/guides/rpc
- Client API：https://hono.dev/docs/api/client

---

## 📌 小结

- 三步：路由链式接住 → `export type AppType` → `hc<AppType>()`；前后端可分仓库（纯类型导入）
- 错误处理是判别联合：`res.ok` 分支，服务端错误体也用 `c.json()` 显式返回才有类型
- vs tRPC：REST 语义 + 零协议成本 vs procedure/batch——按 API 是否对外定
