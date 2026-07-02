# 实战项目 02：智能客服系统（基础版）

## 项目概述

构建一个基于 **LangChain.js v1.0+** 的**命令行智能客服 Agent**，支持多轮对话、意图识别、知识库查询、工单创建与人工转接。用户通过终端与客服 Agent 交互，体验企业级客服系统的核心能力：**会话持久化、结构化输出、RAG 知识检索、Human-in-the-Loop 审批、LangSmith 全链路可观测**。

> 本项目为第二阶段收官项目，使用 LangChain.js 框架（而非手写 ReAct 循环），让学习者掌握框架化 Agent 开发的最佳实践。所有服务均为 Mock 数据，零外部依赖。

## 知识点映射

### Phase 2 核心知识点

| 文档                          | 应用点                                                                                                                                       |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| **2.1 LangChain.js 架构概览** | **框架基础** — `createAgent` 入口、Tool 定义模式、Runnable 管线理解                                                                          |
| **2.2 模型与消息系统**        | **核心应用** — `initChatModel` 配置、`Structured Output` 意图识别、消息格式规范化                                                            |
| **2.3 工具系统**              | **核心应用** — 3 种工具（订单查询 / 工单创建 / 知识库检索）的 `tool()` 工厂定义、工具参数 Zod 校验                                           |
| **2.4 Agent 构建与配置**      | **核心应用** — Agent 配置（systemPrompt + tools + middleware + checkpointer 四件套）、`contextSchema` 用户身份注入                           |
| **2.5 记忆与状态管理**        | **核心应用** — `MemorySaver`/`SqliteSaver` 多轮对话持久化、`store` 实现跨对话用户偏好记忆                                                    |
| **2.6 中间件系统**            | **核心应用** — `humanInTheLoopMiddleware` 工单审批、`summarizationMiddleware` 上下文压缩、`piiMiddleware`（或 `piiRedactionMiddleware`）脱敏 |
| **2.7 LangSmith 链路追踪**    | **核心应用** — Tracing 全链路追踪、自定义 Evaluator 对话质量评估、回归测试                                                                   |

### 前置知识

| 文档                   | 应用点                                                                                                            |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------- |
| **1.1 AI/ML 核心概念** | Token 消耗估算（每次客服问答的 prompt + response token）、温度参数选择（客服场景需要确定性回答 → 低 temperature） |
| **1.3 提示词工程**     | 系统 Prompt 设计（客服角色定义 + 情绪管理）、Few-shot 示例（退换货 / 退款 / 物流查询）                            |
| **1.5 RAG 架构**       | 知识库检索增强（产品退换货政策、物流规则等 FAQ 向量检索）                                                         |

## 项目亮点

1. **框架化开发**：使用 LangChain.js `createAgent` 全家桶，体验生产级 Agent 框架的开发模式
2. **结构化输出**：利用 `Structured Output` 实现意图分类（order_query / refund / complaint / handoff）+ 槽位填充
3. **会话持久化**：`SqliteSaver` 实现多轮对话持久化，重启程序后对话历史不丢失
4. **Human-in-the-Loop**：工单创建/退款操作暂停等待人工审批，模拟真实客服转接流程
5. **三层次记忆**：短期记忆（对话历史 Checkpointer）+ 摘要压缩（summarizationMiddleware）+ 长期记忆（用户偏好 Store）
6. **全链路可观测**：LangSmith Tracing + 自定义对话质量 Evaluator（满意度、解决率、转接率）
7. **安全脱敏**：PII 中间件脱敏电话/邮箱，避免敏感信息泄露

## 技术栈

```
Runtime:     Bun 1.2+ / Node.js 22+
Language:    TypeScript 5.x
Framework:   LangChain.js v1.0+
Interface:   CLI（命令行交互）
Validation:  Zod（通过 LangChain schema 集成）
LLM:         OpenAI 兼容 API
Persistence:   better-sqlite3 + @langchain/langgraph-checkpoint-sqlite（SqliteSaver Checkpointer）
Store:         @langchain/langgraph 的 InMemoryStore（MVP），生产可换 @langchain/langgraph-checkpoint-postgres/store 的 PostgresStore
Vector DB:   内存文本搜索（关键词匹配，后续可升级为向量检索）
Tracing:     LangSmith（环境变量配置，零代码侵入）
Mock Data:   订单服务、工单系统、FAQ 知识库（全部内置，零外部依赖）
```

## 为什么使用 Mock 数据

1. **学习聚焦**：项目核心是 LangChain.js 框架的应用模式（Checkpointer、Middleware、Structured Output、Tracing），业务数据只是载体
2. **零外部依赖**：不需要申请订单系统/工单系统 API Key，开箱即用
3. **场景可控**：可以设计丰富的 Mock 场景（正常订单、异常订单、退款争议等），方便测试各种分支
4. **成本为零**：不会产生任何 API 调用费用

## 模型选型建议

| 场景              | 推荐模型                                         | 说明                                                        |
| ----------------- | ------------------------------------------------ | ----------------------------------------------------------- |
| 默认开发          | `openai:gpt-5.4`                                 | 工具调用稳定，结构化输出准确                                |
| 意图分类/槽位填充 | `openai:gpt-5.4-mini` / `openai:gpt-5.4`         | 低成本，结构化输出足够可靠                                  |
| 复杂退款纠纷      | `openai:gpt-5.4` / `anthropic:claude-sonnet-4-6` | 需要理解用户情绪和政策细节                                  |
| 国内访问          | `qwen3` / `deepseek-chat` 等                     | 均提供 OpenAI 兼容接口，中文客服友好；需配置对应 `BASE_URL` |

## 功能清单

### 核心功能（MVP 必做）

> 建议第一次实现先聚焦核心功能，跑通 5 种意图 + HITL 退款后再做高级功能。

- [ ] 多轮对话（SqliteSaver 持久化，重启后对话不丢失）
- [ ] 意图识别（Structured Output：order_query / refund / complaint / handoff / greeting）
- [ ] 槽位提取（订单号、商品名、金额等字段自动抽取）
- [ ] 订单状态查询（Mock 订单服务，支持按单号和用户查询）
- [ ] 退款申请与审批（humanInTheLoopMiddleware 暂停等待人工确认）
- [ ] 工单创建与转接（复杂问题创建工单，手工分配客服）
- [ ] 知识库 FAQ 检索（产品政策、退换货规则、物流说明）

### 高级功能

- [ ] 上下文摘要压缩（summarizationMiddleware 管理长对话）
- [ ] PII 脱敏（`piiMiddleware` 或 `piiRedactionMiddleware` 隐藏电话/邮箱）
- [ ] 用户偏好记忆（Store 跨对话持久化用户偏好）
- [ ] LangSmith 全链路追踪（Trace 查看每次对话的完整调用链）
- [ ] 对话质量评估（LangSmith Evaluator：满意度、解决率、转接率）

## 设计预览

### Agent 配置（核心入口）

```typescript
import {
  createAgent,
  summarizationMiddleware,
  humanInTheLoopMiddleware,
  piiMiddleware
} from 'langchain'
import { SqliteSaver } from '@langchain/langgraph-checkpoint-sqlite'
import * as z from 'zod'

const checkpointer = SqliteSaver.fromConnString('./data/checkpoints.db')

// 导入或内联定义系统 Prompt
const systemPrompt = `You are a customer support agent...`

const agent = createAgent({
  model: 'openai:gpt-5.4',
  systemPrompt,
  tools: [queryOrder, createRefund, searchKnowledge, createTicket],
  contextSchema: z.object({ userId: z.string(), userName: z.string() }),
  checkpointer,
  middleware: [
    summarizationMiddleware({
      model: 'gpt-5-mini',
      trigger: { tokens: 4000 },
      keep: { messages: 20 }
    }),
    piiMiddleware('email', { strategy: 'redact' }),
    piiMiddleware('phone', { strategy: 'mask' }),
    humanInTheLoopMiddleware({
      interruptOn: {
        createRefund: { allowedDecisions: ['approve', 'reject'] },
        createTicket: { allowedDecisions: ['approve', 'edit'] }
      }
    })
  ]
})
```

> **注**：`piiMiddleware` 是 v1.2+ 推荐的 PII 中间件，每条规则可独立指定 `strategy`。若需要在工具执行前将脱敏值还原，可改用 `piiRedactionMiddleware({ rules: { email: /.../g, phone: /.../g } })`，但它只支持 `redact` 策略。
>
> 意图识别建议用一个独立的 `createAgent({ responseFormat: IntentSchema, tools: [] })` 分类器，或在主 Agent 中先调用 `classify_intent` 工具，再决定后续操作。

### CLI 交互示例

```bash
$ bun run cli --user=李华

👋 智能客服已启动（用户：李华），输入问题开始对话（输入 exit 退出）

> 帮我查一下订单 20240601 的状态
[意图] order_query → 槽位: { order_id: "20240601" }
[调用] query_order({ orderId: "20240601" })
[回复] 您订单 20240601 的状态是「已发货」，预计明天送达。需要帮您做其他操作吗？

> 我想退款，订单号是 20240601
[意图] refund → 槽位: { order_id: "20240601" }
[调用] createRefund({ orderId: "20240601", reason: "用户主动申请" })
[暂停] ⏸️ 退款操作等待人工审批...
       approve / reject ？
> approve
[回复] 退款申请已提交，订单 20240601 的退款将在 3-5 个工作日内原路返回。

> 你们的退货政策是什么？
[调用] searchKnowledge({ query: "退货政策" })
[回复] 我们的退货政策：自签收日起 7 天内支持无理由退货，商品需保持原包装完好...

> 我的电话是 13812345678，发短信通知我
[脱敏] PII detected: phone → masked
[回复] 已记录您的联系方式为 138****5678，退款进度将通过短信通知。

> exit
👋 感谢您的咨询！
```

> **CLI 实现注意**：每次调用 `agent.invoke` 时，第二个参数需要带上 `configurable.thread_id`（可用 `userId` 派生）和 `context`（`userId`、`userName`），`checkpointer` 和 `contextSchema` 才会生效。示例：
>
> ```ts
> await agent.invoke(
>   { messages: [{ role: 'user', content: input }] },
>   {
>     configurable: { thread_id: `cs-${userId}` },
>     context: { userId, userName }
>   }
> )
> ```

## 目录结构

```
02-customer-service/
├── README.md                    # 本文件（项目需求与设计文档）
├── package.json                 # 依赖配置
├── tsconfig.json                # TypeScript 配置
├── .env.example                 # 环境变量模板
├── src/
│   ├── cli.ts                   # CLI 入口：命令行交互
│   ├── agent/
│   │   ├── agent.ts             # LangChain Agent 配置与初始化
│   │   ├── tools.ts             # 工具定义（订单/退款/工单/知识库）
│   │   └── schema.ts            # Structured Output Schema 定义
│   ├── prompts/
│   │   └── system.ts            # 系统 Prompt + Few-shot 示例
│   ├── services/
│   │   ├── order.ts             # 订单查询服务（Mock）
│   │   ├── ticket.ts            # 工单系统（Mock）
│   │   └── knowledge.ts         # 知识库 FAQ 数据与检索
│   ├── memory/
│   │   ├── checkpointer.ts      # SqliteSaver Checkpointer 配置
│   │   └── store.ts             # Store 配置（用户偏好，MVP 使用 InMemoryStore）
│   └── evaluation/
│       ├── evaluator.ts         # 自定义 Evaluator
│       └── test-data.json       # 测试数据集
└── test/
    ├── agent.test.ts            # Agent 端到端测试
    ├── tools.test.ts            # 工具参数校验测试
    └── memory.test.ts           # 会话持久化测试
```

## 错误处理策略

| 异常类型           | 处理策略                                                 |
| ------------------ | -------------------------------------------------------- |
| 无效订单号         | 引导用户"未找到该订单，请检查订单号是否正确（8 位数字）" |
| 退款条件不满足     | 根据 Mock 规则返回具体原因（如超过退货期限）             |
| 知识库无匹配       | 返回"我目前无法回答这个问题，已为您转接人工客服"         |
| 工具参数验证失败   | Zod 校验失败，提示具体字段错误                           |
| LLM 调用失败       | 记录 Trace，返回"系统异常，请稍后再试"                   |
| PII 检测到敏感信息 | 自动脱敏后继续执行，记录审计日志                         |

## 测试覆盖

| 测试文件         | 覆盖范围                                                         |
| ---------------- | ---------------------------------------------------------------- |
| `agent.test.ts`  | 5 种意图识别路径、多轮对话上下文保持、Human-in-the-Loop 审批流程 |
| `tools.test.ts`  | 工具参数校验、Mock 服务边界场景（无效订单、不可退款等）          |
| `memory.test.ts` | SqliteSaver 持久化（进程重启后恢复）、上下文摘要压缩触发条件     |

## 验收标准

- [ ] 意图识别：5 种意图在测试数据集上准确率 ≥ 80%。
- [ ] 订单查询：有效订单号返回正确状态，无效订单号返回引导话术。
- [ ] HITL 退款：发起退款后 Agent 暂停，输入 `approve` 才继续，输入 `reject` 则拒绝。
- [ ] 知识库：命中 FAQ 时直接返回知识库内容，未命中时提示转人工。
- [ ] 持久化：使用相同 `thread_id` 重启 CLI 后，Agent 能记住之前的问题。

## 实现步骤

### 🟢 第一步：基础骨架

1. 创建 `package.json` 和 `tsconfig.json`，安装 LangChain.js 核心依赖
2. 实现 `src/services/` 下的 Mock 数据服务（订单、工单、知识库）
3. 实现 `src/prompts/system.ts` 系统 Prompt 和 Few-shot 示例
4. 配置 `src/memory/checkpointer.ts` 的 SqliteSaver

### 🟡 第二步：工具与 Schema

5. 实现 `src/agent/schema.ts` 结构化输出 Schema（5 种意图 + 槽位字段）
6. 实现 `src/agent/tools.ts` 四个工具（queryOrder / createRefund / searchKnowledge / createTicket）
7. 实现 `src/agent/agent.ts` 组装 createAgent 配置

### 🔴 第三步：CLI 与交互

8. 实现 `src/cli.ts` 命令行入口（用户身份注入、对话循环、审批决策输入）
9. 实现中间件配置（summarization + pii + humanInTheLoop）
10. 端到端测试全部 5 种意图路径

### 📊 第四步：可观测与评估

11. 配置 LangSmith 环境变量，验证 Trace 生成
12. 实现自定义 Evaluator（满意度 / 解决率 / 转接率）
13. 创建测试数据集并运行回归评估

## 本地运行

```bash
# 1. 进入项目目录
cd projects/02-customer-service

# 2. 安装依赖
bun install

# 3. 复制环境变量模板
cp .env.example .env
# 编辑 .env 填入 LLM API Key

# 4. 创建数据目录（Sqlite 持久化文件）
mkdir -p data

# 5. 启动 CLI 对话
bun run cli --user=李华
```

## .env.example 示例

```env
# LLM API 配置
OPENAI_API_KEY=sk-xxxxxxxx
OPENAI_BASE_URL=https://api.openai.com/v1

# 默认模型
DEFAULT_MODEL=openai:gpt-5.4
# 意图分类模型（可用低成本模型）
CLASSIFIER_MODEL=openai:gpt-5.4-mini
# 摘要模型
SUMMARY_MODEL=openai:gpt-5.4-mini

# LangSmith 配置
LANGSMITH_TRACING=true
LANGSMITH_API_KEY=lsv2_sk_xxxx
LANGSMITH_PROJECT=customer-service

# Sqlite 持久化路径（Checkpointer）
CHECKPOINTER_PATH=./data/checkpoints.db

# 长期记忆 Store（MVP 使用 InMemoryStore 无需路径；生产用 PostgresStore 时配置 POSTGRES_URI）
# POSTGRES_URI=postgresql://postgres:postgres@localhost:5432/postgres?sslmode=disable
```

## 学习路线图

### 学习顺序建议

```
第一遍（理解全貌）：
  services/ → schema.ts → tools.ts → prompts/system.ts → agent.ts → cli.ts

第二遍（深入实现）：
  每个文件按 TODO 标记逐步实现
```

### 当前实现状态一览

| 文件                            |   状态    | 关键产出                                   |
| ------------------------------- | :-------: | ------------------------------------------ |
| `src/services/order.ts`         | ❌ 待实现 | Mock 订单服务（10+ 订单场景）              |
| `src/services/ticket.ts`        | ❌ 待实现 | Mock 工单系统                              |
| `src/services/knowledge.ts`     | ❌ 待实现 | FAQ 知识库（退换货、物流、政策 20+ 条目）  |
| `src/agent/schema.ts`           | ❌ 待实现 | 5 种意图 + 槽位的 Structured Output Schema |
| `src/agent/tools.ts`            | ❌ 待实现 | 4 个工具定义                               |
| `src/agent/agent.ts`            | ❌ 待实现 | Agent 配置 + 中间件组装                    |
| `src/prompts/system.ts`         | ❌ 待实现 | 客服系统 Prompt + 5 组 Few-shot            |
| `src/memory/checkpointer.ts`    | ❌ 待实现 | SqliteSaver 配置                           |
| `src/memory/store.ts`           | ❌ 待实现 | 用户偏好 Store（MVP 用 InMemoryStore）     |
| `src/cli.ts`                    | ❌ 待实现 | CLI 交互入口 + 审批输入                    |
| `src/evaluation/evaluator.ts`   | ❌ 待实现 | 自定义对话质量 Evaluator                   |
| `src/evaluation/test-data.json` | ❌ 待实现 | 回归测试数据集                             |
| `test/*.test.ts`                | ❌ 待实现 | 三套测试用例                               |

## 参考文档

- [What's new in LangChain.js v1](https://docs.langchain.com/oss/javascript/releases/langchain-v1)
- [Agents / createAgent](https://docs.langchain.com/oss/javascript/langchain/agents.md)
- [Middleware 概览](https://docs.langchain.com/oss/javascript/langchain/middleware)
- [内置 Middleware（Summarization / HITL / PII 等）](https://docs.langchain.com/oss/javascript/langchain/middleware/built-in.md)
- [Runtime 与 contextSchema](https://docs.langchain.com/oss/javascript/langchain/runtime)
- [短期记忆与 Checkpointer](https://docs.langchain.com/oss/javascript/langchain/short-term-memory.md)
- [长期记忆与 Store](https://docs.langchain.com/oss/javascript/langchain/long-term-memory)
- [Human-in-the-Loop](https://docs.langchain.com/oss/javascript/langchain/human-in-the-loop)
- [Structured Output](https://docs.langchain.com/oss/javascript/langchain/structured-output)
- [LangSmith Tracing](https://docs.langchain.com/langsmith/tracing)
- [piiMiddleware API 参考](https://reference.langchain.com/javascript/langchain/browser/piiMiddleware)
- [piiRedactionMiddleware API 参考](https://reference.langchain.com/javascript/functions/langchain.index.piiRedactionMiddleware.html)
- [LangChain.js 文档索引 llms.txt](https://docs.langchain.com/llms.txt)

---

> 本项目将第二阶段 7 篇文档的框架能力融会贯通，完成后你将具备使用 LangChain.js 构建生产级 Agent 应用的完整能力。
