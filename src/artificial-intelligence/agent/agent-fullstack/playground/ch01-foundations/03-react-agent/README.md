# 03 · 手写 ReAct 循环

对应文档：[1.2 Agent 架构设计范式](../../../doc/01-AI-Agent基础与认知升级/02-Agent架构设计范式.md)

## 场景

你已经知道 Agent = LLM + Tools + Loop。这一题把「Loop」拆开写一遍：

- 模型不真调，用 `@/shared/scripted-model` 的剧本模型，你要写的是**驱动它的循环**。
- 工具就是普通对象，你要写的是**注册、调用、失败兜底、消息回填**。

完成后你会得到一个能断言「第几步调了哪个工具」的迷你 Agent。

## 你要实现的 API

```ts
interface Tool {
  name: string
  description: string
  run(args: Record<string, unknown>): Promise<unknown>
}

type AgentStep =
  | {
      type: 'tool'
      name: string
      args: Record<string, unknown>
      observation?: string
      error?: string
    }
  | { type: 'final'; content: string }

class AgentStepLimitError extends Error {
  readonly maxSteps: number
}

function runAgent(
  task: string,
  model: ScriptedModel,
  tools: Tool[],
  options?: { maxSteps?: number }
): Promise<{ answer: string; steps: AgentStep[] }>
```

`ScriptedModel`、`ChatMessage` 的类型从 `@/shared/scripted-model` 导入。

## 行为规则

1. 初始消息是两条：`system`（一句 Agent 提示）+ `user`（`task`）。
2. 每轮先 `model.invoke(messages)`：
   - 返回 `final` → 记录一步 `final`，立即返回答案；
   - 返回 `tool_call` → 继续第 3 步。
3. 工具调用：
   - 先往消息里追加一条 `assistant`（`content` 为空，带 `toolCall`）；
   - 再按 `name` 在 `tools` 里查；
   - 执行完往消息里追加一条 `tool`（`toolName` + `content` 为 observation）。
4. 未知工具**不要抛错**：observation 写 `Unknown tool: <name>`，该步带上 `error`，继续循环。
5. 工具抛异常也**不要中断**：observation 写 `Error: <message>`，该步带上 `error`，继续循环。
6. observation 的格式：工具返回 `string` 就用原样；其他类型用 `JSON.stringify`。
7. 轮数达到 `maxSteps` 还没拿到 `final`，抛 `AgentStepLimitError`。
8. `maxSteps` 默认 `5`；小于 1 抛 `RangeError`。

## 验收标准

1. 「查北京天气」：剧本 `toolCall('get_weather')` → `final(...)`，返回答案，`steps` 两步。
2. 第二步模型能看到一条 `role: 'tool'`、`toolName: 'get_weather'` 的消息，内容是工具结果的序列化。
3. 工具返回字符串时，observation 不被加引号。
4. 未知工具：步骤 `error` 含 `Unknown tool`，循环继续，最终仍能拿到答案。
5. 工具抛错：步骤 `error` 含原始 message，循环继续。
6. `maxSteps = 2` 且剧本连续两次工具调用：抛 `AgentStepLimitError`，且模型只被调用两次。
7. `maxSteps = 0`：抛 `RangeError`。

## 约束

- 不许修改 `index.test.ts` 和 `shared/`。
- 不许把 `tools` 里的工具名硬编码进循环。
- 不许在未知工具/异常时直接 `return` 或 `break`。

## 提示

<details>
<summary>提示 1 · 方向</summary>

循环的每一轮做三件事：问模型 → 判断是「回答」还是「调工具」 → 把工具结果作为一条新消息塞回对话。消息列表就是 Agent 的工作记忆。

</details>

<details>
<summary>提示 2 · 关键 API</summary>

- `model.invoke(messages)` 返回 `ModelTurn`，用 `turn.type` 区分 `'tool_call'` / `'final'`。
- 用 `new Map(tools.map((tool) => [tool.name, tool]))` 做注册表。
- `await tool.run(args)`；用 `try/catch` 把异常转成 observation，而不是往外抛。

</details>

<details>
<summary>提示 3 · 结构伪代码</summary>

```text
maxSteps 校验
messages = [system, user]
steps = []
循环 i 从 0 到 maxSteps - 1:
  turn = await model.invoke(messages)
  如果 turn 是 final: steps.push(final); 返回
  否则:
    messages.push(assistant 带 toolCall)
    tool = registry.get(name)
    observation = 未知工具 ? 错误文本 : 执行工具（异常也转成错误文本）
    messages.push(tool 消息)
    steps.push(tool 步骤，带上 observation / error)
循环结束仍未返回: throw AgentStepLimitError
```

</details>

## 进阶（通过后做）

- 把 `maxSteps` 换成「连续两次相同工具调用就中止」，防止死循环。
- 给 `Tool` 加 Zod 参数校验，参数不合法时 observation 写校验错误。
- 同一个任务换一套工具（时间 + 汇率），重写一遍循环。

## 运行

```bash
bun test ch01-foundations/03-react-agent
```
