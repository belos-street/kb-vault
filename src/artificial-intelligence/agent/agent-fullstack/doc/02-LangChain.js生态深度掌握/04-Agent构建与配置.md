# 2.4 Agent 构建与配置

> 深入理解 `createAgent` 的完整配置体系，掌握从基础到高级的 Agent 构建技巧

> **模块**：2.4 | **预计时间**：3h | **面试可答**：createAgent 配置项全景、System Prompt 设计、responseFormat 原理、invoke vs streamEvents、Checkpointer 接入

## 学习目标

- 掌握 `createAgent` 的完整配置项与使用场景
- 学会 System Prompt 的设计原则与优化技巧
- 理解 Structured Output（`responseFormat`）的实现方式
- 掌握 Agent 调用模式：`invoke` vs `streamEvents`
- 理解 Agent 状态管理与 Thread ID 的作用

---

## 1. Agent 核心概念

### 1.1 什么是 Agent

Agent = Model + Harness 的组合体。`createAgent` 是一个高度可配置的 Harness，它将模型、工具、提示词、中间件、记忆等组件组合成一个自主决策循环。

```mermaid
flowchart TD
    Start([开始])
    Model[Model 推理决策]
    HasTool{Has Tool Call?}
    Execute[Execute Tool]
    Return[Return Response]
    End([结束])

    Start --> Model
    Model --> HasTool
    HasTool -->|Yes| Execute
    HasTool -->|No| Return
    Execute --> Model
    Return --> End
```

### 1.2 最小完整 Agent

```typescript
import { createAgent, tool } from "langchain";
import * as z from "zod";

const getWeather = tool(
  ({ city }) => `It's sunny in ${city}.`,
  {
    name: "get_weather",
    description: "Get weather for a city.",
    schema: z.object({ city: z.string() }),
  }
);

const agent = createAgent({
  model: "openai:gpt-5.4",
  tools: [getWeather],
  systemPrompt: "You are a helpful weather assistant. Be concise.",
});

const result = await agent.invoke({
  messages: [
    { role: "user", content: "What's the weather in San Francisco?" },
  ],
});
```

---

## 2. `createAgent` 完整配置项

### 2.1 配置项一览

```typescript
const agent = createAgent({
  // === 必需 ===
  model: "openai:gpt-5.4",           // 模型（字符串或实例）

  // === 可选 - 基础 ===
  tools: [tool1, tool2],             // 工具列表
  systemPrompt: "...",               // 系统提示词
  name: "my_agent",                  // Agent 标识名（多 Agent 时有用）

  // === 可选 - 状态管理 ===
  checkpointer: new MemorySaver(),   // 记忆/持久化
  store: new InMemoryStore(),        // 长期记忆存储

  // === 可选 - 上下文 ===
  contextSchema: z.object({ ... }),  // 运行时上下文 Schema

  // === 可选 - 结构化输出 ===
  responseFormat: MySchema,          // 结构化响应格式

  // === 可选 - 扩展 ===
  middleware: [middleware1],         // 中间件列表
  stateSchema: CustomState,          // 自定义状态 Schema
});
```

### 2.2 各配置项详解

**model** — 模型选择（必需）

```typescript
// 字符串格式（推荐）
model: "anthropic:claude-sonnet-4-6"

// 预初始化实例
const model = await initChatModel("google-genai:gemini-3.1-pro-preview", {
  temperature: 0.5,
});
model: model
```

**tools** — 工具列表

```typescript
tools: [searchDatabase, getWeather, sendEmail]

// 也可以动态添加（通过 Middleware）
```

**systemPrompt** — 系统提示词

```typescript
// 字符串
systemPrompt: "You are a helpful assistant."

// 模板字符串
systemPrompt: `
You are a customer support agent for a SaaS company.

Rules:
- Always be polite and professional
- If you cannot solve the issue, escalate to a human agent
- Never share internal system details
`
```

**name** — Agent 标识

```typescript
// 在单 Agent 时可省略，多 Agent 子系统中有用
name: "customer_support_agent"
```

**checkpointer** — 记忆持久化

```typescript
// 开发环境：内存级
checkpointer: new MemorySaver()

// 生产环境：数据库级
import { PostgresSaver } from "@langchain/langgraph-checkpoint-postgres";
checkpointer: PostgresSaver.fromConnString(DB_URI)
```

**contextSchema** — 运行时上下文 Schema

```typescript
contextSchema: z.object({
  userId: z.string(),
  userRole: z.enum(["admin", "user"]),
  tenantId: z.string(),
})
```

**responseFormat** — 结构化输出

```typescript
const Answer = z.object({
  summary: z.string(),
  confidence: z.number(),
  sources: z.array(z.string()),
});

responseFormat: Answer
```

**middleware** — 中间件列表

```typescript
middleware: [
  todoListMiddleware(),
  modelRetryMiddleware(),
  piiMiddleware("email", { strategy: "redact", applyToInput: true }),
]
```

**stateSchema** — 自定义状态 Schema

```typescript
import { createAgent } from "langchain";
import { z } from "zod";

// 自定义 Agent State（高级用法）
const customState = z.object({
  messages: z.array(z.any()),
  // 添加自定义状态字段
  currentTopic: z.string().optional(),
  confidence: z.number().optional(),
});

const agent = createAgent({
  model: "openai:gpt-5.4",
  tools: [],
  stateSchema: customState,
});
```

> `stateSchema` 用于扩展 Agent 的默认 State（默认只包含 `messages`），适合需要在 Agent 循环中追踪额外状态的场景。大多数情况下无需自定义。

---

## 3. System Prompt 设计原则

### 3.1 好的 System Prompt 结构

```typescript
systemPrompt: `
You are a [角色]，负责[任务]。

## 能力范围
- [能力 1]
- [能力 2]
- [能力 3]

## 行为规则
1. [规则 1]
2. [规则 2]
3. [规则 3]

## 输出格式
[期望的输出格式说明]
`
```

**示例 - 客服 Agent**：

```typescript
systemPrompt: `
You are a customer support agent for CloudStorage Pro.

## Capabilities
- Check account status and billing
- Reset passwords
- Guide users through common troubleshooting
- Escalate complex issues to human agents

## Rules
1. Always verify user identity before performing account changes
2. Be empathetic and professional
3. If you cannot resolve the issue within 3 interactions, offer escalation
4. Never share internal system information or API keys

## Escalation Format
To escalate, use: "I'll connect you with a specialist. Reference: {brief_reason}"
`
```

### 3.2 动态 System Prompt

LangChain 没有内置的动态 System Prompt Middleware，而是通过自定义 Middleware 的 `beforeModel` 钩子实现：

```typescript
import { createAgent, createMiddleware, SystemMessage } from "langchain";
import * as z from "zod";

const dynamicPromptMiddleware = createMiddleware({
  name: "DynamicPromptMiddleware",
  beforeModel: (state, runtime) => {
    const userName = runtime.context?.userName;
    const today = new Date().toISOString().split("T")[0];
    // 在每次模型调用前注入动态 System Message
    return {
      messages: [
        new SystemMessage(`You are a helpful assistant.
Address the user as ${userName ?? "the user"}.
Today's date is ${today}.`),
        ...state.messages,
      ],
    };
  },
});

const agent = createAgent({
  model: "openai:gpt-5.4",
  tools: [getWeather],
  contextSchema: z.object({ userName: z.string() }),
  middleware: [dynamicPromptMiddleware],
});
```

### 3.3 System Prompt 优化技巧

| 原则 | 说明 | 示例 |
|------|------|------|
| **具体角色** | 给 Agent 明确的身份 | "You are a senior TypeScript developer" |
| **场景约束** | 明确什么能做、什么不能做 | "Never share internal system details" |
| **结构化** | 用标题和列表组织 | "## Rules", "## Capabilities" |
| **示例驱动** | 提供输入输出示例 | "User: ... Assistant: ..." |
| **格式规范** | 指定输出格式 | "Always respond in JSON format" |

---

## 4. Structured Output（结构化输出）

### 4.1 使用 Zod Schema

```typescript
import * as z from "zod";

const Answer = z.object({
  summary: z.string().describe("A brief summary of the answer"),
  confidence: z.number().min(0).max(1).describe("Confidence score"),
  sources: z.array(z.string()).describe("List of reference sources"),
});

const agent = createAgent({
  model: "openai:gpt-5.4",
  tools: [],
  responseFormat: Answer,
});

const result = await agent.invoke({
  messages: [
    { role: "user", content: "What are the latest AI trends?" },
  ],
});

// 直接获取结构化响应
console.log(result.structuredResponse);
// {
//   summary: "AI trends include...",
//   confidence: 0.9,
//   sources: ["source1.com", "source2.com"]
// }
```

### 4.2 嵌套结构

```typescript
const Actor = z.object({
  name: z.string().describe("Actor's full name"),
  role: z.string().describe("Character name in the movie"),
});

const MovieDetails = z.object({
  title: z.string().describe("Movie title"),
  year: z.number().describe("Release year"),
  cast: z.array(Actor).describe("Main cast members"),
  genres: z.array(z.string()).describe("Movie genres"),
  budget: z.number().nullable().describe("Budget in millions USD"),
});
```

### 4.3 包含原始消息

```typescript
const modelWithStructure = model.withStructuredOutput(Answer, {
  includeRaw: true,  // 同时返回原始 AIMessage
});

const result = await modelWithStructure.invoke("...");
console.log(result);
// {
//   raw: AIMessage { content: "...", usage_metadata: {...} },
//   parsed: { summary: "...", confidence: 0.9, sources: [...] }
// }
```

### 4.4 Schema 支持

| Schema 类型 | 运行时校验 | 说明 |
|------------|-----------|------|
| Zod Schema | ✅ | 推荐方式，类型安全 + 运行时校验 |
| JSON Schema | ❌（需手动） | 最大兼容性 |
| Standard Schema | ✅ | Valibot 等标准 Schema 库 |

---

## 5. Agent 调用模式

### 5.1 invoke — 同步调用

```typescript
const result = await agent.invoke(
  {
    messages: [
      { role: "user", content: "What's the weather in San Francisco?" },
    ],
  },
  {
    configurable: { thread_id: "thread-123" },
    context: { userId: "user-456" },
  }
);

// 获取最后一条消息
console.log(result.messages.at(-1)?.content);

// 获取结构化输出（如果配置了 responseFormat）
console.log(result.structuredResponse);
```

### 5.2 streamEvents — 流式调用

```typescript
// 流式获取 Agent 执行过程中的所有状态快照
const stream = await agent.streamEvents(
  {
    messages: [
      {
        role: "user",
        content: "Search for AI news and summarize the findings",
      },
    ],
  },
  { version: "v3" }
);

for await (const snapshot of stream.values) {
  const latestMessage = snapshot.messages.at(-1);
  if (latestMessage?.content) {
    if (latestMessage.type === "human") {
      console.log(`User: ${latestMessage.content}`);
    } else if (latestMessage.type === "ai") {
      console.log(`Agent: ${latestMessage.content}`);
    }
  } else if (latestMessage?.tool_calls?.length) {
    const toolCallNames = latestMessage.tool_calls.map(tc => tc.name);
    console.log(`Calling tools: ${toolCallNames.join(", ")}`);
  }
}
```

### 5.3 invoke vs streamEvents

| 特性 | invoke | streamEvents |
|------|--------|-------------|
| 返回时机 | 等待所有步骤完成 | 实时返回每一步 |
| 用户体验 | 等待完整响应 | 逐步展示进度 |
| 数据量 | 最终结果 | 所有中间状态 |
| 适用场景 | 简单问答、批处理 | 多工具调用、长时间任务 |
| Tool 调用 | 不可见 | 可见每个工具调用的过程 |

---

## 6. Agent 状态管理与 Thread ID

### 6.1 Thread ID 的作用

Thread ID 是 Agent 对话的标识符，用于：
- **持久化**：同一 Thread ID 的多轮调用共享消息历史
- **隔离**：不同 Thread ID 的对话互不干扰
- **恢复**：可以随时恢复之前的对话

```typescript
const agent = createAgent({
  model: "openai:gpt-5.4",
  tools: [getWeather],
  checkpointer: new MemorySaver(),  // 需要 Checkpointer 支持
});

const config = { configurable: { thread_id: "user-bob-conversation" } };

// 第一轮
let result = await agent.invoke(
  { messages: [{ role: "user", content: "Hi! My name is Bob." }] },
  config
);
// AI: "Hi Bob! Nice to see you here."

// 第二轮（同一 thread_id）
result = await agent.invoke(
  { messages: [{ role: "user", content: "What's my name?" }] },
  config
);
// AI: "You are Bob!" ← 记住了之前的对话
```

### 6.2 生产环境持久化

```typescript
import { PostgresSaver } from "@langchain/langgraph-checkpoint-postgres";

// PostgreSQL 持久化（生产推荐）
const checkpointer = PostgresSaver.fromConnString(
  "postgresql://user:pass@localhost:5432/mydb?sslmode=disable"
);
// 首次使用必须调用 setup() 建表
await checkpointer.setup();

const agent = createAgent({
  model: "openai:gpt-5.4",
  tools: [],
  checkpointer,
});
```

其他 Checkpointer 选项：

| Checkpointer | 适用场景 | 包 |
|-------------|---------|-----|
| `MemorySaver` | 开发/测试 | `@langchain/langgraph` |
| `PostgresSaver` | 生产（PostgreSQL） | `@langchain/langgraph-checkpoint-postgres` |
| `SqliteSaver` | 轻量级/单机 | `@langchain/langgraph-checkpoint-sqlite` |
| `AzureCosmosSaver` | Azure 生态 | `@langchain/langgraph-checkpoint-azure-cosmos` |

### 6.3 context 与 thread_id 的区别

```typescript
// thread_id: 对话级作用域（消息历史、Checkpoint）
// context: 运行时级作用域（用户信息、Feature Flag）

const result = await agent.invoke(
  { messages: [{ role: "user", content: "Hello" }] },
  {
    configurable: { thread_id: "thread-123" },  // 对话标识
    context: { userId: "user-456" },            // 运行时数据
  }
);
```

---

## 7. 完整示例：带记忆的客服 Agent

```typescript
import { createAgent, tool } from "langchain";
import { MemorySaver } from "@langchain/langgraph";
import * as z from "zod";

// 工具定义
const searchKnowledgeBase = tool(
  async ({ query }) => {
    // 模拟知识库搜索
    const kb = {
      "refund": "Refund policy: 30-day money-back guarantee.",
      "shipping": "Free shipping on orders over $50.",
      "account": "Account issues can be resolved at account.example.com.",
    };
    return kb[query.toLowerCase()] ?? `No results found for '${query}'.`;
  },
  {
    name: "search_knowledge_base",
    description: "Search the customer support knowledge base.",
    schema: z.object({
      query: z.string().describe("Search query"),
    }),
  }
);

// 上下文 Schema
const contextSchema = z.object({
  customerTier: z.enum(["basic", "premium"]),
});

// Agent 创建
const agent = createAgent({
  model: "openai:gpt-5.4",
  tools: [searchKnowledgeBase],
  systemPrompt: `
You are a customer support agent for an e-commerce platform.

## Rules
1. Always be polite and professional
2. Search the knowledge base before answering
3. Premium customers get priority handling
4. If you cannot resolve, offer escalation
`,
  contextSchema,
  checkpointer: new MemorySaver(),
});

// 多轮对话
const config = {
  configurable: { thread_id: "customer-789" },
  context: { customerTier: "premium" },
};

// 第一轮
const r1 = await agent.invoke(
  { messages: [{ role: "user", content: "What's your refund policy?" }] },
  config
);
console.log(r1.messages.at(-1)?.content);

// 第二轮（上下文延续）
const r2 = await agent.invoke(
  { messages: [{ role: "user", content: "How do I start a return?" }] },
  config
);
console.log(r2.messages.at(-1)?.content);
```

---

## 面试问答

**Q: createAgent 的参数中，model 支持字符串和实例两种形式。在实际项目中应该用哪种？两者在行为上有差异吗？**
A: 推荐用字符串形式（"provider:model"），因为 createAgent 内部会延迟初始化，可以利用 LangSmith 的静默失败机制（模型不可用时降级）。预初始化实例适合需要精细控制模型参数（temperature、maxTokens 每个工具调用不同）的场景。行为差异：字符串形式每次创建 Agent 时初始化新实例；实例形式复用同一实例，多个 Agent 共享同一模型配置。

**Q: systemPrompt 和 contextSchema 在 Agent 中的定位有什么不同？什么时候该用 contextSchema 而不是在 systemPrompt 里写占位符？**
A: systemPrompt 是**静态指令**，编译时确定，描述 Agent 的角色和行为规则。contextSchema 是**运行时数据接口**，声明每次 invoke 可以传入哪些动态上下文（用户 ID、角色、租户）。如果用 systemPrompt 占位符（如 "The user's name is {name}"），需要每次调用前动态构建字符串，灵活性差且不利于模型理解数据边界。contextSchema 配合 Middleware 的 beforeModel 注入，更清晰和安全。

**Q: createAgent 有哪些可用的 Hook 扩展点？如何在 Agent 执行生命周期中插入自定义逻辑？**
A: `createAgent` 本身没有生命周期 Hook，扩展能力通过 **Middleware** 机制实现。Middleware 提供以下钩子：`beforeAgent`（Agent 循环开始前）、`beforeModel`（每次模型调用前）、`afterModel`（每次模型调用后）、`afterAgent`（Agent 循环结束后）、`wrapModelCall`（包裹模型调用）、`wrapToolCall`（包裹工具调用）。例如：在 `beforeModel` 中动态注入 System Message 或修改消息列表；在 `afterAgent` 中做日志记录、资源清理；在 `wrapToolCall` 中添加工具调用的重试和超时控制。这些 Middleware 钩子通过 `createAgent({ middleware: [...] })` 注册。

**Q: invoke vs streamEvents 的选择对生产架构有什么影响？如果用户需要实时进度展示，但后端是 Serverless 函数，该如何处理？**
A: invoke 返回最终结果，适合同步请求-响应模式（如 REST API）；streamEvents 返回中间步骤，适合需要实时反馈的场景（如 WebSocket、SSE）。Serverless 环境下 streamEvents 的逐块返回较难实现，可行方案：1）使用 Serverless 的 Response Streaming（如 AWS Lambda Response Streaming）；2）将流式数据写入中间存储（Redis Pub/Sub），前端通过 WebSocket 连接读取；3）如果 Serverless 有超时限制（如 30s），invoke + 进度回调更适合。

**Q: responseFormat 在 Agent 级别是如何保证结构化输出不被工具调用打断的？与模型级别的 withStructuredOutput 有什么本质区别？**
A: Agent 级别的 responseFormat 在 Agent 循环**结束后**对最终消息强制执行结构化输出，中间的工具调用过程不影响输出的结构化约束。模型级别的 withStructuredOutput 则让模型在第一次响应时就输出结构化数据，但如果 Agent 循环需要进行工具调用，结构化输出会在工具调用步骤后被中断。本质区别：Agent 级是"最终保证结构化"，模型级是"首次响应结构化"。Agent 级更适合多步骤场景，模型级更适合单次数据提取。

---

## 8. 实战练习

> 目标：配置一个带 `systemPrompt`、`responseFormat` 和 `checkpointer` 的 Agent，并验证多轮记忆。

**要求**：
1. 创建一个 Agent：模型 `openai:gpt-5.4`，`systemPrompt` 设为“你是一位耐心的数学辅导老师，只回答数学问题”。
2. 配置 `responseFormat` 为 `{ answer: z.string(), steps: z.array(z.string()) }`。
3. 配置 `checkpointer: new MemorySaver()`，使用固定的 `thread_id`。
4. 第一轮问 `"3 + 5 等于多少？"`，第二轮问 `"再乘以 2 呢？"`，观察 Agent 是否能结合上下文回答。

**提示**：
- 第二轮调用时，`messages` 只包含新输入，历史由 Checkpointer 自动恢复。
- 如果上下文没延续，检查两次调用是否使用了同一个 `thread_id`。

**预期效果**：
- 第一轮输出 `answer: "8"`，`steps` 包含推理步骤。
- 第二轮输出 `answer: "16"`，并理解“再乘以 2”指代上一轮结果。

---

## 9. 对比：`createAgent` vs 手写 ReAct 循环

| 能力 | 手写 ReAct 循环 | LangChain.js `createAgent` |
|------|----------------|---------------------------|
| 工具调用解析 | 手动解析 `tool_calls` JSON | 自动解析并执行 |
| 消息历史维护 | 手动 push/pop | Checkpointer 自动管理 |
| 系统提示注入 | 手动拼接 | `systemPrompt` 参数 |
| 结构化输出 | 手动 prompt + JSON 解析 | `responseFormat` 参数 |
| 扩展性 | 改核心循环 | 加 Middleware 即可 |

**一句话总结**：手写循环适合学习原理，`createAgent` 适合工程落地，二者底层都是“模型 → 工具 → 模型”的循环。

---

## 总结

**核心要点**：
1. `createAgent` 提供完整的配置体系：model + tools + systemPrompt + checkpointer + middleware
2. System Prompt 设计遵循：角色定义 → 能力范围 → 行为规则 → 输出格式
3. `responseFormat` 结合 Zod Schema 实现类型安全的结构化输出
4. `invoke` 适合简单场景，`streamEvents` 适合多步骤可见性要求高的场景
5. Thread ID 是实现多轮对话记忆的关键，生产环境用 PostgresSaver 替代 MemorySaver

**下一步**：
- 学习 [2.5 记忆与状态管理](05-记忆与状态管理.md)，深入 Checkpointer 和 Token 管理
- 学习 [2.6 中间件系统](06-中间件系统.md)，掌握 Agent 扩展能力

---

*参考资料*：
- [LangChain.js Agent 文档](https://docs.langchain.com/oss/javascript/langchain/agents)
- [LangChain.js Structured Output](https://docs.langchain.com/oss/javascript/langchain/structured-output)
- [LangChain.js Streaming](https://docs.langchain.com/oss/javascript/langchain/streaming)
- [LangGraph 持久化文档](https://docs.langchain.com/oss/javascript/langgraph/persistence)
- [Short-term Memory](https://docs.langchain.com/oss/javascript/langchain/short-term-memory)
