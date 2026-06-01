根据"快速上手、理解理念、能做项目"的目标，这份大纲把 Hono.js 学习拆解成 **8 个模块**，每天 1~2 小时，**约 7-10 天完成**。每个模块都对应核心知识点，最后用一个 **RESTful API 项目** 串联全部知识。

---

## 🎯 学习目标
- 理解 Hono 的设计理念：轻量、快速、Web Standards
- 掌握路由、中间件、请求/响应处理
- 能在多运行时（Cloudflare Workers、Deno、Bun、Node.js）部署应用
- 面试时能解释 Hono 与 Express/Koa 的区别及优势

---

## 📋 前置要求
- 熟悉 JavaScript/TypeScript ES6+
- 了解 HTTP 协议基础（请求方法、状态码、Headers）
- 有 Node.js 或其他后端框架使用经验（Express/Koa 等）

---

## 📚 模块详解

### 模块 1：Hono 概述与快速入门（0.5 天）
**面试可答**：Hono 是基于 Web Standards 的轻量级框架，零依赖，支持多运行时。

- Hono 是什么：日语"火焰"🔥，轻量、快速的 Web 框架
- 核心特性：
  - Ultrafast：RegExpRouter 单次正则匹配，性能碾压同类
  - Lightweight：`hono/tiny` 预设 < 14KB，Express 572KB
  - Multi-runtime：一套代码跑遍 Cloudflare Workers、Deno、Bun、Node.js
  - Web Standards：基于 Request/Response，不造轮子
- 适用场景：Web API、CDN 边缘应用、Serverless、代理服务
- **练习**：`npm create hono@latest` 创建项目，跑起 Hello World

---

### 模块 2：路由系统（1 天）
**面试可答**：Hono 有 5 种路由器，RegExpRouter 最快，SmartRouter 自动选择最优。

- 基础路由：`app.get()` / `app.post()` / `app.put()` / `app.delete()`
- 路由参数：`/posts/:id` → `c.req.param('id')`
- 查询参数：`?page=1` → `c.req.query('page')`
- 路由分组：`app.route('/api', apiRouter)`
- 5 种路由器对比：
  | 路由器 | 特点 | 适用场景 |
  |--------|------|----------|
  | RegExpRouter | 最快，单次正则匹配 | 默认首选 |
  | TrieRouter | 支持所有模式 | RegExpRouter 不支持时的备选 |
  | SmartRouter | 自动选择最优 | 默认使用 |
  | LinearRouter | 注册极快 | 每次请求都初始化的场景 |
  | PatternRouter | 体积最小 | 资源受限环境 |
- **练习**：实现 RESTful 风格的 `/users/:id` 路由

---

### 模块 3：请求处理（1 天）
**面试可答**：通过 `c.req` 对象获取请求信息，支持 JSON/Form/文件等多种格式。

- Context 对象 `c`：请求处理的核心
- 获取请求数据：
  - `c.req.param('id')` - 路径参数
  - `c.req.query('page')` - 查询参数
  - `c.req.header('Authorization')` - 请求头
  - `c.req.json()` - JSON 请求体
  - `c.req.formData()` - 表单数据
  - `c.req.blob()` - 二进制数据
- 请求方法判断：`c.req.method`
- **练习**：实现一个接收 JSON 并返回处理结果的 POST 接口

---

### 模块 4：响应处理（1 天）
**面试可答**：Hono 提供 `c.text()`、`c.json()`、`c.html()` 等便捷方法，也支持原生 Response。

- 基础响应：
  - `c.text('Hello')` - 纯文本
  - `c.json({ ok: true })` - JSON
  - `c.html('<h1>Hello</h1>')` - HTML
  - `c.body(raw)` - 原始内容
- 状态码：`c.text('Created', 201)`
- 响应头：`c.header('X-Custom', 'value')`
- 重定向：`c.redirect('/new-url')`
- 流式响应：`c.stream()` / `c.streamText()`
- **练习**：实现文件下载接口（设置 Content-Type 和 Content-Disposition）

---

### 模块 5：中间件机制（1.5 天）
**面试可答**：中间件是 Hono 的核心扩展机制，`app.use()` 注册，洋葱模型执行。

- 中间件概念：请求 → 中间件1 → 中间件2 → 路由处理 → 响应
- 内置中间件：
  | 中间件 | 用途 |
  |--------|------|
  | `logger` | 请求日志 |
  | `cors` | 跨域配置 |
  | `basicAuth` / `bearerAuth` | 基础认证 |
  | `jwt` | JWT 认证 |
  | `bodyLimit` | 请求体大小限制 |
  | `compress` | 响应压缩 |
  | `etag` | ETag 缓存 |
  | `secureHeaders` | 安全头 |
  | `prettyJSON` | JSON 格式化 |
- 自定义中间件：
  ```ts
  const timing = async (c, next) => {
    const start = Date.now()
    await next()
    c.header('X-Response-Time', `${Date.now() - start}ms`)
  }
  app.use(timing)
  ```
- 中间件作用范围：`app.use('/api/*', middleware)`
- **练习**：实现请求耗时统计中间件 + JWT 认证中间件

---

### 模块 6：TypeScript 与类型安全（1 天）
**面试可答**：Hono 一等公民 TypeScript 支持，路径参数自动推导为字面量类型。

- 路径参数类型推导：`/posts/:id` 自动推导为 `{ id: string }`
- 类型化 Context：
  ```ts
  type Env = {
    Variables: { userId: string }
    Bindings: { DB: D1Database }
  }
  const app = new Hono<Env>()
  ```
- Validator：请求参数校验
  ```ts
  import { z } from 'zod'
  import { zValidator } from '@hono/zod-validator'
  
  app.post('/users', zValidator('json', z.object({
    name: z.string(),
    email: z.string().email()
  })), (c) => {
    const data = c.req.valid('json')
    // data 有完整类型
  })
  ```
- **练习**：用 Zod 校验用户输入，实现类型安全的 CRUD 接口

---

### 模块 7：多运行时适配与部署（1 天）
**面试可答**：Hono 通过 Adapter 模式支持多平台，应用代码统一，入口文件不同。

- 支持的运行时：
  - Cloudflare Workers / Pages
  - Deno
  - Bun
  - Node.js
  - AWS Lambda / Lambda@Edge
  - Vercel / Netlify
  - Fastly Compute
  - Azure Functions / Google Cloud Run
- 平台特定功能（通过 Adapter）：
  ```ts
  // Cloudflare Workers WebSocket
  import { upgradeWebSocket } from 'hono/cloudflare-workers'
  
  app.get('/ws', upgradeWebSocket((c) => ({
    onMessage(evt) { /* ... */ }
  })))
  ```
- 部署实践：
  - Cloudflare Workers：`wrangler deploy`
  - Deno：`deno deploy`
  - Node.js：`node server.js`
- **练习**：同一个应用分别部署到 Cloudflare Workers 和 Node.js

---

### 模块 8：RPC 模式与全栈应用（1 天）
**面试可答**：Hono RPC 模式让客户端和服务端共享类型定义，实现端到端类型安全。

- Hono Client `hc`：
  ```ts
  // 服务端定义
  const routes = app.get('/api/users', (c) => c.json(users))
  export type AppType = typeof routes
  
  // 客户端调用
  import { hc } from 'hono/client'
  import type { AppType } from '../server'
  
  const client = hc<AppType>('http://localhost:3000')
  const res = await client.api.users.$get()
  const data = await res.json() // 自动推导类型
  ```
- JSX / HTML 模板：服务端渲染
- SSG：静态站点生成
- **练习**：实现前后端类型共享的 Todo 应用

---

## 🕹️ 实践项目：RESTful API 服务

**功能清单**（覆盖全部核心知识点）：
- 用户认证：JWT 登录/注册
- CRUD 接口：用户管理、文章管理
- 中间件：日志、CORS、认证、参数校验
- 错误处理：统一错误响应格式
- 数据校验：Zod Schema
- 单元测试：Hono 内置测试工具

**项目结构建议**：
```
/src
  index.ts          # 入口文件
  routes/
    auth.ts         # 认证路由
    users.ts        # 用户路由
    posts.ts        # 文章路由
  middleware/
    auth.ts         # JWT 认证中间件
    logger.ts       # 日志中间件
    validator.ts    # 参数校验中间件
  types/
    index.ts        # 类型定义
  utils/
    response.ts     # 统一响应格式
```

---

## 📖 学习资源

- 官方文档：https://hono.dev/docs/
- GitHub：https://github.com/honojs/hono
- 示例代码：https://github.com/honojs/examples

---

## 📝 文档目录

| 序号 | 文件 | 内容 |
|------|------|------|
| 01 | 01-概述与快速入门.md | Hono 理念、特性、Hello World |
| 02 | 02-路由系统.md | 5 种路由器、路由参数、路由分组 |
| 03 | 03-请求处理.md | Context、参数获取、请求体解析 |
| 04 | 04-响应处理.md | JSON/HTML/流式响应、状态码 |
| 05 | 05-中间件机制.md | 内置中间件、自定义中间件、洋葱模型 |
| 06 | 06-类型安全与校验.md | TypeScript、Zod、Validator |
| 07 | 07-多运行时适配.md | 各平台 Adapter、部署实践 |
| 08 | 08-RPC与全栈.md | Hono Client、类型共享、SSG |
| 09 | 09-实战项目.md | 完整 RESTful API 项目 |
