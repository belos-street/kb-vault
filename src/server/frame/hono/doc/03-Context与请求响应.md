# 03 Context 与请求响应

> 所属大纲：[readme.md](../readme.md) ｜ 预计：1 天 ｜ 前置：02

**一句话定位**：吃透贯穿请求生命周期的 Context `c`——API 只需速过，重点在「薄封装」设计与流式响应。

**面试可答**：`c.req` 读取请求数据，`c.json()`/`c.text()` 等构造响应（本质是标准 Response 工厂）；流式场景用 `hono/streaming` 的 `streamSSE`。

---

## 1. Context API 速过

API 列表不值得背，看一眼即可（细节随查 [Context 官方文档](https://hono.dev/docs/api/context)）：

```ts
app.post('/echo', async (c) => {
  // 读请求（速查）
  const id = c.req.param('id')          // 路径参数（string）
  const page = c.req.query('page')      // 查询参数（string | undefined）
  const ua = c.req.header('User-Agent') // 请求头
  const body = await c.req.json()       // JSON body（惰性解析，只解析一次）
  const form = await c.req.formData()   // multipart / urlencoded
  const raw = c.req.raw                 // 逃逸舱：拿原生 Request（Web 标准）

  // 构造响应（速查）
  return c.json({ id, page, ua }, 201, { 'X-Request-Id': 'abc' })
})
```

设计层面真正要记住的是两点：

1. **`c.json()` 返回的就是标准 `Response`**——它不是 Hono 私有对象，可以直接 `return`，也可以被任何接受 fetch Response 的工具消费
2. **`c` 是每请求新建的轻量对象**，body 等大资源惰性缓存（第一次 `json()` 才解析，之后复用）

> ⚠️ 一个常见坑：`c.status()` / `c.header()` 必须在构造响应**之前**调用；一旦你返回了手动 `new Response(...)`，这些设置不会生效。

## 2. 流式响应：本篇重点

对 LLM token 推送、日志订阅、长任务进度这类场景，流式是刚需。`hono/streaming` 提供三个 helper：

| helper | 场景 |
|--------|------|
| `stream()` | 二进制流 |
| `streamText()` | 纯文本流（自动 chunk） |
| `streamSSE()` | **SSE 事件流**（重点） |

### 2.1 streamSSE：token 级推送的标准解

```ts
import { Hono } from 'hono'
import { streamSSE } from 'hono/streaming'

const app = new Hono()

app.get('/sse', (c) => {
  return streamSSE(c, async (stream) => {
    let id = 0
    while (!stream.aborted) {
      await stream.writeSSE({
        id: String(id++),
        event: 'tick',            // 客户端按 event 名分流，缺省为 'message'
        data: JSON.stringify({ ts: Date.now() }),
        retry: 3000,              // 断线后客户端重连间隔（ms）
      })
      await stream.sleep(1000)    // 不阻塞事件循环的 sleep
    }
  })
})
```

要点：

- **协议格式**由 helper 代劳：响应头 `Content-Type: text/event-stream`、`data:`/`event:`/`id:` 分帧都自动处理
- **`stream.aborted` / `stream.onAbort()`**：客户端断开时及时退出循环并清理资源（09 篇 LLM 代理用它取消上游请求）
- **`stream.sleep()`** 用的是不阻塞事件循环的定时——边缘运行时里同步 sleep 会占用 CPU 时间预算

### 2.2 SSE vs WebSocket 怎么选

| 维度 | SSE | WebSocket |
|------|-----|-----------|
| 方向 | 单向（服务端 → 客户端） | 双向 |
| 协议 | 纯 HTTP，天然过代理/网关 | 独立协议，需要 Upgrade |
| 重连/心跳 | 浏览器 EventSource 内建 | 自己实现 |
| 典型场景 | LLM 流式输出、进度推送 | 协作编辑、聊天室 |

Agent 后端（LLM 流式）几乎都是 SSE：单向 + HTTP 兼容 + 断线重连免费。双向才考虑 WebSocket。

---

## 3. ✍️ 练习：echo 接口 + SSE 时钟

**要求**：实现 `POST /echo`，接收 `{ text: string }` 返回 `{ reversed: string }`（text 倒序）；实现 `GET /sse`，每秒推送一次服务器时间。

**提示**：倒序用 `[...text].reverse().join('')`（避免 emoji 被拆散）；SSE 循环参考 2.1 节。

**预期效果**：`curl -X POST -d '{"text":"hono"}' localhost:3000/echo` 返回 `{"reversed":"onoh"}`；浏览器打开 `/sse` 能看到事件持续到达，断网重连后自动恢复。

---

## 4. 💬 面试问答

**Q1：`c.json()` 和直接 `new Response()` 有什么区别？**

没有本质区别——前者是后者的工厂（自动序列化 + Content-Type）。需要完全控制字节流/Headers 时用原生 Response；`c.req.raw` 是对称的「逃逸舱」。

**Q2：SSE 和 WebSocket 怎么选？LLM 流式输出为什么用 SSE？**

单向推送选 SSE：纯 HTTP 语义，代理/网关/鉴权中间件全部复用，EventSource 自带重连。LLM 输出是典型单向流，双向通道（WS）反而带来连接管理与协议适配成本。

（追问：客户端断开后服务端怎么感知？——`stream.aborted` / `onAbort`，应及时取消上游请求，避免为已断开的连接继续消耗 token。）

**Q3：为什么 `c.status(201)` 有时会「失效」？**

`c.status/c.header` 修改的是 Context 上的暂存状态，仅在随后由 `c.json()/c.text()` 等工厂构造响应时生效；一旦返回手动 `new Response`，暂存不生效。顺序敏感是薄封装的代价。

---

## 5. 🔗 参考资料

- Context：https://hono.dev/docs/api/context
- Streaming helpers：https://hono.dev/docs/helpers/streaming
- MDN Server-Sent Events：https://developer.mozilla.org/zh-CN/docs/Web/API/Server-sent_events

---

## 📌 小结

- API 速过即可，心智模型记两条：c.json = Response 工厂；c 是惰性轻封装
- `c.status/c.header` 在构造响应之前调用
- 流式重点：`streamSSE` + `aborted/onAbort` 资源清理；LLM 场景 = SSE
