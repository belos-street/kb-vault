# 09 实战A：Agent 后端服务

> 所属大纲：[readme.md](../readme.md) ｜ 预计：2 天 ｜ 前置：03（SSE）、04（中间件）、07（部署）

**一句话定位**：面向 AI Agent 场景的后端——SSE 流式输出、LLM 代理、MCP 接入，Agent 开发工程师的主战场。

**面试可答**：SSE 用 `c.streamSSE()` 做 token 级推送（断开用 `onAbort` 取消上游）；MCP 服务通过官方 TS SDK 的 Streamable HTTP transport 暴露 Tools；网关层用 API Key 认证 + 限流保护成本敏感的 LLM 调用。

---

## 1. 项目蓝图

**技术栈**：Bun + TypeScript strict + oxlint/oxfmt；部署选 Node/Bun（长连接友好，07 篇）

```
/src
  index.ts            # 入口（Bun.serve）+ 中间件挂载
  routes/
    chat.ts           # SSE 对话接口
    mcp.ts            # MCP Streamable HTTP 挂载
  middleware/
    api-key.ts        # API Key 认证
    rate-limit.ts     # 固定窗口限流（演示），生产换 Redis
  services/
    llm.ts            # LLM 流式代理（依赖注入，可测）
    session.ts        # 会话上下文（Map 演示 / Redis 生产）
```

```bash
bun add openai zod
bun add @modelcontextprotocol/server @modelcontextprotocol/hono
```

> 💡 LLM SDK 选择：OpenAI 官方 SDK 兼容所有 OpenAI 协议服务（含 GLM 等国产兼容端点），换 `baseURL` 即可。

## 2. LLM 流式代理：`services/llm.ts`

**依赖注入**是这篇的关键设计（呼应「关键函数依赖注入可测」）：`createLLMService` 接收客户端实例，测试时换 mock。

```ts
// services/llm.ts
import OpenAI from 'openai'

export type LLMClient = Pick<OpenAI['chat']['completions'], 'create'>

export function createLLMService(client: LLMClient, model = 'gpt-5.6-sol') {
  return {
    async *stream(messages: { role: 'user' | 'system'; content: string }[], signal: AbortSignal) {
      const completion = await client.chat.completions.create(
        { model, messages, stream: true },
        { signal },   // 客户端断开 → 上游也取消，不浪费 token
      )
      for await (const chunk of completion) {
        const delta = chunk.choices[0]?.delta?.content
        if (delta) yield delta
      }
    },
  }
}

export type LLMService = ReturnType<typeof createLLMService>
```

### 2.1 会话上下文：`services/session.ts`

```ts
export function createSessionStore() {
  const store = new Map<string, { role: 'user' | 'system'; content: string }[]>()

  return {
    history: (key: string) => store.get(key) ?? [],
    append: (key: string, msg: { role: 'user' | 'system'; content: string }) =>
      store.set(key, [...(store.get(key) ?? []), msg].slice(-20)), // 截断防上下文膨胀
  }
}
```

- demo 用 Map（单实例内存态）；生产换 Redis（多实例共享 + TTL），接口不变只换实现
- 在 chat 路由中先 `session.append(sessionId, { role: 'user', content })`，再以 `[...session.history(sessionId)]` 调 `llm.stream`（作为练习延伸接入）

## 3. SSE 对话接口：`routes/chat.ts`

```ts
// routes/chat.ts
import { Hono } from 'hono'
import { streamSSE } from 'hono/streaming'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import type { LLMService } from '../services/llm'

const chatSchema = z.object({
  messages: z
    .array(z.object({ role: z.enum(['user', 'system']), content: z.string().min(1) }))
    .min(1),
})

export const chat = new Hono<{ Variables: { llm: LLMService } }>()

chat.post('/chat', zValidator('json', chatSchema), async (c) => {
  const { messages } = c.req.valid('json')
  const llm = c.get('llm')            // index.ts 注入（见第 5 节）
  const ac = new AbortController()

  return streamSSE(c, async (stream) => {
    stream.onAbort(() => ac.abort())  // 客户端断开 → 取消上游
    try {
      let id = 0
      for await (const token of llm.stream(messages, ac.signal)) {
        await stream.writeSSE({ id: String(id++), event: 'delta', data: JSON.stringify({ token }) })
      }
      await stream.writeSSE({ event: 'done', data: '[DONE]' })
    } catch (err) {
      // 头已发出，状态码改不了——错误只能在流内表达
      await stream.writeSSE({ event: 'error', data: JSON.stringify({ message: 'upstream failed' }) })
    }
  })
})
```

三个生产要点（03 篇原理在此兑现）：

1. **取消链路**：`onAbort → AbortController → SDK signal`，客户端关页面就停止烧钱
2. **错误在流内表达**：`event: 'error'` 事件 + 客户端按 event 名分流
3. **限流在进入流之前**：LLM 成本敏感，网关层必须先拦（第 4 节）

## 4. API Key 认证 + 限流

```ts
// middleware/api-key.ts
import { createMiddleware } from 'hono/factory'

export const apiKey = createMiddleware(async (c, next) => {
  const key = c.req.header('X-Api-Key')
  if (key !== c.env.API_KEY) {
    return c.json({ code: 'UNAUTHORIZED', message: 'invalid api key' }, 401)
  }
  await next()
})
```

```ts
// middleware/rate-limit.ts（固定窗口演示；生产换 Redis INCR+EXPIRE / 滑动窗口）
import { createMiddleware } from 'hono/factory'

const hits = new Map<string, { count: number; resetAt: number }>()

export const rateLimit = (max: number, windowMs: number) =>
  createMiddleware(async (c, next) => {
    const key = c.req.header('X-Api-Key') ?? 'anon'
    const bucket = hits.get(key)
    const now = Date.now()
    if (!bucket || now > bucket.resetAt) {
      hits.set(key, { count: 1, resetAt: now + windowMs })
    } else if (++bucket.count > max) {
      return c.json({ code: 'RATE_LIMITED', message: 'too many requests' }, 429)
    }
    await next()
  })
```

## 5. 组装入口：`index.ts`

```ts
import { Hono } from 'hono'
import OpenAI from 'openai'
import { createLLMService, type LLMService } from './services/llm'
import { chat } from './routes/chat'
import { mcpApp } from './routes/mcp'
import { apiKey } from './middleware/api-key'
import { rateLimit } from './middleware/rate-limit'

type Env = {
  Variables: { llm: LLMService }
  Bindings: { API_KEY: string; LLM_API_KEY: string; LLM_BASE_URL: string }
}

const app = new Hono<Env>()

app.use('/api/*', apiKey, rateLimit(30, 60_000))
app.use(async (c, next) => {
  c.set('llm', createLLMService(new OpenAI({ apiKey: c.env.LLM_API_KEY, baseURL: c.env.LLM_BASE_URL })))
  await next()
})
app.route('/api', chat)
app.route('/', mcpApp)

export default app   // Bun 托管；Node 用 @hono/node-server serve
```

## 6. MCP 接入：`routes/mcp.ts`

```ts
// routes/mcp.ts
import { McpServer, WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/server'
import { createMcpHonoApp, localhostHostValidation } from '@modelcontextprotocol/hono'
import { z } from 'zod'

const server = new McpServer({ name: 'agent-api', version: '0.1.0' })

server.registerTool('search_docs', {
  description: '检索知识库文档',
  inputSchema: { query: z.string() },
}, async ({ query }) => ({
  content: [{ type: 'text', text: `检索结果：${query}` }],
}))

const transport = new WebStandardStreamableHTTPServerTransport({
  sessionIdGenerator: undefined, // 无会话模式（demo）；生产按 session 建立并管理生命周期
})
await server.connect(transport)

export const mcpApp = createMcpHonoApp()
mcpApp.use('*', localhostHostValidation()) // 本机开发的 DNS rebinding 防护
mcpApp.all('/mcp', (c) =>
  transport.handleRequest(c.req.raw, { parsedBody: c.get('parsedBody') }),
)
```

> 📌 版本基线：MCP TS SDK v2（2026-07-28 规范同期发布）已拆分为分包——服务端用 `@modelcontextprotocol/server`，框架适配用 `@modelcontextprotocol/hono`（`createMcpHonoApp` 内建 JSON body 解析并放入 `c.get('parsedBody')`，`handleRequest` 直接吃标准 Request，贴合「一切皆 fetch」）。v1.x 旧代码走 node-style 集成（`@modelcontextprotocol/sdk` 单包 + `StreamableHTTPServerTransport` 消费原生 `req/res`，配合 `@hono/node-server` 的 `c.env.incoming/outgoing` 与 `RESPONSE_ALREADY_SENT` 哨兵——从 `@hono/node-server/utils/response` 导入），仅在迁移旧代码时了解。

**调试**：`bunx @modelcontextprotocol/inspector` 打开 Inspector，Transport 选 Streamable HTTP、URL 填 `http://localhost:3000/mcp`，能看到 Tools 列表并试调用。

**A2A**：同为 Agent 互联协议（HTTP 承载），接入思路相同——以官方 A2A SDK 现状为准，本文不展开。

---

## 7. ✍️ 练习：完成并验证

**要求**：跑通 chat SSE 全链路（curl 客户端：`curl -N` 观察 delta 流）；暴露一个自定义 MCP Tool 并用 Inspector 调通；限流验证 30 次/分钟。

**提示**：`curl -N -X POST localhost:3000/api/chat -H 'X-Api-Key: ...' -d '{"messages":[{"role":"user","content":"hi"}]}'`；中途 Ctrl+C 观察服务端是否 abort 上游（SDK 日志/账单）。

**预期效果**：delta 事件逐 token 到达后收到 done；Inspector 列出 `search_docs` 并可执行；第 31 次请求得 429。

---

## 8. 🔗 参考资料

- Hono Streaming：https://hono.dev/docs/helpers/streaming
- MCP TypeScript SDK（v2 分包）：https://github.com/modelcontextprotocol/typescript-sdk
- MCP Inspector：https://github.com/modelcontextprotocol/inspector
- OpenAI Node SDK（streaming）：https://github.com/openai/openai-node

---

## 📌 小结

- 三条生产线：LLM 流式（SSE + abort 链路）、MCP 暴露（Streamable HTTP）、网关防护（API Key + 限流）
- 依赖注入 LLM client——不做 DI 就没法 mock 成本敏感的外部依赖
- 长连接场景部署 Node/Bun（07 篇结论）
