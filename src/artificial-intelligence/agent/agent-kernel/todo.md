# Kern 修订 TODO（第二轮 review 后）

> **状态**：第三轮复核已完成；v0.2a 示例计划待执行
> **来源**：[review-2026-11-02-round2.md](review-2026-11-02-round2.md)
> **原则**：按批次独立验收，不跨批混改；每批结束跑 `bun test`、`bun run typecheck`、`git diff --check` 与跨文档 grep。
> **迁移提示**：`spikes/` 与设计文档已迁至 `D:\code\personal\kern`；本文件中的 `cd spikes` 命令请在 `D:\code\personal\kern\spikes` 下执行。

## 进度总览

| 批次 | 范围 | 状态 |
| --- | --- | --- |
| Batch 1 | R-01 P0：`wrapToolCall` 的 `ToolCallContext` | 已完成 |
| Batch 2 | R-02 / R-03 / R-06 / R-10：loop 控制流与错误收口 | 已完成 |
| Batch 3 | R-04 / R-05 / R-07：超时、terminal 事件、并发 ask | 已完成 |
| Batch 4 | R-08 / R-09：principal 持久化、usage 上下文 | 已完成 |
| Batch 5 | R-11：T2a / T2b、manifest schema + runner | 已完成 |
| Batch 6 | R-12–R-29：P2 / P3 逐条 triage | 已完成 |

---

## Batch 1 — R-01（P0）

目标：审批真正做成插件，而不是 spike 里的 `beforeStart` 旁路。

- [x] `01 §11` 增加 `ToolCallContext`：`readonly state`、`toolContext`、`pendingCall`、`approval`（含 `decision`）
- [x] `03 §4` 把 `wrapToolCall` 改为前置闸门 `(callCtx) => Promise<'allow' | 'deny'>`；执行洋葱留给 v0.2 `wrapToolExecution`
- [x] `03 §3` 钩子表同步 `wrapToolCall` 的输入上下文
- [x] `05 §3` 明确 `ToolContext.permissions` 来源、默认 `allowAllPermissions`、审批 decision 只读视图
- [x] `09 §2.3` 审批落点改为「wrapper 读取 `ToolCallContext` 后 ask / allow / deny」
- [x] `spikes/run-phase.ts` 用 `wrapToolCall` 替换 `ToolRuntime.beforeStart`
- [x] 测试：allow / deny / 无 decision → suspend / `ToolSuspended` 不绕过 wrapper
- [x] 验收：审批插件能同时读到 `toolContext.permissions` 与 approval decision；硬下限由 core 执行（`requiresApproval`），ask / allow / deny 由插件决策，core 只负责状态落盘与 `resume`

---

## Batch 2 — R-02 / R-03 / R-06 / R-10

目标：02 成为唯一权威 loop，崩溃 / abort / finishReason 都不靠猜。

### R-02 phase / ②a

- [x] `02 §3` 权威草图补 `state.phase` 赋值
- [x] 回填后写 `phase = turn-end` → 保存点 ②a
- [x] 计数后写 `phase = model` → 保存点 ②b
- [x] `06 §2.1` / `08 §3` 只引用 02，不保留第三套版本

### R-03 首事件 break

- [x] `run-started` 移入 `try`，或由 runtime 外层生成器统一 `return()` 收口
- [x] 测试：消费者在第一个事件 `break` 时，状态 = aborted、保存点 ⑤ 已写、锁释放（spike 无锁，验证 `terminal` 保存点）

### R-06 abort 工具终结

- [x] `tool-call-cancelled` 增加 `reason: 'aborted'`
- [x] `run-aborted` 前对 in-flight 工具发 `tool-call-cancelled(aborted)`
- [x] 明确入参校验失败也发 `tool-call-completed(ok:false)`
- [x] 测试：工具执行中 abort 后无未闭合 tool span / started

### R-10 finishReason / partial tool call

- [x] `finishReason = 'error'` 一律抛 `ProviderError`
- [x] 聚合器返回 `complete: boolean`
- [x] `length` + incomplete 不 yield `tool-call`，改为显式 error / 截断提示
- [x] 测试：partial JSON fixture；error finish 不当作正常回答（`model-finish.test.ts`）

---

## Batch 3 — R-04 / R-05 / R-07

### R-04 hook timeout

- [x] 明确 `hookTimeoutMs` 只约束 pre / post 与首个 chunk 等待
- [x] 不覆盖整条 `wrapModelCall` 流
- [x] 不覆盖 `wrapToolCall` 的 execute；工具用自身 `timeoutMs`
- [x] 补长模型流 / 长工具用例（`hook-timeout.test.ts`）

### R-05 terminal 事件保护

- [x] `transformEvent` 只允许同 type 改写 payload
- [x] `error` / `run-finished` / `run-aborted` / `approval-requested` 不可丢弃
- [x] 负向测试：插件尝试丢弃 terminal 事件时被拒绝（`event-transform.test.ts`）

### R-07 并发批次遇 ask

- [x] 选定「有 ask 的批次一律串行」：停止调度新工具 → 等待 in-flight 完成并落盘 → 再 suspend
- [x] 05 §6 / 09 §2.3 同步
- [x] 测试：并发 + ask 不产生未落盘的 running 工具（`tool-scheduler.test.ts`）

---

## Batch 4 — R-08 / R-09

### R-08 principal

- [x] `RunState` 持久化 opaque `principal`（或 thread metadata）
- [x] `resume()` 使用持久化 principal，禁止调用方替换
- [x] 测试：审批 allow 后重启，`permissions` 不落回 allowAll（principal 驱动 permissions）

### R-09 usage 上下文

- [x] `RunContext` 增加只读 `state` 或 `getUsage()`
- [x] 预算插件可在 `wrapModelCall` 前置检查 thread 累计 usage
- [x] `01 §10` / `10 §4` 同步
- [x] 测试：预算超限在模型调用前抛 `BudgetExceededError`（`budget.test.ts`）

---

## Batch 5 — R-11 验收

- [x] T2 固定 allow：断言 `[read, edit]` + final diff
- [x] 新增 T2a（allow / diff）与 T2b（ask / deny / 无 diff + `APPROVAL_DENIED`）
- [x] T5 单独验证 ask 拦截、`approval-requested`、`resume`、完成顺序
- [x] `task-manifest.schema.json` + `run-task.ts` runner
- [x] manifest 补齐 `model` / `budget` / `killPoints` / `invariants`，统一嵌套字段
- [x] T7b 并入 v0.3 的 T7
- [x] 验收：T1 / T2 manifest 可机械校验；T2a/T2b 可判定

验收记录：`spikes` 下 64 pass；`tsc --noEmit` 通过；`bun run src/run-task.ts` 输出 5/5 manifests valid；`git diff --check` 无输出。schema 的 required / enum 与 runner 常量由 `fixtures.test.ts` 反向对齐，防止文档漂移。

---

## Batch 6 — P2 / P3 triage

逐条给出「修 / 延期 / 删除」决定，不留在开放问题里。本轮全部为「修」（R-18 已在 Batch 1/5 完成）：

| ID | 决定 | 落点 |
| --- | --- | --- |
| R-12 `totalSteps` / usage 出口 | 修 | 每次模型调用计数（含自然终止轮）；`RunState.runUsage`；`run-finished` 带 `finishReason` / `usageDelta` / `runUsage` / `threadUsage`（02 / 06） |
| R-13 `Checkpointer.save` 失败 | 修 | 定义为 fatal；终态只做一次 best-effort，不递归 finalize（06 §2） |
| R-14 锁顺序 / 错误优先级 | 修 | 先锁后 load；`ThreadBusyError` 优先于 `ThreadNotResumableError`（06 §2.3） |
| R-15 `onEvent` 背压 | 修 | 返回 `void` 且不 await；runtime 有界观察队列 256 条 / 64KB，丢最旧并计数（03 §3） |
| R-16 `enforce` / `criticalHooks` | 修 | 删除插件级 `enforce`；`criticalHooks?: Array<keyof AgentHooks>`（03 §2/§5/§9） |
| R-17 观察钩子只读 | 修 | 新增 `ObserverContext`（无 checkpointer / provider / services）；`onX` 拿 `Readonly<RunState>`（01 §11 / 03 §3） |
| R-18 文档与 spike / manifest 漂移 | 修（已完成） | Batch 1 改 `wrapToolCall`；Batch 5 落 schema + runner + 嵌套 manifest |
| R-19 rewind / fork | 修（删除承诺） | v0.x 不做；分支用新 threadId；v1.x 再评估历史快照（09 §2.5 / 06 §6） |
| R-20 provider / checkpointer 解析 | 修 | 保留服务名 `provider` / `checkpointer`，setup 后解析并 fail-fast；候选模型 `model:<id>`（01 §11 / 03 §2） |
| R-21 v0.4 过载 | 修 | 拆 v0.4a（otel / todo / T6）与 v0.4b（子 agent / 路由 / T8）；Graph spike 移 v1.x（08 / 09 / 10 / readme） |
| R-22 wrapper 顺序 / tool retry | 修 | 注册序 = 外层优先：budget → compaction → retry；tool retry 仅幂等或 `next` 前失败（03 §3 / 04 §4） |
| R-23 `transformInput` 语义 | 修 | 返回请求视图，不写回 `RunState.messages`；持久化压缩需显式 API（03 §3 / 06 §4） |
| R-24 abort payload / `onRunEnd` | 修 | `run-aborted { reason }` 不带 error；`run-finished` 带 `finishReason`；`onRunEnd` 用于 done/aborted，`onError` 只用于 error（02 / 03） |
| R-25 工具五要素 | 修 | 三机械字段 + 两 harness 约定；`result_ref` 落 `<tmpdir>/kern-refs/<threadId>/`，TTL 24h（05 §8 / 09 §2.2） |
| R-26 v0.1 协议瘦身 | 修 | `providerOptions` / `outputSchema` / `ToolResult.data` / `ContentBlock.diff` / `ContentBlock.image` / `UserContent.image` / `Usage.costUsd` 推迟到 v0.2（01 / 04 / 05） |
| R-27 沙箱清理 / env / cwd | 修 | `finally` 清理 timer / listener / temp file；`minimalEnv` 保留 PATH / HOME / TMPDIR；cwd 必须在 workspaceRoot 内（07 §3） |
| R-28 core 定义 | 修 | 统一为「Loop / Event / Hooks + RunState 契约」；readme 架构图去掉「规划」；工具执行是 Promise（01 §1 / readme） |
| R-29 版本 / 状态表 | 修 | 08 为唯一版本源；OTel 统一 v0.4a；T7b 并入 v0.3 T7；readme 03 状态与正文一致；关闭评测开放问题（01 / 08 / 09 / 10 / readme） |

验收：`bun test`、`bun run typecheck`、`git diff --check` 与跨文档 grep 均通过；旧的 `enforce` / `answerKey` / 扁平 budget 字段不再出现在设计文档（历史 review 文件保留原文）。

---

## 复核补丁（第三轮）

- [x] R-02：02 §3 在保存点 ③ 前显式写 `state.phase = 'tools'`；spike 的 crash-at-③ 用例已断言 `phase === 'tools'`
- [x] T2b 归属 v0.2b（审批里程碑）；08 / 09 / readme 版本表同步
- [x] `CheckpointError` / `PrincipalMismatchError` 进 `KernelError` 表；`SandboxPathError` 由工具归一为 `SANDBOX_PATH_DENIED`
- [x] `wrapToolExecution`：v0.1 签名 no-op，v0.2a 转正
- [x] readme core 定义与核心理念补 `RunState` 契约
- [x] spike `ToolCallContext` 改为 `toolContext`（`permissions` + `principal`），`can(name, input)` 与 05 对齐
- [x] `criticalHooks` 排除 `onEvent`；队列消费者错误只 WARN
- [x] 修正 Batch 1 验收措辞：core 执行硬下限，插件决定 ask / allow / deny

---

## 每批验收

- [x] `cd spikes && bun test`
- [x] `cd spikes && bun run typecheck`
- [x] `git diff --check`
- [x] 跨文档 grep：旧的 `beforeStart`、`phase` 冲突、T2 矛盾、版本表冲突不得残留
- [x] 本批改动只更新相关文档与 spike，不顺带加功能

## 后续验证：mini Claude Code（v0.2a）

> 结论：mini Claude Code 是 v0.2a 的端到端示例，不是 v0.1 的退出标准；不放进 `src/core`。

- [ ] v0.1 只做 T0 天气 Agent；只读版 demo 可选，不阻塞 T0
- [ ] v0.2a 建 `examples/mini-claude-code/`，只通过公开 API 组装 runtime
- [ ] 工具：`read` / `write` / `edit` / `grep` / `glob` / `bash` / `webfetch`
- [ ] `bash` 走 sandbox `execCommand`；`webfetch` 做超时 / 大小 / content-type / SSRF 白名单
- [ ] `write` / `bash` 在 v0.2a 固定 allow；审批在 v0.2b 接入
- [ ] 录制回放 Provider + 固定任务断言（文件 diff / 工具序列 / exitCode）
- [ ] 覆盖只读、单文件编辑、grep → edit、bash 失败重试
- [ ] 缺能力回写 v0.2 设计，不向 core 打补丁

## 暂不做

- 不新增 Graph / 多 Agent / RAG / MCP 功能
- 不把审批塞回 core 硬编码
- 不在 v0.1 加 `write` / `bash` / `webfetch` 等 v0.2 工具
- 不把 mini Claude Code / harness 能力塞进 core
- 不为「简历」提前扩 v0.4 范围
- 不重写全部文档；只回写受影响章节
