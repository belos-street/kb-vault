# LangGraph 教学 Demo（TypeScript）

六课，从「一条直线」做到「一个会循环、会记忆、会调工具的 ReAct Agent」。

**默认不需要 API Key，不联网，结果可复现**——`bun run 01` 就能看到输出。这套 demo 想教的是 **LangGraph 的图怎么组织**，不是怎么调模型；第 6 课另有一条可选的 `bun run 06:real`，读取 `.env` 用真模型跑同一张 Agent 图。

> 这是 [03-data-analysis](../../../projects/03-data-analysis/README.md) 的前置「看图课」，也是第 3 章 [3.1 核心概念](../01-LangGraph核心概念.md) / [3.2 高级模式](../02-LangGraph高级模式.md) 的配套 demo：03 用真实业务串联 Supervisor / MCP / interrupt；这里把业务剥掉，只留下 State / Node / Edge / 循环 / Checkpointer / ReAct 六个骨架。先在这里把图看明白，再去 03 里看它怎么撑起一个完整项目。

## 快速开始

```bash
bun install
bun run 01        # 第 1 课
bun run all       # 一口气跑完六课（默认假模型，确定性）
bun run 06:real   # 可选：读取 .env，用真模型跑第 6 课
```

要求：Bun ≥ 1.4（`@langchain/langgraph` v1.x 要求 Node ≥ 22，Bun 运行时直接支持）。

## 六课路线图

| 命令        | 主题     | 你会学到                                                    | 图的样子                              |
| ----------- | -------- | ----------------------------------------------------------- | ------------------------------------- |
| `bun run 01` | 最小的图 | `StateSchema` / Node / Edge / START / END / `invoke`        | `START → receive → triage → respond → END` |
| `bun run 02` | 条件边   | `addConditionalEdges` 按 state 走不同分支                   | 一个节点扇出三条路                    |
| `bun run 03` | 循环     | 边往回指 + `recursionLimit` + `GraphRecursionError`          | `writer ⇄ critic` 自改进循环          |
| `bun run 04` | 记忆     | `MemorySaver` + `thread_id` + `getState`                    | 图不变，但跨调用保留 state            |
| `bun run 05` | 流式     | `stream()` 的 `"updates"` / `"values"` 两种模式              | 观察执行过程                          |
| `bun run 06` | 综合     | 手写 ReAct Agent：消息 + 工具 + 循环                        | `agent ⇄ tools`                       |
| `bun run 06:real` | 可选真模型 | 同一张图，把假模型换成 `.env` 里的模型                  | 图不变                                |

每一课都是**独立可运行的单文件**，直接看 `src/01-hello-graph.ts` ~ `src/06-agent.ts`。建议按顺序看，并且**一边跑一边改**：把节点里的文字改掉、把边删掉、把返回值改错，看它怎么报错——报错信息本身就是最好的教程。

## 一个 LangGraph 程序的全部零件

```ts
import * as z from 'zod'
import {
  END,
  ReducedValue,
  START,
  StateGraph,
  StateSchema
} from '@langchain/langgraph'

// 1. State：字段 + 每个字段的「更新规则」
const State = new StateSchema({
  topic: z.string(), // 直接覆盖
  trace: new ReducedValue(
    // 追加合并
    z.array(z.string()).default(() => []),
    {
      inputSchema: z.string(),
      reducer: (current, next) => [...current, next]
    }
  )
})

// 2. Node：普通函数。读 state，返回「要改的字段」（只返回增量！）
async function remember(state: typeof State.State) {
  return { trace: 'remember' }
}

// 3. 拼图 + 4. 编译
const graph = new StateGraph(State)
  .addNode('remember', remember)
  .addEdge(START, 'remember')
  .addEdge('remember', END)
  .compile() // 不 compile 不能用

const result = await graph.invoke({ topic: 'LangGraph' })
```

就这四样东西。剩下的（条件边、循环、记忆、流式、中断、子图、并行）都是在这个骨架上长出来的。

> 本 demo 统一用 v1.x 的 `StateSchema`（Zod）。老教程里常见的 `Annotation.Root` 仍然兼容，读第三方代码时认得即可；新代码直接用 `StateSchema`，和本仓库 [3.1 教程](../01-LangGraph核心概念.md) 保持一致。

## 五个新手必踩的坑

1. **节点返回的是「增量」，不是完整 state。**
   返回 `{ trace: 'a' }` 而不是 `{ ...state, trace: [...] }`。LangGraph 会按字段的更新规则合并。

2. **节点名不能和 state 的字段名重名。**
   `addNode('reply', ...)` 而 state 里已有 `reply` 字段 → 直接报错
   `reply is already being used as a state attribute`。给节点换个名字即可。

3. **数组/对象字段忘了写 reducer。**
   在 `StateSchema` 里，普通 `z.array(...)` 是 last-value 语义（后写覆盖先写），你的 `messages` 历史会莫名其妙只剩最后一条；要追加就用 `ReducedValue`，并用 `inputSchema` 声明节点这次能写什么（单个元素还是整个数组）。

4. **忘了 `compile()`。**
   `new StateGraph(...)` 只是草稿（builder），`compile()` 之后才有 `invoke` / `stream`。

5. **写了循环却没有刹车。**
   每个环都要有出口，并用 `recursionLimit` 兜底；否则报 `GraphRecursionError`。生产代码里建议再在 state 里自己记 `round`，到上限就降级返回。

## 真模型模式（可选）

第 6 课内置两条路径，图的形状一个字都不用动：

- `bun run 06`：确定性的假模型（默认，`bun run all` 也用它）
- `bun run 06:real`：读取 `.env`，用真模型驱动同一张 `agent ⇄ tools` 图

`.env` 格式见项目根目录的 `.env.example`：

```bash
OPENAI_API_KEY=sk-...
OPENAI_BASE_URL=https://api.deepseek.com
DEFAULT_MODEL=deepseek-v4-flash
```

真模型路径只换了 `agent` 节点的函数体：

```ts
const model = new ChatOpenAI({ ... }).bindTools(TOOL_DEFS)

async function realAgentNode(state) {
  const res = await model.invoke(state.messages)
  return {
    messages: [res],
    pendingTool: res.tool_calls?.[0] ?? null,
    answer: res.tool_calls?.length ? undefined : textOf(res),
    steps: state.steps + 1
  }
}
```

DeepSeek 端点会自动关闭 thinking（多轮工具调用要求回传 `reasoning_content`，而 `@langchain/openai` 的转换层会丢弃它，容易 400）。换成其他 OpenAI 兼容端点只需改 `.env`，不用改图。

> `.env` 已在 `.gitignore` 中忽略；仓库只提交 `.env.example`。真正把模型接进自己的项目时，把 `agent` 节点换成上面这个函数体即可——`StateSchema`、条件边、`tools ⇄ agent` 循环都不用动。

## 生产环境还会用到的

- `PostgresSaver` / `SqliteSaver` 替代 `MemorySaver`：记忆落到数据库，重启不丢
- `interrupt()` + `Command({ resume })`：人工审批（Human-in-the-loop）
- 子图（subgraph）、`Send` 并行分发、`Command({ goto })` 动态跳转
- LangGraph Platform / LangSmith：部署与追踪

这些都不在本 demo 里展开，避免把「看图」变成「看业务」。对应的机制在 [3.2 高级模式](../02-LangGraph高级模式.md) 与 [03-data-analysis](../../../projects/03-data-analysis/README.md) 里落地。

## 课程与教程映射

| 课程       | 对应教程                                                                                                                        |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------- |
| 01 ~ 03    | [3.1 LangGraph 核心概念](../01-LangGraph核心概念.md)：State / reducer / 条件边 / 循环        |
| 04         | [3.2 高级模式 · 检查点与状态持久化](../02-LangGraph高级模式.md)                              |
| 05         | [3.2 高级模式 · 流式进阶](../02-LangGraph高级模式.md)                                        |
| 06         | [3.1 §5 条件路由](../01-LangGraph核心概念.md) + 本 demo 的 tools / ReAct 组装                     |
| 下一步     | [3.3 Agentic RAG](../03-AgenticRAG实现.md)、[3.4 多 Agent 编排](../04-多Agent编排.md) |

## 目录

```
src/
  ui.ts              终端输出小工具（与 LangGraph 无关）
  01-hello-graph.ts  最小直线图
  02-conditional.ts  条件边分流
  03-loop.ts         循环与递归上限
  04-memory.ts       checkpointer 与跨轮记忆
  05-stream.ts       流式观察与图可视化
  06-agent.ts        综合：ReAct Agent（假模型 / 真模型两条路径）
  real-model.ts      可选的 .env 真模型工厂（仅 06:real 使用）
```

## 验收命令

```bash
bun run all           # 六课全部跑通（默认假模型）
bun run 06:real       # 可选：读取 .env 用真模型跑第 6 课
bun run typecheck     # tsc --noEmit
bun run lint          # oxlint
bun run format:check  # oxfmt --check
```

## 技术栈

| 技术                                                          | 用途                       |
| ------------------------------------------------------------- | -------------------------- |
| [Bun](https://bun.sh)                                         | 运行时 + 包管理            |
| [TypeScript](https://www.typescriptlang.org)                  | strict 类型                |
| [@langchain/langgraph](https://www.npmjs.com/package/@langchain/langgraph) v1.6 | 显式图编排 |
| [@langchain/openai](https://www.npmjs.com/package/@langchain/openai) | 可选：真模型（`06:real`） |
| [Zod](https://zod.dev) v4                                     | StateSchema 字段定义       |
| [oxlint](https://oxc.rs) / [oxfmt](https://oxc.rs)            | Lint / Format              |

## 参考资料

- [LangGraph.js 概念总览](https://docs.langchain.com/oss/javascript/langgraph/overview)
- [Graph API：状态、节点与边](https://docs.langchain.com/oss/javascript/langgraph/use-graph-api)
- [Thinking in LangGraph（官方方法论）](https://docs.langchain.com/oss/javascript/langgraph/thinking-in-langgraph)
