# 智能客服系统 — 实现 Todo

> 对应需求文档：[README.md](README.md)

---

## Phase 0：项目初始化 ✅

- [x] 创建/更新 `package.json`，安装 LangChain.js 核心依赖
- [x] 确认 `tsconfig.json` 配置正确（ESM、Strict、Bundler moduleResolution）
- [x] 按 README 目录结构创建空目录：`src/agent`、`src/prompts`、`src/services`、`src/memory`、`src/evaluation`、`test`、`data`
- [x] 在 `package.json` 添加脚本：`cli`、`test`

**验证方式**：

```bash
bun --version
bun run index.ts   # 应输出 Hello via Bun!
```

---

## Phase 1：基础骨架

### 1.1 实现 Mock 订单服务 `src/services/order.ts` ✅

**目标**：提供订单查询与退款条件校验能力，覆盖常见客服场景。

**关键产出**：

- 定义 `Order` 类型（订单号、商品名、金额、状态、下单时间、签收时间、是否可退款等）
- 内置 10+ 条 Mock 订单数据，至少覆盖：
  - 正常已发货
  - 已签收（7 天内，可退款）
  - 已签收（超过 7 天，不可退款）
  - 已取消
  - 已退款
  - 退款中
- 导出函数：
  - `getOrderById(orderId: string, userId: string)`：按单号+用户查询，未找到返回 `null`
  - `canRefund(order: Order)`：返回 `{ ok: boolean; reason?: string }`

**验收标准**：

- 有效订单号返回正确订单
- 无效订单号返回 `null`
- 超期订单 `canRefund.ok === false` 并附带具体原因

---

### 1.2 实现 Mock 工单服务 `src/services/ticket.ts` ✅

**目标**：为复杂问题创建工单并返回工单号。

**关键产出**：

- 定义 `Ticket` 类型（工单号、用户ID、问题摘要、状态、创建时间）
- 内存数组存储工单
- 导出函数：
  - `createTicket(params)`：创建工单，返回工单号
  - `getTicket(ticketId)`：查询工单状态

**验收标准**：

- 创建工单后能通过工单号查询到
- 工单号格式统一（例如 `TK` + 时间戳）

---

### 1.3 实现 FAQ 知识库 `src/services/knowledge.ts` ✅

**目标**：支持关键词检索，命中 FAQ 时直接返回答案，未命中时返回空。

**关键产出**：

- 内置 20+ 条 FAQ，覆盖：
  - 退货政策
  - 退款时效
  - 物流说明
  - 换货流程
  - 售后服务时间
- 导出函数：
  - `searchKnowledge(query: string, topK = 3)`：按关键词匹配，返回最相关的 FAQ 列表

**验收标准**：

- “退货政策”能命中退货相关答案
- “你们的 CEO 是谁”这类无匹配问题返回空数组

---

### 1.4 系统 Prompt `src/prompts/system.ts` ✅

**目标**：定义客服 Agent 的角色、边界、情绪和 Few-shot 示例。

**关键产出**：

- `systemPrompt` 字符串，包含：
  - 角色定义：礼貌、专业的中文客服
  - 可用工具说明
  - 拒绝回答非业务问题
  - 情绪管理策略
  - 5 组 Few-shot 示例（退换货、退款、物流查询、投诉、人工转接）

**验收标准**：

- Prompt 被 `agent.ts` 直接引用
- 至少包含 3 组以上 Few-shot

---

### 1.5 短期记忆 Checkpointer `src/memory/checkpointer.ts` ✅

**目标**：使用 SqliteSaver 实现多轮对话持久化。

**关键产出**：

- [x] 从环境变量读取 `CHECKPOINTER_PATH`，默认 `./data/checkpoints.db`
- [x] 导出 `checkpointer = SqliteSaver.fromConnString(path)`
- [x] 确保 `data/` 目录存在

**验收标准**：

- [x] 两次使用相同 `thread_id` 调用 Agent，能记住上轮对话

---

### 1.6 长期记忆 Store `src/memory/store.ts` ✅

**目标**：跨对话保存用户偏好（如 preferredContact、addressTag 等）。

**关键产出**：

- [x] MVP 使用 `InMemoryStore`（`@langchain/langgraph`）
- [x] 导出 `store`
- [x] 后续可切换为 `PostgresStore`（备注在代码注释中）

**验收标准**：

- [x] 能被 `createAgent({ store })` 引用
- [x] 代码注释说明生产环境替换方案

---

## Phase 2：工具与 Schema

### 2.1 结构化输出 Schema `src/agent/schema.ts` ✅

**目标**：定义意图分类 + 槽位填充的 Zod Schema。

**关键产出**：

- [x] `IntentSchema`：
  - `intent`: enum，可选值 `order_query`、`refund`、`complaint`、`handoff`、`greeting`
  - `slots`: 对象，包含 `order_id`、`product_name`、`amount`、`reason`、`contact` 等可选字段
  - `reply`: 可选，直接回复语
- [x] 导出类型推断：`type IntentOutput = z.infer<typeof IntentSchema>`

**验收标准**：

- [x] 能通过 `responseFormat: IntentSchema` 使用
- [x] Zod 校验失败时字段错误清晰

---

### 2.2 工具定义 `src/agent/tools/` ✅

**目标**：实现 4 个业务工具，均使用 `tool()` 工厂 + Zod 参数校验。

**关键产出**：

- [x] `queryOrder`：参数 `{ orderId: string }`，调用 `orderService.getOrderById`
  - 未找到时返回引导话术
- [x] `createRefund`：参数 `{ orderId: string; reason: string }`，先校验 `canRefund`
  - 条件不满足时返回具体原因
- [x] `searchKnowledge`：参数 `{ query: string }`，调用 `knowledgeService.searchKnowledge`
  - 未命中时返回转人工提示
- [x] `createTicket`：参数 `{ summary: string; priority?: string }`，调用 `ticketService.createTicket`

**验收标准**：

- [x] 每个工具都有 Zod schema
- [x] 工具描述清晰，便于 Agent 选择
- [x] 边界场景返回明确错误信息

---

### 2.3 Agent 配置 `src/agent/agent.ts` ✅

**目标**：使用 `createAgent` 组装完整 Agent。

**关键产出**：

- [x] 模型由 `DEFAULT_MODEL` 环境变量配置，默认 `openai:gpt-5.4`
- [x] 注入 `systemPrompt`
- [x] 注册 4 个业务工具
- [x] `contextSchema` 定义 `userId` + `userName`
- [x] 挂载 `checkpointer`（SqliteSaver 持久化）
- [x] 挂载 `store`（InMemoryStore 跨对话记忆）
- [x] 3 个中间件：
  - `summarizationMiddleware`（token 超 4000 时摘要压缩，保留最近 20 条）
  - `piiMiddleware`（邮箱脱敏）
  - `humanInTheLoopMiddleware`（退款/工单需要人工确认）

**验收标准**：

- [x] `bun run cli` 能启动，不报错（需要 CLI 入口就位）
- [x] 传入 `context` 后 Agent 知道用户身份

---

## Phase 3：CLI 与交互

### 3.1 CLI 入口 `src/cli.ts`

**目标**：提供命令行交互，支持用户身份注入、对话循环、审批决策输入。

**关键产出**：

- 解析命令行参数 `--user=李华`，默认 userId 和 userName
- 使用 `readline` 或 `prompts` 读取用户输入
- 每次调用 `agent.invoke` 时传入：
  - `configurable: { thread_id }`（用 userId 派生，如 `cs-${userId}`）
  - `context: { userId, userName }`
- 当 Agent 因 HITL 暂停时，提示用户输入 `approve` / `reject` / `edit`
- 输入 `exit` 退出

**验收标准**：

- 相同 `--user` 重启后，能继续上回对话
- HITL 暂停时只接受允许的决策词

---

### 3.2 中间件配置验证

**目标**：确保 summarization、PII、HITL 三个中间件按预期工作。

**验收标准**：

- 长对话触发 token 阈值后，历史消息被摘要压缩
- 输入电话/邮箱后，输出中敏感信息被脱敏
- 退款/工单操作会暂停等待人工确认

---

### 3.3 端到端测试 `test/agent.test.ts`

**目标**：覆盖 5 种意图路径和 HITL 流程。

**关键产出**：

- 使用 `bun:test` 编写测试用例
- 至少覆盖：
  - `greeting`
  - `order_query`（有效/无效订单）
  - `refund`（HITL approve/reject）
  - `complaint`（创建工单）
  - `handoff`
  - 知识库命中/未命中
- 使用独立 `thread_id`，避免测试间状态污染

**验收标准**：

- `bun test` 全部通过

---

## Phase 4：可观测与评估

### 4.1 LangSmith 链路追踪

**目标**：配置环境变量，使每次调用自动生成 Trace。

**关键产出**：

- 创建 `.env`（从 README 示例复制）
- 配置：
  - `LANGSMITH_TRACING=true`
  - `LANGSMITH_API_KEY`
  - `LANGSMITH_PROJECT=customer-service`

**验收标准**：

- 在 LangSmith 平台能看到对话 Trace

---

### 4.2 自定义 Evaluator `src/evaluation/evaluator.ts`

**目标**：评估对话质量（满意度、解决率、转接率）。

**关键产出**：

- 定义 `Evaluator` 函数，输入对话历史，输出评分
- 三个维度：
  - 满意度：用户情绪是否积极
  - 解决率：问题是否被解决（未触发 handoff / ticket）
  - 转接率：是否触发人工

**验收标准**：

- 能独立运行 evaluator
- 对测试数据集输出可读的评分报告

---

### 4.3 测试数据集 `src/evaluation/test-data.json`

**目标**：准备回归测试数据。

**关键产出**：

- JSON 文件，包含多组测试对话：
  - 每组包含 `input`、`expected_intent`、`expected_slots`、`expected_outcome`
- 覆盖 5 种意图 + HITL + 知识库

**验收标准**：

- Evaluator 能读取并运行全部测试用例

---

## Phase 5：文档与收尾

- [ ] 更新 README 中的「当前实现状态一览」表格
- [ ] 删除或替换 `index.ts` 中的 `console.log("Hello via Bun!")`
- [ ] 添加 `.env.example` 文件（如不存在）
- [ ] 运行 `bun test` 全量测试
- [ ] 运行 `bun run cli --user=李华` 做最终人工走查

---

## 参考文档

- [Agents / createAgent](https://docs.langchain.com/oss/javascript/langchain/agents.md)
- [Middleware 概览](https://docs.langchain.com/oss/javascript/langchain/middleware)
- [内置 Middleware](https://docs.langchain.com/oss/javascript/langchain/middleware/built-in.md)
- [Runtime 与 contextSchema](https://docs.langchain.com/oss/javascript/langchain/runtime)
- [短期记忆与 Checkpointer](https://docs.langchain.com/oss/javascript/langchain/short-term-memory.md)
- [长期记忆与 Store](https://docs.langchain.com/oss/javascript/langchain/long-term-memory)
- [Human-in-the-Loop](https://docs.langchain.com/oss/javascript/langchain/human-in-the-loop)
- [Structured Output](https://docs.langchain.com/oss/javascript/langchain/structured-output)
