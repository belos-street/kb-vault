# 09 — Harness 层设计

> **状态**：v1 提纲 · 依赖 01-07 定稿，随 v0.2 展开细化
> **定位**：官方插件集 + preset，把 core 组装成能直接干活的 coding agent
> **边界**：不是 app（不含 TUI / 前端），不是 core（不含 loop）；CLI 交互层归 examples
> **参照物**：Claude Code（产品形态）、DeepAgents（agent-fullstack [3.6](../../agent-fullstack/doc/03-LangGraph.js复杂工作流编排/06-DeepAgents框架.md)：虚拟文件系统 + 子 agent + 技能系统——本质就是一个 harness）

## 1. 与 core 的契约（先列需求 → 反推接口 → 标缺口）

这张表是 harness 的**验收表**：左列是 harness 成立所需的能力，右列是 core 侧的落点；凡「现状 ❌」的条目就是 v0.2 的 core 开发任务。

| harness 需要 | core 接口 | 现状 |
| --- | --- | --- |
| 审批暂停 / 恢复 | `RunState.status` + `pendingToolCalls`（PendingCall）+ `pendingApprovals` + `runtime.resume()` | ✅ 协议 v0.1（签名定稿，实现为 no-op 占位），实现 v0.2 |
| 结果瘦身 / 脱敏 | `transformToolResult` 钩子 | ✅ 协议 v0.1（透传占位），实现 v0.2 |
| diff / 图片 / 结构化结果 | `ToolResult.content: ContentBlock[]` | ✅ 协议 v0.1（结构已定），实现 v0.2 |
| TUI + telemetry + 日志同时消费 | telemetry / 日志走 `onEvent` 观察钩子 ✅；TUI fork 留 `[v0.3]` | ✅（观察面已定，见 [03](03-插件系统与钩子设计.md)） |
| 命令在项目目录执行 + 实时输出 | `Sandbox.execCommand` + `cwd` + 流式 stdout → `ctx.emitOutput()` → `tool-output-delta` | ❌ v0.2（已进 [07](07-沙箱与可观测性.md)） |
| 上下文预算感知 | `Provider.capabilities.contextWindow` | ❌ v0.2（已进 [04](04-模型Provider抽象.md)） |
| 模型路由 / 降级 | `wrapModelCall`（AsyncGenerator 洋葱）+ `providerOptions`（[v0.2] 透传口） | ✅ v0.1 留位 / v0.2 透传，路由逻辑在 harness |
| 子 agent 嵌套 run / 委派工具 | runtime 实例化 + 委派工具 | ❌ v0.3 |

## 2. 组件分解

### 2.1 System prompt 装配

- **分层**：身份与规则 → 工具使用规范 → 环境（cwd / OS / git 状态）→ 项目上下文（AGENTS.md）→ 技能 → 当前任务
- **分工边界**（防漂移）：单工具的「何时用 / 输入输出」归 `ToolSpec.description`（作者维护）；harness 的「工具使用规范」只写**全局约定**——并行调用限制、`result_ref` 回读方式、错误话术惯例、审批提示语。两层不重复
- **落点**：`onRunStart`（环境采集，写 `ctx.metadata('harness')`）+ `transformInput`（注入）
- **关键决策**：模板引擎 vs 代码拼接（倾向代码拼接，少一层抽象）；**前缀稳定**——静态段在前、动态段（当前任务）在后，保证 prompt cache 命中

### 2.2 工具集

| 类别 | 工具 | 要点 |
| --- | --- | --- |
| 文件 | read / write / edit / glob / grep / **read_result** | read 带行号与截断；edit 唯一性校验 + 写前快照（可回滚）；只读工具 `concurrencySafe: true`，写工具 `false`；read_result 回读大结果的 `result_ref`（对应 [05](05-工具系统.md) 大结果落盘） |
| 执行 | bash | `Sandbox.execCommand`、cwd、超时、`onStdout → ctx.emitOutput()`、危险命令拦截 |
| 任务 | todo / task | todo 进度追踪；task = 子 agent 委派（v0.3） |
| 外部 | web fetch / MCP | MCP v1.0 |

每个工具必须声明**三个机械字段**：`concurrencySafe` / `requiresApproval` / `sideEffect`；另外两条是 **harness 约定**（不进 `ToolDefinition` 类型）：结果大小策略（超过 `maxResultBytes` 落盘并返回 `result_ref`）与错误话术（`failResult` 的 code / message 规范——直接决定模型自纠质量）。`sideEffect: 'non-idempotent'` 的写 / 执行类工具，崩溃恢复时默认不自动重放。

**`result_ref` 生命周期（定稿）**：大结果写到 `<tmpdir>/kern-refs/<threadId>/`，`read_result` 凭 opaque ref 回读；TTL 24 小时或 `thread.delete` 时清理。不进仓库目录，避免污染工作区与 git。

**连续失败升级策略**：同一工具对同一目标连续失败 N 次（默认 3）→ 注入纠错提示（含上次完整错误）→ 仍失败 → 按任务标记失败 / 转人工。落点：`transformInput`（注入提示）+ harness 计数器（`metadata['harness:failstreak']`）。

### 2.3 权限与审批

- **规则模型**：`allow / deny / ask` × 工具 × 参数模式（路径 glob、命令前缀）
- **分级基线**：读（自动）→ 写（ask 或白名单）→ 执行（ask）→ 删除（强制 ask）
- **协议**：`approval-requested` 事件 → 外部决策 → `runtime.resume({ approvalId, decision })`；每个 `PendingApproval` 带 `expiresAt`，过期统一 deny；决策写入 `pendingApprovals.decision` 后落盘（保存点 ③b），崩溃不重问；拒绝归一为 `failResult('APPROVAL_DENIED')`，不 abort
- **超时执行者**：harness / CLI 定时器扫描 `pendingApprovals.expiresAt`，到点调用 `resume(deny)`；core 只做状态判定，不启动定时器
- **批次规则**：一批工具里出现 ask → **停止调度新工具**；若已有 in-flight 工具，先等它完成并落盘（④b），再进入 `awaiting-approval`；不允许把其余工具留在 `pending` 后直接挂起，也不允许挂起期间启动新工具。`allow` 后从挂起项继续，`deny` 后跳过该项继续
- **落点**：`transformTools`（裁剪不可用工具）+ `wrapToolCall`（前置闸门：读 `ToolCallContext.toolContext.permissions` 与 `approval.decision`，返回 allow / deny 或抛 `ToolSuspended`）

### 2.4 上下文管理

- **预算**：`contextWindow × 70%` 触发压缩
- **策略顺序**：工具结果瘦身 → 滚动摘要 → 硬截断（便宜策略先用）
- **硬约束**（继承 [06](06-状态与记忆管理.md)）：`tool_use` / `tool_result` 成对删除；system prompt 永不压缩；压缩点尽量靠后（保 cache）
- **落点**：`transformInput`

### 2.5 会话与恢复

- thread 的 resume / 新 run；**v0.x 不做 rewind / fork**（core 无历史快照 API，要分支就新建 threadId）
- pending approval 恢复；进程崩溃后从 checkpoint 续跑（依赖 [06](06-状态与记忆管理.md) 保存点 ③ 配对 + ③b 决策 + ④ running/completed）
- **resume 生命周期**：`onRunSuspended` / `onRunResume` 关闭 / 重建**插件在 setup 时持有的** per-run 资源（OTel span、沙箱连接、临时目录），不从 `ObserverContext` 取 service；T7 必须验证这两个钩子被调用，而不是只看最终状态

### 2.6 子 agent

- 委派工具 + 隔离上下文 + 结果摘要回传（父级只见结论，不见过程）
- 并发子 agent、预算分配、失败隔离（子 agent 失败不拖垮父 run）
- 对照 DeepAgents 的 subagent 机制（agent-fullstack 3.6）

### 2.7 模型路由

- 按任务分级选模型：主循环 / 压缩 / 子 agent / 标题生成——不同任务用不同档位模型
- 降级链 + 成本上限；**落点**：`wrapModelCall`（AsyncGenerator 洋葱，零 chunk 才能重试）+ `Provider.capabilities`
- provider 从保留服务 `services.provider` 解析；候选模型注册为 `services['model:<id>']`，路由插件在 wrapper 里替换 `next`（见 [03 §2](03-插件系统与钩子设计.md)）
- 选型决策树参照 agent-fullstack 1.1 的模型选型决策

### 2.8 观测与评测

- trace（core 已设计，见 [07](07-沙箱与可观测性.md)）+ 成本（单价表在插件配置）
- 评测：固定任务集 + 录制回放 + 断言（工具序列 / 最终 diff / token 预算），详见 [08](08-路线图与里程碑.md) 评测基建

### 2.9 技能与命令（v1.0）

- skills（按需注入的提示包）、slash commands、用户自定义 shell 钩子
- harness 的可扩展面，对照 Claude Code 的 skills / commands
- 与 agent-fullstack 大纲的 skill 体系（本仓库 `.agents/skills/`）同构——学习时可直接对照

## 3. 装配与 preset

```ts
// 伪代码：harness 装配入口
const agent = createCodingHarness({
  model: 'qwen3.8-max',
  preset: 'minimal',
  cwd: '/path/to/project',
  tools: ['read', 'edit', 'bash'],
  plugins: [todoPlugin, otelPlugin],
})

for await (const e of agent.stream({ threadId, input })) { ... }
```

| preset | 行为 | 适用 |
| --- | --- | --- |
| `minimal` | 读 + 编辑 + bash，写操作 ask | 日常开发 |
| `safe` | 全部 ask | 不熟悉的仓库 / 生产环境 |
| `ci` | 只读 + 全自动（无 ask） | CI 流水线 |

## 4. 纵向切片验收（用任务集，不用「能聊天」）

| # | 任务 | 验证点 |
| --- | --- | --- |
| T1 | 读文件并回答 | 工具调用 + read 截断 |
| T2 | 单文件精确编辑 + diff（固定 allow） | edit 唯一性；工具序列 `[read, edit]`；最终 diff 只改 greeting 文案 |
| T2a | T2 的 allow 分支 | `wrapToolCall` 返回 allow；diff 落盘；测试 exit 0 |
| T2b | T2 的 ask / deny 分支 | `approval-requested` → resume deny；不写文件；`APPROVAL_DENIED` + `tool-call-cancelled` |
| T3 | 多文件重构（grep → 多处 edit） | 并发安全 + 结果瘦身 |
| T4 | 跑测试 → 失败 → 修 → 再跑 | 循环 + 错误回传 |
| T5 | `rm -rf` 被拦截 + 批准后执行 | 完整审批协议（approval-requested → resume allow）；工具序列 `[bash]`；无未闭合 span |
| T6 | 上下文超限压缩后继续完成 | 压缩配对完整性 |
| T7 | 审批中途 / 工具执行中 kill，重启后继续（含审批决策落盘后 kill） | checkpoint ③ 配对 + ③b 决策 + ④ running 语义；non-idempotent 不静默重放；已落盘 allow / deny 不重问 |
| T8 | 子 agent 探索代码库 | 委派 + 隔离 |

每条任务的 manifest 至少包含：

| 字段 | 内容 |
| --- | --- |
| `repo` | fixture 仓库 id + commit hash + 初始文件树 |
| `model` | 录制 SSE fixture id；真实模型模式需记录 seed / temperature / 重试策略 |
| `approval` | `none`（无闸门）/ `allow`（wrapper 返回 allow）/ `ask`（必填 `decision`，可配 `timeoutMs`） |
| `expectedTools` | `mode: exact / subsequence` + 工具序列；允许的工具替换（read → grep 等）写在子序列断言里 |
| `expect` | `finalDiff` / `exitCode` / `answerContains` / `unchangedFiles` / `removedPaths` / `errorCode` / `eventOrder`，至少一项 |
| `budget` | maxTurns / maxInputTokens / maxOutputTokens / maxWallTimeMs |
| `killPoints` | `after-③` / `after-④a` / `after-④b` / `after-approval-decision` / `consumer-break` |
| `invariants` | 四项必填：`tool-use-pairing`、`tool-event-pairing`、`seq-monotonic`、`pending-empty-at-terminal` |

字段权威定义在独立 kern 仓库的 `spikes/fixtures/manifests/task-manifest.schema.json`，机械校验由 `spikes/src/run-task.ts` 执行（已随 spike 迁至 `D:\code\personal\kern\spikes`；`bun test` 内跑 T1–T5 的 manifest + fixture 前置条件）。

> 以下命令在 `D:\code\personal\kern` 根目录执行：

```bash
cd spikes && bun run src/run-task.ts        # 校验全部 manifest
cd spikes && bun run src/run-task.ts t2b    # 只校验单个
```

> manifest 示例（T2b，ask/deny 分支）：

```json
{
  "id": "T2b",
  "input": "rename Hello to Hi in src/greeting.ts",
  "repo": { "id": "basic", "path": "fixtures/basic", "commit": "local-dev", "initialTree": ["src/hello.ts", "src/greeting.ts", "tmp/scratch.txt"] },
  "model": { "mode": "recorded", "fixture": "t2-recorded-v1", "retries": 0 },
  "approval": { "mode": "ask", "decision": "deny", "timeoutMs": 2000 },
  "expectedTools": { "mode": "exact", "sequence": [{ "name": "read", "input": { "path": "src/greeting.ts" } }, { "name": "edit", "input": { "path": "src/greeting.ts", "from": "Hello from Kern", "to": "Hi from Kern" } }] },
  "expect": { "errorCode": "APPROVAL_DENIED", "eventOrder": ["approval-requested", "tool-call-cancelled"], "unchangedFiles": ["src/greeting.ts", "src/hello.ts"] },
  "budget": { "maxTurns": 3, "maxInputTokens": 4000, "maxOutputTokens": 2000, "maxWallTimeMs": 15000 },
  "killPoints": [],
  "invariants": ["tool-use-pairing", "tool-event-pairing", "seq-monotonic", "pending-empty-at-terminal"]
}
```

> W1–W6 仍按 [10](10-扩展能力与编排层.md) 的提纲，不并入 T1–T8；两层各自有任务集。

**T1 / T2 fixture**（spike 内置 `spikes/fixtures/basic@local-dev`；v0.2a 落地时替换为 pinned commit）：

| 任务 | fixture | 输入 | 期望工具 / 结果 | 预算 |
| --- | --- | --- | --- | --- |
| T1 | `fixtures/basic@local-dev`；`src/hello.ts` | “read src/hello.ts and summarize” | 工具序列 `[read(src/hello.ts)]`；回答含 `greet`；无文件修改 | 2 turns / 2k input / 1k output / 10s |
| T2 | 同一 fixture；`src/greeting.ts` 含 `Hello` | “rename Hello to Hi in src/greeting.ts” | `approval.mode=none`（固定 allow，无 wrapper）；工具序列 `[read, edit]`；最终 diff 只改 greeting 文案 | 3 turns / 4k input / 2k output / 15s |
| T2a | 同一 fixture；同一输入 | 同一输入 | `approval.mode=allow`（`wrapToolCall` 返回 allow）；diff 落盘；测试 exit 0 | 3 turns / 4k input / 2k output / 15s |
| T2b | 同一 fixture；同一输入 | ask → deny | 不写文件；`APPROVAL_DENIED`；`tool-call-cancelled`；无未闭合 started | 3 turns / 4k input / 2k output / 15s |
| T5 | `fixtures/basic@local-dev`；`tmp/scratch.txt` | “remove the fixture temp directory with rm -rf” | `[bash]` 删除 `tmp/`；`approval-requested` → resume allow；事件顺序 `approval-requested → tool-call-started → tool-call-completed`；无未闭合 span | 3 turns / 4k input / 2k output / 20s |

## 5. 分阶段

| 版本 | 范围 | 验收任务 |
| --- | --- | --- |
| v0.2a | core 协议占位转正 + 沙箱 L1（`execCode` / `execCommand`）+ 文件工具集 + 2.1 prompt 装配 + 2.4 基础瘦身 | T1 / T2 / T2a |
| v0.2b | SQLite Checkpointer + 2.3 权限审批 + smoke | T2b / T3 / T4 |
| v0.3 | harness-safe（2.3 完整审批 + 2.5 会话恢复 + 2.6 子 agent 部分） | T5 / T7（含 T7b） |
| v0.4a | harness-scale 前半（plugin-otel + plugin-todo + compaction 规则版） | T6 |
| v0.4b | harness-scale 后半（子 agent 完整 + 模型路由 + 评测体系） | T8 |
| v1.0 | ecosystem（2.9 + MCP + RAG） | 知识库问答 |

> 拆分理由：原 v0.2 单版本 12 项任务对练手项目过载（[08 风险表](08-路线图与里程碑.md) 自己也标了「范围蔓延」）——a/b 两段各自可退出、可验收，降低弃坑风险。v0.4 同理拆成 a / b；`Kern Graph` spike 移到 v1.x，不占 v0.4。

## 6. 开放问题（标定稿版本）

- [x] 已定：审批 = `approval-requested` 事件 + `ToolSuspended` + `runtime.resume({ approvalId, decision })`；不用工具返回值表达暂停
- [ ] `[v0.2]` 压缩用模型摘要还是规则裁剪？（成本 vs 质量，建议先规则后摘要）
- [ ] `[v0.3]` 子 agent 是否共享 checkpointer？（建议：隔离 thread，父级只存摘要）
- [x] 已定：评测用录制回放跑 CI，人工验收用真实模型（不再作为开放问题）
- [ ] `[待评估]` harness 是否包含 TUI（Bun × node-pty 兼容风险，见 [01](01-总体架构设计.md)），还是只到 CLI？
