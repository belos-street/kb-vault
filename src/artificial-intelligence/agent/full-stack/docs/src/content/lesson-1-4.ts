import type { Block } from '../data/types.ts'

export const lesson14: Block[] = [
  {
    kind: 'p',
    text: '这一篇只加一个变量：**工具循环**。不引入 LangChain，用 OpenAI SDK 的 `tools` 把 ReAct 写出来，再故意撞三个坑：并行调用、参数校验、无限循环。这三个坑就是后面 2.3、2.5、4.3 的召回点。'
  },
  {
    kind: 'note',
    tone: 'tip',
    title: 'SDK 只负责发请求，循环仍然手写',
    text: '1.2 的 `Llm` 已经封装了 SDK 的 timeout、retry 与流式输出；工具循环、消息回填、参数校验仍然由 core 负责。这样能看清 `toolCalls` 与 `tool` 消息的对应关系；2.1 再把这套循环交给 `createAgent`。'
  },
  {
    kind: 'note',
    tone: 'definition',
    title: 'Agent 与 Chain 的区别',
    text: 'Chain 的步骤在代码里写死：先 A 再 B 再 C。Agent 的步骤由模型在运行时决定：要不要调工具、调哪个、调几次。判断标准只有一个——控制流是否由模型产生。'
  },
  { kind: 'h2', text: '先跑通：手写 ReAct 工具循环' },
  {
    kind: 'diagram',
    title: 'ReAct 循环：模型决定，工具执行',
    caption:
      '循环只有一个出口：模型不再返回 tool_calls。工具只负责执行，决定「调不调、调几次」的始终是模型。',
    width: 920,
    height: 310,
    nodes: [
      {
        id: 'user',
        label: '用户问题',
        sub: 'messages',
        x: 20,
        y: 70,
        w: 130,
        h: 54
      },
      {
        id: 'llm',
        label: 'LLM 决策',
        sub: 'content / tool_calls',
        x: 210,
        y: 60,
        w: 190,
        h: 64,
        tone: 'accent'
      },
      {
        id: 'tool',
        label: '工具执行',
        sub: 'weather({ city })',
        x: 470,
        y: 60,
        w: 170,
        h: 64,
        tone: 'blue'
      },
      {
        id: 'observation',
        label: 'Observation',
        sub: '结果序列化',
        x: 710,
        y: 60,
        w: 170,
        h: 64,
        tone: 'violet'
      },
      {
        id: 'answer',
        label: '最终回答',
        sub: '无 tool_calls 时退出',
        x: 210,
        y: 230,
        w: 190,
        h: 54,
        tone: 'accent'
      }
    ],
    edges: [
      { from: 'user', to: 'llm', label: 'messages' },
      { from: 'llm', to: 'tool', label: 'tool_calls' },
      { from: 'tool', to: 'observation', label: 'result' },
      {
        from: 'observation',
        to: 'llm',
        label: 'tool 消息回填',
        dashed: true,
        bend: -120
      },
      { from: 'llm', to: 'answer', label: '无 tool_calls' }
    ]
  },
  {
    kind: 'code',
    title: 'llm.ts：扩展消息与返回值',
    lang: 'ts',
    code: String.raw`export type ToolSpec = {
  name: string
  description: string
  parameters: Record<string, unknown>
}

export type ToolCall = {
  id: string
  name: string
  arguments: string
}

export type LlmReply = {
  content: string | null
  toolCalls: ToolCall[]
}

// 1.2 只有纯文本；这里扩成判别联合，tool 消息才能回填给模型
export type ChatMessage =
  | { role: 'system' | 'user'; content: string }
  | { role: 'assistant'; content: string | null; toolCalls?: ToolCall[] }
  | { role: 'tool'; toolCallId: string; content: string }

export type Llm = {
  complete(messages: ChatMessage[]): Promise<string>
  stream(messages: ChatMessage[]): AsyncIterable<string>
  chat(messages: ChatMessage[], tools: ToolSpec[]): Promise<LlmReply>
}`,
    caption:
      '1.2 的 `ChatMessage` 只覆盖纯文本；这一篇扩成判别联合，让 assistant 能带 `toolCalls`、tool 消息能带 `toolCallId`。'
  },
  {
    kind: 'code',
    title: 'llm.ts：只在适配层做 snake_case 映射',
    lang: 'ts',
    code: String.raw`const toSdkToolCall = (call: ToolCall) => ({
  id: call.id,
  type: 'function' as const,
  function: { name: call.name, arguments: call.arguments }
})

const toSdkTool = (tool: ToolSpec) => ({
  type: 'function' as const,
  function: tool
})

function toSdkMessages(messages: ChatMessage[]): ChatCompletionMessageParam[] {
  return messages.map((message) => {
    if (message.role === 'tool') {
      return {
        role: 'tool',
        tool_call_id: message.toolCallId,
        content: message.content
      }
    }

    if (message.role === 'assistant') {
      return {
        role: 'assistant',
        content: message.content,
        ...(message.toolCalls?.length
          ? { tool_calls: message.toolCalls.map(toSdkToolCall) }
          : {})
      }
    }

    return { role: message.role, content: message.content }
  })
}

// createLlm 里新增 chat：发 tools，把 SDK 的 tool_calls 归一化成 toolCalls
async chat(messages, tools) {
  const response = await client.chat.completions.create({
    model,
    messages: toSdkMessages(messages),
    tools: tools.map(toSdkTool)
  })

  const reply = response.choices[0]?.message
  return {
    content: reply?.content ?? null,
    toolCalls: (reply?.tool_calls ?? [])
      .filter((call) => call.type === 'function')
      .map((call) => ({
        id: call.id,
        name: call.function.name,
        arguments: call.function.arguments
      }))
  }
}`,
    caption:
      'SDK 用 `tool_calls` / `tool_call_id`，core 用 `toolCalls` / `toolCallId`；翻译只发生在 llm.ts，agent.ts 永远看不到 wire format。'
  },
  {
    kind: 'code',
    title: 'agent.ts',
    lang: 'ts',
    code: String.raw`import { z } from 'zod'
import type { ChatMessage, Llm, ToolCall, ToolSpec } from './llm.ts'

const WeatherArgs = z.object({
  city: z.string().min(1)
})

type WeatherInput = z.infer<typeof WeatherArgs>

type Tool = {
  args: z.ZodType<WeatherInput>
  run: (args: WeatherInput) => Promise<unknown>
}

const tools: Record<string, Tool> = {
  weather: {
    args: WeatherArgs,
    run: async (args) => ({
      city: args.city,
      tomorrow: '中雨',
      tempC: 22
    })
  }
}

const toolSpecs: ToolSpec[] = [
  {
    name: 'weather',
    description: '查询城市天气',
    parameters: {
      type: 'object',
      required: ['city'],
      properties: { city: { type: 'string' } }
    }
  }
]

function parseArgs(raw: string):
  | { ok: true; value: unknown }
  | { ok: false; message: string } {
  try {
    return { ok: true, value: JSON.parse(raw) }
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : 'invalid JSON'
    }
  }
}

function toolMessage(
  id: string,
  error: string,
  detail: string
): ChatMessage {
  return {
    role: 'tool',
    toolCallId: id,
    content: JSON.stringify({ error, detail })
  }
}

async function runTool(call: ToolCall) {
  const tool = tools[call.name]
  if (!tool) {
    return {
      invalid: true,
      message: toolMessage(call.id, 'unknown_tool', call.name)
    }
  }

  const json = parseArgs(call.arguments)
  if (!json.ok) {
    return {
      invalid: true,
      message: toolMessage(call.id, 'invalid_arguments', json.message)
    }
  }

  const args = tool.args.safeParse(json.value)
  if (!args.success) {
    return {
      invalid: true,
      message: toolMessage(
        call.id,
        'invalid_arguments',
        args.error.issues
          .map((issue) => issue.path.join('.') + ' ' + issue.message)
          .join('; ')
      )
    }
  }

  return {
    invalid: false,
    message: {
      role: 'tool' as const,
      toolCallId: call.id,
      content: JSON.stringify(await tool.run(args.data))
    }
  }
}

export function createAgent(llm: Llm) {
  return {
    async run(question: string, maxSteps = 6): Promise<string> {
      const messages: ChatMessage[] = [
        { role: 'user', content: question }
      ]

      for (let step = 0; step < maxSteps; step += 1) {
        const reply = await llm.chat(messages, toolSpecs)

        messages.push({
          role: 'assistant',
          content: reply.content,
          toolCalls: reply.toolCalls
        })

        if (reply.toolCalls.length === 0) {
          return reply.content ?? ''
        }

        for (const call of reply.toolCalls) {
          messages.push((await runTool(call)).message)
        }
      }

      throw new Error('max_steps_exceeded: 工具循环次数超限')
    }
  }
}`,
    caption:
      '核心是一个 for 循环加 runTool：模型返回 toolCalls 就校验、执行、回填，没有就结束；SDK 只负责发请求。'
  },
  {
    kind: 'checklist',
    title: '运行前检查',
    items: [
      '`OPENAI_API_KEY` 已设置；模型支持 Function Calling',
      '用 fake `Llm` 跑 `createAgent`，至少出现一次 `toolCalls`',
      '把 `maxSteps` 改成 1，能看到 `max_steps_exceeded`'
    ]
  },
  { kind: 'demo', id: 'react-loop' },
  { kind: 'h2', text: 'Function Calling 协议：三个字段决定一切' },
  {
    kind: 'table',
    head: ['字段', '出现在哪', '作用'],
    rows: [
      ['tool_calls[]', 'assistant 消息', '模型决定调用哪些工具、参数是什么'],
      ['tool_calls[].id', 'assistant → tool', '把结果对回请求，并行时必须靠它'],
      [
        'role: "tool" + tool_call_id',
        'tool 消息',
        '告诉模型这是哪个调用的结果'
      ],
      ['finish_reason', 'choice', '`tool_calls` 表示还要继续，`stop` 表示结束']
    ]
  },
  {
    kind: 'note',
    tone: 'info',
    title: '表里是 wire format，代码里是 core format',
    text: '`tool_calls` / `tool_call_id` 是 SDK 与模型之间的字段；本项目在 `llm.ts` 里统一翻译成 `toolCalls` / `toolCallId`，`agent.ts` 只面对后者。两套名字不要混用。'
  },
  {
    kind: 'note',
    tone: 'warn',
    title: '最容易忽略的一点',
    text: 'assistant 的 `tool_calls` 消息必须原样回填到下一轮 messages，tool 消息也要带同一个 `tool_call_id`。漏掉任何一边，模型都会失去上下文，表现为「反复调同一个工具」。'
  },
  { kind: 'h2', text: '坑一：并行调用' },
  {
    kind: 'p',
    text: '模型可能在一轮里返回多个 `tool_calls`，它们之间没有依赖关系。串行执行会变慢；真正会把 id 对错的是漏回填，或按数组下标而不是 `call.id` 回填。正确做法是并行执行、按 id 回填，不假设返回顺序。'
  },
  {
    kind: 'code',
    title: '并行执行与回填',
    lang: 'ts',
    code: String.raw`const calls = reply.toolCalls

// runTool 只依赖单个 call，天然可以并行
const results = await Promise.all(calls.map(runTool))
messages.push(...results.map((item) => item.message))`,
    caption:
      '并行只对互不依赖的调用成立；tool 消息按 call.id 回填，执行顺序不影响对应关系。'
  },
  { kind: 'h2', text: '坑二：参数校验' },
  {
    kind: 'p',
    text: '模型生成的参数不可信：字段可能缺失、类型可能错、枚举可能越界。主循环的 `runTool` 已经统一做两层检查：JSON 能否解析、是否符合工具的 Zod Schema；任何一层失败都回填 `invalid_arguments`，让模型自己修正。'
  },
  {
    kind: 'code',
    title: '给工具加参数：只改 Schema',
    lang: 'ts',
    code: String.raw`const WeatherArgs = z.object({
  city: z.string().min(1),
  days: z.number().int().min(1).max(7).default(1)
})

// 校验已经在 runTool 里统一处理，循环本身不用改
// 失败时回填：{"error":"invalid_arguments","detail":"city Too small..."}`,
    caption:
      'Schema 是唯一的运行时真相：JSON 解析失败、字段缺失、类型不对，都走同一条回填路径。'
  },
  {
    kind: 'code',
    title: '同步更新 Function Calling 的 parameters',
    lang: 'json',
    code: String.raw`{
  "type": "object",
  "required": ["city"],
  "properties": {
    "city": { "type": "string" },
    "days": { "type": "integer", "minimum": 1, "maximum": 7 }
  }
}`,
    caption:
      'parameters 是给模型看的说明书，Zod Schema 是给运行时看的门禁；两者必须一致，但不要互相替代。'
  },
  { kind: 'h2', text: '坑三：无限循环' },
  {
    kind: 'table',
    head: ['失控形态', '表现', '兜底'],
    rows: [
      ['重复调同一工具', '同样的参数、同样的错误', 'maxSteps + 相同调用检测'],
      ['永远不结束', '一直返回 tool_calls', 'maxSteps 强制退出'],
      ['参数越修越错', '每轮都 invalid_arguments', '连续失败 2 次就退出'],
      ['调用链过深', 'A 调 B、B 调 A', '工具调用图禁止回边或限深']
    ]
  },
  {
    kind: 'code',
    title: '三个兜底一起上',
    lang: 'ts',
    code: String.raw`let invalidStreak = 0
const seen = new Set<string>()

for (let step = 0; step < maxSteps; step += 1) {
  const reply = await llm.chat(messages, toolSpecs)

  messages.push({
    role: 'assistant',
    content: reply.content,
    toolCalls: reply.toolCalls
  })

  const calls = reply.toolCalls
  if (calls.length === 0) return reply.content ?? ''

  // 1) 重复调用检测：同名 + 同参数视为原地打转
  for (const call of calls) {
    const signature = call.name + ':' + call.arguments
    if (seen.has(signature)) {
      throw new Error('repeated_tool_call: 重复调用同一个工具')
    }
    seen.add(signature)
  }

  // 2) 执行与回填：runTool 已区分 unknown_tool / invalid_arguments
  const results = await Promise.all(calls.map(runTool))
  messages.push(...results.map((item) => item.message))

  // 3) 连续两轮有调用不合法就退出
  invalidStreak = results.some((item) => item.invalid)
    ? invalidStreak + 1
    : 0
  if (invalidStreak >= 2) {
    throw new Error('too_many_invalid_arguments: 连续两轮工具参数不合法')
  }
}

throw new Error('max_steps_exceeded: 工具循环次数超限')`,
    caption:
      'maxSteps 是最后一道门；重复调用检测与连续失败计数能让它更早退出，省 token。'
  },
  {
    kind: 'note',
    tone: 'tip',
    title: '这三个坑分别在哪一篇收口',
    text: '并行调用与参数校验 → 2.3 工具契约；中间件级重试与 HITL → 2.5；图里的 recursionLimit 与退出条件 → 4.3；评估与回归 → 10.4。本篇只负责让它们「显式暴露」。'
  },
  {
    kind: 'p',
    text: '三个坑的失败断言在 `docs/examples/1-4-react-loop`。在 `docs/` 下运行 `cd examples/1-4-react-loop && bun install && bun run demo`，会看到 3 个 PASS：并行 id 对账、`invalid_arguments` 回填、`max_steps_exceeded`。它不需要真实 LLM。示例把循环抽成 `runAgent({ chat })`，注入假 `ChatFn`，并直接使用 wire 字段（`tool_calls` / `tool_call_id`）让协议可见；正文的 `agent.ts` 在 core 里使用归一化字段，映射发生在 `llm.ts`。'
  },
  { kind: 'h2', text: '接回 1.2：新增 agent 入口，保留三道防线' },
  {
    kind: 'p',
    text: '1.4 不替换 1.2 的流式入口，而是新增一个 CLI 命令和一条 HTTP 路由：`bun run agent` 走 `agent.run`，`POST /api/agent` 复用 `/api/*` 的鉴权、`BodySchema` 与 `errorBody`；`/api/chat` 继续保留 SSE。'
  },
  {
    kind: 'code',
    title: 'agent-cli.ts / server.ts：新增接线',
    lang: 'ts',
    code: String.raw`const llm = createLlm(process.env)
const chat = createChat(llm)
const agent = createAgent(llm)

// CLI：bun run agent "杭州明天要带伞吗？"
console.log(await agent.run(question))

// HTTP：新增一次性接口；/api/* 的鉴权中间件继续生效
app.post('/api/agent', async (c) => {
  const body = BodySchema.safeParse(await c.req.json().catch(() => null))

  if (!body.success) {
    return c.json(
      errorBody('invalid_body', body.error.issues[0]?.message ?? '请求体不合法'),
      400
    )
  }

  try {
    return c.json({ reply: await agent.run(body.data.message) })
  } catch (error) {
    console.error('agent_error', error)
    return c.json(errorBody('agent_error', '工具循环失败'), 422)
  }
})`,
    caption:
      '1.2 的 `/api/chat` 流式入口保持不变；新增 `/api/agent` 复用同一套鉴权、BodySchema 与错误信封，只替换 core 调用。'
  },
  {
    kind: 'note',
    tone: 'tip',
    title: '循环错误先让它抛出来',
    text: '`max_steps_exceeded`、`repeated_tool_call`、`too_many_invalid_arguments` 在 core 里直接抛 `Error`；统一映射成 422、加 traceId 是 1.2 的错误码约定与项目 02 接口层的事。'
  },
  { kind: 'h2', text: 'Memory 与 Planning：先给地图，不展开' },
  {
    kind: 'table',
    head: ['能力', '解决什么', '落在哪'],
    rows: [
      ['短期记忆', '多轮对话不丢上下文', '2.4 Thread ID + Checkpointer'],
      ['长期记忆', '跨会话记住偏好与事实', '9.3 / 9.4 存储选型'],
      ['任务规划', '把复杂目标拆成可执行步骤', '5.2 任务分解'],
      ['多 Agent', '不同角色分工与上下文隔离', '5.1 拓扑与选型']
    ]
  },
  {
    kind: 'p',
    text: '本篇不实现 Memory，也不做 Planning。原因很简单：在单轮工具循环里塞记忆与规划，会把「控制流」和「状态」两个变量混在一起，后面很难判断问题出在哪一层。'
  },
  { kind: 'h2', text: '验收清单' },
  {
    kind: 'checklist',
    title: '本篇跑通的标准',
    items: [
      '用 fake `Llm` 断言 messages 序列：`assistant(toolCalls) → tool → assistant`',
      '一轮返回两个 `toolCalls` 时，两条 tool 消息的 `toolCallId` 都能对上',
      '传入非法参数时，得到 `invalid_arguments` 并能触发一次模型修正',
      '把 `maxSteps` 设为 3，故意构造循环，能看到明确的退出错误而不是挂住',
      '`bun run agent` 与 `POST /api/agent` 都走 `createAgent`；`/api/chat` 仍保留 1.2 的流式入口',
      '`cd examples/1-4-react-loop && bun run demo` 输出 3 个 PASS（不需要 LLM）'
    ]
  },
  { kind: 'h2', text: '本讲产出' },
  {
    kind: 'p',
    text: '带走 `agent.ts`、三个失败场景的可运行断言（`docs/examples/1-4-react-loop`）、一条复用鉴权与校验的 `/api/agent` 路由，以及一张 Function Calling 协议表。到这里项目 01 的主链路齐了：调用、core、工具循环；Prompt 契约在 1.3 的示例工程里。下一步进入阶段二，用框架重写它。'
  },
  {
    kind: 'exercise',
    title: '1.4 练习：把循环写稳',
    items: [
      {
        id: 's1-4-e1',
        level: '基础',
        question:
          '给 `weather` 工具加 `days` 参数，并让模型在问「明天」时传 `days: 1`。',
        hint: 'parameters 里声明 `days`，description 写清「今天=0，明天=1」。',
        answer: '工具描述里写明天用 1，Schema 里限制 0~7。',
        solution:
          '注意 `required` 里是否包含 `days`：不包含时模型可能不传，代码里要给默认值。'
      },
      {
        id: 's1-4-e2',
        level: '改造',
        question:
          '把单轮工具调用改成并行执行，并保持 tool 消息顺序与 id 对应。',
        hint: '`Promise.all` 执行，回填时遍历结果数组，不要依赖返回顺序。',
        answer: '并行执行互不依赖的调用，按 `call.id` 回填。',
        solution:
          '先判断依赖：模型在同一轮返回的调用默认无依赖；有依赖时它会在下一轮再调。'
      },
      {
        id: 's1-4-e3',
        level: '排障',
        question:
          '日志显示模型连续 5 轮调用 `getOrder`，参数一模一样，最后超时。给出三条修复。',
        hint: '从「为什么会重复」和「怎么强制退出」两个方向想。',
        answer: '回填 tool 消息（可能漏了）、加重复调用检测、加 maxSteps。',
        solution:
          '最常见原因是 tool 消息没带 `tool_call_id` 或没回填，模型以为没执行；其次是没有重复检测；最后才是 maxSteps 兜底。'
      },
      {
        id: 's1-4-e4',
        level: '设计',
        question:
          '设计一个「工具调用审计」方案，能回答「这次回答用了哪些工具、参数是什么、谁授权的」。',
        hint: '三要素：tool_call_id、调用者身份、参数与结果摘要。',
        answer:
          '每次调用记录 requestId、tool、args、result 摘要、role / tenant。',
        solution:
          '落在结构化日志里，字段与 trace 对齐；敏感参数脱敏；审计查询按 requestId 聚合。'
      }
    ]
  },
  { kind: 'h2', text: '面试问答' },
  {
    kind: 'table',
    head: ['问题', '一句话答案'],
    rows: [
      [
        'Agent 与 Chain 的区别？',
        '控制流是否由模型在运行时决定：写死的是 Chain，模型决定的是 Agent。'
      ],
      [
        'ReAct 循环怎么工作？',
        '模型在内部推理（Thought 不一定外显），再输出 tool_calls；运行时执行工具并回填 tool 消息，直到没有工具调用或触发上限。'
      ],
      [
        'Function Calling 的协议是什么？',
        'assistant 返回 tool_calls，tool 消息带 tool_call_id 回填，finish_reason 标识是否继续。'
      ],
      [
        '怎么防 Agent 死循环？',
        'maxSteps + 重复调用检测 + 连续失败计数；框架层再加 recursionLimit。'
      ]
    ]
  },
  {
    kind: 'note',
    tone: 'interview',
    title: '追问：什么时候不该用 Agent？',
    text: '步骤固定、结果可预测、对延迟敏感时，用工作流更稳。Agent 的价值在「运行时才知道该走哪条路」，如果路径本来就能枚举，写死比让模型决定更便宜也更可靠。'
  },
  {
    kind: 'links',
    title: '官方参考',
    items: [
      {
        label: 'OpenAI Function Calling',
        href: 'https://platform.openai.com/docs/guides/function-calling',
        note: 'tool_calls 与 tool 消息格式'
      },
      {
        label: 'ReAct 论文',
        href: 'https://arxiv.org/abs/2210.03629',
        note: 'Reasoning + Acting 原始思路'
      },
      {
        label: 'Zod',
        href: 'https://zod.dev/',
        note: '工具参数运行时校验'
      }
    ]
  }
]
