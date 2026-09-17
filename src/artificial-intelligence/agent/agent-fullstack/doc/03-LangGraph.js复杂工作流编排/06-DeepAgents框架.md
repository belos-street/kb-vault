# 3.6 DeepAgents 框架实践

> 基于 LangChain + LangGraph 的开箱即用 Agent harness：文件系统、子代理、上下文管理、沙箱与权限一站式解决

> **模块**：3.6 | **预计时间**：3h | **面试可答**：DeepAgents 与 createAgent/LangGraph 的选型、虚拟文件系统与可插拔 backend、v0.7 breaking changes、Harness Profiles 适配开源模型

## 学习目标

- 理解 DeepAgents 的定位：agent harness = 预置循环 + 内置高阶能力
- 掌握虚拟文件系统工具与四种可插拔 backend
- 掌握子 Agent 委派、任务规划、上下文压缩的配置方式
- 掌握沙箱执行、程序化工具调用（PTC）与声明式文件权限
- 了解 v0.7 breaking changes 与 Harness Profiles（开源模型适配）

---

## 1. DeepAgents 定位

DeepAgents 是一个 **agent harness**（2.1 的 Model + Harness 分层里的 Harness 一极）：核心仍是与其它框架相同的工具调用循环，但内置了一组让 Agent 能扛「长任务、复杂任务」的高阶能力——虚拟文件系统、子代理、任务规划、上下文压缩、沙箱执行。它构建在 LangChain 的构建块之上，用 **LangGraph 做运行时**（durable execution、流式、HITL），`createDeepAgent()` 返回的就是**一张编译好的 LangGraph 图**——3.1-3.5 的全部知识（checkpointer、interrupt、流式、LangSmith）原样适用。

```typescript
// 依赖：bun add deepagents langchain（当前 1.x；peer 依赖 @langchain/langgraph 等自动安装）
import { createDeepAgent } from "deepagents";
import { tool } from "langchain";
import * as z from "zod";

// 自定义函数、LangChain 工具、MCP 工具都可以进 tools（MCP 见 3.5）
const getWeather = tool(
  async ({ city }) => `It's always sunny in ${city}!`,
  { name: "get_weather", description: "查询城市天气", schema: z.object({ city: z.string() }) }
);

const agent = await createDeepAgent({
  model: "anthropic:claude-sonnet-4-6", // 或模型实例；字符串走 initChatModel（2.2）
  tools: [getWeather],
  systemPrompt: "你是一个研究助手", // v0.7 起没有默认 prompt，从零自己写（见第 6 节）
});

// 返回的是编译后的 LangGraph graph：invoke/stream/checkpointer 全部可用
const result = await agent.invoke({
  messages: [{ role: "user", content: "调研 LangGraph 并把笔记存成文件" }],
});
```

与 3.4 多 Agent 编排的关系：DeepAgents 的子代理是**框架内置的委派机制**（`task` 工具），不需要你手写 Supervisor 图；反过来它不负责跨团队的复杂拓扑——需要任意 Agent 互调时仍回到 3.4。

---

## 2. 虚拟文件系统（Virtual Filesystem）

### 2.1 内置文件工具

DeepAgents 给每个 Agent 默认挂上一套文件工具，操作对象是「虚拟文件系统」（由 backend 决定真实存储）：

| 工具 | 说明 |
|------|------|
| `ls` | 列目录（含大小、修改时间等元数据） |
| `read_file` | 读文件（带行号；`offset/limit` 分段读大文件；非文本文件可返回多模态内容块） |
| `write_file` | 新建或**覆盖**写（v0.7 起对已存在文件是覆盖语义，不再报错） |
| `edit_file` | 精确字符串替换（支持全局替换模式） |
| `delete` | 删除文件/递归删目录（`>=0.7` 提供；backend 不支持删除时自动隐藏） |
| `glob` / `grep` | 按模式找文件 / 按内容搜索（多种输出模式） |
| `execute` | 执行 shell 命令——**仅沙箱类 backend 提供**（见第 5 节） |

这套文件系统是 DeepAgents 其它能力（技能、记忆、上下文 offload、代码执行）的公共底座——把中间产物落盘而不是全塞进上下文，是它扛长任务的关键设计。

### 2.2 可插拔文件系统后端

| Backend | 存储位置 | 持久范围 | 典型用途 |
|---------|---------|---------|---------|
| `StateBackend`（默认） | LangGraph state | 随 checkpointer：线程内持久，不跨线程 | 默认选择；云端会话 |
| `FilesystemBackend` | 本地磁盘 | 持久 | 本地文件整理、代码库任务 |
| `StoreBackend` | LangGraph Store | **跨线程**持久 | 用户长期工作区 |
| `CompositeBackend` | 路由组合 | 按前缀分派 | 混合（如 `/workspace/` 落盘，其余进 state） |

```typescript
import { createDeepAgent, FilesystemBackend, CompositeBackend } from "deepagents";

// 本地磁盘：务必 virtualMode: true，把根限制在 rootDir 内防路径逃逸
const localAgent = createDeepAgent({
  model: "anthropic:claude-sonnet-4-6",
  backend: new FilesystemBackend({ rootDir: "/tmp/agent-ws", virtualMode: true }),
});

// 组合路由：/workspace/ 前缀写磁盘，其余文件进 state
const hybridAgent = createDeepAgent({
  model: "anthropic:claude-sonnet-4-6",
  backend: new CompositeBackend(
    new StateBackend(),
    { "/workspace/": new FilesystemBackend({ rootDir: "/tmp/agent-ws", virtualMode: true }) }
  ),
});
```

### 2.3 声明式文件权限控制

`permissions` 规则控制 Agent 对路径的读写，按声明顺序 **first-match-wins**，无匹配默认允许：

```typescript
const agent = await createDeepAgent({
  model: "anthropic:claude-sonnet-4-6",
  backend: new FilesystemBackend({ rootDir: ".", virtualMode: true }),
  permissions: [
    { operations: ["read", "write"], paths: ["/workspace/**"], mode: "allow" },
    { operations: ["read", "write"], paths: ["/**/.env", "/**/secrets/**"], mode: "deny" },
    { operations: ["read"], paths: ["/docs/**"], mode: "allow" },
    // 兜底：以上都不匹配则允许（可按需补一条 deny all）
  ],
});
```

要点：

- 规则只约束**文件工具**；沙箱类 backend 的 `execute` 不受其约束（能跑命令就可能绕过路径规则），敏感环境二选一
- 典型用法：限制写范围到 `/workspace/`、保护 `.env` 与凭据、给子代理更窄的权限（子代理可单独声明继承/覆盖）
- 更复杂的校验逻辑用 backend 的 policy hooks 实现

---

## 3. 子 Agent 委派与上下文隔离

### 3.1 task 工具与子代理定义

`createDeepAgent` 自动附带 `task` 工具与一个内置的 `general-purpose` 子代理。自定义子代理用**字典式声明**（JS 为 camelCase）：

```typescript
const agent = await createDeepAgent({
  model: "anthropic:claude-sonnet-4-6",
  subagents: [
    {
      name: "researcher",
      description: "网络调研：收集资料并整理成要点（何时委派给它就看这段描述）",
      systemPrompt: "你是调研专员，只负责收集与归纳，不下结论。", // 必填，且不继承主 agent 的 prompt
      tools: [webSearch],   // 指定则完全覆盖继承；不指定则继承主 agent 工具
      model: "openai:gpt-5.4", // 可给子代理换更便宜/更快的模型
    },
    {
      name: "writer",
      description: "把调研要点写成结构化报告",
      systemPrompt: "你是撰稿人，基于 researcher 的笔记输出报告。",
    },
  ],
});
```

**上下文隔离机制**（对比 3.4 手工隔离）：

- 主 Agent 的中间过程不自动进入子代理——子代理只收到 `task` 调用时传入的任务描述
- 子代理的执行过程（它自己的多轮工具调用）也不回灌主 Agent——主 Agent 只拿到**最终结果**
- 即 DeepAgents 天然采用 3.4 说的「只共享最终结果」策略，省 Token 且防污染

> ⚠️ `SubAgentMiddleware` 是必需脚手架，不能用 `excludedMiddleware` 移除；想禁用委派需两步：harness profile 里 `generalPurposeSubagent: { enabled: false }` 且不传 `subagents`。

### 3.2 已有 LangGraph 图当子代理

编译过的图可以直接包成 `CompiledSubAgent`（`{ name, description, runnable }`）——把 3.3 的 Agentic RAG 图委派给 DeepAgents 调用，是两个框架结合的典型用法。

---

## 4. 自动上下文压缩与摘要

DeepAgents 的上下文管理分四层：

| 层 | 机制 | 说明 |
|----|------|------|
| 输入上下文 | system prompt + memory + skills + 工具描述 | 决定起点（v0.7 后起点很瘦，见第 6 节） |
| **压缩** | **Summarization / context offloading** | 对话历史自动摘要压缩；大工具结果**offload 到文件系统**（落盘留引用，不占上下文） |
| 技能 | Skills 渐进披露（见下） | 启动只读 SKILL.md frontmatter，用到才读全文 |
| Prompt caching | 静态段落标记缓存 | 支持的模型上降低重复前缀成本 |

与 2.5 的 `summarizationMiddleware` 同源（LangChain 中间件体系），但 DeepAgents 把「工具结果 offload 到虚拟文件系统」做成了默认行为——这是它能跑几十步长任务而不撑爆窗口的核心。

### 技能系统（Skills）与可复用工作流

```typescript
const agent = await createDeepAgent({
  model: "anthropic:claude-sonnet-4-6",
  skills: ["/skills/"], // 指向 backend 里的技能目录（>=1.7.0）
});
```

- 每个 skill 是一个目录 + `SKILL.md`（遵循 Agent Skills 标准），可附脚本/模板/参考文档
- **渐进披露**：启动时只读 frontmatter（名称+描述，几十 token），任务匹配时才读全文——领域知识按需加载
- 与项目沉淀的 skill-kit 思路同构：把「怎么做事的方法论」从 system prompt 里拆出来变成可复用资产

---

## 5. Shell 执行与代码解释器

### 5.1 沙箱执行（Sandbox Backend）

沙箱类 backend 会自动给 Agent 挂 `execute` 工具——在隔离环境里跑 shell（装依赖、跑测试、调 CLI、操作 OS 文件系统）。本机直跑（`LocalShellBackend`）**没有隔离**，仅限可信本机场景；生产/多租户一律用真正的沙箱 backend（云端沙箱服务，文件可上传/下载）。权限规则（2.3）不覆盖 `execute`，敏感环境的审批交给 HITL（第 7 节）。

### 5.2 代码解释器与 PTC（程序化工具调用）

解释器给 Agent 一个 `eval` 工具：在 **QuickJS 运行时**里执行 JS 代码——无 shell、无包安装、无文件/网络访问，轻量安全。

它支撑 **PTC（Programmatic Tool Calling）**：模型不再「一次工具调用返回一次结果」，而是写一小段程序把多个工具调用编排起来（循环、批量、条件、数据变换）：

```
无 PTC：调 search(50 页数据) → 全量塞回上下文 → 模型挑出 3 条
有 PTC：模型写 eval("for (p of pages) { const r = await search(p); if (r.score > 0.9) hits.push(r) }")
        → 只把 hits 回传上下文
```

大批量数据处理场景下，PTC 显著省 Token 与轮次。选型：要装依赖/跑测试/碰 OS → 沙箱；轻量计算/批量工具编排 → 解释器。

---

## 6. v0.7 精简 harness（breaking changes）

DeepAgents 在 2026-07 发布 v0.7 做了一次「瘦身」重设计，JS 随后进入 1.x（当前 1.13.x）。教学与迁移必须知道这六条：

| 变更 | v0.7 前 | v0.7+ | 影响 |
|------|--------|-------|------|
| **默认 system prompt 移除** | 内置整套行为规范 prompt | **从零开始**，`systemPrompt` 写什么是什么 | 必须自己写清工作方式（用文件系统、先规划再执行……）；默认回合 base input tokens 约 6k → 2k（-65%） |
| **todoListMiddleware 改 opt-in** | 默认挂载（`write_todos` 常驻） | 不传就没有任务规划 | 需要规划时显式传（见下） |
| 内置工具描述精简 | 冗长 | 精简约 43% | 行为基本不变 |
| backend factories 移除 | `createFsBackend()` 等工厂 | 直接传 backend 实例 | v0.5 起已废弃，v0.7 清理 |
| middleware 同名覆盖 | 不支持 | 自定义 middleware `.name` 撞上内置即替换 | 替换内置能力的正规姿势 |
| 文件语义调整 | write 已存在报错；无 delete | **write 覆盖**、新增 `delete`、空结果返回 `"No files found"` 而非 `[]` | 依赖旧行为的代码要改 |

```typescript
import { todoListMiddleware } from "langchain"; // 注意：JS 从 "langchain" 导入

const planner = await createDeepAgent({
  model: "anthropic:claude-sonnet-4-6",
  systemPrompt: "面对多步任务先用 write_todos 拆解计划，逐项推进并更新状态。",
  middleware: [todoListMiddleware()], // opt-in：任务规划（pending/in_progress/completed）
});
```

> 💡 **迁移提示**：从 v0.6 升级的代码，最常见问题就是「Agent 行为变了」——根因是默认 prompt 没了。解法不是改回旧版，而是把关键工作方式（规划、落盘、验证）写进自己的 systemPrompt。

---

## 7. Harness Profiles：面向开源模型的 harness 适配

不同模型「吃 harness 的能力」不同——小参数开源模型（Qwen、DeepSeek、Kimi 系列）面对 10+ 个工具和大 prompt 时工具选择错误率明显上升。Harness Profile 把「harness 面貌」按模型定制：

```typescript
import { registerHarnessProfile } from "deepagents";

// 为开源模型注册精简 harness：砍工具、砍中间件、追加模型专属提示
registerHarnessProfile("openai:qwen3.8-max", {
  systemPromptSuffix: "你运行在精简工具环境中：一次只调用一个工具，先用 ls 了解文件布局。",
  excludedTools: ["glob", "grep"],           // 收敛工具面
  excludedMiddleware: ["todoList"],          // 关掉非必需中间件
  generalPurposeSubagent: { enabled: false }, // 关闭子代理委派
});
```

- JS SDK 支持 **harness profiles 注册**（`registerHarnessProfile` / `parseHarnessProfileConfig` / `serializeProfile`）
- **Provider profiles 与插件注册系统是 Python 版独有**，JS 只保留 profiles 这一层
- 另一个用途（反过来）：给能力强的模型挂全量 harness、给弱模型挂精简版，同一套业务代码适配多模型梯队

---

## 8. 人类介入（Human-in-the-Loop）

DeepAgents 把 3.2 的 `interrupt` 封装成声明式配置 `interruptOn`，按工具名指定需要审批的动作：

```typescript
import { Command, MemorySaver } from "@langchain/langgraph";

const agent = await createDeepAgent({
  model: "anthropic:claude-sonnet-4-6",
  backend: new FilesystemBackend({ rootDir: "/tmp/agent-ws", virtualMode: true }),
  interruptOn: {
    write_file: { allowedDecisions: ["approve", "edit", "reject"] }, // 写文件要审批
    execute: true,            // 等价于全部决策类型
    read_file: false,         // 读不需要
  },
  checkpointer: new MemorySaver(), // HITL 硬性前提（3.2 三前提同样适用）
});

// 运行到受控工具时暂停：
const r1 = await agent.invoke(
  { messages: [{ role: "user", content: "把分析结论写入 report.md" }] },
  { configurable: { thread_id: "run-9" } }
);
console.log(r1.__interrupt__); // 展示待审批的 write_file 调用（工具名+参数）

// 人工决策后恢复（同一 config）：
const r2 = await agent.invoke(
  new Command({
    resume: {
      decisions: [
        { type: "approve" },           // 或 edit（附 editedAction: { name, args }）/ reject（附 message）
      ],
    },
  }),
  { configurable: { thread_id: "run-9" } }
);
```

决策类型：`approve`（照原样执行）/ `edit`（改参数执行）/ `reject`（拒绝并附理由）/ `respond`（以消息回应）。子代理可通过自己的 `interruptOn` 覆盖主配置。

---

## 面试问答

> **问：DeepAgents、createAgent、裸 LangGraph 三者怎么选？**
>
> 答：看任务形态与自定义需求。createAgent 适合单角色、标准工具循环的常规 Agent，成本最低；当任务变成「多步骤、需要中间产物落盘、需要委派子任务、长到会撑爆上下文」时，DeepAgents 提供现成方案——文件系统、task 委派、上下文压缩这些自己搭要一到两周；裸 LangGraph 适合控制流必须代码说了算的场景：固定业务流程、复杂拓扑的多 Agent 系统、需要精细打断点的工作流。一个实用的判断信号：如果你的 createAgent 项目开始自己往状态里塞「中间文件」、手写「把任务转给另一个 Agent」的工具，那就是该看 DeepAgents 的信号；如果控制流开始出现 if/else 编排复杂分支，那就是该下到 LangGraph 的信号。DeepAgents 本身返回编译后的 LangGraph 图，两者可以无缝组合。

> **问：DeepAgents 的虚拟文件系统对长任务为什么如此关键？StateBackend、FilesystemBackend、StoreBackend 怎么选？**
>
> 答：关键在于「上下文 offload」——长任务的中间产物（抓取的网页、生成的草稿、分析结果）如果全留在消息历史里，几十步就撑爆窗口；DeepAgents 把它们写成文件，上下文里只留路径与摘要，需要时再 read_file 精准取回，这等价于给 Agent 配了外置工作内存。backend 选择看持久范围：StateBackend 存在 LangGraph state 里，随 checkpointer 线程内持久、不跨线程，是云端会话的默认选择；FilesystemBackend 直接写本地磁盘，适合本机文件整理与代码任务，务必开 virtualMode 限制根目录防路径逃逸；StoreBackend 走 LangGraph Store 跨线程持久，适合「同一个用户的工作区跨会话保留」；混合需求用 CompositeBackend 按路径前缀路由。

> **问：v0.7 为什么移除默认 system prompt？对使用者意味着什么？**
>
> 答：动机是成本与可控性：内置 prompt 是为通用场景设计的大而全行为规范，默认回合 base input tokens 约 6k，大量业务根本用不到其中一半；移除后降到约 2k，同时行为完全由使用者的 systemPrompt 决定。对使用者意味着两件事：升级后 Agent 行为会变（不再自动「先规划再执行、先落盘再总结」），必须把这些关键工作方式写进自己的 prompt；prompt 从负债变成资产——团队可以版本化、评审、按业务定制 agent 的工作规范。配套的变化是 todoListMiddleware 改为 opt-in，需要任务规划时显式传入。判断一个 DeepAgents 项目是否踩过这个坑，看它升级 v0.7 后有没有重写 systemPrompt。

> **问：解释器（Interpreter）与沙箱（Sandbox）都提供代码执行，边界怎么划？**
>
> 答：沙箱是完整执行环境：execute 工具跑 shell，可以装依赖、跑测试、调 CLI、操作操作系统文件系统，运行在隔离的云端沙箱里，适合「像工程师一样干活」的任务；解释器是进程内嵌的 QuickJS 运行时，只有 eval 工具，无 shell、无包安装、无文件与网络访问，适合轻量计算与 PTC——模型写一段程序把多次工具调用编排起来（循环、批量、条件过滤），只把最终结果回传上下文。安全边界也不同：解释器天然高隔离低成本；沙箱强但贵，且文件权限规则管不住 execute（能跑命令就可能绕过路径限制），敏感环境要靠 interruptOn 审批兜底。经验法则：数据处理与工具编排用解释器，需要真实开发环境用沙箱，不确定就从解释器开始。

> **问：如何用 Harness Profiles 解决开源模型「吃不下」复杂 harness 的问题？**
>
> 答：问题背景是 harness 默认工具面大（文件系统 7 件套、task、todo……）、上下文重，强模型能驾驭，Qwen/DeepSeek/Kimi 这类开源小模型工具选择错误率上升。Harness Profile 允许按模型注册精简配置：excludedTools 砍掉低频工具、excludedMiddleware 关掉非必需中间件、generalPurposeSubagent.enabled=false 关闭子代理、systemPromptSuffix 追加针对该模型行为特点的指令（如一次只调一个工具、先探索再动手）。这样同一套业务代码可以在强模型（全量 harness）与开源模型（精简 harness）间切换而不改业务逻辑。注意 JS SDK 只支持 harness profiles；provider profiles 与插件注册系统是 Python 版独有。

---

## 9. 实战练习

> 目标：搭一个「调研 → 落盘 → 审批发布」的 DeepAgents 工作流，串起文件系统、子代理、上下文管理与 HITL。

**要求**：
1. `createDeepAgent` 配两个子代理：`researcher`（带 mock 搜索工具，把笔记 `write_file` 到 `/workspace/notes.md`）与 `writer`（读取笔记产出 `report.md`）。
2. 主 agent 配 `todoListMiddleware()`（opt-in），systemPrompt 自写（含「先规划、中间产物落盘、完成后核对文件」）。
3. `backend` 用 `CompositeBackend`：`/workspace/` 走 `FilesystemBackend(virtualMode: true)`，其余默认 `StateBackend`；`permissions` 拒绝写 `.env`。
4. `interruptOn` 对 `write_file` 开审批；跑通「invoke 暂停 → resume approve → 检查 /workspace 下两个文件生成」。
5. 用 `stream`（`streamMode: "updates"`）观察 task 委派与文件工具调用序列。

**提示**：
- 子代理的 `systemPrompt` 必填且不继承主 prompt；`description` 决定主 agent 何时委派。
- 若恢复后文件写入重复执行，检查 resume 是否用了不同 `thread_id`（3.2 三前提）。

**预期效果**：
- 流式输出可见 `write_todos`（规划）→ `task`（委派 researcher）→ 子代理文件写入 → `task`（委派 writer）→ 主 agent 审批点；
- 两次人工审批通过后，`/workspace/notes.md` 与 `/workspace/report.md` 内容完整，`.env` 写入被拒绝。

---

## 10. 对比：DeepAgents vs LangChain Agent vs 裸 LangGraph

| 维度 | DeepAgents | createAgent（2.4） | 裸 LangGraph（3.1-3.4） |
|------|-----------|--------------------|------------------------|
| 抽象层级 | harness（循环+内置能力） | 预置循环+Middleware | 显式图编排 |
| 中间产物 | 虚拟文件系统落盘 | 全在消息/状态 | 自己设计 state |
| 子任务委派 | `task` 内置、隔离开箱即用 | 无 | 手写 Supervisor/Swarm（3.4） |
| 上下文管理 | 压缩+offload+Skills 渐进披露 | summarizationMiddleware | 全手工 |
| 控制流自由度 | 中（内置循环，middleware 定制） | 中低 | 最高（节点/边全自控） |
| 起步成本 | 低 | 最低 | 高 |
| 典型场景 | 深度调研、编码助手、报告生成 | 客服、问答、常规工具 Agent | 固定业务流、复杂多 Agent 拓扑 |

**一句话总结**：DeepAgents = 把「做一个能干长活的 Agent」所需的公共设施（文件、委派、压缩、沙箱）产品化；控制流要求越高越往 LangGraph 下沉，任务越常规越上浮到 createAgent——三层共用同一套 LangGraph 运行时，迁移不是重写而是升降舱。

---

## 总结

**核心要点**：
1. **定位**：harness 层；`createDeepAgent` 返回编译后的 LangGraph 图，3.1-3.5 能力全兼容
2. **虚拟文件系统是核心设计**：7+1 个文件工具 + 四种 backend（State/Filesystem/Store/Composite）；`virtualMode: true` 防路径逃逸；`permissions` 声明式读写控制（first-match-wins）
3. **委派与隔离**：`task` 工具 + 字典式子代理（systemPrompt 必填）；「只共享最终结果」天然省上下文
4. **上下文管理四层**：瘦身输入、自动摘要、大结果 offload、Skills 渐进披露
5. **执行与适配**：沙箱（shell，隔离环境）vs 解释器（QuickJS eval，PTC）；v0.7 精简 harness 六条 breaking changes（默认 prompt 移除、todo opt-in 等）；Harness Profiles 按模型裁剪 harness 面

**下一步**：
- 学习 [3.7 LangGraph 企业级实践](07-LangGraph企业级实践.md)：把本章配置的这些能力纳入容错、监控与成本体系
- 完成 [实战项目 03：数据分析助手](../../readme.md) 时，可评估用 DeepAgents 承载「报告 Agent」的文档产出

---

*参考资料*：
- [Deep Agents 概览（JS）](https://docs.langchain.com/oss/javascript/deepagents/overview)
- [Deep Agents：Subagents / Backends / Permissions](https://docs.langchain.com/oss/javascript/deepagents/subagents)
- [Deep Agents：Human-in-the-loop](https://docs.langchain.com/oss/javascript/deepagents/human-in-the-loop)
- [Deep Agents：Harness Profiles](https://docs.langchain.com/oss/javascript/deepagents/profiles)
- [Deep Agents v0.7 发布说明（breaking changes）](https://www.langchain.com/blog/deep-agents-v0-7)
- [deepagents（npm）](https://www.npmjs.com/package/deepagents)
