# 2.1 LangChain.js 架构概览

> 从全栈工程师视角理解 LangChain.js 的架构设计与生态全景图

> **模块**：2.1 | **预计时间**：2h | **面试可答**：Model + Harness 设计哲学、包生态与依赖分层、JS vs Python 差异、createAgent 内部机制

## 学习目标

- 理解 LangChain.js v1.0+ 的 "Model + Harness" 设计哲学
- 掌握 LangChain 包生态全景图与各包职责
- 了解 LangChain.js 与 Python 版的关键区别
- 能够完成项目初始化并运行第一个 Agent
- 快速集成 LangSmith 链路追踪

---

## 1. LangChain.js v1.0+ 设计哲学：Model + Harness

### 1.1 核心概念

LangChain.js v1.0+ 围绕一个简洁的核心理念构建：**Agent = Model + Harness**。

- **Model（模型）**：负责推理和决策的大语言模型
- **Harness（框架）**：围绕模型的一切——Prompt、Tools、Middleware、Memory、Checkpointer

```mermaid
graph TB
    subgraph Agent[Agent]
        Model[Model / LLM<br/>推理决策]
        subgraph Harness[Harness]
            Prm[Prompt]
            Tls[Tools]
            MW[Middleware]
            Mem[Memory]
            CP[Checkpointer]
        end
    end
```

**设计目标**：
- **极简 API**：`createAgent()` 一行代码创建 Agent
- **可组合性**：Middleware 机制让功能按需叠加
- **Provider 无关**：统一接口，模型切换只需改字符串

### 1.2 Agent 工作流程

Agent 的核心是一个循环（Loop）：

```typescript
// 伪代码：Agent 循环
async function agentLoop(input: string) {
  const messages = [new HumanMessage(input)];

  while (true) {
    // 1. 模型生成响应（可能包含工具调用）
    const response = await model.invoke(messages);

    // 2. 如果没有工具调用，返回结果
    if (!response.tool_calls?.length) {
      return response.content;
    }

    // 3. 执行工具调用
    for (const toolCall of response.tool_calls) {
      const result = await executeTool(toolCall);
      messages.push(result);
    }
    // 4. 继续循环
  }
}
```

---

## 2. 包生态全景图

LangChain.js 采用模块化包设计，核心包和集成包分工明确：

| 包名 | 职责 | 安装 |
|------|------|------|
| `langchain` | 核心 API：`createAgent`、`tool`、`initChatModel`、Middleware | `bun add langchain` |
| `@langchain/core` | 基础类型：消息、工具接口、运行时 | `bun add @langchain/core` |
| `@langchain/langgraph` | 图状态管理：`MemorySaver`、`StateSchema`、`Command` | `bun add @langchain/langgraph` |
| `@langchain/openai` | OpenAI 集成 | `bun add @langchain/openai` |
| `@langchain/anthropic` | Anthropic/Claude 集成 | `bun add @langchain/anthropic` |
| `@langchain/google-genai` | Google Gemini 集成 | `bun add @langchain/google-genai` |
| `@langchain/aws` | AWS Bedrock 集成 | `bun add @langchain/aws` |

**依赖关系**：

```mermaid
graph LR
    langchain["langchain"]
    langchain --> core["@langchain/core<br/>基础类型和接口"]
    langchain --> langgraph["@langchain/langgraph<br/>状态管理和持久化"]
    langchain --> provider["@langchain/{provider}<br/>模型提供商集成<br/>按需"]
```

### 2.1 包职责详解

**`langchain`** — 核心包，提供所有高层 API：
- `createAgent()` — 创建 Agent
- `initChatModel()` — 初始化模型
- `tool()` — 定义工具
- `createMiddleware()` — 创建中间件
- 内置 Middleware：`todoListMiddleware`、`modelRetryMiddleware`、`piiMiddleware` 等

**`@langchain/core`** — 基础类型包：
- 消息类型：`SystemMessage`、`HumanMessage`、`AIMessage`、`ToolMessage`
- 内容块类型：`ContentBlock.Text`、`ContentBlock.Reasoning` 等
- 运行时类型：`ToolRuntime`

**`@langchain/langgraph`** — 图引擎：
- `MemorySaver` — 内存级 Checkpointer
- `StateSchema` — 自定义状态定义
- `Command` — 从工具中更新状态

> 注：生产级 Checkpointer 在**独立包**中——`PostgresSaver` 来自 `@langchain/langgraph-checkpoint-postgres`（用法见 2.4/2.5），不要按 `@langchain/langgraph` 安装。

### 2.2 集成包模式

每个模型提供商对应一个 `@langchain/{provider}` 包，所有包遵循同一接口：

```typescript
// 所有集成包都支持这些统一方法
const response = await model.invoke(messages);     // 调用
const stream = await model.stream(messages);        // 流式
const responses = await model.batch([...inputs]);   // 批处理
const structured = model.withStructuredOutput(schema); // 结构化输出
```

---

## 3. 与 Python 版的关键区别

| 维度 | LangChain.js | LangChain Python |
|------|-------------|-----------------|
| 运行时 | Node.js 22+ / Bun 1.0+ | Python 3.9+ |
| 核心创建方式 | `createAgent()` 函数式 | `create_agent()` 函数式 |
| 工具定义 | `tool()` + Zod Schema | `@tool` 装饰器 |
| Middleware | `createMiddleware()` 一等公民 | v1 同样有原生 Middleware（钩子体系一致） |
| 类型安全 | TypeScript + Zod | Pydantic |
| DeepAgents | `createDeepAgent()` 独立函数 | 同上 |
| 包管理 | npm/yarn/pnpm/bun | pip/poetry |

**关键差异**：
1. **类型系统**：JS 版利用 TypeScript + Zod 提供编译时类型安全，Python 版用 Pydantic
2. **Middleware**：两版在 v1 均将 Middleware 作为内置一等特性，钩子体系一致；差异在个别内置中间件的 API 形状（如 PII 中间件的配置方式）
3. **工具签名**：JS 版用 `tool(fn, { name, description, schema })`，Python 版用 `@tool` 装饰器

---

## 4. 安装与项目初始化

### 4.1 环境要求

- **Node.js 22+** 或 **Bun v1.0.0+**
- TypeScript 5.0+

> 注：`langchain@1.x` 包声明的最低要求为 Node.js >= 20（`engines` 字段），本章推荐 Node 22+ 以获得更完整的 API 支持。

### 4.2 项目初始化

```bash
# 创建项目目录
mkdir my-agent && cd my-agent

# 使用 Bun 初始化
bun init -y

# 安装核心包
bun add langchain @langchain/core

# 安装模型提供商集成包
bun add @langchain/openai        # OpenAI
# 或
bun add @langchain/anthropic     # Anthropic/Claude
# 或
bun add @langchain/google-genai  # Google Gemini
```

### 4.3 TypeScript 配置

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  }
}
```

### 4.4 环境变量配置

```bash
# 选择你的模型提供商，设置对应的 API Key
export OPENAI_API_KEY="sk-..."
# 或
export ANTHROPIC_API_KEY="sk-ant-..."
# 或
export GOOGLE_API_KEY="AIza..."
```

---

## 5. `createAgent` 快速体验

### 5.1 最小的 Agent 示例

```typescript
import { createAgent, tool } from "langchain";
import * as z from "zod";

// 1. 定义一个工具
const getWeather = tool(
  ({ city }) => `It's always sunny in ${city}!`,
  {
    name: "get_weather",
    description: "Get the weather for a given city",
    schema: z.object({
      city: z.string().describe("The city to get the weather for"),
    }),
  }
);

// 2. 创建 Agent
const agent = createAgent({
  model: "openai:gpt-5.4",
  tools: [getWeather],
});

// 3. 调用 Agent
const result = await agent.invoke({
  messages: [
    { role: "user", content: "What's the weather in San Francisco?" },
  ],
});

console.log(result.messages.at(-1)?.content);
```

> 💡 **示例模型字符串说明**：本章所有 `openai:gpt-5.4`、`anthropic:claude-sonnet-4-6` 等字符串仅示范 `provider:model` 格式，**不代表当期推荐模型**；实际选型以 [1.1 模型选型决策树](../01-AI-Agent基础与认知升级/01-AI-ML核心概念科普.md) 为准，把字符串换成你可用且在决策树推荐列表中的模型即可。

### 5.2 不同模型提供商的写法

```typescript
import { initChatModel } from "langchain";

// 方式一：字符串方式（推荐）
const agent = createAgent({
  model: "anthropic:claude-sonnet-4-6",  // provider:model 格式
  tools: [getWeather],
});

// 方式二：预先初始化模型实例
const model = await initChatModel("google-genai:gemini-3.5-flash", {
  temperature: 0.5,
  timeout: 600_000,
  maxTokens: 25000,
});

const agent = createAgent({
  model,
  tools: [getWeather],
});
```

**支持的 Provider 示例**：

| Provider | 字符串格式 | 包 |
|----------|-----------|-----|
| OpenAI | `openai:gpt-5.4` | `@langchain/openai` |
| Anthropic | `anthropic:claude-sonnet-4-6` | `@langchain/anthropic` |
| Google Gemini | `google-genai:gemini-3.5-flash` | `@langchain/google-genai` |
| Azure OpenAI | `azure_openai:gpt-5.4` | `@langchain/openai` |
| AWS Bedrock | `bedrock:anthropic.claude-sonnet-4-6` | `@langchain/aws` |
| Ollama（本地） | `ollama:llama3.1` | `@langchain/ollama`（需安装） |
| OpenRouter | `openrouter:anthropic/claude-sonnet-4-6` | `@langchain/openrouter` |

### 5.3 流式输出

```typescript
const stream = await agent.streamEvents(
  {
    messages: [
      { role: "user", content: "Search for AI news and summarize" },
    ],
  },
  { version: "v3" }
);

for await (const snapshot of stream.values) {
  const latestMessage = snapshot.messages.at(-1);
  if (latestMessage?.content) {
    process.stdout.write(String(latestMessage.content));
  }
}
```

> 注意区分两个流式 API：`agent.stream()` 按超步返回状态更新（**不接受 `version` 参数**）；`agent.streamEvents(input, { version: "v3" })` 才提供 `.values` / `.messages` 等类型化投影（v1.3+ 推荐）。

---

## 6. LangSmith 链路追踪快速集成

LangSmith 是 LangChain 的全链路观测平台，提供 Trace 查看、调试和评估能力。

### 6.1 快速集成

```bash
export LANGSMITH_TRACING="true"
export LANGSMITH_API_KEY="lsv2_..."
```

配置后，所有 Agent 调用自动记录 Trace。可在 [LangSmith](https://smith.langchain.com) 上查看每次调用的详细信息。

### 6.2 Trace 内容

每次 Agent 调用会记录：
- **模型调用**：输入/输出、Token 消耗、延迟
- **工具调用**：调用的工具名、参数、返回值
- **中间步骤**：Agent 循环中的每一步
- **错误信息**：调用失败时的异常详情

---

## 面试问答

> **问：LangChain.js v1.0+ 的设计哲学 "Model + Harness" 具体解决了什么问题？相比于直接调用 LLM API 有什么优势？**
>
> 答：核心问题是将推理（Model）与工程化能力（Harness）解耦。直接调用 API 需要开发者自行处理工具调用、消息管理、重试、上下文窗口等重复性问题。"Model + Harness" 让开发者只关注模型选择和工具定义，Harness 层自动处理 Agent 循环（推理→工具→推理...）、中间件编排、状态持久化等，大幅降低 Agent 开发的工程复杂度。

> **问：@langchain/core 和 @langchain/langgraph 的职责边界是什么？在实际项目中如何决定何时引入 langgraph？**
>
> 答：@langchain/core 提供**基础类型**（消息类型、内容块、运行时接口），不涉及执行逻辑；@langchain/langgraph 提供**状态图引擎**（MemorySaver、StateSchema、Command），处理 Agent 的状态流转和持久化。核心包 langchain 同时依赖两者。只有在需要 Checkpointer 记忆持久化、自定义 State Schema 或从工具内用 Command 更新状态时，才需要显式引入 @langchain/langgraph。

> **问：createAgent() 一行代码的背后，LangChain.js 做了哪些关键工作？**
>
> 答：createAgent() 内部构建了一个 Agent 循环：1）配置模型（通过字符串或 initChatModel 实例化）；2）注册工具列表（将 Zod Schema 编译为模型可识别的 JSON Schema）；3）初始化 Harness（中间件管道、Checkpointer、Store）；4）启动循环引擎：模型调用 → 解析 tool_calls → 执行工具 → 结果回传 → 继续推理或返回。整个过程对开发者透明，但可以通过 Middleware 的各个 Hook 干预任意环节。

> **问：LangChain.js 采用模块化包设计（langchain / @langchain/core / @langchain/{provider}）的设计考量是什么？这种方式带来了哪些好处和成本？**
>
> 答：设计考量是职责分离和按需加载。好处：1）核心包轻量，按需添加 provider 包；2）Provider 实现统一接口，切换模型只需改包名和字符串；3）类型包（@langchain/core）可被其他库独立依赖。成本：1）初次上手需要理解多包结构；2）版本兼容性需要关注（core 和 langchain 版本需匹配）；3）bun/npm install 需安装多个包。

> **问：LangChain.js 和 LangChain Python 在架构上的最大区别是什么？对全栈开发者意味着什么？**
>
> 答：两版在 v1 已高度对齐——都有 `createAgent`/`create_agent`、原生 Middleware 和一致的钩子体系。真正的区别在于：类型系统（TypeScript + Zod vs Pydantic）、个别内置中间件的 API 形状（如 JS 的 `piiMiddleware` 配置方式与 Python 不同）、以及运行时特性（事件驱动/异步并发模型）。对全栈开发者而言，同一套 Agent 心智模型可以在前后端复用，JS 版可利用事件驱动优势构建细粒度的 Agent 控制管道，日志、鉴权、上下文注入、限流均可通过 Middleware 无侵入式叠加。

---

## 7. 实战练习

> 目标：在本地跑通第一个 `createAgent`，并验证不同 Provider 的切换只需改字符串。

**要求**：
1. 使用 Bun 初始化项目：`bun init -y`。
2. 安装 `langchain`、`@langchain/core` 和任意一个 Provider 包（如 `@langchain/openai`）。
3. 复制文档中的“最小 Agent 示例”，将模型改为当前你可用的真实模型字符串。
4. 运行后观察输出，并尝试把模型字符串换成另一个 Provider（如 `anthropic:claude-sonnet-4-6`），其余代码保持不变。

**提示**：
- 需要先配置对应 Provider 的 API Key（如 `OPENAI_API_KEY`）。
- 如果 Provider 不同，需要安装对应的包，否则 `initChatModel` 会提示缺少集成包。

**预期效果**：
- 第一次运行成功输出天气结果。
- 切换 Provider 后，仅修改字符串即可再次运行成功，体会“Provider 无关”的设计。

---

## 8. 对比：LangChain.js vs 原生 LLM API / 其他框架

| 能力 | 原生 LLM API | LangChain.js | LangGraph (单独使用) |
|------|-------------|--------------|---------------------|
| 单次对话 | 简单直接 | 略微厚重 | 需要自定义图 |
| 工具调用循环 | 手写循环 + 解析 JSON | `createAgent` 内置 | Agent 预构建提供（v1 中即 `createAgent`） |
| 多 Provider 切换 | 重写 SDK 调用 | 改字符串即可 | 改字符串即可 |
| 记忆持久化 | 完全自建 | `checkpointer` 一行配置 | 原生 Checkpointer 支持 |
| 中间件扩展 | 无 | `createMiddleware` 一等公民 | 通过图节点手动实现 |

**一句话总结**：如果你只需要“问一句答一句”，原生 API 最轻；如果你想让模型自主使用工具、管理状态、可观测，LangChain.js 的 `createAgent` 是更省力的选择。

---

## 总结

**核心要点**：
1. **Agent = Model + Harness**，LangChain.js 提供 `createAgent()` 作为核心入口
2. **包生态**分层清晰：`langchain`（核心）→ `@langchain/core`（类型）→ `@langchain/{provider}`（集成）
3. **安装简单**：bun install langchain，一行代码创建 Agent
4. **LangSmith** 零配置集成，提供全链路可观测性

**下一步**：
- 学习 [2.2 模型与消息系统](02-模型与消息系统.md)，深入模型调用和消息体系
- 了解 [2.3 工具系统](03-工具系统.md)，为 Agent 赋予外部能力
- 深入 [2.4 Agent 构建与配置](04-Agent构建与配置.md)

---

*参考资料*：
- [LangChain.js 安装文档](https://docs.langchain.com/oss/javascript/langchain/install)
- [LangChain.js Quickstart](https://docs.langchain.com/oss/javascript/langchain/quickstart)
- [LangChain Agent 文档](https://docs.langchain.com/oss/javascript/langchain/agents)
- [LangSmith 快速开始](https://docs.langchain.com/langsmith/trace-with-langchain)
- [LangChain 参考文档](https://reference.langchain.com/javascript/)
