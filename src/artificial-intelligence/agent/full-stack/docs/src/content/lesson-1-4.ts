import type { Block } from '../data/types.ts'

export const lesson14: Block[] = [
  {
    kind: 'p',
    text: '这一篇只加一个变量：**工具循环**。不引入 LangChain，用原生 `fetch` 把 ReAct 写出来，再故意撞三个坑：并行调用、参数校验、无限循环。这三个坑就是后面 2.3、2.5、4.3 的召回点。'
  },
  {
    kind: 'note',
    tone: 'definition',
    title: 'Agent 与 Chain 的区别',
    text: 'Chain 的步骤在代码里写死：先 A 再 B 再 C。Agent 的步骤由模型在运行时决定：要不要调工具、调哪个、调几次。判断标准只有一个——控制流是否由模型产生。'
  },
  { kind: 'h2', text: '先跑通：手写 ReAct 工具循环' },
  {
    kind: 'code',
    title: 'react-agent.ts',
    lang: 'ts',
    code: String.raw`import { z } from 'zod'

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

function toolMessage(id: string, error: string, detail: string) {
  return {
    role: 'tool' as const,
    tool_call_id: id,
    content: JSON.stringify({ error, detail })
  }
}

async function runTool(call: any) {
  const tool = tools[call.function.name]
  if (!tool) {
    return {
      invalid: true,
      message: toolMessage(call.id, 'unknown_tool', call.function.name)
    }
  }

  const json = parseArgs(call.function.arguments)
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
      tool_call_id: call.id,
      content: JSON.stringify(await tool.run(args.data))
    }
  }
}

async function chat(messages: unknown[]) {
  const response = await fetch(
    (process.env.LLM_BASE_URL ?? 'https://api.openai.com/v1') +
      '/chat/completions',
    {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: 'Bearer ' + process.env.LLM_API_KEY
      },
      body: JSON.stringify({
        model: process.env.LLM_MODEL ?? 'gpt-4o-mini',
        messages,
        tools: [
          {
            type: 'function',
            function: {
              name: 'weather',
              description: '查询城市天气',
              parameters: {
                type: 'object',
                required: ['city'],
                properties: { city: { type: 'string' } }
              }
            }
          }
        ]
      })
    }
  )

  if (!response.ok) {
    const detail = await response.text().catch(() => '')
    throw new Error(
      'upstream_error: ' + response.status + ' ' + detail.slice(0, 200)
    )
  }

  return (await response.json()) as any
}

async function run(question: string, maxSteps = 6) {
  const messages: any[] = [{ role: 'user', content: question }]

  for (let step = 0; step < maxSteps; step += 1) {
    const data = await chat(messages)
    const message = data.choices[0].message
    messages.push(message)

    const calls = message.tool_calls ?? []
    if (calls.length === 0) return message.content

    for (const call of calls) {
      messages.push((await runTool(call)).message)
    }
  }

  throw new Error('max_steps_exceeded')
}

console.log(await run('杭州明天要带伞吗？'))`,
    caption:
      '核心是一个 for 循环加一个 runTool：模型返回 tool_calls 就校验、执行、回填，没有就结束。'
  },
  {
    kind: 'checklist',
    title: '运行前检查',
    items: [
      '`LLM_API_KEY` 已设置；模型支持 Function Calling',
      '`bun run react-agent.ts` 能打印答案，且日志里至少有一次 `tool_calls`',
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
    tone: 'warn',
    title: '最容易忽略的一点',
    text: 'assistant 的 `tool_calls` 消息必须原样回填到下一轮 messages，tool 消息也要带同一个 `tool_call_id`。漏掉任何一边，模型都会失去上下文，表现为「反复调同一个工具」。'
  },
  { kind: 'h2', text: '坑一：并行调用' },
  {
    kind: 'p',
    text: '模型可能在一轮里返回多个 `tool_calls`，它们之间没有依赖关系。串行执行会变慢，串行回填还可能把 id 对错。正确做法是并行执行、按 id 回填，不假设返回顺序。'
  },
  {
    kind: 'code',
    title: '并行执行与回填',
    lang: 'ts',
    code: String.raw`const calls = message.tool_calls ?? []

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
  const data = await chat(messages)
  const message = data.choices[0].message
  messages.push(message)

  const calls = message.tool_calls ?? []
  if (calls.length === 0) return message.content

  // 1) 重复调用检测：同名 + 同参数视为原地打转
  for (const call of calls) {
    const signature = call.function.name + ':' + call.function.arguments
    if (seen.has(signature)) throw new Error('repeated_tool_call')
    seen.add(signature)
  }

  // 2) 执行与回填：runTool 已区分 unknown_tool / invalid_arguments
  const results = await Promise.all(calls.map(runTool))
  messages.push(...results.map((item) => item.message))

  // 3) 连续两轮有调用不合法就退出
  invalidStreak = results.some((item) => item.invalid)
    ? invalidStreak + 1
    : 0
  if (invalidStreak >= 2) throw new Error('too_many_invalid_arguments')
}

throw new Error('max_steps_exceeded')`,
    caption:
      'maxSteps 是最后一道门；重复调用检测与连续失败计数能让它更早退出，省 token。'
  },
  {
    kind: 'note',
    tone: 'tip',
    title: '这三个坑分别在哪一篇收口',
    text: '并行调用与参数校验 → 2.3 工具契约；中间件级重试与 HITL → 2.5；图里的 recursionLimit 与退出条件 → 4.3；评估与回归 → 10.4。本篇只负责让它们「显式暴露」。'
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
      '日志里能看到一次完整的 `assistant(tool_calls) → tool → assistant` 链路',
      '一轮返回两个 `tool_calls` 时，两条 tool 消息的 `tool_call_id` 都能对上',
      '传入非法参数时，得到 `invalid_arguments` 并能触发一次模型修正',
      '把 `maxSteps` 设为 3，故意构造循环，能看到明确的退出错误而不是挂住'
    ]
  },
  { kind: 'h2', text: '本讲产出' },
  {
    kind: 'p',
    text: '带走 `react-agent.ts`、三个失败场景（并行 / 参数 / 循环）、一张 Function Calling 协议表。到这里项目 01 的四块拼图齐了：调用、服务、Prompt、工具循环。下一步进入阶段二，用框架重写它。'
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
