# 03 数据分析助手 · 实施 Todo

> 依据 [README.md](./README.md) 的实现步骤与验收标准生成，勾选顺序 = 推荐实施顺序。
> 规格细节以 README 为准，本文件只做执行追踪。规格出处标注为 §章节号。

## 0. 工程初始化

- [x] `package.json` / `tsconfig.json`（沿用 02 项目配置）
- [x] `.oxlintrc.json` + `.oxfmtrc.jsonc`（agents.md §5.6 约定：落项目根）
- [x] `.env.example`（DEFAULT_MODEL / CHART_MODEL / ANALYTICS_DB_PATH / REPORTS_DIR / MCP_SERVER_ENTRY / SQL_MAX_ROWS）
- [x] `src/config.ts`：环境变量集中读取（Zod 校验）
- [x] `bun run` 脚本注册：`db:seed` / `cli` / `demo:charts` / `test`
- [x] oxlint + oxfmt 跑通（0 errors / 0 warnings）

## 1. Spike（先验证高风险 API，结论回填文末）

- [x] **Spike A**：`createSupervisor` + `responseFormat` 的产物落点——确认 key 名、挂载为子图后外层能否直接从 `state` 读到
- [x] **Spike B**：`interrupt()` + `Command({ resume })` 的最小闭环——确认中断结果的暴露形态、恢复时节点重跑行为
- [x] **Spike C**：stdio MCP Server + `@langchain/mcp-adapters` 的 `listTools()`——确认 Bun 子进程启动方式、stdout 是否干净
- [x] **Spike D**：`Send` + `ReducedValue` 的单条输入语义——节点返回单条 option 而非数组

> Spike 脚本保留在 `scripts/spike-*.ts`（4 个），验证完即可删；结论见文末。

## 2. 数据与 MCP 底座（§实现步骤-第一步）

- [x] `db/seed.ts`：生成 `data/analytics.db`（orders 1205 行 + products 15 行；负金额 3 条、NULL region 2 条），幂等可重跑
- [x] `src/services/db.ts`：只读连接 `{ readonly: true }` + `PRAGMA query_only = ON`
- [x] `mcp-server/index.ts`：stdio transport，单工具 `query_sales`（前缀检查 + `.slice(0, SQL_MAX_ROWS)` 截断）
- [x] MCP Server 日志全部走 `console.error`（stdout 只跑 JSON-RPC）
- [x] `mcp-adapters` 连通性验证（`scripts/spike-c-mcp.ts`）：listTools + callTool + 写操作被拦截

## 3. 两个专家 Agent（§实现步骤-第二步）

- [x] `src/prompts/sql-expert.ts`：DDL 注入 + 只读规则 + 脏数据防御性过滤（含动态「当前日期」）
- [x] `src/prompts/chart-expert.ts`：按维度出图的格式约束，禁止编造数据
- [x] `src/prompts/chart-schema.ts`：窄版 ECharts option Zod Schema（图表模型与测试共用）
- [x] `src/agents/sql-agent.ts`：`createReactAgent` + MCP 工具
- [x] `src/agents/chart-agent.ts`：`createChartGenerator`（mini 模型 + `withStructuredOutput`）+ `render_charts` 工具（顺序版，落盘 `data/reports/<threadId>/charts/`）
- [x] `src/agents/supervisor.ts`：`createSupervisor`（`llm` 参数、`.compile()`、**不传 checkpointer**）+ `responseFormat({ summary, markdown })`

## 4. 外层工作流（§实现步骤-第三步）

- [x] `src/graph/state.ts`：`messages` 用 `MessagesValue`（append）、`structuredResponse` 用 last-value、`intent` / `reply` 已声明
- [x] `src/graph/rag-subgraph.ts`：`decide`（`bindTools` 决定要不要查）→ `retrieve`（ToolNode）→ `grade`（`temperature: 0` + mini）→ `answer` / `fallback`，无 rewrite 环
- [x] `src/services/metrics-kb.ts`：5 条口径（GMV / 销售额 / 退款率 / 客单价 / 环比）
- [x] `src/graph/workflow.ts`：`routeIntent` 三分类条件边 + 直接挂载 supervisor / RAG 两个子图 + `exportReport`
- [x] `exportReport`：`interrupt()` 之前只做纯计算，`writeReport` 放在恢复之后；`reject` 直接返回
- [x] `src/services/export.ts`：`saveCharts` + `writeReport`（目录名取 `config.configurable.thread_id`）
- [x] `MemorySaver` 接入外层 `compile()`
- [x] `test/workflow.test.ts`：路由三分支、`reject` 不落盘 / `approve` 落盘、`report.md` 与 `structuredResponse.markdown` 一致（5 用例全绿）

## 5. Send 对照 demo 与 CLI（§实现步骤-第四步）

- [x] `demo/chart-map-reduce.ts`：`ChartState`（`ReducedValue` + 单条 `inputSchema`）+ `split` 条件边扇出 + reducer 汇合（可直接 `bun run demo:charts`，从真库取两个维度）
- [x] `test/chart-map-reduce.test.ts`：扇出数量、单条语义、空维度（3 用例全绿）
- [x] `src/cli.ts`：对话循环 + 打印 `thread_id` + 审批输入（approve / reject）+ `--stream`（`streamMode: 'updates'` + `subgraphs: true`）

## 6. 验收走查（对照 README §验收标准逐条勾）

- [x] `bun run db:seed` 一键生成数据集（1205 行，两种脏数据计数符合预期）；MCP `listTools` 可见 `query_sales`
- [ ] 意图路由：三分支互不误入 —— fake 模型已覆盖，**真实模型待 Key**
- [ ] 端到端：取数 → 2+ 张图 → 主管收口 → 审批 → `report.md` + `charts/*.json` 落盘 —— **真实模型待 Key**（流水线已由 stub 覆盖）
- [ ] 防幻觉：报告关键数字与 SQL 结果一致；图表数量与 `charts/` 目录文件数一致 —— **真实模型待 Key**
- [x] `reject` 后不写文件；`approve` 后文件生成；`Command({ resume })` 能在同一 `thread_id` 上正确恢复
- [ ] `--stream` 能看到 supervisor 子图内部的节点切换事件 —— **真实模型待 Key**
- [ ] 脏数据不进入结果：负金额 / NULL region 行被过滤 —— prompt 规则已写，**真实模型待 Key**
- [ ] `bun run demo:charts` 跑通，且与 Agent 内顺序版产物结构一致 —— **真实模型待 Key**（Send 语义已由单测覆盖）

> ⚠️ 仓库内 `.env` 的 `OPENAI_API_KEY` 是占位值（`sk-your-api-key-here`），真实调用会 401。
> 换上有效 Key 后取消上面 5 条【待 Key】即可完成验收，代码路径无需改动。

## 7. 刻意不做（不勾选，仅记录去向）

| 不做                              | 去向                                                     |
| --------------------------------- | -------------------------------------------------------- |
| 定时日报 + 阈值预警               | 6.2（node-cron / BullMQ，同一工作流 `invoke` 触发即可）   |
| 容错三件套 / 模型降级链           | 3.7 文档                                                 |
| Agentic RAG 的 rewrite 环 / giveUp| 3.3 独立练习                                             |
| 自包含 HTML / ECharts 打包        | 第五阶段                                                 |
| DeepAgents 换装                   | 3.6 文档                                                 |
| MCP allowlist 词法扫描 / 501 探针 | 8.4（OWASP LLM Top 10）                                  |
| 跨进程持久化（SqliteSaver 等）    | 2.5 文档（02 已用 `PostgresSaver` 验证）                 |
| Hono `/reports` 端点              | 1.5 / 第六阶段                                           |

## Spike 结论（2026-10-28 回填）

- **Spike A（Supervisor responseFormat）**：✅ 通过（`scripts/spike-a-supervisor.ts`，fakeModel 驱动）
  - `createSupervisor(...)` 返回 **未编译的 StateGraph**，必须 `.compile()`
  - `responseFormat` 在 langgraph prebuilt 里实现为独立节点 `generate_structured_response`（内部 `model.withStructuredOutput`），产物写 **`structuredResponse`** key
  - 编译图直接 `addNode` 挂到外层图，外层声明同名 channel（`messages` append + `structuredResponse` last-value）后**可直接读** `state.structuredResponse`
  - ⚠️ supervisor 的 `agents` 必须是**已编译图**且带 `name`（`createReactAgent({ name })` 或 `compile({ name })`）
- **Spike B（interrupt 恢复）**：✅ 通过（`scripts/spike-b-interrupt.ts`）
  - 中断结果在 invoke 返回值上：`result.__interrupt__ = [{ id, value }]`，`value` 即 `interrupt()` 的入参
  - 恢复：`new Command({ resume: <payload> })` + **同一 thread_id**；`interrupt()` 的返回值就是 resume payload
  - 恢复后节点**从头重跑**：interrupt 前的计数器 1 → 2，副作用必须放在 interrupt 之后
- **Spike C（MCP 桥接）**：✅ 通过（`scripts/spike-c-mcp.ts`）
  - mcp-adapters v2 构造参数是 `{ mcpServers: {...}, prefixToolNameWithServerName }`；**默认加 server 前缀**（`analytics_query_sales`），需要原名就显式关掉
  - `listTools()` 是 v2 正式 API（`getTools()` 已标 deprecated）
  - isError 结果在客户端转成 `ToolException` 抛出；LangGraph 会把它变成错误 ToolMessage 交给模型自纠
  - Bun 子进程：`command: process.execPath` + `cwd` 固定项目根，跨平台稳定；stdout 必须干净
- **Spike D（Send + ReducedValue）**：✅ 通过（`scripts/spike-d-send.ts`）
  - `dimensions` N 项 → N 个 `Send` → `renderChart` 收到独立子状态 `{ dimension }`
  - 节点必须返回**单条** `{ charts: option }`（不是数组），由 `ReducedValue.reducer` 追加
  - 空维度不产生任务，`charts` 为空数组；3 维度按 fan-out 顺序汇合
- **环境**：Bun 1.4.2 / langchain 1.5.16 / @langchain/langgraph 1.5.0 / langgraph-supervisor 1.1.3 / mcp-adapters 2.0.1 / MCP SDK 1.32.2 / zod 4.6.7
