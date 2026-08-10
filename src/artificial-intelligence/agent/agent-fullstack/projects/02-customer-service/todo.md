# 智能客服系统 — 学习 Todo

> 对应需求文档：[README.md](README.md)
> 教程文档：`doc/02-LangChain.js生态深度掌握/`（下文以「文档 2.x」引用）
> 学习方式：按 Phase 顺序推进，每步先读对应文档章节，再动手实现，最后跑验证。

---

## Phase 0：环境准备

> 前置：确认依赖已安装（`bun install`），`package.json` 已存在。

- [ ] 确认依赖齐备：`langchain`、`@langchain/core`、`@langchain/langgraph`、`@langchain/langgraph-checkpoint-sqlite`、`@langchain/openai`、`zod`、`better-sqlite3`、`dotenv`
- [ ] 确认 `tsconfig.json`：`strict`、`moduleResolution: bundler`、`target: ES2022`
- [ ] 按 README 目录结构创建空目录：`src/agent/tools`、`src/prompts`、`src/services`、`src/memory`、`src/evaluation`、`test`、`data`
- [ ] 复制 `.env.example` → `.env`，填入真实 API Key

**验证**：`bun run index.ts` 输出 `Hello via Bun!`（临时验证脚本可用，稍后删除）

---

## Phase 1：基础骨架（Mock 服务 + Prompt + 记忆）

> 本阶段不涉及 LLM 调用，纯业务层，为后续工具提供数据源。

### 1.1 Mock 订单服务 `src/services/order.ts`

**目标**：提供订单查询与退款条件校验，覆盖正常/异常场景。

**关键产出**：
- `Order` 类型：订单号、商品名、金额、状态、下单/签收时间、是否可退款
- 10+ 条 Mock 订单（已发货 / 7 天内可退 / 超期不可退 / 已取消 / 退款中 / 已退款）
- `getOrderById(orderId: string, userId: string)`：未找到返回 `null`
- `canRefund(order: Order)`：返回 `{ ok: boolean; reason?: string }`

**API 提示**：无 LangChain API，纯 TypeScript 类型与数据。参考文档 [2.3 工具系统 §3 Zod 校验](01-../../doc/02-LangChain.js生态深度掌握/03-工具系统.md) 中 `.describe()` 的写法，字段命名用 snake_case（`order_id`）。

**验证**：`bun test` 单测有效/无效订单、超期不可退。

### 1.2 Mock 工单服务 `src/services/ticket.ts`

**目标**：创建工单并返回工单号。

**关键产出**：
- `Ticket` 类型：工单号（`TK` + 时间戳）、用户 ID、问题摘要、状态、创建时间
- 内存数组存储
- `createTicket(params)`、`getTicket(ticketId)`

**验证**：创建后能按工单号查到。

### 1.3 FAQ 知识库 `src/services/knowledge.ts`

**目标**：关键词检索 FAQ，命中返回答案，未命中返回空。

**关键产出**：
- 20+ 条 FAQ（退换货、退款时效、物流、换货流程、售后时间）
- `searchKnowledge(query: string, topK = 3)`：按关键词匹配返回相关条目

**验证**：`退货政策` 命中；`你们的 CEO 是谁` 返回空数组。

### 1.4 系统 Prompt `src/prompts/system.ts`

**目标**：定义客服角色、能力边界、情绪管理、Few-shot 示例。

**关键产出**：
- 角色定义：礼貌、专业的中文客服
- 能力范围：列出 6 个工具能做什么（引导模型调用工具）
- 边界策略：非业务问题拒绝 / 转人工话术
- 6 组 Few-shot（对应 6 种意图：order_query / refund / complaint / faq_query / handoff / greeting）

**API 提示**：纯字符串。结构参考 [文档 2.4 §3 System Prompt 设计原则](01-../../doc/02-LangChain.js生态深度掌握/04-Agent构建与配置.md)：角色 → 能力范围 → 行为规则 → 输出格式。

**验证**：`agent.ts` 能直接引用 `systemPrompt`。

### 1.5 短期记忆 Checkpointer `src/memory/checkpointer.ts`

**目标**：SqliteSaver 持久化对话历史。

**关键产出**：
- 读取 `CHECKPOINTER_PATH`（默认 `./data/checkpoints.db`），确保 `data/` 存在
- 导出 `checkpointer`

**API 提示**：
- 包：`@langchain/langgraph-checkpoint-sqlite`
- ⚠️ 教程文档只给了 [PostgresSaver.fromConnString 示例](01-../../doc/02-LangChain.js生态深度掌握/05-记忆与状态管理.md#31-postgresql-checkpointer)，SqliteSaver 初始化需查 [API 参考](https://reference.langchain.com/javascript/functions/langgraph_checkpoint_sqlite.SqliteSaver.html)：可能是 `SqliteSaver.fromConnString("sqlite://...")` 或传入 `new Database()` 实例（better-sqlite3）

**验证**：同 `thread_id` 两次调用，第二次能想起第一轮内容。

### 1.6 长期记忆 Store `src/memory/store.ts`

**目标**：跨对话保存用户偏好。

**关键产出**：
- 导出 `store`：`new InMemoryStore()`（来自 `@langchain/langgraph`）
- 注释说明：生产可换 `PostgresStore`（`@langchain/langgraph-checkpoint-postgres/store`）

**API 提示**：[文档 2.5 §5 长期记忆 Store](01-../../doc/02-LangChain.js生态深度掌握/05-记忆与状态管理.md)：`new InMemoryStore()`；读写必须通过工具的 `runtime.store`（不能闭包引用）。

**验证**：能被 `createAgent({ store })` 引用（下一阶段验证读写）。

---

## Phase 2：工具与 Schema

> 对应 [文档 2.3 工具系统](01-../../doc/02-LangChain.js生态深度掌握/03-工具系统.md) 与 [文档 2.4 §4 Structured Output](01-../../doc/02-LangChain.js生态深度掌握/04-Agent构建与配置.md)。

### 2.1 意图 Schema `src/agent/schema.ts`

**目标**：定义意图分类 + 槽位的 Zod Schema。

**关键产出**：
- `IntentSchema`：
  - `intent`: `z.enum(["order_query", "refund", "complaint", "faq_query", "handoff", "greeting"]).catch("unknown")`（兜底策略）
  - `slots`: `z.object({ order_id, product_name, amount, reason, contact })` 全部 optional
  - `reply`: optional（greeting / handoff 可直接回复）
- `type IntentOutput = z.infer<typeof IntentSchema>`

**API 提示**：[文档 2.4 §4.1 使用 Zod Schema](01-../../doc/02-LangChain.js生态深度掌握/04-Agent构建与配置.md)：`z.object({...})` + `.describe()` 帮助模型理解字段；`.catch("unknown")` 是 zod 4 的解析兜底。

**验证**：`bun test` 校验合法输入解析成功、非法意图落到 `unknown`。

### 2.2 业务工具 `src/agent/tools/`

**目标**：6 个工具，均用 `tool()` 工厂 + Zod 参数校验。

**关键产出**（每个工具独立文件 + `index.ts` 聚合导出）：

| 文件 | 工具名 | 参数 | 行为 |
|------|--------|------|------|
| `query_order.ts` | `query_order` | `{ order_id }` | 查订单，未找到返回引导话术 |
| `create_refund.ts` | `create_refund` | `{ order_id, reason }` | `canRefund` 校验，不满足返回原因 |
| `search_knowledge.ts` | `search_knowledge` | `{ query }` | 检索 FAQ，未命中提示转人工 |
| `create_ticket.ts` | `create_ticket` | `{ summary, priority? }` | 创建工单返回工单号 |
| `preference.ts` | `save_preference` | `{ key, value }` | 写 `runtime.store`（用户偏好） |
| `preference.ts` | `get_preferences` | `{}` | 读 `runtime.store` |

**API 提示**：
- 工具定义：[文档 2.3 §1.2](01-../../doc/02-LangChain.js生态深度掌握/03-工具系统.md) — `tool(fn, { name, description, schema })`，描述要写清"何时调用"
- Runtime Context：[文档 2.3 §4.1](01-../../doc/02-LangChain.js生态深度掌握/03-工具系统.md) — 第二个参数 `config: ToolRuntime`，`config.context.userId` 读用户身份
- Store 读写：[文档 2.5 §5.3](01-../../doc/02-LangChain.js生态深度掌握/05-记忆与状态管理.md) — `runtime.store.get(["users", userId], "preferences")` / `.put(...)`
- 命名规范：[文档 2.3 §2.4](01-../../doc/02-LangChain.js生态深度掌握/03-工具系统.md) — snake_case
- 错误返回：业务错误**返回消息字符串**（可恢复，模型能读懂），不要 throw（权限等不可恢复错误才 throw）

**验证**：`bun test` 参数校验、无效订单、不可退款、知识库未命中。

### 2.3 主 Agent 配置 `src/agent/agent.ts`

**目标**：`createAgent` 组装完整主 Agent。

**关键产出**：
- `model`：`process.env.DEFAULT_MODEL`（带 provider 前缀，如 `openai:gpt-5.4`）
- `systemPrompt`、`contextSchema`（`userId` + `userName`）
- `checkpointer`、`store`
- 中间件（顺序重要）：piiRedaction → modelFallback → toolCallLimit → summarization → humanInTheLoop

**API 提示**：
- [文档 2.4 §2 `createAgent` 完整配置项](01-../../doc/02-LangChain.js生态深度掌握/04-Agent构建与配置.md)
- [文档 2.6 内置 Middleware](01-../../doc/02-LangChain.js生态深度掌握/06-中间件系统.md)：
  - `piiRedactionMiddleware([{ name, strategy, applyToInput }])` — 数组签名，`email: redact`、`phone: mask`；**放最外层**确保所有模型拿到脱敏输入
  - `modelFallbackMiddleware(...models)` — 可变参数备选模型
  - `toolCallLimitMiddleware({ runLimit: 10, exitBehavior: "end" })`
  - `summarizationMiddleware({ model, trigger: { tokens: 4000 }, keep: { messages: 20 } })`
  - `humanInTheLoopMiddleware({ interruptOn: { create_refund: { allowedDecisions: ["approve", "reject"] }, ... } })`
- PII 注意事项：真实手机号/邮箱会触发脱敏，测试时可故意输入 `13812345678` 观察效果

**验证**：`bun run cli` 能启动（CLI 就位后）；传入 `context` 后 Agent 知道用户身份。

### 2.4 测试文件 `test/tools.test.ts`、`test/memory.test.ts`

**目标**：为已完成的工具与记忆层建立回归测试（Phase 1.1/2.1/2.2 验证中的 `bun test` 依赖这些文件）。

**关键产出**：
- `test/tools.test.ts`：工具参数校验、无效订单、不可退款、知识库未命中
- `test/memory.test.ts`：
  - SqliteSaver：同 `thread_id` 两次 `agent.invoke`，第二轮能想起第一轮内容（用临时 db 路径，如 `new Database(":memory:")`）
  - Store 跨线程偏好：构造**两个不同 thread_id + 同一 userId** 直接调 `agent.invoke`，第二轮能读出第一轮保存的偏好

**验证**：`bun test` 全绿。

---

## Phase 3：分类器与 CLI 交互

### 3.1 意图分类器 `src/agent/classifier.ts`

**目标**：独立 Agent 做意图分类 + 槽位填充。

**关键产出**：
- `createAgent({ name: "intent_classifier", model: CLASSIFIER_MODEL, responseFormat: IntentSchema, tools: [], systemPrompt: "客服意图分类器..." })`
- 调用后取 `result.structuredResponse`（`{ intent, slots }`）

**API 提示**：[文档 2.4 §4 Structured Output](01-../../doc/02-LangChain.js生态深度掌握/04-Agent构建与配置.md) — Agent 级 `responseFormat` 在循环结束后强制结构化，结果在 `result.structuredResponse`；`name` 用于 LangSmith 区分调用链。

**验证**：分类器对 6 种意图样例均输出合法 `{ intent, slots }`。

### 3.2 CLI 入口 `src/cli.ts`

**目标**：命令行交互：分类器编排 → 主 Agent 对话 → HITL 审批恢复。

**关键产出**：
- 解析 `--user=李华`，派生 `userId` / `userName`
- 主循环：
  1. 读输入 → 调分类器 → 打印 `[意图] 槽位`
  2. `unknown` 意图不拦截，原样传给主 Agent
  3. 主 Agent `streamEvents` 打印 `[调用]` 与流式回复
  4. `streamEvents` 流结束后用 `agent.getState(config)` 检查是否中断 → 提示 approve/reject → `Command({ resume })` 恢复
- `exit` 退出

**API 提示**：
- 分类器调用：`classifier.invoke({ messages: [{ role: "user", content: input }] })`
- 主 Agent 流式：[文档 2.4 §5.2 `streamEvents`](01-../../doc/02-LangChain.js生态深度掌握/04-Agent构建与配置.md) — `agent.streamEvents(input, { configurable, context, version: "v3" })`，遍历 `snapshot.messages.at(-1)` 判断 `tool_calls` / `ai` content
- HITL 恢复：[文档 2.6 面试问答（HITL 原理）](01-../../doc/02-LangChain.js生态深度掌握/06-中间件系统.md) — ⚠️ `result.interrupts?.[0]` 只在 `invoke` 的返回里可用；本 CLI 用 `streamEvents`，流结束没有该对象，需调 `agent.getState(config)` 读 `state.__interrupt__`（或 `agent.getInterrupts(config)`）判断是否暂停。恢复用 `new Command({ resume: decision })`（`@langchain/langgraph`），**同 thread_id**
- `Command` 参考：[文档 2.1 包生态](01-../../doc/02-LangChain.js生态深度掌握/01-LangChain.js架构概览.md) — `@langchain/langgraph` 导出 `Command`

**验证**：
- `bun run cli --user=李华` 完整跑通 6 种意图
- 退款流程：输入后暂停 → `approve` 继续 / `reject` 拒绝
- 相同 `--user` 重启后能接上上轮对话（SqliteSaver 生效）
- 同会话内保存的称呼立即生效（偏好读写走 `runtime.store`）
- ⚠️ **跨线程偏好**（同一 userId 不同 thread_id）在 CLI 里无法演示：thread_id 由 userId 派生（`cs-${userId}`），同一用户只有一条线程。此项验证放在 `test/memory.test.ts`（构造两个不同 thread_id 直接调 `agent.invoke`）

### 3.3 端到端测试 `test/agent.test.ts`

**目标**：覆盖 6 种意图路径、多轮上下文保持、HITL 审批流程。

**关键产出**：
- 6 种意图各一条输入，断言分类器输出合法 `{ intent, slots }`
- 同 `thread_id` 两轮对话，断言上下文延续
- HITL：触发退款暂停 → `Command({ resume: "approve" })` → 断言继续执行；`reject` 断言阻断
- 注册 `llmToolEmulatorMiddleware({ model: "gpt-5.4-mini" })` 模拟工具执行（[文档 2.6 §2.10](01-../../doc/02-LangChain.js生态深度掌握/06-中间件系统.md)），降低对真实工具调用的依赖

**验证**：`bun test` 全绿（⚠️ 端到端仍会调用 LLM，需真实 API Key）。

---

## Phase 4：可观测与评估

> 对应 [文档 2.7 LangSmith 链路追踪](01-../../doc/02-LangChain.js生态深度掌握/07-LangSmith链路追踪.md)。

### 4.1 LangSmith Tracing

**目标**：每次调用自动生成 Trace。

**关键产出**：
- `.env` 配置 `LANGSMITH_TRACING=true`、`LANGSMITH_API_KEY`、`LANGSMITH_PROJECT=customer-service`
- 运行几轮对话，在 LangSmith UI 查看分类器 + 主 Agent 的调用链

**API 提示**：零代码侵入，环境变量驱动（[文档 2.7 §1.2](01-../../doc/02-LangChain.js生态深度掌握/07-LangSmith链路追踪.md)）。可通过 `agent.invoke(input, { tags: ["debug"] })` 打标签方便过滤。

**验证**：UI 中能看到 `intent_classifier` 与 `customer_support_agent` 两条链路。

### 4.2 自定义 Evaluator `src/evaluation/evaluator.ts`

**目标**：对话质量评估（满意度 / 解决率 / 转接率）。

**关键产出**：
- `src/evaluation/test-data.json`：多组 `{ input, referenceOutput, metadata: { expected_intent, expected_slots, expected_outcome } }`（⚠️ 平台约定字段是 `input` + `referenceOutput`，自定义期望值放 `metadata`，否则 `runOnDataset` 字段对不上；`reference` 对应 `referenceOutput`）
- Evaluator 函数：`({ input, output, reference }) => ({ key, score, comment })`

**API 提示**：[文档 2.7 §4.3/4.4](01-../../doc/02-LangChain.js生态深度掌握/07-LangSmith链路追踪.md) — 自定义 Evaluator 是普通函数；`runOnDataset` 来自 `langsmith/evaluation`（签名可能随版本变化，以 [LangSmith JS SDK](https://docs.smith.langchain.com/) 为准）。

**验证**：对测试数据集输出可读评分报告；对比不同版本的通过率。

---

## Phase 5：收尾

- [ ] 运行 `bun test` 全量测试通过
- [ ] `bun run cli --user=李华` 人工走查全部场景（含 HITL 恢复、PII 脱敏、偏好记忆）
- [ ] 更新 README「当前实现状态一览」表格（❌ → ✅）
- [ ] 删除临时 `index.ts`（Hello World）及其 `package.json` 入口配置
- [ ] 提交 git（参考仓库规范：`feat: xxx`）

---

## 学习要点速查（每步的 API 出处）

| 能力 | 核心 API | 文档出处 |
|------|---------|---------|
| 创建 Agent | `createAgent({ model, systemPrompt, tools, contextSchema, checkpointer, store, middleware, responseFormat })` | 2.4 |
| 定义工具 | `tool(fn, { name, description, schema })` + Zod | 2.3 |
| 结构化输出 | `responseFormat: Schema` → `result.structuredResponse` | 2.4 |
| 短期记忆 | `SqliteSaver`（初始化 API 见 1.5 ⚠️）/ `new InMemoryStore()` | 2.5 |
| 长期记忆 | 工具内 `runtime.store.get/put` + `createAgent({ store })` | 2.5 |
| PII 脱敏 | `piiRedactionMiddleware([{ name, strategy, applyToInput }])` | 2.6 |
| 模型容错 | `modelFallbackMiddleware("a", "b")` | 2.6 |
| 工具限流 | `toolCallLimitMiddleware({ runLimit, exitBehavior })` | 2.6 |
| 摘要压缩 | `summarizationMiddleware({ model, trigger, keep })` | 2.5 / 2.6 |
| 人工审批 | `humanInTheLoopMiddleware({ interruptOn })` + `Command({ resume })` | 2.6 |
| 流式输出 | `agent.streamEvents(input, { version: "v3" })` | 2.4 |
| 链路追踪 | 环境变量 `LANGSMITH_TRACING` | 2.7 |
| 评估 | 自定义 Evaluator 函数 + `runOnDataset`（`langsmith`） | 2.7 |

---

## 参考文档

- [LangChain.js 官方文档](https://docs.langchain.com/oss/javascript/langchain/agents)
- [SqliteSaver API 参考](https://reference.langchain.com/javascript/functions/langgraph_checkpoint_sqlite.SqliteSaver.html)
- [piiRedactionMiddleware API 参考](https://reference.langchain.com/javascript/functions/langchain.index.piiRedactionMiddleware.html)
- [LangSmith JS SDK](https://docs.smith.langchain.com/)
