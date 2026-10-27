# 09 — Harness 层设计

> **状态**：v1 提纲 · 依赖 01-07 定稿，随 v0.2 展开细化
> **定位**：官方插件集 + preset，把 core 组装成能直接干活的 coding agent
> **边界**：不是 app（不含 TUI / 前端），不是 core（不含 loop）；CLI 交互层归 examples
> **参照物**：Claude Code（产品形态）、DeepAgents（agent-fullstack [3.6](../../agent-fullstack/doc/03-LangGraph.js复杂工作流编排/06-DeepAgents框架.md)：虚拟文件系统 + 子 agent + 技能系统——本质就是一个 harness）

## 1. 与 core 的契约（先列需求 → 反推接口 → 标缺口）

这张表是 harness 的**验收表**：左列是 harness 成立所需的能力，右列是 core 侧的落点；凡「现状 ❌」的条目就是 v0.2 的 core 开发任务。

| harness 需要 | core 接口 | 现状 |
| --- | --- | --- |
| 审批暂停 / 恢复 | `RunState.status` + `pendingToolCalls`（PendingCall）+ `runtime.resume()` | ✅ 协议 v0.1（resume 为 no-op 占位），实现 v0.2 |
| 结果瘦身 / 脱敏 | `transformToolResult` 钩子 | ✅ 协议 v0.1（透传占位），实现 v0.2 |
| diff / 图片 / 结构化结果 | `ToolResult.content: ContentBlock[]` | ✅ 协议 v0.1（结构已定），实现 v0.2 |
| TUI + telemetry + 日志同时消费 | telemetry / 日志走 `onEvent` 观察钩子 ✅；TUI fork 留 `[v0.3]` | ✅（观察面已定，见 [03](03-插件系统与钩子设计.md)） |
| 命令在项目目录执行 + 实时输出 | `SandboxOptions.cwd` + 流式 stdout | ❌ v0.2（已进 [07](07-沙箱与可观测性.md)） |
| 上下文预算感知 | `Provider.capabilities.contextWindow` | ❌ v0.2（已进 [04](04-模型Provider抽象.md)） |
| 模型路由 / 降级 | `wrapModelCall` + `providerOptions` | ✅ 接口已定，路由逻辑在 harness |
| 子 agent 嵌套 run / 委派工具 | runtime 实例化 + 委派工具 | ❌ v0.3 |

## 2. 组件分解

### 2.1 System prompt 装配

- **分层**：身份与规则 → 工具使用规范 → 环境（cwd / OS / git 状态）→ 项目上下文（AGENTS.md）→ 技能 → 当前任务
- **分工边界**（防漂移）：单工具的「何时用 / 输入输出」归 `ToolSpec.description`（作者维护）；harness 的「工具使用规范」只写**全局约定**——并行调用限制、`result_ref` 回读方式、错误话术惯例、审批提示语。两层不重复
- **落点**：`onRunStart`（环境采集）+ `transformInput`（注入）
- **关键决策**：模板引擎 vs 代码拼接（倾向代码拼接，少一层抽象）；**前缀稳定**——静态段在前、动态段（当前任务）在后，保证 prompt cache 命中

### 2.2 工具集

| 类别 | 工具 | 要点 |
| --- | --- | --- |
| 文件 | read / write / edit / glob / grep / **read_result** | read 带行号与截断；edit 唯一性校验 + 写前快照（可回滚）；全部 `concurrencySafe: false`；read_result 回读大结果的 `result_ref`（对应 [05](05-工具系统.md) 大结果落盘） |
| 执行 | bash | cwd、超时、流式 stdout、危险命令拦截 |
| 任务 | todo / task | todo 进度追踪；task = 子 agent 委派（v0.3） |
| 外部 | web fetch / MCP | MCP v1.0 |

每个工具必须声明四要素：`concurrencySafe` / `requiresApproval` / 结果大小策略 / 错误话术（`failResult` 的 code 与 message 规范——错误话术直接决定模型自纠质量）。

**连续失败升级策略**：同一工具对同一目标连续失败 N 次（默认 3）→ 注入纠错提示（含上次完整错误）→ 仍失败 → 按任务标记失败 / 转人工。落点：`transformInput`（注入提示）+ harness 计数器（`metadata['harness:failstreak']`）。

### 2.3 权限与审批

- **规则模型**：`allow / deny / ask` × 工具 × 参数模式（路径 glob、命令前缀）
- **分级基线**：读（自动）→ 写（ask 或白名单）→ 执行（ask）→ 删除（强制 ask）
- **协议**：`approval-requested` 事件 → 外部决策 → `runtime.resume(approval)`，超时默认拒绝
- **落点**：`transformTools`（裁剪不可用工具）+ `wrapToolCall`（ask 拦截）

### 2.4 上下文管理

- **预算**：`contextWindow × 70%` 触发压缩
- **策略顺序**：工具结果瘦身 → 滚动摘要 → 硬截断（便宜策略先用）
- **硬约束**（继承 [06](06-状态与记忆管理.md)）：`tool_use` / `tool_result` 成对删除；system prompt 永不压缩；压缩点尽量靠后（保 cache）
- **落点**：`transformInput`

### 2.5 会话与恢复

- thread 的 resume / rewind（回上一轮）/ fork（分支试验）
- pending approval 恢复；进程崩溃后从 checkpoint 续跑（依赖 [06 保存点 ③](06-状态与记忆管理.md)）

### 2.6 子 agent

- 委派工具 + 隔离上下文 + 结果摘要回传（父级只见结论，不见过程）
- 并发子 agent、预算分配、失败隔离（子 agent 失败不拖垮父 run）
- 对照 DeepAgents 的 subagent 机制（agent-fullstack 3.6）

### 2.7 模型路由

- 按任务分级选模型：主循环 / 压缩 / 子 agent / 标题生成——不同任务用不同档位模型
- 降级链 + 成本上限；**落点**：`wrapModelCall` + `Provider.capabilities`
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
  cwd: '/path/to/project',
  approvalPolicy: 'workspace-write',
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
| T2 | 单文件精确编辑 + diff | edit 唯一性 + `requiresApproval` 拦截生效（ask 策略下默认拒绝即可验证；完整审批协议见 T5） |
| T3 | 多文件重构（grep → 多处 edit） | 并发安全 + 结果瘦身 |
| T4 | 跑测试 → 失败 → 修 → 再跑 | 循环 + 错误回传 |
| T5 | `rm -rf` 被拦截 + 批准后执行 | 完整审批协议（approval-requested → resume） |
| T6 | 上下文超限压缩后继续完成 | 压缩配对完整性 |
| T7 | 审批中途 kill，重启后继续 | checkpoint 保存点 ③ |
| T8 | 子 agent 探索代码库 | 委派 + 隔离 |

每条任务定义四要素：**期望工具序列、期望结果、token 上限、耗时上限**——这是 harness 评测集的元数据格式。

## 5. 分阶段

| 版本 | 范围 | 验收任务 |
| --- | --- | --- |
| v0.2a | core 协议占位转正 + 沙箱 L1 + 文件工具集 + 2.1 prompt 装配 + 2.4 基础瘦身 | T1 / T2 |
| v0.2b | SQLite Checkpointer + plugin-otel + plugin-todo + compaction 规则版 + 2.3 权限审批 | T3 / T4 |
| v0.3 | harness-safe（2.3 完整审批 + 2.5 会话恢复 + 2.6 子 agent 部分） | T5 / T7 |
| v0.4 | harness-scale（2.6 完整 + 2.7 模型路由 + 2.8 观测评测） | T6 / T8 |
| v1.0 | ecosystem（2.9 + MCP + RAG） | 知识库问答 |

> 拆分理由：原 v0.2 单版本 12 项任务对练手项目过载（[08 风险表](08-路线图与里程碑.md) 自己也标了「范围蔓延」）——a/b 两段各自可退出、可验收，降低弃坑风险。

## 6. 开放问题（标定稿版本）

- [ ] `[v0.2]` 审批是事件协议还是工具返回值？（倾向：事件 + `resume`，与 [02 状态机](02-核心循环与事件系统.md) 的 `awaiting-approval` 统一）
- [ ] `[v0.2]` 压缩用模型摘要还是规则裁剪？（成本 vs 质量，建议先规则后摘要）
- [ ] `[v0.3]` 子 agent 是否共享 checkpointer？（建议：隔离 thread，父级只存摘要）
- [ ] `[v0.3]` 评测用真实模型还是录制回放？（CI 用回放，人工验收用真实）
- [ ] `[待评估]` harness 是否包含 TUI（Bun × node-pty 兼容风险，见 [01](01-总体架构设计.md)），还是只到 CLI？
