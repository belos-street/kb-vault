# Kern 架构评审（第二轮）

> **评审日期**：2026-11-02
> **评审对象**：`readme.md` + `doc/01`–`doc/10`
> **辅助证据**：`spikes/` 下 7 个测试文件、41 条用例（本地 `bun test` 全部通过；只证明 spike 覆盖的路径，不代表 core 已实现）
> **评审立场**：独立评审。只基于文档与仓库内可读证据；外部框架行为未在文档给出源码或版本的，标为「未验证」。
> **结论**：**Conditional Go**（有条件通过）

---

## 0. 结论摘要

- **Conditional Go**：第一轮的 2 个 P0 已修（流式洋葱、Sandbox 命令形态），但第二轮仍有 **1 个 P0**：HITL 审批钩子拿不到 `RunState` / `PermissionSet`，按现有签名无法把审批做成插件。
- **10 个 P1** 主要落在「协议写了一半」：`phase` 与 ②a 保存点只写在 06/08、不在 02 的权威 loop；`run-started` 在 `try` 外；`hookTimeoutMs=30s` 会截断正常流；abort 没有工具终结事件；并发批次遇 ask 的挂起语义未定义；`resume()` 丢 `principal`；预算插件读不到 thread usage；`finishReason='error'` 被当成功；T2 验收自相矛盾。
- **spike 可运行，但 spike 绕开了文档协议**：`run-phase.ts` 用 `ToolRuntime.beforeStart` + 直接读 `state.pendingApprovals` 做审批，没有走 `wrapToolCall`；这正好暴露了 R-01。spike 实现了 `phase` / ②a / ②b，而 02 的 loop 草图没有，文档落后于代码。
- **≤10 文件可行；单文件 ≤200 行不可行**。任务书写 ≤200，readme/01/08 写 ≤300；按 300 评审仍偏紧，`loop.ts` / `runtime.ts` / `protocol.ts` 是超限点。若 200 仍是硬约束，这一条应直接判 No-Go。
- **最值得保留**：core / plugins / harness 的硬边界、`PendingCall` + 五保存点 + at-least-once 的诚实语义、T1–T8 任务集验收。最该修的是「钩子上下文」与「loop 控制流」，不是再加功能。

---

## 1. 评分卡

| 维度 | 权重 | 1–5 分 | 一句话理由 |
| --- | --- | --- | --- |
| 定位与边界 | 15% | 4 | 单 Agent core、图外置的边界仍然清楚；但 core「只做三件事」与 `RunState` / Checkpointer 的归属表述不一致。 |
| 架构效率 | 20% | 4 | 流式洋葱、工具输出队列、五保存点的抽象方向正确；HITL 钩子上下文与并发批次挂起仍是结构性缺口。 |
| 合理性与一致性 | 20% | 3 | 第一轮冲突大多已修，但 `phase` / ②a、T2、rewind/fork、OTel 版本、manifest 字段仍有跨文档冲突。 |
| 轻量性 | 15% | 4 | core 只依赖 Zod 已落地为 `RegisteredTool`；v0.2 monorepo 时机合理；10 篇文档仍偏重。 |
| 可落地性 | 20% | 3 | spike 41/41 通过说明关键路径可写；但审批上下文、`resume` principal、超时、partial tool call 会在 v0.2a/v0.3 返工。 |
| 文档质量 | 10% | 4 | 状态行、决策记录、开放问题、任务 manifest 明显优于一般设计稿；仍存在文档-代码漂移与状态标签不一致。 |

**加权总分**：4×0.15 + 4×0.20 + 3×0.20 + 4×0.15 + 3×0.20 + 4×0.10 = **3.60 / 5**。

**权重说明**：维持建议权重。定位是前提，不单独放大；效率、一致性、可落地性合计 60%，因为这三项决定是否返工；轻量性是手段不是目的；文档只占 10%，因为文档问题可以低成本修。

**第一轮修复核对**：K-01（流式洋葱）、K-02（`execCode` / `execCommand`）、K-04（assistant `tool_use` 先入 messages）、K-05（at-least-once + `sideEffect`）、K-06（审批事件 / `resume`）、K-08（错误表）、K-10（`tool-call-started` payload）、K-12（`RegisteredTool`）、K-14（`try/finally`）、K-17（dispose 逆拓扑）、K-18（`requiresApproval` 硬下限）、K-20（`ctx.metadata`）、K-21（`killTree`）、K-22（capabilities 缺省）、K-23（行数放宽到 300）、K-24（只读工具 `concurrencySafe: true`）、K-25（compaction 移到 v0.4）、K-26（CI `tsc` + 边界 + LOC）、K-28（删除 `failed`）、K-30（层号 / preset）、K-32（事件配对）均已落地或部分落地。**未修**：K-27（`length` 截断的 partial tool call）、K-29（`seq` 空洞 / `transformEvent` 改写类型）、K-31（状态标签；死链部分为旧评审误判，实际路径正确）、K-19（`onEvent` 背压只加了口号）、K-13（manifest 只填了 T1/T2，格式仍不统一）。

---

## 2. Findings

### 2.1 P0（阻断 v0.1 协议冻结 / v0.2a 落地）

| ID | 级别 | 位置 | 问题 | 证据 | 影响 | 最小修改建议 |
| --- | --- | --- | --- | --- | --- | --- |
| R-01 | P0 | [03 §3/§4](doc/03-插件系统与钩子设计.md)、[05 §3](doc/05-工具系统.md)、[06 §2.2](doc/06-状态与记忆管理.md)、[09 §2.3](doc/09-harness层设计.md)、[01 §11](doc/01-总体架构设计.md) | `wrapToolCall` 只拿到 `RunContext`；审批决策在 `RunState.pendingApprovals`，权限在 `ToolContext.permissions`，两个都不在 `RunContext` 里。审批插件无法判断「这个 call 是否已 allow」，也无法按权限决定 ask。 | 03 §4：`type Handler<TIn, TOut> = (input: TIn, ctx: RunContext) => Promise<TOut>`；03 §3：`wrapToolCall`「包住单次工具执行」，用途「权限审批」；05 §3：`ToolContext.permissions` 由 `ToolContextFactory` 计算；06 §2.2：`resume` 把 `decision` 写入 `pendingApprovals`；09 §2.3：审批落点 `wrapToolCall`（ask 拦截）；01 §11 `RunContext` 只有 `runId / threadId / limits / signal / principal / logger / services / checkpointer / provider / metadata`。spike `run-phase.ts` 实际用 `ToolRuntime.beforeStart` + `findApproval(state, ...)`，绕过了 `wrapToolCall`。 | v0.2a T2 的 `requiresApproval` 拦截、v0.3 T5 的完整审批协议无法按文档实现；要么 core 硬编码审批（spike 现状，违背「一切皆插件」），要么改 `wrapToolCall` 签名。 | 二选一并冻结：① 给 `wrapToolCall` 增加每调用的 `ToolCallContext`（含 `permissions`、`approval` 决策、`pendingCall` 只读视图）；② 审批判定收归 core 工具管线，`wrapToolCall` 只做观察 / 日志。同步定义 `ToolContextFactory` 的服务名与注册方式。 |

### 2.2 P1（导致 v0.2 / v0.3 明显返工）

| ID | 级别 | 位置 | 问题 | 证据 | 影响 | 最小修改建议 |
| --- | --- | --- | --- | --- | --- | --- |
| R-02 | P1 | [02 §3/§3.1](doc/02-核心循环与事件系统.md)、[06 §2.1](doc/06-状态与记忆管理.md)、[08 §3](doc/08-路线图与里程碑.md) | 02 的权威 loop 草图**从不写 `RunState.phase`**，也没有 ②a 保存点；06 的 resume 矩阵和 08 的 v0.1 任务都依赖这两个东西。 | 02 §3 步骤 5：`state.messages.push(...); state.runStep += 1; state.totalSteps += 1; yield turn-finished; await checkpoint(state) // 保存点②`；全文无 `state.phase = ...`。06 §2.1：②a「ToolMessage 回填、`phase = turn-end`，`turn-finished` 前」；②b「计数 + `phase = model` 后」；06 §1：`phase` 是「resume 重入点」。02 §3.1：`resume` 按 `phase` 从断点进入。08 §3：v0.1 要做「五个 checkpoint 保存点（②a 回填 / ②b turn-end ...）」。spike `run-phase.ts` 已实现 `state.phase` 与 ②a/②b，41 条测试通过。 | 按 02 实现会得到「phase 永远是 model」的 loop；崩溃在回填后、turn-finished 前无法按 06 的矩阵恢复；02/06/08 三处无法同时成立。 | 以 02 为唯一权威，补 `phase` 赋值与 ②a checkpoint（回填后、turn-finished 前），再写 ②b；或删除 ②a 并同步改 06/08。不要保留第三种版本。 |
| R-03 | P1 | [02 §3](doc/02-核心循环与事件系统.md)、[08 §6](doc/08-路线图与里程碑.md) | `yield event('run-started')` 在 `try` 之外；消费者在第一个事件就 `break` 时，`finally` 不会执行，状态仍是 `running`，⑤ 不写，锁不释放。 | 02 §3：`yield event('run-started', { threadId: state.threadId })` 在 `try {` 之前；`finally` 只包住 `while` / `catch`。08 §6：要求「消费者 break 后 status = aborted 且保存点 ⑤ 已写」。spike 的消费者 break 测试断在 `tool-call-started`，没有断在 `run-started`。 | SSE 首个事件断连、TUI 立即取消会留下「崩溃残留」；下次 `load` 误判为可恢复；锁泄漏。 | 把 `run-started` 移进 `try`，或用 runtime 外层包装生成器，在 `return()` 时统一收口；补「首事件 break」单测。 |
| R-04 | P1 | [03 §3](doc/03-插件系统与钩子设计.md)、[05 §4](doc/05-工具系统.md)、[07 §2](doc/07-沙箱与可观测性.md) | `hookTimeoutMs` 默认 30s 约束 transform / wrap；但 `wrapModelCall` 的 wrapper 生命周期等于整条模型流，`wrapToolCall` 等于整次工具执行，工具自己的 `timeoutMs` 可能远大于 30s。 | 03 §3：「`RuntimeOptions.hookTimeoutMs`（默认 30s）约束 transform / wrap 钩子；超时按中止 run 处理」。05 §4：「超时由内核内建强制执行——`timeoutMs` 计时不归插件、更不归工具自身」。07 §2：`SandboxOptions.timeoutMs` 必填，无默认值。09 §2.2：bash 带超时。 | 正常 60s 模型流会被 30s hook timeout 截断；bash 的 10min 超时会被 30s hook timeout 抢先中止；v0.2a T4「跑测试」可能直接挂。 | 定义 timeout 的作用域：只约束 `next` 之前的准备 / 首个 chunk 等待，还是整个 wrapper；`wrapToolCall` 的 execute 用工具 `timeoutMs`，hook timeout 只包 pre/post；或按钩子配置。补「长流 / 长工具」用例。 |
| R-05 | P1 | [02 §5.2/§5.3](doc/02-核心循环与事件系统.md)、[03 §3](doc/03-插件系统与钩子设计.md) | `transformEvent` 可以「丢弃 / 改写」任何事件，没有排除 `error` / `run-finished` / `run-aborted`；与「所有错误先 yield error 再 throw」冲突。 | 02 §5.3：「`transformEvent` 返回 `null` 表示丢弃该事件；被丢弃的事件 onEvent 与消费者都不可见」。03 §3：`transformEvent` 用途「脱敏、UI 事件适配」。02 §5.2：「所有错误先 `yield { type: 'error' }` 再 `throw`」。没有「terminal 事件不可丢弃 / 不可改类型」的约束。 | 插件一个 `return null` 就能让消费者收不到终止事件；`error` 被脱敏插件丢掉后，消费者只看到 throw；若允许改 `type`，消费者 `switch` 不稳定。 | 规定 `transformEvent` 只能同 type 改写 payload，且 `error` / `run-finished` / `run-aborted` / `approval-requested` 不允许丢弃；或为 terminal 事件单独 bypass。补「丢弃 terminal 事件」负向测试。 |
| R-06 | P1 | [02 §5.1/§5.5](doc/02-核心循环与事件系统.md)、[05 §4/§5](doc/05-工具系统.md) | abort 路径没有工具终结事件；`tool-call-cancelled` 只有 `denied` / `expired` 两个 reason；入参校验失败时 `tool-call-completed` 与 `tool-call-started` 的配对也未定义。 | 02 §5.1：`tool-call-cancelled` `reason: 'denied' \| 'expired'`；同节不变量：「每个 `tool-call-started` 必须有且只有一个终结事件（completed / retrying / cancelled）」。05 §5：`AbortError` 向上冒泡，中止 run；业务失败归一为 completed + ok=false。02 §3 `persistTerminal` 在 abort 时补 `ToolMessage`，但不发工具终结事件。 | 工具执行中 abort，UI 会看到 started 永远不结束；telemetry 的 tool span 泄漏；T0/T7 的 abort 不变量测试会失败。 | 增加 `reason: 'aborted'`，在 `run-aborted` 前对 in-flight 工具发 `tool-call-cancelled(aborted)`；明确校验失败是否发 `tool-call-completed`（建议发，ok=false）；补 abort 配对测试。 |
| R-07 | P1 | [09 §2.3](doc/09-harness层设计.md)、[05 §6](doc/05-工具系统.md)、[06 §1](doc/06-状态与记忆管理.md) | 并发批次遇 ask 的挂起语义未定义：已完成的保留结果、挂起项写 `pendingApprovals`、「其余保持 pending」；但同一批里可能有 `running` 的并发工具。 | 09 §2.3：「一批工具里出现 ask → 已完成的调用保留结果，挂起项写入 `pendingApprovals`，其余保持 `pending`；`allow` 后执行挂起项并继续批次，`deny` 后跳过该项继续」。05 §6：`concurrencySafe: true` 的工具「互相可并发（`Promise.all` + 全局并发上限 4）」。06 §1：`PendingCall.status` 有 `pending / running / completed`。 | 一个工具 ask 时，同批 `running` 的工具仍在执行；run 进入 `awaiting-approval` 后，这些工具的结果没有落盘点；「其余保持 pending」与 `running` 冲突；重启后可能重复执行。 | 定义批次挂起协议：停止调度新工具 → 等待 in-flight 工具完成并落盘 → 再 suspend；或「有 ask 的批次一律串行，ask 前不启动其他工具」。二者选一并写进 05/09。补并发 + ask 用例。 |
| R-08 | P1 | [06 §2.2](doc/06-状态与记忆管理.md)、[05 §3](doc/05-工具系统.md)、[01 §11](doc/01-总体架构设计.md) | `resume()` 签名没有 `principal`；`ToolContextFactory` 依赖 `principal` 计算 `permissions`；`RunState` 也不持久化 principal。 | 06 §2.2：`resume(req: { threadId: string; approvalId?: string; decision?: 'allow' \| 'deny'; reason?: string; signal?: AbortSignal })`；同节 `stream` 示例有 `principal: { id: 'u1' }`。05 §3：`ToolContextFactory.create({ principal?: Principal; run: RunContext })`。06 §1 `RunState` 字段无 principal。 | 审批 allow 后或崩溃恢复后，新进程无法重建 `ToolContext.permissions`；`safe` preset、T5 的 `rm -rf` 审批后执行会落回 `allowAllPermissions`，权限语义失效。 | 把 opaque `principal` 持久化到 `RunState`（或单独 `thread metadata`），或给 `resume()` 增加 `principal`；明确「恢复时以持久化 principal 为准，禁止调用方替换」。补审批后重启用例。 |
| R-09 | P1 | [01 §10](doc/01-总体架构设计.md)、[01 §11](doc/01-总体架构设计.md)、[10 §4](doc/10-扩展能力与编排层.md) | 预算插件要在 `wrapModelCall` 调用前检查 thread 累计预算，但 `RunContext` 没有 `state` / `usage`；`onAfterModelCall` 是观察钩子，默认抛错只记录。 | 01 §10：「v0.2 由 `wrapModelCall` 插件在调用前检查预算并抛 `BudgetExceededError`（预算按 thread 累计口径）」。01 §11 `RunContext` 有 `limits`，无 `usage` / `state`。03 §3：观察钩子默认「抛错仅记录并继续」，只有 `criticalHooks` 才中止。10 §4：「`wrapModelCall`（前置预算）+ `onAfterModelCall`（审计）」。 | 预算插件只能 `ctx.checkpointer.load(threadId)` 异步读旧 state（慢且可能过期），或把 `BudgetExceededError` 放在观察钩子里被吞掉；v0.2 预算熔断不可靠。 | 给 `RunContext` 增加只读 `state` 或 `getUsage()`；或把预算做进 core（与「不进内核」的已定决策冲突，需二选一）。同步修 10 §4。 |
| R-10 | P1 | [04 §3/§5](doc/04-模型Provider抽象.md)、[02 §3](doc/02-核心循环与事件系统.md) | `FinishReason` 包含 `'error'`，但 loop 的自然终止只看 `res.toolCalls.length === 0`；`length` 截断时 `aggregator.done()` 仍可能产出半截 tool-call。 | 04 §3：`FinishReason = 'stop' \| 'tool-calls' \| 'length' \| 'content-filter' \| 'error'`。02 §3：`if (res.toolCalls.length === 0) { ... finalize('done') }`。04 §5：`const calls = aggregator.done(); for (const call of calls) yield { type: 'tool-call', call }`，无 complete 标记。 | Provider 返回 `done(error)` 时会被当正常回答结束，错误被吞；`length` 截断时执行半截 JSON 工具调用，可能改错文件。 | `done` 且 `finishReason='error'` 一律抛 `ProviderError`；聚合器返回 `complete: boolean`，`length` + incomplete 不 yield `tool-call`，改为显式 `error` / 截断提示；补 partial JSON fixture。 |
| R-11 | P1 | [09 §4 T2](doc/09-harness层设计.md)、[spikes fixtures t2](spikes/fixtures/manifests/t2.json) | T2 验收自相矛盾：文字要求「ask 策略下默认拒绝即可验证」，fixture 又要求 `[read, edit]` 执行后产生最终 diff。 | 09 §4：T2「edit 唯一性 + `requiresApproval` 拦截生效（ask 策略下默认拒绝即可验证；完整审批协议见 T5）」。同节 fixture：T2「工具序列 `[read, edit]`；最终 diff 只改 greeting 文案；测试 exit 0」。`t2.json` 的 `expectedTools` 也包含 `edit` 与 `finalDiff`。 | T2 在「默认拒绝」下 edit 不会执行，final diff 为空；在「allow」下又验证不到拦截。v0.2a 主验收无法判定通过。 | 拆成 T2a（allow / 自动批准，断言 diff）与 T2b（ask / deny，断言无 diff + `APPROVAL_DENIED`）；或 T2 固定 allow，T5 单独验证 ask。 |

### 2.3 P2（质量 / 维护性 / 一致性）

| ID | 级别 | 位置 | 问题 | 证据 | 影响 | 最小修改建议 |
| --- | --- | --- | --- | --- | --- | --- |
| R-12 | P2 | [01 §2](doc/01-总体架构设计.md)、[02 §3](doc/02-核心循环与事件系统.md)、[02 §5.1](doc/02-核心循环与事件系统.md) | `totalSteps` 只在「有工具调用并完成」时递增；自然终止的最后一个 turn 不计数。`run-finished.usage` 标「本轮增量」，run 级总用量没有出口。 | 01 §2：`totalSteps`「thread 级累计 turn 数」。02 §3 步骤 5 才 `state.totalSteps += 1`；无工具的自然终止在步骤 2 直接 `finalize('done')`。02 §5.1：`run-finished` 的 `usage` 注释「usage 为本轮增量」。 | `maxTotalSteps` 硬上限少计最后一轮，长寿 thread 无法精确审计；消费者要自己累加每轮 usage，`run-finished` 无法给出 run 总量。 | 每次模型调用都递增 `runStep` / `totalSteps`；`run-finished` 增加 `runUsage` / `threadUsage`，或把每轮字段改名 `usageDelta`。 |
| R-13 | P2 | [02 §3](doc/02-核心循环与事件系统.md)、[06 §2](doc/06-状态与记忆管理.md) | `Checkpointer.save` 抛错时没有语义：`finalize` 内再 checkpoint，`finally` 也可能再 checkpoint，可能递归失败。 | 02 §3 `persistTerminal` / `finalize` 都 `await checkpoint(state)`；`catch` 里 `yield* finalize('error', ...)`；`finally` 里 `await persistTerminal('aborted')`。06 §2 `Checkpointer.save(state): Promise<void>` 无错误约定。 | 磁盘满 / SQLite 锁失败时，终态可能写不进去，错误路径自己再失败；锁释放顺序不确定。 | 定义 `save` 失败为 fatal：只做一次 best-effort 终态写，失败记录原始错误并释放锁；禁止在 `finalize` 内重试；补 fake checkpointer 抛错用例。 |
| R-14 | P2 | [06 §2.2/§2.3](doc/06-状态与记忆管理.md) | `stream` / `resume` 的锁是在 `load` 之前还是之后获取未定义；`ThreadBusyError` 与 `ThreadNotResumableError` 的优先级也未定。 | 06 §2.3：「同一 `threadId` 并发 `stream` 直接抛 `ThreadBusyError`」；06 §2.2：「`stream()` 加载到 `awaiting-approval` / `running` 且已有 `messages` 时抛 `ThreadNotResumableError`」。两处都可能在同一 thread 上触发。 | 两个 `stream` 同时 `load` 后再抢锁，会有一个覆盖另一个的 state；用户看到哪个错误取决于检查顺序。 | 规定「先获取 per-thread 锁，再 load state」；定义错误优先级（busy 先于 not-resumable）；补并发 `stream` 用例。 |
| R-15 | P2 | [03 §3](doc/03-插件系统与钩子设计.md) | `onEvent` 的「O(1)、禁止 await 网络 IO」只是文字约定，没有类型或运行时机制；慢插件仍会形成背压。 | 03 §3：「`onEvent` 必须保持 O(1)：禁止在这里 `await` 网络导出；OTel / Langfuse 走批量 + 异步队列」。02 §5.3：事件流是 `transformEvent → onEvent → 消费者`。没有说明 `onEvent` 是否被 await、超时如何计。 | 一个同步 JSON 序列化大事件、或返回 Promise 的插件会拖慢 token 流；「telemetry 故障不杀请求」变成「不杀但拖」。 | 明确 `onEvent` 返回 `void` 且不被 await；或 core 用 fire-and-forget 队列 + 丢弃计数；补慢插件用例。 |
| R-16 | P2 | [03 §2/§3/§5](doc/03-插件系统与钩子设计.md) | `enforce` 是插件级 `'pre' \| 'post'`，但注释说「排到本钩子的最前 / 最后」；`criticalHooks` 是 `string[]`，拼错钩子名不会报错。 | 03 §2：`enforce?: 'pre' \| 'post'`；同字段注释「hook 执行顺序强化：排到本钩子的最前 / 最后」。`criticalHooks?: string[]`。03 §5：「两个排序维度分离」。 | 无法只对某个钩子 pre、另一个 post；`criticalHooks` 拼错会静默失去 critical；类型安全承诺打折。 | 删除 `enforce`（第一轮建议），或改成 `Record<keyof AgentHooks, 'pre' \| 'post'>`；`criticalHooks?: Array<keyof AgentHooks>`。 |
| R-17 | P2 | [03 §3](doc/03-插件系统与钩子设计.md)、[01 §11](doc/01-总体架构设计.md) | 观察钩子被定义为「只读」，但 `onRunStart(state, ctx)` 拿到可变 `state`，`RunContext` 又暴露 `checkpointer` / `provider` / `services`；插件可以直接写状态。 | 03 §3：「观察（`onX` / `onEvent`）：只读，不得改 `messages` / 工具列表；允许通过 `ctx.metadata(...)` 写插件命名空间」。01 §11 `RunContext` 含 `checkpointer: Checkpointer`、`provider: ModelProvider`、`services: ServiceRegistry`。 | 「观察只读」无法靠类型约束；telemetry 插件可以 `ctx.checkpointer.save(...)` 或替换 provider；出问题难以审计。 | 观察钩子改用 `ObserverContext`（只读 state + metadata + logger），或把 `RunContext` 的这些字段标 `readonly` 并在文档写明「信任边界」。 |
| R-18 | P2 | [02 §3](doc/02-核心循环与事件系统.md)、[03 §3](doc/03-插件系统与钩子设计.md)、`spikes/src/run-phase.ts`、`spikes/fixtures/manifests/t1.json` / `t2.json` | 文档与 spike 漂移：spike 用 `ToolRuntime.beforeStart` + `findApproval(state)` 做审批，不走 `wrapToolCall`；spike 实现 `phase` / ②a，文档 02 没有；T1/T2 manifest 缺 `model` / `killPoints` / `invariants`，`budget` 扁平而 09 写嵌套。 | `run-phase.ts` 的 `ToolRuntime` 有 `beforeStart` 与 `requiresApproval`，`executePendingTools` 直接读 `state.pendingApprovals`。09 §4 manifest 要求 `model` / `budget` / `killPoints` / `invariants`；`t1.json` / `t2.json` 只有 `maxTurns` 等扁平字段。 | 「spike 已验证」被用来支撑文档，但 spike 验证的是另一套协议；manifest 无法机械校验；v0.1 实现会以 spike 为准，文档变废纸。 | 二选一：把文档改成 spike 的 `ToolRuntime` 协议，或把 spike 改成 `wrapToolCall`；manifest 落 JSON Schema + runner，字段与 09 逐字对齐。 |
| R-19 | P2 | [09 §2.5](doc/09-harness层设计.md)、[06 §6](doc/06-状态与记忆管理.md) | 09 承诺 thread 的 `rewind` / `fork`；06 明确「不支持时间旅行」，Checkpointer 只有 `load(threadId)` 当前态，没有历史快照 API。 | 09 §2.5：「thread 的 resume / rewind（回上一轮）/ fork（分支试验）」。06 §6：「不支持时间旅行是有意取舍 ... 若 v0.3 引入子 Agent 编排再评估 `fork`」。06 §2 `Checkpointer` 只有 `save` / `load` / `delete?`。 | harness 的 rewind / fork 没有数据基础；若在 harness 里自己存历史，等于绕开 core 状态模型；v0.3 范围膨胀。 | 从 v0.x 删除 rewind / fork，或给 Checkpointer 增加 `listVersions` / `loadVersion`；先做前者，v1.x 再评估。 |
| R-20 | P2 | [01 §11](doc/01-总体架构设计.md)、[03 §2](doc/03-插件系统与钩子设计.md)、[09 §2.7](doc/09-harness层设计.md) | `RunContext.provider` / `checkpointer` 由谁提供、服务名是什么未定义；`SetupContext` 只有 `registerService`，没有 `registerProvider` / `registerCheckpointer`。模型路由又只能通过 `ctx.provider` 单 Provider。 | 01 §11 `RunContext.provider: ModelProvider`、`checkpointer: Checkpointer`；03 §2 `SetupContext.registerService<T>(name, service)`；09 §2.7「模型路由 / 降级 ... 落点 `wrapModelCall` + `Provider.capabilities`」。 | core 无法从 `plugins` 解析出唯一 provider / checkpointer；路由插件想切 Anthropic 只能绕过 `next` 自己调服务；v0.1 天气 Agent 的装配规则不清。 | 在 `createRuntime` 增加显式 `provider` / `checkpointer` 选项，或冻结保留服务名 `'provider'` / `'checkpointer'`；路由用 `providerRegistry` 或 `req.provider`，不要只靠 `ctx.provider`。 |
| R-21 | P2 | [08 §4](doc/08-路线图与里程碑.md)、[10 §6](doc/10-扩展能力与编排层.md) | v0.4 同时背 plugin-otel、plugin-todo、compaction 规则版、子 agent 完整、模型路由、评测体系；10 还建议 v0.4 做 Kern Graph spike。 | 08 §4 v0.4 任务 6 项；10 §6：「v0.4：子 agent / 模型路由 / 评测；可做 `Kern Graph` 的技术 spike」。08 §5 自己列了「harness 范围蔓延」风险。 | v0.4 可能成为第二个弃坑点；T6/T8 的验收压力与 OTel/todo 的基础设施同时到来。 | 拆 v0.4a（OTel + todo + T6）与 v0.4b（子 agent + 路由 + T8）；Kern Graph spike 移到 v1.x。 |
| R-22 | P2 | [04 §4](doc/04-模型Provider抽象.md)、[03 §4/§7](doc/03-插件系统与钩子设计.md)、[05 §1](doc/05-工具系统.md) | `context-overflow` 由 `wrapModelCall` 捕获后调 compaction；重试插件也在 `wrapModelCall`。wrapper 顺序未定义，可能出现「重试插件先抛 context-overflow，压缩插件看不到」。工具重试 `wrapToolCall` 可重放非幂等副作用。 | 04 §4：「Provider 抛 context-overflow → `wrapModelCall` 捕获 → `ctx.services.get('compaction')` → 重调 next」。03 §4 的 model-retry 示例对 `isRetryable` false 直接 throw。03 §7 #3「tool 重试 → `wrapToolCall`」。05 §1 `sideEffect` 默认 non-idempotent。 | 压缩可能永远不触发；tool retry 插件可把 `write` / `bash` 执行两次；与 at-least-once 的诚实语义冲突。 | 定义推荐 wrapper 顺序（compaction 外层、retry 内层、budget 最外层）；tool retry 仅允许 `sideEffect: 'idempotent'` 或 `next` 之前失败；写进 03 §4/§7。 |
| R-23 | P2 | [03 §3](doc/03-插件系统与钩子设计.md)、[06 §4](doc/06-状态与记忆管理.md) | `transformInput` 的返回值语义未定：是「只影响本次请求的视图」，还是「替换并持久化 `RunState.messages`」？compaction 依赖这个区别。 | 03 §3 改写类：「必须返回新值，按顺序串行管道」。06 §4：「上下文窗口管理不进内核，通过 `transformInput` 钩子实现」。02 §3 在 `callModel` 内部应用，未写回 state。 | 若只在请求视图生效，checkpoint 仍存全量历史，压缩每轮重算；若写回 state，原始历史丢失，恢复 / 审计受影响；T6 无法定验收。 | 明确 `transformInput` 返回 request view，`RunState.messages` 保持 canonical；或增加 `state.messages` 显式替换 API 并写 checkpoint。补压缩前后 state 断言。 |
| R-24 | P2 | [02 §3/§5.1](doc/02-核心循环与事件系统.md)、[03 §3](doc/03-插件系统与钩子设计.md) | `finalize('aborted', { error })` 产出的事件类型是 `run-aborted { reason?: string }`，payload 带 `error`；`run-finished` 没有 `finishReason`；`onRunEnd` 是否在 abort 时调用未定义。 | 02 §3 `catch`：`yield* finalize(isAbort(err) ? 'aborted' : 'error', { error: toKernelError(err) })`；`finalize` 统一 `yield { type, ...payload }`。02 §5.1 `run-aborted { reason?: string }`、`run-finished { output: string; usage: Usage }`。03 §3 `onRunEnd / onError`「结束 / 异常」。 | TS 类型不成立（aborted 事件多出 `error`）；消费者无法知道 `length` 截断；abort 的清理钩子不确定是否触发。 | `finalize('aborted', { reason })`；`run-finished` 加 `finishReason`；明确 `onRunEnd` 用于 done/aborted，`onError` 只用于 error。 |

### 2.4 P3（文档 / 命名 / 表达）

| ID | 级别 | 位置 | 问题 | 证据 | 影响 | 最小修改建议 |
| --- | --- | --- | --- | --- | --- | --- |
| R-25 | P3 | [09 §2.2](doc/09-harness层设计.md)、[05 §1/§8](doc/05-工具系统.md) | 09 要求「每个工具必须声明五要素：`concurrencySafe` / `requiresApproval` / `sideEffect` / 结果大小策略 / 错误话术」；`ToolDefinition` 只有前三项 + `timeoutMs` / `tags`，没有结果大小策略与错误话术字段。`read_result` 依赖 05 §8 的大结果落盘，但落盘位置仍是开放问题。 | 09 §2.2 原文；05 §1 `ToolDefinition` 字段；05 §8：「超阈值（默认 32KB）落盘 + 返回引用」，05 §10 开放问题「大结果落盘的存储位置」。 | 五要素无法机械检查；`read_result` 在 v0.2a 可能没有稳定存储路径；工具作者各自发明。 | 把「结果大小策略 / 错误话术」降为 harness 约定并写清默认；或给 `ToolDefinition` 增加可选字段；先定 `result_ref` 的存储根与生命周期。 |
| R-26 | P3 | [01 §11](doc/01-总体架构设计.md)、[04 §1](doc/04-模型Provider抽象.md)、[05 §1/§2/§7](doc/05-工具系统.md) | v0.1 冻结协议里带了大量 v0.2+ 才用的字段：`providerOptions`、`outputSchema`、`ToolResult.data`、`ContentBlock.diff`、`image`、`Usage.costUsd`。 | 01 §11 `Usage.costUsd?`；04 §1 `providerOptions?` 标 `[v0.2]`；05 §1 `outputSchema?`；05 §2 `ContentBlock.diff` / `image` 标 `[v0.2]`；05 §2 `data?`。 | 协议面变大，v0.1 无用字段也要测试 / 序列化；「协议先行」变成「提前承诺」。 | 只在 v0.1 保留实际消费的字段；其余标 `[v0.2]` 并从 `v0.1 frozen` 类型中移出，v0.2 再加（需接受一次协议扩展）。 |
| R-27 | P3 | [07 §3](doc/07-沙箱与可观测性.md) | `execCode` 的 abort 监听未 `removeEventListener`；`removeTempFile` 不在 `finally`；`minimalEnv` 未定义，若不含 `PATH`，`Bun.spawn(['bun', ...])` 可能找不到命令；`cwd` 没有校验。 | 07 §3：`opts.signal?.addEventListener('abort', () => {...})`；`await removeTempFile(entry)` 在正常路径；`env: { ...minimalEnv, ...opts.env }`；`cwd: opts.cwd` 必填但无路径校验。 | 每次工具调用泄漏 listener；pipe 抛错时临时文件残留；最小 env 可能让 bash / bun 直接失败；`cwd` 可指向任意目录。 | `finally` 清理临时文件与 listener；定义 `minimalEnv` 至少含 `PATH` / `HOME` / `TMPDIR`；校验 `cwd` 在允许根目录内。 |
| R-28 | P3 | [01 §1.1/§1.3](doc/01-总体架构设计.md)、[10 §1](doc/10-扩展能力与编排层.md)、[readme 架构图](readme.md) | 01 §1.1 说「内核只做三件事：Agent Loop、事件分发、钩子管线」；10 §1 说 core 职责还包括 `RunState` / Checkpointer 协议；readme 架构图把「规划」画进 core loop；01 §1.3 说「所有执行路径签名都是 `AsyncGenerator<Event>`」，但 `ToolDefinition.execute` 是 `Promise<ToolResult>`。 | 01 §1.1 原文；10 §1「core 的职责：Agent Loop、事件分发、钩子管线、`RunState` / Checkpointer 协议」；readme 架构图 `B[Agent Loop 模型调用 → 工具 → 规划 → 循环]`；05 §1 `execute(...): Promise<ToolResult>`。 | 读者对「core 到底包含什么」有三套理解；规划被误认为 core 能力；「所有执行路径」与工具 Promise 冲突。 | 统一为「Loop / Event / Hooks + RunState 契约」；readme 图移除「规划」；把 §1.3 改成「run / model 事件是流，工具执行是 Promise」。 |
| R-29 | P3 | [01 §7](doc/01-总体架构设计.md)、[10 §4](doc/10-扩展能力与编排层.md)、[08 §4](doc/08-路线图与里程碑.md)、[readme 文档索引](readme.md)、[09 §5/§6](doc/09-harness层设计.md) | 版本 / 状态表不一致：`plugin-otel` 在 01 §7 是 v0.2、10 §4 是 v0.2b、08 是 v0.4；readme 索引 03 标「草案（核心）」而正文标 v2；09 §6 把「真实模型 vs 回放」列为开放问题，但括号里已经给出答案；T7b 不在 09 §5 的版本表。 | 01 §7 `@kernjs/plugin-otel` 拆出时机「v0.2」；10 §4「可观测性后端切换 ... v0.2b」；08 §4 v0.4「plugin-otel」。readme 索引 03「草案（核心）」；03 正文「v2」。09 §6「[ ] [v0.3] 评测用真实模型还是录制回放？（CI 用回放，人工验收用真实）」。09 §5 只列 T5/T7，未列 T7b。 | 读者 / CI / 发布表对不上；开放问题看起来没关闭；T7b 没有归属版本。 | 以 08 为唯一版本源，回写 01/10；索引状态与正文统一；`[x]` 关闭评测问题；T7b 并入 v0.3 的 T7。 |

### 2.5 文档冲突对照（只并列原文，不裁决）

| # | A 文档原文 | B 文档原文 | 冲突点 |
| --- | --- | --- | --- |
| C-1 | 02 §3 步骤 5：回填后只 `await checkpoint(state) // 保存点②`，全文无 `phase` 赋值 | 06 §2.1：②a「`phase = turn-end`，`turn-finished` 前」；②b「计数 + `phase = model` 后」；08 §3：v0.1 要做「②a 回填 / ②b turn-end」 | 保存点数量与 phase 写入 |
| C-2 | 09 §4 T2：`[read, edit]`；最终 diff 只改 greeting 文案；测试 exit 0 | 09 §4 T2 文字：`requiresApproval` 拦截生效（ask 策略下默认拒绝即可验证） | 同一任务既要求 edit 生效、又要求默认拒绝 |
| C-3 | 09 §2.5：thread 的 `resume` / `rewind` / `fork` | 06 §6：不支持时间旅行；若 v0.3 再评估 `fork`；`Checkpointer` 无历史 API | harness 是否承诺 rewind / fork |
| C-4 | 03 §3/§4：`wrapToolCall` 包住单次工具执行，`Handler` 用 `RunContext`；审批落点 `wrapToolCall` | 05 §3：权限在 `ToolContext.permissions`，由 `ToolContextFactory` 计算；06 §2.2：审批 decision 在 `RunState.pendingApprovals` | 审批插件拿不到 decision / permissions |
| C-5 | 03 §3：`hookTimeoutMs` 默认 30s 约束 transform / wrap，超时中止 run | 05 §4：`timeoutMs` 由内核内建强制执行；07 §2：`SandboxOptions.timeoutMs` 必填，可远大于 30s | 两个超时的优先级与作用域 |
| C-6 | 01 §7：`@kernjs/plugin-otel` 拆出时机 v0.2；10 §4：v0.2b | 08 §4：v0.4 才做 plugin-otel | OTel 版本 |
| C-7 | 01 §1.1：内核只做三件事（Loop / 事件 / 钩子） | 10 §1：core 职责还包括 `RunState` / Checkpointer 协议；06 整篇状态管理 | core 是否包含状态契约 |
| C-8 | 09 §4：manifest 至少包含 `model` / `budget` / `killPoints` / `invariants` | `t1.json` / `t2.json`：只有 `expectedTools` / `maxTurns` 等扁平字段，无 `model` / `killPoints` / `invariants` | manifest 格式是否已定 |

处理原则：上表不替作者裁决。对应修法见 R-01 / R-02 / R-04 / R-08 / R-11 / R-18 / R-19 / R-29。作者需要二选一并全量回写，不能两边都保留。

---

## 3. 分维度分析

### 3.1 定位与边界（4/5）

- 「single-agent runtime core，不是 workflow runtime」在 readme、01、10 三处一致；10 把图 / DAG / 多 Agent 放到 L3，core 不 import，这是全文最扎实的部分。`Kern Graph` 作为独立包的方案成立。
- HITL 放在 core 可以接受：它是**工具调用级审批**，不是节点级闸门；10 §3.3 也明确「core 只到工具级审批，节点级 interrupt 由 graph 自己实现」。这条区分规则应该写进 01/02，而不是只留在 10。
- 边界渗漏主要在上下文：`wrapToolCall` 拿不到 `RunState` / `ToolContext`（R-01），`RunContext` 暴露 `checkpointer` / `provider` 给观察钩子（R-17），`resume` 丢 `principal`（R-08）。这不是「分层图画错」，而是「钩子输入不够，插件只能绕过分层」。
- 「core 只做三件事」与 06 的 `RunState` / Checkpointer 协议冲突（R-28）。建议把 core 定义成「Loop / Event / Hooks + RunState 契约」，插件实现存储；否则读者会以为状态也是插件。
- 非目标足够明确；没有把图引擎塞进 core 的迹象。harness 的 2.1–2.9 野心较大，但它在 core 之外，风险主要是 v0.4 范围（R-21），不是定位。

### 3.2 架构效率（4/5）

- 抽象有真实用例支撑：Loop、事件、钩子、Provider、工具、Checkpointer 都能对应到 T1–T8；`PendingCall` + 五保存点不是凭空设计，而是针对「副作用工具重放」「部分完成」「审批恢复」的现实问题。第一轮的两个 P0 已修，流式洋葱（`composeStream`）在 spike 里 4 条用例通过，工具输出队列（`AsyncQueue`）与事件配对也有用例。
- `onX / transformX / wrapX` 三分法清楚，职责基本不重叠。真正的缺口是**输入上下文**而不是钩子名字：审批要 decision / permissions，预算要 usage，路由要 provider 选择。钩子表看起来完备，但类型签名只写了「签名要点」，`AgentHooks` 没有完整定义（08 §3 只列类型名）。这会在 v0.2a 集中爆发。
- 事件协议对单本地消费者够用；`onEvent` 覆盖 telemetry。单消费者不是 v0.1–v0.3 的瓶颈。真正的成本是 `transformEvent` 可丢 terminal 事件（R-05）、abort 无工具终结事件（R-06）、`onEvent` 背压（R-15）。这些都不是「再加事件类型」能修的，是协议规则。
- 工具管线的「校验 → wrap → execute → transform → 回填」自洽；并发分组、超时、错误归一都有考虑。未定的是「并发批次遇 ask」的挂起语义（R-07），以及 `wrapToolCall` 与 `ToolContext` 的边界（R-01）。
- Checkpointer 的数据模型方向正确，且 spike 已验证 ③ 配对、②a/②b、③b、④a/④b、consumer break。控制流仍有缺口：02 不写 phase / ②a（R-02）、首事件 break（R-03）、checkpoint 失败（R-13）、锁顺序（R-14）。「数据模型够、控制流不够」是当前最准确的判断。
- 插件协议静态注册、`dependsOn` 拓扑、`services` 注册表都合理；`dispose` 逆拓扑已修。`enforce` 与 `criticalHooks` 的类型/粒度仍不干净（R-16）。

### 3.3 合理性与一致性（3/5）

- 第一轮 11 处冲突大多已修：审批事件、abort 例外、观察钩子写 metadata、T3 并发、回放硬要求、dispose 顺序、compaction 版本、层号、preset、HITL 语义。这说明作者在认真收敛，不是「文档先行」摆样子。
- 仍有会变成实现分歧的冲突：`phase` / ②a（C-1）、T2（C-2）、rewind/fork（C-3）、审批上下文（C-4）、超时（C-5）、OTel 版本（C-6）、core 范围（C-7）、manifest（C-8）。其中 C-1 / C-4 / C-5 直接涉及 v0.1 要冻结的协议，不是措辞问题。
- 错误模型现在有四类 + 两判定位，`MaxTotalStepsError` / `BudgetExceededError` 已进 `KernelError`；abort 例外写清楚了。剩余问题是 `finishReason='error'` 不进错误模型（R-10）、`finalize('aborted')` payload 类型不符（R-24）、`Checkpointer.save` 失败无定义（R-13）。
- 安全边界描述比第一轮诚实：L1 不隔离网络 / 文件系统，cwd 内 `.env` 可读，`.env` 读取需审批或路径拒绝；`killed = timedOut || aborted` 与业务失败正交。这符合「不夸大隔离性」。剩余是 Windows shell / 进程树 / PATH 的实现细节（R-27），以及 `cwd` 未校验。
- 可观测性方向正确：span 树靠 `spanId / parentSpanId`，不靠全局栈；属性对齐 `gen_ai.*`；`text-delta` 不逐条落 trace。`run-aborted` 没在 span 表出现、abort 无工具终结事件，会让 trace 缺口（R-06）。`usage.costUsd` 放在 core 类型但单价表在插件，归属略混（R-26）。

### 3.4 轻量性（4/5）

- core 仅依赖 Zod 现在成立：`registerTool` 只接收 `RegisteredTool`，Zod → JSON Schema 在 `@kernjs/tools`；`ToolContext` / `ModelProvider` 都是接口。这是第一轮 K-12 的正确修法。
- v0.1 单包、v0.2 monorepo 的时机合理：v0.2a 引入 sandbox / 文件工具 / harness，包边界开始有产品意义；Bun workspaces 成本低。真正需要补的是「机械 enforce」：08 §6 已有 `tsc --noEmit` + import 边界 + LOC 脚本，方向对；还要加「干净安装 CI」防止 workspace hoisting 掩盖未声明依赖。
- `Bun.serve` vs Hono：单端点 SSE + resume 用 `Bun.serve` 足够；Hono 的价值在路由 / 中间件 / 鉴权 / OpenAPI，不在性能。文档没有过度贬低 Hono。SSE 的 replay / 多客户端属于 server 包，不应进 core。
- Bun + TS 对本地 coding agent 足够；Rust / Go 现在不需要。未来可选：高并发 SSE 网关、CPU 密集解析 / 向量检索、海量 trace 聚合、容器编排；这些作为旁路服务，不进 core。这个结论成立。
- 文档本身偏重：10 篇 + T1–T8 + W1–W6 + 6 个试金石 + 若干开放问题。01 / 02 / 03 / 05 / 06 是权威，09 / 10 是提纲；目前 09 已进入路线图承诺的讨论，10 也有 W1–W6。建议保留 01/02/03/05/06 五篇权威，09 并入 08，10 缩成一页边界备忘；否则每次协议改动要回写十篇，维护成本会超过学习收益。
- 10 文件 / 300 行：按 spike 看，`run-phase.ts` 单文件 535 行（含 approval / phase / tool loop / checkpoint / resume）；core 去掉 spike 便利设施后仍可能 350+。10 文件可以，300 是「目标」不是「保证」；200 是自我束缚。

### 3.5 可落地性（3/5）

- v0.1 五步执行顺序是全文最可落地的部分：先冻协议，再裸 loop，再加钩子，再加 checkpointer，最后 CLI。T0 有明确载体（天气 Agent），spike 也有 `fixtures/basic` 与 `t1.json` / `t2.json`。41 条 spike 测试通过，说明「流式洋葱 + 零 chunk 重试」「③ 配对」「②a/②b」「③b」「④a/④b」「工具输出队列」「并发调度」这些高风险点至少有一条可运行路径。
- 但 spike **绕开了 `wrapToolCall` 审批**（R-01），也**没有覆盖首事件 break**（R-03）、**没有 principal**（R-08）、**没有 abort 工具终结事件**（R-06）、**没有并发 + ask**（R-07）。这些不是「再加测试」，是协议输入不够。
- v0.1 可以在修完 R-02 / R-03 / R-10 / R-24 后启动；v0.2a 必须在 R-01 / R-08 / R-11 修完后启动。否则 v0.2a 的 T2 会在「审批是插件还是 core」上返工。
- 高风险技术点中，文档已覆盖：流式工具调用聚合、`tool_use / tool_result` 配对、压缩成对删除、Bun × OTel、node-pty、MCP schema。仍缺：`length` 截断的 partial tool call（R-10）、审批上下文（R-01）、`resume` principal（R-08）、并发批次挂起（R-07）、checkpoint 失败（R-13）、首事件 break（R-03）。
- 「文档里优雅、代码里难写」的具体位置：`wrapToolCall` 内暂停审批（R-01）、`executeTools` 并发 + 队列 + 挂起（R-07）、`resume` 按 phase 重入（R-02）、`transformInput` 压缩视图（R-23）、`Checkpointer.save` 失败收口（R-13）。这五处是接口设计问题，不是实现细节。
- T1–T8 比第一轮可测：有 manifest、预算、killPoints、invariants。但 T1/T2 的 JSON 仍不满足 09 的「至少包含」，`expectedTools` 没写精确/子序列，T2 自相矛盾，T7b 没版本。需要 JSON Schema + runner，而不是继续加文字。

### 3.6 对照公平性

- Vite / Koa 的对照公平：文档明确说「借鉴命名与组合模型」，没有声称等价；`enforce` 的取舍也写清楚了。LangChain v1 middleware 的对照部分公平：retry / HITL / PII / todo 的落点能对应上；但文档没有给版本、源码位置或行为证据，`createAgent` 内部循环、`streamEvents` v2 的映射属于「未验证」。
- LangGraph 的边界讲清楚了：core 不做图，Kern Graph 独立包；10 §3.3 也承认「节点级 interrupt 由 graph 自己实现」。但在恢复能力上低估了 LangGraph 的 checkpointer（channel values + pending writes + time travel）；06 §6 用「无图就没有分支执行」解释不做，逻辑成立，但对照表应补一列「代价 / 适用条件」。
- Claude Code / DeepAgents 的对照是产品形态级，不是 API 级；「harness 本质」判断成立，但没有逐项比较 prompt 装配、工具 UX、权限策略。作为学习提纲够用，作为公平对照不够。
- 真正的差异化：core 可删插件、零运行时依赖、显式 `PendingCall` + 五保存点、`transformEvent` 在 `onEvent` 之前、用 T 任务集替代「能聊天」。重复造轮子：Provider 适配、schema 转换、retry、todo、compaction、HITL、OTel、MCP 桥。对学习项目，重复是合理的；但要在每行标「为什么自研：学习 / 差异化 / 别无选择」，否则简历读者会把「重复实现」当「架构判断」。
- Kern Graph 的独立包方案成立；但 10 §3.3 的「复用 `resume()`」偏乐观：core 的 `resume` 是 run 级续跑，graph 需要 node 级 interrupt 与自己的图状态。10 §7 已把这个列为开放问题，方向对，不要写成「已可复用」。

### 3.7 文档质量（4/5）

- 优点：状态行、开放问题、决策记录（`[x] 已定`）、风险表、文档回写机制、三问笔记，这些让文档可评审、可收敛。多数设计稿没有这些。第一轮后新增的 `spike`、`manifest`、`exit criteria` 也提高了可验证性。
- 缺点：状态标签不统一（readme 索引 03「草案（核心）」vs 正文 v2）；版本表不一致（OTel v0.2 / v0.2b / v0.4）；开放问题里已有答案的仍标 `[ ]`；`T7b` 没版本；文档与 spike 漂移（R-18）。死链方面，06/07 的 `../../agent-fullstack/...` 从 `doc/` 出发是正确路径，旧评审的「应为 ../../」判断本身有误；实际 6 个目标文件均存在（本地已验证）。
- 「文档先行」没有变成「文档膨胀」，但已经接近：09 / 10 是提纲，却进入路线图承诺的讨论；01 / 02 / 03 / 06 重复描述同一时序。建议保留 01 / 02 / 03 / 05 / 06 五篇权威，09 并入 08，10 缩成一页；每次协议改动只改一处，其他文档引用。
- 证据质量：关键结论大多有原文引用；但外部框架（LangChain / LangGraph / Bun / Zod）没有版本与源码位置，属于「未验证」。这不是致命问题，但要标清楚，避免读者把设计判断当事实。

---

## 4. 重点必答（10 问）

### 4.1 这套内核是否真的能控制在 10 文件 / 200 行？列出预计模块和风险。

**结论：10 文件可以；200 行不行；300 行是紧的目标，不是保证。** 任务书写 ≤200，readme / 01 / 08 写 ≤300；两个口径不同。若 200 是硬约束，建议直接判 No-Go，或把 core 缩到「Loop + Event + Hooks」并接受状态 / 工具管线外置——但那样会推翻当前定位。

按文档职责 + spike 规模估算（未读 core 源码，只有 spike）：

| # | 模块 | 内容 | 估算行数 | 200 行风险 |
| --- | --- | --- | --- | --- |
| 1 | `protocol.ts` | `Message` / `ContentBlock` / `ToolCall` / `ToolSpec` / `Usage` / `RunState` / `PendingCall` / `RunContext` / `MetadataScope` / `Checkpointer` / `ModelProvider` / `KernelPlugin` / `AgentHooks` | 300–400 | 高 |
| 2 | `hooks.ts` | 钩子类型、`compose` / `composeStream`、transform 管道、enforce / critical / timeout | 200–260 | 高 |
| 3 | `loop.ts` | 状态机、phase、finalize、checkpoint、abort、tool batch、approval suspend | 300–450 | 高 |
| 4 | `tools.ts` | 校验、调度、超时、错误归一、输出队列、`RegisteredTool` | 250–350 | 高 |
| 5 | `runtime.ts` | 插件注册、setup / dispose、拓扑、services、thread 锁、stream / resume 胶水 | 220–320 | 高 |
| 6 | `events.ts` | 信封、seq、`transformEvent` / `onEvent` 分发 | 120–180 | 低 |
| 7 | `errors.ts` | 错误类与归一 | 60–90 | 低 |
| 8 | `state.ts` | 初始化、clone、迁移、保存点辅助 | 100–160 | 中 |
| 9 | `config.ts` | limits、logger、默认值、`RuntimeOptions` | 60–100 | 低 |
| 10 | `index.ts` | 出口与 `createRuntime` | 20–40 | 低 |

合计约 **1800–2200 行**。`protocol.ts` / `loop.ts` / `tools.ts` / `runtime.ts` 四个是超 300 的高风险；`loop.ts` 若把 `resume` 也放进去，按 spike `run-phase.ts` 的 535 行（含 approval / phase / tool loop / checkpoint / resume）压缩后仍可能 350–450。要同时守 10 文件与 300 行，只有两种做法：

1. `protocol.ts` 只放跨文档公共类型，`AgentHooks` / `ToolContext` / `ModelChunk` 各自留在专题模块；`loop.ts` 拆出 `resume.ts`（变成 11 文件）。
2. 放宽到 12 文件 / 300 行，或用 core 总 LOC ≤1800 作为唯一硬指标，单文件只做「目标」。

建议：**保留 ≤10 文件作为设计纪律，300 行作为目标，LOC 1800 作为硬指标；v0.1 退出时用脚本报告实际模块与行数，不为了 200 行拆出无意义文件。** 200 行且「类型定义与注释计入」是自我束缚；第一轮已经指出，文档改到 300 是对的，但任务书要同步。

### 4.2 钩子清单是否完备？缺哪个会导致 v0.2 / v0.3 返工？

**名字基本完备，输入上下文不完备。** 缺的不是新钩子，而是钩子能拿到的数据：

| 钩子 / 通道 | 现状 | 缺口 | 返工风险 |
| --- | --- | --- | --- |
| `wrapToolCall` | `RunContext` | 拿不到 `pendingApprovals.decision` / `ToolContext.permissions`（R-01） | v0.2a T2 / v0.3 T5 审批无法做成插件 |
| `wrapModelCall` | `RunContext` | 拿不到 thread `usage` / `RunState`，预算与路由难做（R-09） | v0.2 预算、v0.4 路由返工 |
| `onEvent` | 逐事件调用，O(1) 靠约定 | 没有「不 await / 丢弃 / 超时」机制（R-15） | telemetry 背压 |
| `onRunEnd` / `onError` | 「结束 / 异常」 | abort 是否触发 `onRunEnd` 未定义（R-24） | v0.3 恢复 / 清理 |
| `wrapToolCall` 事件 | `tool-call-cancelled` 只有 denied / expired | abort 没有终结事件（R-06） | UI / telemetry 缺口 |
| `transformEvent` | 可丢弃 / 改写任意事件 | terminal / error 没有保护（R-05） | 消费者收不到终止 |
| `transformInput` | 改写 messages | 返回视图还是持久化未定（R-23） | compaction / PII 返工 |
| `onRunSuspended` / `onRunResume` | 已有 | 是好补充；但要保证 resume 有 principal（R-08） | 资源重建失败 |

真正会导致 v0.2 / v0.3 返工的三个：`wrapToolCall` 上下文、`wrapModelCall` 的 usage/state、abort 生命周期。`onAfterModelCall` 可以并入 `wrapModelCall` 的后置段，不算缺口；`onEvent` 已经是 telemetry 的正确通道。建议在 01 §11 或新增 `protocol.ts` 里给出 `AgentHooks` 的完整 TS 签名，不要只给表格「签名要点」。

### 4.3 五保存点是否足以覆盖 HITL、崩溃恢复、并发工具和 abort？

**数据模型够；控制流不够。** 分场景：

- **HITL**：③ + ③b + `pendingApprovals` + `expiresAt` 的数据模型成立；spike 也验证了 allow / deny / expire / 两次审批排队。缺口是 `wrapToolCall` 拿不到 decision（R-01）、`resume` 丢 principal（R-08）、并发批次遇 ask（R-07）。所以「状态能存，插件不能判」。
- **崩溃恢复**：④a `running + attemptId` + `sideEffect` + at-least-once 是正确修法；spike 验证了非幂等不重放、幂等重试、②a/②b/③/④b 恢复。缺口是 02 不写 `phase` / ②a（R-02）、首事件 break（R-03）、`Checkpointer.save` 失败（R-13）、锁顺序（R-14）。所以「spike 能跑，文档 loop 不能按图实现」。
- **并发工具**：④ 每个工具两次写、结果按原始顺序回填，这部分成立；`tool-output-delta` 与 `toolCallId` 也成立。缺口是「一批里一个 ask，其他 `running` 工具怎么办」（R-07）；以及 abort 时 in-flight 工具没有终结事件（R-06）。
- **abort**：`try/finally` + `persistTerminal('aborted')` + 补 `ToolMessage` 方向正确；spike 消费者 break 测试通过（断在 `tool-call-started`）。缺口是首事件 break（R-03）、`run-aborted` 前没有工具终结事件（R-06）、`finalize('aborted')` payload 类型不符（R-24）。

结论：**五保存点 + ③b 的数量够了，不需要第六个保存点；需要补的是「每个保存点写什么 phase / 什么事件 / 失败怎么办」的执行契约。** 先修 R-02 / R-03 / R-06 / R-07 / R-13，再谈 v0.3 验收。

### 4.4 `AsyncGenerator` 单消费者是否会在 TUI / telemetry / SSE 场景受限？

**在 v0.1–v0.3 的单本地 CLI 不受限；受限的是多客户端与断线重连。** telemetry / 日志走 `onEvent`，TUI 是唯一外部消费者；`AsyncGenerator` 的 pull 背压、`try/catch`、`generator.return()` 取消都比 EventEmitter / RxJS 简单，单消费者场景是对的。

真正受限的两个场景：

- **TUI + Web SSE 同时消费同一条 run**：一个生成器只能有一个外部消费者；需要 server 层 `broadcast()` / ring buffer / tee。02 §7 已把 TUI fork 留到 v0.3，方向对。
- **SSE 断线重连**：`resume` 是 run 级续跑，不是事件流重放；客户端会丢中间事件。需要 `seq` + `Last-Event-ID` 的 replay buffer，属于 server 包，不应进 core。

不要在 core 加事件总线。core 保持单消费者是对的。但要补两条规则：`transformEvent` 丢弃事件会造成 `seq` 空洞，必须明确「seq 允许空洞，排序仍有效」；`onEvent` 必须非阻塞（R-15），否则 telemetry 会变成生产者背压。

### 4.5 v0.2 monorepo 是否过早？包边界能否被机械 enforce？

**不过早。** v0.2a 要引入 sandbox、文件工具、harness，包边界开始对应产品承诺（插件可独立删除）；Bun workspaces 的脚手架成本低，收益是 smoke 脚本与依赖方向可见。v0.1 单包、v0.2 拆包是合理节奏。

但「能否机械 enforce」取决于 CI，不是 workspaces 本身：

- 08 §6 已有 `bunx tsc --noEmit` + import 边界检查 + LOC 脚本，方向对；还要加「干净安装 CI」，防止 workspace hoisting 让未声明依赖在本地通过。
- 包图要先定：`core` 不 import `plugin-*` / `harness` / `server`；插件不互相 import；`@kernjs/tools` 是作者辅助包，core 不 import；`server` 是否独立包仍是 01 §10 开放问题（R-29）。
- `smoke` 脚本「删除任意插件，core 仍可启动」是好的机械验收；它比目录拆分更能证明边界。
- 建议 v0.2a 先拆 `core` / `tools` / `plugin-sandbox` / `harness` 四个包，其余插件等有实现再拆；不要为了「monorepo 完整」一次拆十几个空包。

### 4.6 Bun + TS 有哪些隐藏坑？哪些场景必须 Node / 原生模块 / Rust / Go？

**现在需要处理的：**

- **Bun 不做类型检查**：`bun run` 只 strip 类型；08 已加 `tsc --noEmit`，这是对的。没有它，流式 / 泛型钩子错误到运行时才暴露。
- **Bun × OTel SDK**：文档已列为风险；若 exporter 依赖 Node 原生模块，最稳的是降级为 HTTP exporter 或旁路 collector。未验证。
- **`Bun.spawn` 的 kill 语义**：`killTree: true` 已写；Windows 上要确认进程组 / 进程树 / 信号；`bash` 是否存在于 Git Bash / WSL / PowerShell 也未定（07 §6 开放）。
- **`minimalEnv` 与 `PATH`**：07 §3 的 `env: { ...minimalEnv, ...opts.env }` 没定义 `minimalEnv`；若不含 `PATH`，`Bun.spawn(['bun', entry])` / `bash` 可能找不到命令（R-27）。最小 env 应保留 `PATH` / `HOME` / `TMPDIR`，只删 API Key。
- **`bun:sqlite`**：只适合 Bun；事务 / WAL / 多进程锁未在 06 写；v0.2b 单进程可用，多进程要换 PG / Redis。
- **`node-pty`**：TUI 的兼容性未验证；09 §6 已标开放。不要把 TUI 放进 core。
- **`zod-to-json-schema` / Zod 4 `z.toJSONSchema`**：文档已把转换移到 `@kernjs/tools`，正确；Zod 4 内置能力需验证版本（文档自己标了「版本需验证」）。
- **SSE 解析 / `stream_options: { include_usage: true }`**：兼容端可能不支持，usage 缺失；04 §5 已有注释，但要有 fallback。
- **`AbortSignal` 到子进程**：`Bun.spawn` 的 `signal` / `kill` 组合要测；否则 abort 后进程残留。

**必须 Node / 原生模块 / Rust / Go 的场景（现在不需要）：** 高并发 SSE 网关（Go / Rust 可选）、CPU 密集解析 / 向量检索（Rust / 原生库）、海量 trace 聚合（旁路服务）、容器编排（L2 沙箱）。这些都不进 core；现在用 Bun + TS 足够。不要因为「简历项目」提前引入 Rust/Go；那会把「最小内核」变成「多语言工程」。

### 4.7 T1–T8 / W1–W6 的验收是否可测？缺哪些 fixture 和断言？

**比第一轮可测，但还没到「机械可跑」。** T1/T2 已有 manifest，spike 也有 `fixtures/basic`；41 条测试验证了 fixture 读取与预算字段。缺口：

- **manifest 格式不统一**：09 §4 要求 `repo` / `model` / `expectedTools` / `finalDiff` / `exitCode` / `answerKey` / `budget` / `killPoints` / `invariants`；`t1.json` / `t2.json` 只有 `expectedTools` / `maxTurns` 等扁平字段，没有 `model` / `killPoints` / `invariants`。`budget` 在 09 是嵌套对象，在 fixture 是扁平的 `maxTurns` 等（R-18 / R-29）。
- **`expectedTools` 匹配模式未编码**：09 §4 写「精确序列或子序列；允许工具替换（read → grep）」，JSON 里没有 `match: 'exact' \| 'subsequence'` / `allowReplace` 字段。T1/T2 只能靠 runner 猜。
- **T2 自相矛盾**：文字要求 ask 默认拒绝，fixture 要求 edit 产生 diff（R-11）。必须先拆 T2a / T2b。
- **T7 / T7b 的 killPoints 没落地**：`killPoints` 字段在 09，但没有对应 fixture / 注入器；spike 有 `Crash` 模拟，但没有与 manifest 对齐。
- **T5 审批日志**：T5 只写「rm -rf 被拦截 + 批准后执行」，没有断言 `approval-requested` 事件、`pendingApprovals` 落盘、`resume` 决策、`tool-call-cancelled` / completed 的顺序。
- **T3 并发交错**：T3 要验证「只读并发、写入串行」，但没有要求 runner 记录 start / end 时间或交错日志；`tool-scheduler` spike 只验证分组，不验证 loop 集成。
- **T6 压缩配对**：T6 要验证 tool_use / tool_result 成对删除，但 manifest 没有 `expectedMessageIds` / `droppedPairs` 断言。
- **T8 子 agent 隔离**：T8 要验证父级只见结论，但 manifest 没有「父 messages 不含子过程」的断言。
- **W1–W6**：10 明确是提纲，不是承诺；W3 的 fan-out / fan-in 合并语义、W5 的 superstep 恢复都还没有 fixture。不要按承诺验收。

建议：先写一个 `task-manifest.schema.json` + `run-task.ts` runner，统一字段；每个 T 任务至少断言 `events`（顺序 / 配对）、`state`（配对 / pending 为空）、`finalDiff` / `exitCode`、`budget`、`killPoints`。T1/T2 先跑通，再谈 T3–T8。

### 4.8 与 LangChain / LangGraph 的对照是否公平？哪些是自研优势，哪些是重复造轮子？

**公平的部分：** Vite / Koa 的命名与组合模型、LangGraph 的「图外置」边界、Claude Code / DeepAgents 的 harness 定位。这些是结构对照，不是功能等价声明。

**不够公平 / 未验证的部分：**

- LangChain v1 middleware 的具体行为、`createAgent` 内部循环、`streamEvents` v2 的粒度映射，文档没有给版本和源码位置；属于「未验证」。
- LangGraph checkpointer 的恢复能力被简化成「图状态 + pending writes」，没有展开 channel values、time travel、分支成本；06 §6 用「无图就没有分支执行」解释不做，逻辑成立，但对照表应补「代价 / 适用条件」。
- Claude Code / DeepAgents 的对照是产品形态级，不是 API 级；没有逐项比较 prompt 装配、工具 UX、权限策略。作为学习提纲够用，作为公平对照不够。

**自研优势：** core 可删插件、零运行时依赖、显式 `PendingCall` + 五保存点、`transformEvent` 在 `onEvent` 之前、用 T 任务集替代「能聊天」。这些是真正的差异化，且有文档证据。

**重复造轮子：** Provider 适配、schema 转换、retry、todo、compaction、HITL、OTel、MCP 桥。对学习项目，重复是合理的；但要在每行标「为什么自研：学习 / 差异化 / 别无选择」，否则简历读者会把「重复实现」当「架构判断」。

**Kern Graph：** 独立包方案成立；但 10 §3.3 的「复用 `resume()`」偏乐观：core 的 `resume` 是 run 级续跑，graph 需要 node 级 interrupt 与自己的图状态。10 §7 已列为开放问题，方向对，不要写成「已可复用」。

### 4.9 「学习 + 简历」的定位是否导致过度设计或功能堆叠？

**core 没有过度设计；过度在 harness 与路线图。** 证据：

- v0.4 同时背 OTel + todo + compaction + 子 agent 完整 + 路由 + 评测（R-21）。
- 09 列 2.1–2.9 九个组件，还保留 TUI / rewind / fork；rewind / fork 与 06 的「不做时间旅行」冲突（R-19）。
- 10 篇文档 + T1–T8 + W1–W6 + 6 个试金石 + 若干开放问题，维护面很大。
- 一些小项提前进 v0.1 协议：`providerOptions`、`outputSchema`、`UserContent.image`、`ContentBlock.diff`、`Usage.costUsd`、`enforce`、`criticalHooks`（R-26）。

简历导向的风险是「广度看起来很大，深度没有跑通」。反制手段是：v0.1 + v0.2a 先跑通 T1–T4，附 trace、回归 fixture、对照笔记；v0.2b 减到 SQLite + 审批；其余延期。把「我拒绝了什么」写进 notes，比多列 9 个组件更能证明判断力。

### 4.10 如果只能保留 60%，砍哪些？如果必须加 20%，加哪些？

**保留的最小闭环（60%）：**

- Loop + `finalize` + 终止条件 + abort + `phase`（修 R-02 / R-03 后）。
- 事件信封 + `transformEvent` / `onEvent` + 单消费者 + terminal 事件保护。
- 钩子三分法（`onX / transformX / wrapX`）+ 注册顺序 + `wrapModelCall` 流式洋葱。
- 流式 Provider + tool-call 聚合 + 错误三分类 + `finishReason` 处理。
- 工具校验 / 错误回传 / `concurrencySafe` 串行分组 / 超时 / `ToolContext`。
- Checkpointer 五保存点 + ③b + 进程内 thread 锁（修 R-13 / R-14 后）。
- CLI + 天气 Agent + 录制回放 fixture + T0。

**砍掉 / 延期（40%）：**

- `enforce`、`criticalHooks`（或只留注册顺序 + 按钩子 critical）。
- `onAfterModelCall`（并入 `wrapModelCall` 后置段）、`outputSchema`、`ToolResult.data` 冗余、`Usage.costUsd`。
- `providerOptions`（v0.1 只留 `capabilities.contextWindow`）、reasoning 历史回传、image / diff 实现。
- OTel SDK、todo、compaction → v0.4（文档已做）；server / Hono、TUI fork、rewind / fork、PG / Redis → v0.3+ / v1.x。
- Kern Graph → v1.x 独立包；W1–W6 不并入 T1–T8。
- 文档合并：09 并入 08，10 缩成一页边界备忘；保留 01 / 02 / 03 / 05 / 06 五篇权威。

**必须加（20%）：**

- `wrapToolCall` 的 `ToolCallContext`（permissions / approval decision）；`RunContext` 加只读 `state` / `getUsage()`（R-01 / R-09）。
- `resume` 的 `principal` 持久化（R-08）。
- `phase` / ②a 写入 loop（R-02）；首事件 break 收口（R-03）。
- abort 工具终结事件 + `tool-call-cancelled(aborted)`（R-06）。
- 并发批次挂起协议（R-07）。
- `finishReason='error'` / `length` partial tool call（R-10）。
- manifest JSON Schema + runner + T2a/T2b（R-11 / R-18）。
- checkpoint 失败 / 锁顺序（R-13 / R-14）。
- `tsc --noEmit` + import 边界 + LOC + 干净安装 CI（08 已有，补干净安装）。

---

## 5. 三个视角结论

### A. 学习项目：是否真的能帮助理解 Agent 框架的设计动机？

**能，但有前提。** 这套文档把「为什么不用图」「为什么保存点要在工具派发前」「为什么事件先于异常」「为什么单消费者」写成了可检验的决策，而不是功能清单；对照笔记的三问（差异 / 它为什么那样设计 / 我什么时候会输）是比代码更值钱的产出。spike 41 条测试通过，说明作者已经在做「可运行的验证」，不是只写文档。

前提是：先修 R-01 / R-02 / R-03 / R-06 / R-10，再开 v0.1；否则学习曲线会从「理解设计动机」变成「修自己造的协议 bug」。最有学习价值的三个点：流式洋葱 + 零 chunk 重试、checkpoint ③/④ 配对与 at-least-once、审批 suspend / resume。这三个都已经有 spike 路径，值得继续深挖。

### B. 工程作品 / 简历：是否足以证明架构判断力，而不是功能堆叠？

**有条件地足够。** 文档已经展示了判断力：core / plugins / harness 的硬边界、拒绝图进 core、五保存点、错误模型、依赖方向、T 任务集。这些比「我实现了 9 个组件」更能说明问题。第一轮后的修订也说明作者能吸收评审，而不是护设计。

但作品化的门槛是「跑通 + 可验证」：v0.1 + v0.2a 跑通 T1–T4，附 trace、回归 fixture、对照笔记，才足以证明；如果停在 10 篇文档 + 9 个 harness 组件，读者会把它归为「设计文档型项目」。简历上最值得写的是「我拒绝了什么、代价是什么、怎么验收」，而不是组件数量。当前 R-01 / R-11 会让 T2 跑不通，必须先修，否则「跑通 T1–T4」的承诺不成立。

### C. 真实可用：能否在本地 coding agent 场景稳定跑起来？

**可以作为「有人看着的本地 coding agent」，不能作为生产级 / 无人值守。** v0.1 天气 Agent 可用；v0.2a 的 read / edit / bash 在本地仓库可以跑，但「稳定」要打折：

- 审批协议还有 R-01 / R-08，`ask` 只能依赖 core 硬编码或默认 allowAll；无人值守 / 自动批准不可信。
- 崩溃恢复的 at-least-once 是诚实的，但并发批次 + ask（R-07）可能让 in-flight 工具继续执行；kill 后可能重复副作用。
- L1 沙箱不隔离文件系统和网络，cwd 内 `.env` 可读；不能把它当安全边界；`cwd` 未校验（R-27）。
- Windows 下的 shell、进程树、信号行为未定义；`minimalEnv` 的 PATH 未定义。
- 压缩在 v0.4 才验收（T6），长会话稳定性没有早期回归；`transformInput` 视图语义未定（R-23）。

结论：配合 `safe` preset、git 作为 undo、敏感文件不在 cwd，可以作为「有人看着的本地 coding agent」使用；不要承诺生产级或无人值守 SLA。这不是要求生产 SLA，而是文档承诺的审批 / 恢复语义还没有完全兑现。

---

## 6. 建议

### 6.1 删减

1. 删 `enforce` 与插件级 `criticalHooks` 的粗粒度：v0.1 只保留注册顺序 + `dependsOn`；`critical` 改成按钩子声明（`Array<keyof AgentHooks>`）。等出现真实排序冲突再加。
2. 删 `onAfterModelCall`（并入 `wrapModelCall` 后置段）、`outputSchema`、`ToolResult.data` 冗余、`Usage.costUsd`；这些 v0.1 不用。
3. 删 v0.4 的「一次全做」：拆 v0.4a（OTel + todo + T6）与 v0.4b（子 agent + 路由 + T8）；Kern Graph spike 移到 v1.x。
4. 删 09 的 rewind / fork，或给 Checkpointer 增加历史 API 后再承诺；v0.x 先不做。
5. 文档合并：09 并入 08，10 缩成一页边界备忘；保留 01 / 02 / 03 / 05 / 06 五篇权威，减少回写成本。

### 6.2 补充

1. `wrapToolCall` 的 `ToolCallContext`（permissions / approval decision / pendingCall 只读视图）；或把审批判定收归 core 并明确「审批不是插件」。二选一，不要两边都写。
2. `resume` 的 `principal` 持久化；`RunContext` 加只读 `state` / `getUsage()`；`AgentHooks` 的完整 TS 签名。
3. 02 的 `phase` / ②a 写入；首事件 break 收口；abort 工具终结事件；并发批次挂起协议。
4. `finishReason='error'` / `length` partial tool call 的处理 + fixture；`Checkpointer.save` 失败 / 锁顺序的约定。
5. `task-manifest.schema.json` + `run-task.ts` runner；T2a/T2b；T7b 并入 T7；T1/T2 manifest 补齐 `model` / `killPoints` / `invariants`。
6. `onEvent` 非阻塞机制（fire-and-forget + 丢弃计数）；`transformEvent` terminal 事件保护；`seq` 空洞规则。

### 6.3 延期

1. OTel SDK / Langfuse 导出 → v0.4；v0.2b 先用 JSONL trace。
2. 子 agent / 模型路由 / 评测体系 → v0.4（已在路线图）；先做委派，不先做图。
3. 多进程锁 / Redis / PG → v1.x；v0.1 进程内锁够。
4. TUI / node-pty → v1.x；不要进 core。
5. compaction 摘要版 / 长期记忆 / RAG / MCP → v1.0；先规则裁剪，后摘要。
6. Kern Graph / W1–W6 → v1.x 独立包，不并入 T1–T8。

---

## 7. 需要作者回答的问题（≤10）

1. `wrapToolCall` 只拿 `RunContext`，怎么读 `pendingApprovals.decision` 和 `ToolContext.permissions`？如果读不到，审批是 core 内置还是插件？请二选一并冻结。
2. `resume()` 没有 `principal`；审批 / 崩溃恢复后，`ToolContextFactory` 如何重建权限？principal 存哪里？
3. 02 的 loop 从不写 `RunState.phase`，06 / 08 却依赖它；以哪篇为权威？②a 是保留还是删除？
4. `hookTimeoutMs=30s` 是否覆盖整条 `wrapModelCall` 流和 `wrapToolCall` 的 execute？它和工具 `timeoutMs` 谁优先？
5. `transformEvent` 能否丢弃 / 改写 `error` / `run-finished` / `run-aborted`？如果能，「先事件后异常」如何保证？
6. abort 时，已经发出 `tool-call-started` 的工具由哪个事件收口？`tool-call-cancelled` 是否增加 `aborted`？
7. T2 到底期望 edit 生效还是默认拒绝？fixture 的 `finalDiff` 与「ask 默认拒绝」如何同时成立？
8. 观察钩子拿到 `RunContext`（含 `checkpointer` / `provider`）是否真的只读？如果插件调用 `save`，core 如何阻止？
9. `RunContext.provider` 是单 Provider；模型路由想切 Anthropic 时，`wrapModelCall` 通过什么接口选 Provider？
10. T1/T2 manifest 的权威字段是什么？`model` / `killPoints` / `invariants` 为什么没进 JSON？`budget` 是嵌套还是扁平？

---

## 8. 最后一句

**这套设计最可能死在 v0.2a 前后：当审批、恢复、并发工具和权限同时要落地时，`wrapToolCall` 的上下文与 loop 的 phase 控制流必须改协议，而改协议要回写十篇文档；最值得保留的是 core / plugins / harness 的硬边界、`PendingCall` + 五保存点 + at-least-once 的诚实语义，以及用 T1–T8 替代「能聊天」的验收方式。**
