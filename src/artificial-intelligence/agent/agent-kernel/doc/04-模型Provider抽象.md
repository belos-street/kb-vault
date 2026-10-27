# 04 — 模型 Provider 抽象

> **状态**：v2 · 已吸收第一轮评审 · 随 v0.1 实现迭代
> **关联**：[01-总体架构设计](01-总体架构设计.md)（错误模型） · [02-核心循环与事件系统](02-核心循环与事件系统.md) · [03-插件系统与钩子设计](03-插件系统与钩子设计.md)

## 1. 统一接口

```ts
interface ModelProvider {
  // 唯一标识，如 'openai-compatible' / 'anthropic'
  id: string
  // [v0.2] 能力声明：压缩插件与模型路由的依赖（不声明则按最保守处理）
  capabilities?: ProviderCapabilities
  // 流式是唯一执行形态（流式优先原则，见 01）
  stream(req: ModelRequest): AsyncIterable<ModelChunk>
  // 可选：token 估算（预算熔断用）
  countTokens?(messages: Message[]): Promise<number>
}

interface ProviderCapabilities {
  contextWindow: number
  supportsTools: boolean
  supportsReasoning: boolean
  supportsVision: boolean
}

interface ModelRequest {
  model: string
  messages: Message[]
  tools: ToolSpec[]
  temperature?: number
  maxTokens?: number
  signal?: AbortSignal
  // [v0.2] 透传口：reasoning effort / cache_control / tool_choice /
  // parallel_tool_calls / response_format 等——避免每加一个模型特性就改内核接口
  providerOptions?: Record<string, unknown>
}
```

> 💡 设计决策：没有非流式的 `invoke`。非流式需求 = `for await` 收集最后一个文本块，由内核提供工具函数，Provider 只实现一条路径。

## 2. 消息与内容块

```ts
type Message =
  | SystemMessage      // { role: 'system'; content: string }
  | UserMessage        // { role: 'user'; content: UserContent[] }
  | AssistantMessage   // { role: 'assistant'; content: AssistantContent[] }
  | ToolMessage        // { role: 'tool'; toolCallId: string; content: ContentBlock[] }

// v0.1 即定协议（后加会破坏消息协议），image 实现可后置
type UserContent =
  | { type: 'text'; text: string }
  | { type: 'image'; source: ImageSource }

type AssistantContent =
  | { type: 'text'; text: string }
  | { type: 'tool-use'; call: ToolCall }
  | { type: 'reasoning'; text: string }
```

- 消息类型是**内核协议**，Provider 负责翻译成各家 API 格式
- `ToolMessage` 用 `toolCallId` 关联，不依赖数组顺序——Anthropic 要求显式关联，OpenAI 按顺序，取交集用 id
- **reasoning 的语义**：`provider-private`，内核只透传不解释；Claude 的 thinking 签名校验等细节由 Anthropic Provider 自行处理

## 3. 流式 chunk 协议

| chunk 类型 | 含义 | 产出次数 |
| --- | --- | --- |
| `text-delta` | 文本增量 | 0..n |
| `reasoning-delta` | 思维链增量 | 0..n |
| `tool-call-started` | 工具调用开始（id + name 已知，参数未完） | 0..n |
| `tool-call` | **聚合完成**的工具调用 | 0..n |
| `usage` | token 用量 | 0..1 |
| `done` | 结束标记（含 finish reason） | 1 |

```ts
type ModelChunk =
  | { type: 'text-delta'; delta: string }
  | { type: 'reasoning-delta'; delta: string }
  | { type: 'tool-call-started'; id: string; name: string }
  | { type: 'tool-call'; call: ToolCall }
  | { type: 'usage'; usage: Usage }
  | { type: 'done'; finishReason: FinishReason }

type FinishReason =
  | 'stop'
  | 'tool-calls'
  | 'length'
  | 'content-filter'
  | 'error'
```

两条关键决策：

- **tool-call 的增量聚合在 Provider 内完成**。SSE 里工具调用参数是分片 JSON（`arguments` 逐段到达），内核不应感知传输细节——内核只见完整 `ToolCall`
- **`tool-call-started` 独立成事件**：UI（TUI）在参数流完之前就能显示「正在读文件…」，这是 coding agent 体验的关键；没有它只能等参数全部聚合

### finishReason 映射规则

```text
choice.finish_reason === 'tool_calls'  → 'tool-calls'
choice.finish_reason === 'length'      → 'length'
choice.finish_reason === 'content_filter' → 'content-filter'
choice.finish_reason === 'stop'        → 若聚合出了 tool-call 则 'tool-calls'，
                                          否则 'stop'
```

> ⚠️ 部分兼容端会出现「`stop` 但带 `tool_calls`」的不一致——以「是否聚合出 tool-call」为最终判据，不信 finish_reason 单一来源。

## 4. Provider 错误归一（对接 01 错误模型）

Provider 必须把各家 API 的错误翻译成 `ProviderError` 三分类，否则 [03](03-插件系统与钩子设计.md) 的重试插件无法判断：

| 分类 | 典型来源 | retryable | 处理 |
| --- | --- | --- | --- |
| `retryable` | 429 / 5xx / 网络瞬断 / 超时 | true | 重试插件处理（退避） |
| `fatal` | 401 / 403 / 参数错误 / 模型不存在 | false | 直接中止 |
| `context-overflow` | 上下文超长 | false（原样重试必再失败） | 触发压缩插件，缩上下文后重发 |

```ts
class ProviderError extends Error {
  constructor(
    message: string,
    public readonly kind: 'retryable' | 'fatal' | 'context-overflow',
    public readonly status?: number,
  ) {
    super(message)
  }
}
```

分层约定：**传输层重试在 Provider，业务语义重试在钩子**——Provider 只做连接级重试（如 TCP 断开），429 退避策略属于 `wrapModelCall` 插件的职责。

## 5. Provider 适配策略

| 适配器 | 覆盖模型 | 说明 |
| --- | --- | --- |
| `openai-compatible` | GPT / GLM / DeepSeek / Qwen / Kimi | `baseURL` + `apiKey` 可配，一个适配器吃掉大部分模型 |
| `anthropic` | Claude | `tool_use` 块语义与 OpenAI 不同，单独实现 |
| `ollama` | 本地模型 | v1.0+ 可选 |

### 流式解析草图（openai-compatible）

```ts
// 伪代码：SSE 流 → ModelChunk 的翻译过程，省略错误归一与重连
async function* stream(req: ModelRequest): AsyncIterable<ModelChunk> {
  const res = await fetch(`${baseURL}/chat/completions`, {
    method: 'POST',
    body: JSON.stringify({
      model: req.model,
      messages: toOpenAIMessages(req.messages),
      tools: req.tools.length ? toOpenAITools(req.tools) : undefined,
      stream: true,
      stream_options: { include_usage: true },
    }),
    signal: req.signal,
  })

  const aggregator = new ToolCallAggregator()   // 分片聚合器
  let usage: Usage | undefined
  let lastFinishReason: OpenAIFinishReason = 'stop'

  for await (const sse of sseLines(res.body)) {
    const chunk = JSON.parse(sse)
    if (chunk.choices[0]?.finish_reason) lastFinishReason = chunk.choices[0].finish_reason
    for (const choice of chunk.choices) {
      const delta = choice.delta
      if (delta.content) yield { type: 'text-delta', delta: delta.content }
      if (delta.tool_calls) {
        // 分片到达：先 started（id+name），聚合完成后发完整 tool-call
        for (const ev of aggregator.push(delta.tool_calls)) yield ev
      }
    }
    if (chunk.usage) usage = toUsage(chunk.usage)
  }

  const calls = aggregator.done()
  for (const call of calls) yield { type: 'tool-call', call }
  if (usage) yield { type: 'usage', usage }      // 兼容端可能不回 usage，不得 yield undefined
  // 映射规则见第 3 节：'stop' 但聚合出了 tool-call → 'tool-calls'
  yield { type: 'done', finishReason: resolveFinishReason(lastFinishReason, calls) }
}
```

## 6. 工具调用协议差异

| 维度 | OpenAI 系 | Anthropic |
| --- | --- | --- |
| 请求格式 | `tools: [{ type: 'function', function: {...} }]` | `tools: [{ name, input_schema }]` |
| 响应位置 | `delta.tool_calls[]`（index 分片聚合） | `content_block`（`tool_use` 块） |
| 结果回传 | `role: 'tool'` + `tool_call_id` | `role: 'user'` + `tool_result` 块 |
| 并行调用 | 同一响应多个 tool_calls | 多个 tool_use 块 |

差异全部封装在各自 Provider 内，内核与工具系统不感知。

## 7. 对照现有方案

| 维度 | 本内核 | LangChain `initChatModel` | Vercel AI SDK |
| --- | --- | --- | --- |
| 形态 | 插件注册 | 字符串模型名动态实例化 | provider 函数式构造 |
| 流式 | 唯一路径 | `stream` / `invoke` 双路径 | `streamText` 为主 |
| 工具聚合 | Provider 内完成 | `AIMessageChunk` 聚合暴露给上层 | `streamText` 内聚合 |
| 透传口 | `providerOptions` | `modelKwargs` 等零散配置 | `providerOptions` 统一 |

> 💡 Vercel AI SDK 的 `providerOptions` 与统一 result 形态值得在定稿接口前精读一轮。

## 8. 开放问题（标定稿版本）

- [ ] `[v0.1]` 多轮对话中 `reasoning` 内容是否回传历史（Claude thinking 块的回传规则由 Anthropic Provider 决定，内核只透传）
- [ ] `[v0.2]` token 计数：各 API 端点 vs 本地估算器（精度 vs 依赖）
- [x] 已定：错误归一三分类为 Provider 强制契约（对接 [01](01-总体架构设计.md) 错误模型）
- [x] 已定：`tool-call-started` chunk 进 v0.1 协议
- [x] 已定：`UserContent` v0.1 定 `text | image` 协议（image 实现可后置）
