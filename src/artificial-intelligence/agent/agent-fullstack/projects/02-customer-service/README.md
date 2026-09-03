# 实战项目 02：智能客服系统（基础版）

## 项目概述

构建一个基于 **LangChain.js v1.0+** 的**命令行智能客服 Agent**，支持多轮对话、意图识别、知识库查询、工单创建与人工转接。用户通过终端与客服 Agent 交互，体验企业级客服系统的核心能力：**会话持久化、结构化输出、RAG 知识检索、Human-in-the-Loop 审批、LangSmith 全链路可观测**。

> 本项目为第二阶段收官项目，使用 LangChain.js 框架（而非手写 ReAct 循环），让学习者掌握框架化 Agent 开发的最佳实践。所有服务均为 Mock 数据，零外部依赖。

## 知识点映射

### Phase 2 核心知识点

| 文档                          | 应用点                                                                                                                                                          |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **2.1 LangChain.js 架构概览** | **框架基础** — `createAgent` 入口、Tool 定义模式、包生态理解                                                                                                    |
| **2.2 模型与消息系统**        | **核心应用** — `initChatModel` 配置、`responseFormat` 结构化输出意图分类、消息格式规范化                                                                        |
| **2.3 工具系统**              | **核心应用** — 6 个工具（订单查询 / 退款申请 / 工单创建 / 知识库检索 / 偏好读写）的 `tool()` 工厂定义、工具参数 Zod 校验、`ToolRuntime` 使用                    |
| **2.4 Agent 构建与配置**      | **核心应用** — Agent 配置（systemPrompt + tools + middleware + checkpointer 四件套）、`contextSchema` 用户身份注入、`responseFormat` 结构化输出                 |
| **2.5 记忆与状态管理**        | **核心应用** — `SqliteSaver` 多轮对话持久化、`store` 实现跨对话用户偏好记忆、`summarizationMiddleware` 上下文压缩                                               |
| **2.6 中间件系统**            | **核心应用** — `humanInTheLoopMiddleware` 工单审批与恢复、`piiRedactionMiddleware` 脱敏、`modelFallbackMiddleware` 模型容错、`toolCallLimitMiddleware` 工具限流 |
| **2.7 LangSmith 链路追踪**    | **核心应用** — Tracing 全链路追踪、自定义 Evaluator 对话质量评估、回归测试                                                                                      |

### 前置知识

| 文档                   | 应用点                                                                                                            |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------- |
| **1.1 AI/ML 核心概念** | Token 消耗估算（每次客服问答的 prompt + response token）、温度参数选择（客服场景需要确定性回答 → 低 temperature） |
| **1.3 提示词工程**     | 系统 Prompt 设计（客服角色定义 + 情绪管理）、Few-shot 示例（退换货 / 退款 / 物流查询）                            |
| **1.5 RAG 架构**       | 知识库检索增强（产品退换货政策、物流规则等 FAQ 关键词检索，MVP 无需向量）                                         |

## 项目亮点

1. **框架化开发**：使用 LangChain.js `createAgent` 全家桶，体验生产级 Agent 框架的开发模式
2. **双 Agent 架构**：独立**意图分类器**（`responseFormat` 结构化输出）+ 主客服 Agent（工具调用），分工清晰
3. **会话持久化**：`SqliteSaver` 实现多轮对话持久化，重启程序后对话历史不丢失
4. **Human-in-the-Loop**：退款申请/工单创建暂停等待人工审批，并掌握**暂停后的恢复机制**
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
Persistence: better-sqlite3 + @langchain/langgraph-checkpoint-sqlite（SqliteSaver Checkpointer）
Store:       @langchain/langgraph 的 InMemoryStore（MVP，仅进程内有效、重启丢失），生产可换 PostgresStore
Vector DB:   内存关键词匹配（MVP 不引入向量检索）
Tracing:     LangSmith（环境变量配置，零代码侵入）
Mock Data:   订单服务、工单系统、FAQ 知识库（全部内置，零外部依赖）
```

## 为什么使用 Mock 数据

1. **学习聚焦**：项目核心是 LangChain.js 框架的应用模式（Checkpointer、Middleware、Structured Output、Tracing），业务数据只是载体
2. **零外部依赖**：不需要申请订单系统/工单系统 API Key，开箱即用
3. **场景可控**：可以设计丰富的 Mock 场景（正常订单、异常订单、退款争议等），方便测试各种分支
4. **成本可控**：仅产生 LLM API 调用费用，无其他成本

## 模型选型建议

| 场景              | 推荐模型                                         | 说明                                                        |
| ----------------- | ------------------------------------------------ | ----------------------------------------------------------- |
| 默认开发          | `openai:gpt-5.4`                                 | 工具调用稳定，结构化输出准确                                |
| 意图分类/槽位填充 | `openai:gpt-5.4-mini`                            | 低成本，结构化输出足够可靠（独立分类器使用）                |
| 复杂退款纠纷      | `openai:gpt-5.4` / `anthropic:claude-sonnet-4-6` | 需要理解用户情绪和政策细节                                  |
| 国内访问          | `qwen3` / `deepseek-chat` 等                     | 均提供 OpenAI 兼容接口，中文客服友好；需配置对应 `BASE_URL` |

## 架构设计

### 双 Agent 流水线

```mermaid
flowchart LR
    U[用户输入] --> C[意图分类器<br/>responseFormat: IntentSchema]
    C -->|intent + slots| CLI[CLI 编排层]
    CLI --> M[主客服 Agent<br/>createAgent + tools]
    M --> T1[query_order]
    M --> T2[create_refund]
    M --> T3[search_knowledge]
    M --> T4[create_ticket]
    M --> T5[preference 读写]
    M -->|HITL 暂停| H[人工审批]
    H -->|approve / reject| M
```

**为什么拆分类器**：

- 意图分类是**纯结构化任务**，用 `responseFormat`（或 `withStructuredOutput`）一次性输出 `{ intent, slots }`，稳定且省 Token
- 主 Agent 只负责**执行**，不需要在循环里做意图判断，避免"分类 - 调用 - 再分类"的无效轮转
- 分类器与主 Agent 可用**不同模型**（分类器用 mini 模型省钱），对应 `.env` 中 `CLASSIFIER_MODEL`

## 功能清单

### 核心功能（MVP 必做）

> 建议第一次实现先聚焦核心功能，跑通 6 种意图 + HITL 退款后再做高级功能。

- [ ] 多轮对话（SqliteSaver 持久化，重启后对话不丢失）
- [ ] 意图识别（意图分类器：order_query / refund / complaint / faq_query / handoff / greeting，共 6 种）
- [ ] 槽位提取（订单号、商品名、金额等字段自动抽取）
- [ ] 订单状态查询（Mock 订单服务，支持按单号和用户查询）
- [ ] 退款申请与审批（humanInTheLoopMiddleware 暂停等待人工确认 + 恢复机制）
- [ ] 工单创建与转接（复杂问题创建工单，模拟分配客服）
- [ ] 知识库 FAQ 检索（产品政策、退换货规则、物流说明）

### 高级功能

- [ ] 上下文摘要压缩（summarizationMiddleware 管理长对话）
- [ ] PII 脱敏（`piiRedactionMiddleware` 隐藏电话/邮箱）
- [ ] 模型容错（`modelFallbackMiddleware` 主模型失败时自动降级到备选模型）
- [ ] 工具调用限流（`toolCallLimitMiddleware` 防止 Agent 无限循环调用工具）
- [ ] 用户偏好记忆（Store 跨对话持久化用户偏好）
- [ ] LangSmith 全链路追踪（Trace 查看每次对话的完整调用链）
- [ ] 对话质量评估（LangSmith Evaluator：满意度、解决率、转接率）

## 设计预览

### 意图分类器（独立 Agent）

```typescript
import { createAgent } from 'langchain'
import { IntentSchema } from './schema'

export const classifier = createAgent({
  /** Agent 标识：LangSmith Trace 中用于区分分类器与主 Agent 的调用链 */
  name: 'intent_classifier',
  model: process.env.CLASSIFIER_MODEL ?? 'openai:gpt-5.4-mini',
  systemPrompt:
    '你是一个客服意图分类器。根据用户输入，输出意图与槽位。不要调用任何工具。',
  responseFormat: IntentSchema, // Structured Output：强制输出 { intent, slots }
  tools: []
})

// CLI 中调用
const classification = await classifier.invoke({
  messages: [{ role: 'user', content: input }]
})
// classification.structuredResponse → { intent: "order_query", slots: { order_id: "20240601" } }
```

> **兜底策略**：模型偶尔会输出 schema 之外的意图。1）`IntentSchema` 的 `intent` 字段建议用 `z.enum([...]).catch("unknown")` 兜底，解析失败时落到 `unknown`；2）CLI 检测到 `unknown` 时不拦截，仍把原始消息传给主 Agent——主 Agent 的 systemPrompt 已定义边界策略，会自行转人工或礼貌拒绝。

### 主 Agent 配置（核心入口）

```typescript
import {
  createAgent,
  summarizationMiddleware,
  humanInTheLoopMiddleware,
  piiRedactionMiddleware,
  modelFallbackMiddleware,
  toolCallLimitMiddleware
} from 'langchain'
import { SqliteSaver } from '@langchain/langgraph-checkpoint-sqlite'
import { InMemoryStore } from '@langchain/langgraph'
import * as z from 'zod'
import { systemPrompt } from '@/prompts/system.ts'
import { checkpointer } from '@/memory/checkpointer.ts'
import { store } from '@/memory/store.ts'
import {
  queryOrderTool,
  createRefundTool,
  searchKnowledgeTool,
  createTicketTool,
  savePreferenceTool,
  getPreferencesTool
} from '@/agent/tools/index.ts'

const DEFAULT_MODEL = process.env.DEFAULT_MODEL ?? 'openai:gpt-5.4'
const SUMMARY_MODEL = process.env.SUMMARY_MODEL ?? 'openai:gpt-5.4-mini'
const FALLBACK_MODELS = [
  process.env.FALLBACK_MODEL_1 ?? 'openai:gpt-5.4-mini',
  process.env.FALLBACK_MODEL_2 ?? 'anthropic:claude-sonnet-4-6'
]

const agent = createAgent({
  /** Agent 标识：LangSmith Trace 中用于区分主 Agent 与分类器的调用链 */
  name: 'customer_support_agent',
  /** 主模型，由 DEFAULT_MODEL 环境变量配置（createAgent 字符串简写必须带 provider 前缀） */
  model: DEFAULT_MODEL,
  /** 系统 Prompt：客服角色定义 + 工具说明 + 边界策略 + 情绪管理 */
  systemPrompt,
  /** 业务工具（snake_case 命名，与文档规范一致） */
  tools: [
    queryOrderTool,
    createRefundTool,
    searchKnowledgeTool,
    createTicketTool,
    savePreferenceTool,
    getPreferencesTool
  ],
  /** 运行时上下文 Schema：每次 invoke 传入 userId + userName，工具内通过 runtime.context 访问 */
  contextSchema: z.object({
    userId: z.string(),
    userName: z.string()
  }),
  /** 短期记忆 Checkpointer：SqliteSaver 持久化对话历史，同 thread_id 恢复上下文 */
  checkpointer,
  /** 长期记忆 Store：跨对话保存用户偏好（工具通过 runtime.store 读写） */
  store,
  /** 中间件栈，按数组顺序执行（beforeModel 正序 / afterModel 逆序，洋葱模型） */
  middleware: [
    // PII 脱敏：必须放最外层，确保所有模型（主模型 / 摘要模型 / 备选模型）都只收到脱敏后的输入
    // （当前 langchain 版本 piiRedactionMiddleware 已废弃，改用 piiMiddleware 逐类型声明）
    piiMiddleware('email', { strategy: 'redact', applyToInput: true }),
    piiMiddleware('phone', {
      strategy: 'mask',
      applyToInput: true,
      detector: '1[3-9]\\d{9}'
    }),
    // 模型容错：主模型失败时依次降级
    modelFallbackMiddleware(...FALLBACK_MODELS),
    // 工具限流：单次运行最多 10 次工具调用，防止死循环
    toolCallLimitMiddleware({ runLimit: 10, exitBehavior: 'end' }),
    // 上下文压缩：token 超阈值时用 SUMMARY_MODEL 摘要旧消息，保留最近 20 条
    summarizationMiddleware({
      model: SUMMARY_MODEL,
      trigger: { tokens: 4000 },
      keep: { messages: 20 }
    }),
    // 人工审批：退款申请 / 工单创建 暂停等待人工决策
    humanInTheLoopMiddleware({
      interruptOn: {
        create_refund: { allowedDecisions: ['approve', 'reject'] },
        // MVP 只支持 approve/reject；如需"编辑工单内容后重提"，可扩展为 ["approve", "edit", "reject"]（高级功能）
        create_ticket: { allowedDecisions: ['approve', 'reject'] }
      }
    })
  ]
})
```

### HITL 恢复机制（关键！）

`humanInTheLoopMiddleware` 基于 LangGraph 的 dynamic interrupt：Agent 执行到需审批的工具时**暂停并保存状态**，不会自动继续。CLI 需要显式处理暂停 → 等待输入 → 恢复：

```typescript
// CLI 循环伪代码
const result = await agent.invoke(
  { messages: [{ role: 'user', content: input }] },
  config
)

// 1. 判断是否被中断（HITL 暂停）
const interrupt = result.interrupts?.[0] // 或检查 state 中的 __interrupt__

if (interrupt) {
  // 2. 打印可选的决策词，等待用户输入
  console.log(`[暂停] ${interrupt.description}`)
  const decision = await readline() // "approve" / "reject"

  // 3. 用【相同的 thread_id】重新 invoke，传入决策
  //    Checkpointer 恢复暂停时的状态，根据决策继续或阻断执行
  //    推荐用 Command({ resume: decision })：决策值不进入对话历史，模型不会把它当成普通聊天内容
  const resumed = await agent.invoke(
    new Command({ resume: decision }),
    config // 同一个 { configurable: { thread_id } }
  )
  console.log(resumed.messages.at(-1)?.content)
}
```

> **恢复方式说明**：LangGraph 的标准恢复方式是 `Command({ resume: decision })`（`decision` 为 "approve"/"reject" 等决策值），需要从 `@langchain/langgraph` 导入 `Command`。把决策作为普通 user message 注入也能工作（部分教程写法），但模型可能把 "approve" 当成闲聊内容而不按决策响应——如果走 user message 路线发现行为异常，改用 `Command` 即可。

> 原理详见 [2.6 中间件系统](01-../../doc/02-LangChain.js生态深度掌握/06-中间件系统.md) 面试问答：暂停状态由 Checkpointer 持久化，恢复时带相同 `thread_id` 重新调用，即可从断点继续。

### CLI 交互示例

```bash
$ bun run cli --user=李华

👋 智能客服已启动（用户：李华），输入问题开始对话（输入 exit 退出）

> 帮我查一下订单 20240601 的状态
[意图] order_query → 槽位: { order_id: "20240601" }
[调用] query_order({ order_id: "20240601" })
[回复] 您订单 20240601 的状态是「已发货」，预计明天送达。需要帮您做其他操作吗？

> 我想退款，订单号是 20240601
[意图] refund → 槽位: { order_id: "20240601" }
[调用] create_refund({ order_id: "20240601", reason: "用户主动申请" })
[暂停] ⏸️ 退款操作等待人工审批...
       approve / reject ？
> approve
[恢复] 审批通过，继续执行
[回复] 退款申请已提交，订单 20240601 的退款将在 3-5 个工作日内原路返回。

> 你们的退货政策是什么？
[意图] faq_query
[调用] search_knowledge({ query: "退货政策" })
[回复] 我们的退货政策：自签收日起 7 天内支持无理由退货，商品需保持原包装完好...

> 我的电话是 13812345678，发短信通知我
[脱敏] PII detected: phone → masked
[回复] 已记录您的联系方式为 138****5678，退款进度将通过短信通知。

> 以后都叫我小王吧
[调用] save_preference({ key: "nickname", value: "小王" })
[回复] 好的小王，已记住你的称呼。

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
>
> 意图分类器在调用主 Agent **之前**先执行，CLI 打印 `[意图]` 后，把原始用户消息（或原始消息 + 意图摘要）传给主 Agent。
>
> **实际实现用 `invoke` 驱动对话循环**（`streamEvents` 方案已放弃）：当前版本 `agent.getState` / `getInterrupts` 属内部 API（类型返回 never），流式结束后无法可靠读取中断状态；而 `invoke` 返回值直接携带 `__interrupt__`（文档 2.6 §2.2 的可靠读取点）。若需要流式输出，可在流结束后改用 `invoke` + `Command({ resume })` 恢复：
>
> ```ts
> // invoke 返回值即含中断信息（可靠读取点）
> const result = await agent.invoke(
>   { messages: [{ role: 'user', content: input }] },
>   config
> )
> const interrupt = result.__interrupt__?.[0]?.value
> if (interrupt && interrupt.actionRequests.length > 0) {
>   // 收集人工决策后恢复执行（同 thread_id）
>   const resumed = await agent.invoke(
>     new Command({ resume: { decisions } }),
>     config
>   )
> }
> ```
>
> 完整对话循环见 [src/cli.ts](src/cli.ts)：HITL 用 while 循环处理——resume 后可能再次触发中断（如同轮多个审批工具），需循环收集决策直至无中断。

## 目录结构

```
02-customer-service/
├── README.md                    # 本文件（项目需求与设计文档）
├── package.json                 # 依赖配置
├── tsconfig.json                # TypeScript 配置
├── .env.example                 # 环境变量模板
├── src/
│   ├── cli.ts                   # CLI 入口：分类器编排 + 对话循环 + 审批输入
│   ├── agent/
│   │   ├── agent.ts             # 主客服 Agent 配置与初始化
│   │   ├── classifier.ts        # 意图分类器（独立 Agent + responseFormat）
│   │   ├── schema.ts            # IntentSchema / 槽位 Schema 定义
│   │   └── tools/
│   │       ├── index.ts         # 工具聚合导出
│   │       ├── query_order.ts   # 订单查询工具
│   │       ├── create_refund.ts # 退款申请工具（HITL 审批）
│   │       ├── search_knowledge.ts # 知识库检索工具
│   │       ├── create_ticket.ts # 工单创建工具（HITL 审批）
│   │       └── preference.ts    # 用户偏好读写工具（runtime.store）
│   ├── prompts/
│   │   └── system.ts            # 系统 Prompt + Few-shot 示例
│   ├── services/
│   │   ├── order.ts             # 订单查询服务（Mock）
│   │   ├── ticket.ts            # 工单系统（Mock）
│   │   ├── knowledge.ts         # 知识库 FAQ 数据与关键词检索
│   │   └── type.ts              # 共享类型定义
│   ├── memory/
│   │   ├── checkpointer.ts      # SqliteSaver Checkpointer 配置
│   │   └── store.ts             # Store 配置（MVP 使用 InMemoryStore）
│   └── evaluation/
│       ├── evaluator.ts         # 自定义 Evaluator
│       └── test-data.json       # 测试数据集
└── test/
    ├── agent.test.ts            # Agent 端到端测试
    ├── tools.test.ts            # 工具参数校验测试
    └── memory.test.ts           # 会话持久化测试
```

## 错误处理策略

| 异常类型           | 处理策略                                                         |
| ------------------ | ---------------------------------------------------------------- |
| 无效订单号         | 引导用户"未找到该订单，请检查订单号是否正确（8 位数字）"         |
| 退款条件不满足     | 根据 Mock 规则返回具体原因（如超过退货期限）                     |
| 知识库无匹配       | 返回"我目前无法回答这个问题，已为您转接人工客服"                 |
| 工具参数验证失败   | Zod 校验失败，提示具体字段错误                                   |
| LLM 调用失败       | 记录 Trace，返回"系统异常，请稍后再试"（modelFallback 自动降级） |
| PII 检测到敏感信息 | 自动脱敏后继续执行，记录审计日志                                 |

## 测试覆盖

| 测试文件         | 覆盖范围                                                         |
| ---------------- | ---------------------------------------------------------------- |
| `agent.test.ts`  | 6 种意图识别路径、多轮对话上下文保持、Human-in-the-Loop 审批流程 |
| `tools.test.ts`  | 工具参数校验、Mock 服务边界场景（无效订单、不可退款等）          |
| `memory.test.ts` | SqliteSaver 持久化（进程重启后恢复）、Store 跨对话偏好记忆       |

> 💡 CI 测试中可使用 `llmToolEmulatorMiddleware({ model: 'gpt-5.4-mini' })` 模拟工具执行，无需真实 API 调用即可验证 Agent 行为逻辑。

## 验收标准

### 核心功能（必过）

- [ ] 意图识别：6 种意图在测试数据集上准确率 ≥ 80%。
- [ ] 订单查询：有效订单号返回正确状态，无效订单号返回引导话术。
- [ ] HITL 退款：发起退款后 Agent 暂停，输入 `approve` 才继续，输入 `reject` 则拒绝。
- [ ] 知识库：命中 FAQ 时直接返回知识库内容，未命中时提示转人工。
- [ ] 持久化：使用相同 `thread_id` 重启 CLI 后，Agent 能记住之前的问题。

### 高级功能（尽量完成）

- [ ] PII 脱敏：输入电话/邮箱后，回复中敏感信息被遮蔽（可见 `138****5678` 效果）。
- [ ] 摘要压缩：长对话超过 token 阈值后，历史消息被摘要替代，旧信息仍可回答。
- [ ] 偏好记忆：同一 `userId` 不同 `thread_id`，Agent 能记住上轮保存的称呼/偏好（⚠️ MVP 用 InMemoryStore，仅**进程内**有效；重启 CLI 后偏好丢失属预期行为，不要误判为 bug）
- [ ] 模型降级：临时把主模型 API Key 改错，Agent 自动降级到备选模型仍能回复。
- [ ] 工具限流：构造死循环场景，Agent 在超过 `runLimit` 后优雅终止。
- [ ] LangSmith：能在 Trace 中看到分类器 + 主 Agent 的完整调用链。

## 实现步骤

### 🟢 第一步：基础骨架

1. 创建 `package.json` 和 `tsconfig.json`，安装 LangChain.js 核心依赖（参考仓库已有配置）
2. 实现 `src/services/` 下的 Mock 数据服务（订单、工单、知识库）
3. 实现 `src/prompts/system.ts` 系统 Prompt 和 Few-shot 示例
4. 配置 `src/memory/checkpointer.ts` 的 SqliteSaver 和 `src/memory/store.ts` 的 InMemoryStore
   > ⚠️ 学习文档只给了 `PostgresSaver.fromConnString` 示例，SqliteSaver 的初始化 API 需翻参考文档核实（`SqliteSaver.fromConnString("sqlite://...")` 或传入 Database 实例），参考链接见文末。

### 🟡 第二步：工具与 Schema

5. 实现 `src/agent/schema.ts` 意图 Schema（6 种意图 + 槽位字段）
6. 实现 `src/agent/tools/` 六个工具（query_order / create_refund / search_knowledge / create_ticket / preference 读写）
7. 实现 `src/agent/agent.ts` 组装 createAgent 配置

### 🔴 第三步：分类器与 CLI 交互

8. 实现 `src/agent/classifier.ts` 意图分类器（responseFormat 结构化输出）
9. 实现 `src/cli.ts` 命令行入口（用户身份注入、分类器编排、对话循环、HITL 恢复）
10. 实现高级中间件（summarization + piiRedaction + modelFallback + toolCallLimit）
11. 端到端测试全部 6 种意图路径

### 📊 第四步：可观测与评估

12. 配置 LangSmith 环境变量，验证 Trace 生成
13. 实现自定义 Evaluator（满意度 / 解决率 / 转接率）
14. 创建测试数据集并运行回归评估

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

# 默认模型（createAgent 字符串需带 provider 前缀）
DEFAULT_MODEL=openai:gpt-5.4
# 意图分类模型（可用低成本模型）
CLASSIFIER_MODEL=openai:gpt-5.4-mini
# 摘要模型
SUMMARY_MODEL=openai:gpt-5.4-mini
# 模型降级备选（modelFallbackMiddleware）
FALLBACK_MODEL_1=openai:gpt-5.4-mini
FALLBACK_MODEL_2=anthropic:claude-sonnet-4-6

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
  services/ → schema.ts → tools/ → prompts/system.ts → classifier.ts → agent.ts → cli.ts

第二遍（深入实现）：
  每个文件按 TODO 标记逐步实现
```

### 当前实现状态一览

> 全部实现完成（2026-09）。`bun test` 57 pass；`bun run cli` 走查 6 种意图 + HITL + PII 脱敏 + 偏好记忆全部通过；`bun run evaluate` 真实 LLM 数据集评估 8/8 通过。

| 文件                            |   状态    | 关键产出                                                           |
| ------------------------------- | :-------: | ------------------------------------------------------------------ |
| `src/services/order.ts`         | ✅ 已实现 | Mock 订单服务（13 条订单，全状态场景）                             |
| `src/services/ticket.ts`        | ✅ 已实现 | Mock 工单系统（内存存储）                                          |
| `src/services/knowledge.ts`     | ✅ 已实现 | FAQ 知识库（20+ 条目，关键词检索）                                 |
| `src/agent/schema.ts`           | ✅ 已实现 | 6 种意图 + 槽位 Schema（zod union + catch 兜底）                   |
| `src/agent/classifier.ts`       | ✅ 已实现 | 意图分类器（提示词 JSON + 手工解析兜底，含 PII 脱敏）              |
| `src/agent/tools/*.ts`          | ✅ 已实现 | 6 个工具定义（snake_case 命名）                                    |
| `src/agent/agent.ts`            | ✅ 已实现 | 主 Agent 配置 + 5 层中间件栈                                       |
| `src/prompts/system.ts`         | ✅ 已实现 | 客服系统 Prompt + 6 组 Few-shot                                    |
| `src/memory/checkpointer.ts`    | ✅ 已实现 | SqliteSaver（bun:sqlite 适配器）                                   |
| `src/memory/store.ts`           | ✅ 已实现 | 用户偏好 Store（InMemoryStore）                                    |
| `src/cli.ts`                    | ✅ 已实现 | CLI 交互 + 分类器编排 + HITL 恢复 + 自建 Trace                     |
| `src/observability/tracer.ts`   | ✅ 已实现 | 自建链路追踪：BaseCallbackHandler → JSONL Run Tree                 |
| `src/evaluation/evaluator.ts`   | ✅ 已实现 | 意图 / 槽位 / 工具 三维 Evaluator + 本地评估 runner                |
| `src/evaluation/test-data.json` | ✅ 已实现 | 8 条回归用例（覆盖 6 种意图）                                      |
| `test/*.test.ts`                | ✅ 已实现 | 6 套测试 57 用例（tools / memory / agent / tracer / evaluator 等） |

## 参考文档

- [What's new in LangChain.js v1](https://docs.langchain.com/oss/javascript/releases/langchain-v1)
- [Agents / createAgent](https://docs.langchain.com/oss/javascript/langchain/agents.md)
- [Middleware 概览](https://docs.langchain.com/oss/javascript/langchain/middleware)
- [内置 Middleware（Summarization / HITL / PII 等）](https://docs.langchain.com/oss/javascript/langchain/middleware/built-in.md)
- [Runtime 与 contextSchema](https://docs.langchain.com/oss/javascript/langchain/runtime)
- [短期记忆与 Checkpointer](https://docs.langchain.com/oss/javascript/langchain/short-term-memory.md)
- [长期记忆与 Store](https://docs.langchain.com/oss/javascript/langchain/long-term-memory)
- [SqliteSaver API 参考（@langchain/langgraph-checkpoint-sqlite）](https://reference.langchain.com/javascript/functions/langgraph_checkpoint_sqlite.SqliteSaver.html)
- [Human-in-the-Loop](https://docs.langchain.com/oss/javascript/langchain/human-in-the-loop)
- [Structured Output](https://docs.langchain.com/oss/javascript/langchain/structured-output)
- [LangSmith Tracing](https://docs.langchain.com/langsmith/tracing)
- [piiRedactionMiddleware API 参考](https://reference.langchain.com/javascript/functions/langchain.index.piiRedactionMiddleware.html)
- [LangChain.js 文档索引 llms.txt](https://docs.langchain.com/llms.txt)

---

> 本项目将第二阶段 7 篇文档的框架能力融会贯通，完成后你将具备使用 LangChain.js 构建生产级 Agent 应用的完整能力。
