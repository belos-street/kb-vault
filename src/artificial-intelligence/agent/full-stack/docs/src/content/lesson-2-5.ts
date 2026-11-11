import type { Block } from '../data/types.ts'

export const lesson25: Block[] = [
  {
    kind: 'p',
    text: '这一篇只加一个变量：**中间件扩展点**。上一章的 Agent 已经能调用工具、能记状态；这一篇不写新业务，只把重试、脱敏、人工审批这些横切逻辑从业务函数里拆出来，挂到 Agent 循环的固定钩子上。'
  },
  {
    kind: 'note',
    tone: 'decision',
    title: '中间件不是插件市场，是循环上的固定钩子',
    text: '中间件只能在 Agent 循环已经定义好的位置执行：模型前、模型后、工具前、工具后、整个 invoke 前后。选中间件时先问「它包的是哪一段」，再问「它叫什么名字」。'
  },
  { kind: 'h2', text: '先看循环：中间件到底挂在哪' },
  {
    kind: 'p',
    text: '一次 `invoke` 不是一次模型调用，而是一个循环：模型返回 `tool_calls`，运行时执行工具，再把结果回填给模型。中间件就挂在这个循环的固定节点上。'
  },
  {
    kind: 'table',
    head: ['钩子', '触发时机', '典型用途', '内置中间件'],
    rows: [
      [
        'beforeAgent',
        '每次 invoke 开始，一次',
        '初始化、鉴权、注入 traceId',
        '自定义'
      ],
      [
        'beforeModel',
        '每次模型调用前',
        '裁剪历史、PII 脱敏、注入 system',
        'piiMiddleware、modelCallLimitMiddleware'
      ],
      [
        'wrapModelCall',
        '包住模型调用',
        '重试、fallback、改模型或 Prompt',
        'modelRetryMiddleware'
      ],
      [
        'afterModel',
        '模型返回后、工具执行前',
        '检查 tool_calls、审批拦截、调用上限',
        'humanInTheLoopMiddleware、toolCallLimitMiddleware'
      ],
      [
        'wrapToolCall',
        '包住每次工具调用',
        '权限、缓存、重试、审计',
        'toolRetryMiddleware'
      ],
      ['afterAgent', '每次 invoke 结束，一次', '统计、清理、写审计', '自定义']
    ]
  },
  {
    kind: 'code',
    title: '执行顺序：数组顺序 + 洋葱模型',
    lang: 'text',
    code: String.raw`beforeAgent
  beforeModel(1..n)
    wrapModelCall(1..n)
      model
    wrapModelCall(n..1)
  afterModel(n..1)
  wrapToolCall(1..n)
    tool
  wrapToolCall(n..1)
afterAgent`,
    caption:
      'before* 按数组顺序执行，after* 按数组逆序执行；wrap* 是洋葱，数组里第一个中间件在最外层。'
  },
  {
    kind: 'note',
    tone: 'warn',
    title: '顺序写反，语义就反了',
    text: 'PII 必须早于模型调用，否则原始数据已经发出去；HITL 必须早于工具执行，否则审批还没发生，工具已经跑了。中间件数组的顺序不是排版，是执行语义。'
  },
  { kind: 'h2', text: '自定义中间件：四个钩子够用' },
  {
    kind: 'p',
    text: '内置中间件覆盖通用场景；业务特有的审计、计时、灰度、租户隔离，用 `createMiddleware` 写。最常用的四个钩子是 `beforeModel`、`wrapModelCall`、`wrapToolCall`、`afterAgent`。'
  },
  {
    kind: 'code',
    title: 'middleware/audit.ts',
    lang: 'ts',
    code: String.raw`import { createMiddleware } from 'langchain'

export const auditMiddleware = createMiddleware({
  name: 'AuditMiddleware',
  beforeModel: (state) => {
    console.log('model input messages:', state.messages.length)
  },
  wrapModelCall: async (request, handler) => {
    const startedAt = Date.now()
    const response = await handler(request)
    console.log('model latency:', Date.now() - startedAt)
    return response
  },
  wrapToolCall: async (request, handler) => {
    console.log('tool:', request.toolCall.name, request.toolCall.args)
    return handler(request)
  },
  afterAgent: (state) => {
    console.log('agent done messages:', state.messages.length)
  }
})`,
    caption:
      'beforeModel / afterAgent 只观察或改 state；wrapModelCall / wrapToolCall 必须调用 handler，否则模型或工具不会执行。'
  },
  {
    kind: 'p',
    text: '`beforeModel` 与 `afterModel` 的返回值是「部分 state」，会合并回当前状态；不返回就是 pass-through。`wrapModelCall` 与 `wrapToolCall` 拿到的是 `request + handler`，可以做重试、缓存、改参数，但最终要把 `handler(request)` 的结果返回。'
  },
  { kind: 'demo', id: 'middleware-pipeline' },
  { kind: 'h2', text: '内置中间件：按位置选，不要按名字选' },
  {
    kind: 'p',
    text: '同一个能力可能有多个实现位置。先问它是在模型前后、工具前后，还是整个 invoke 前后，再决定用哪个中间件。'
  },
  {
    kind: 'table',
    head: ['中间件', '挂在哪', '解决什么', '关键配置'],
    rows: [
      [
        'modelRetryMiddleware',
        'wrapModelCall',
        '429、超时、网络错误重试',
        'maxRetries、retryOn、onFailure'
      ],
      [
        'toolRetryMiddleware',
        'wrapToolCall',
        '工具瞬时故障重试',
        'tools、maxRetries、onFailure'
      ],
      [
        'toolCallLimitMiddleware',
        'afterModel',
        '限制工具调用次数',
        'runLimit、threadLimit、exitBehavior'
      ],
      [
        'piiMiddleware',
        'beforeModel / afterModel',
        '输入输出脱敏',
        'piiType、strategy、applyToInput / Output'
      ],
      [
        'humanInTheLoopMiddleware',
        'afterModel（默认）',
        '写操作审批',
        'interruptOn、allowedDecisions'
      ],
      [
        'todoListMiddleware',
        'wrapModelCall + afterModel',
        '给 Agent 注入 write_todos 工具',
        'systemPrompt、toolDescription'
      ]
    ]
  },
  {
    kind: 'code',
    title: '重试 + PII：三个中间件各管一段',
    lang: 'ts',
    code: String.raw`import {
  createAgent,
  modelRetryMiddleware,
  piiMiddleware,
  toolRetryMiddleware
} from 'langchain'

const agent = createAgent({
  model: 'openai:gpt-4o-mini',
  tools: [weatherTool, refundTool],
  middleware: [
    modelRetryMiddleware({ maxRetries: 2, onFailure: 'error' }),
    toolRetryMiddleware({ maxRetries: 1, onFailure: 'continue' }),
    piiMiddleware('email', { strategy: 'redact', applyToInput: true }),
    piiMiddleware('credit_card', { strategy: 'mask', applyToInput: true })
  ]
})`,
    caption:
      'modelRetry 包住模型调用，toolRetry 包住工具调用，PII 在模型前脱敏。数组顺序就是外层到内层的顺序。'
  },
  {
    kind: 'note',
    tone: 'info',
    title: 'piiMiddleware 的默认值',
    text: '`applyToInput` 默认是 `true`，`applyToOutput` 默认是 `false`。只清洗输入时不用写；要同时清洗模型输出，显式打开 `applyToOutput: true`。'
  },
  {
    kind: 'code',
    title: 'todoListMiddleware：给多步任务一个待办',
    lang: 'ts',
    code: String.raw`import { createAgent, todoListMiddleware } from 'langchain'

const planner = createAgent({
  model: 'openai:gpt-4o-mini',
  tools: [weatherTool],
  middleware: [todoListMiddleware()]
})`,
    caption:
      '片段：weatherTool 来自 2.3 的工具定义。todoListMiddleware 会注入 write_todos 工具；复杂多步任务才开，简单任务不要多这一轮工具调用。'
  },
  {
    kind: 'note',
    tone: 'warn',
    title: '严格 TS 的一个已知坑',
    text: 'langchain 1.6.x 的 `piiMiddleware` / `humanInTheLoopMiddleware` 在 `exactOptionalPropertyTypes: true` 下会报 TS2769；示例工程因此关闭了该选项。业务项目要么暂时关闭该选项，要么等上游类型修复。'
  },
  { kind: 'h3', text: '把 1.4 的三个坑接过来' },
  {
    kind: 'table',
    head: ['1.4 的坑', '2.5 的收口', '还留在哪'],
    rows: [
      [
        '并行 tool_calls',
        'wrapToolCall 对每个调用分别执行，日志带 tool_call_id，不要假设串行',
        '2.3 契约'
      ],
      [
        '参数校验',
        'Zod 仍在 2.3 的 tool schema；toolRetry 只处理瞬时故障，不替代校验',
        '2.3'
      ],
      [
        '无限循环',
        'toolCallLimitMiddleware / modelCallLimitMiddleware 限制调用次数',
        '4.3 recursionLimit'
      ]
    ]
  },
  {
    kind: 'p',
    text: '中间件不是绕过 2.3 契约的捷径：入参 Schema 仍是硬约束，权限仍在工具或 `wrapToolCall` 里校验；中间件只是把重试、审批、限流这些横切逻辑放到正确的位置。'
  },
  { kind: 'h2', text: 'HITL：审批不是业务 if，是循环中断' },
  {
    kind: 'p',
    text: '退款、转账、删库这类写操作，不该只在工具里写一句 `if (role !== "admin")`。更完整的做法是把「要不要执行」交给人在回路，把「这个人能不能执行」仍留在工具内部。'
  },
  {
    kind: 'code',
    title: 'HITL 配置：在工具执行前停下来',
    lang: 'ts',
    code: String.raw`import { createAgent, humanInTheLoopMiddleware } from 'langchain'
import { MemorySaver } from '@langchain/langgraph'

const agent = createAgent({
  model: 'openai:gpt-4o-mini',
  tools: [refundTool],
  middleware: [
    humanInTheLoopMiddleware({
      interruptOn: {
        refund: {
          allowedDecisions: ['approve', 'edit', 'reject'],
          description: '退款需要人工审批'
        }
      }
    })
  ],
  checkpointer: new MemorySaver()
})`,
    caption:
      'interruptOn 按工具名配置；默认 batched 模式在 afterModel 阶段汇总中断，per_call 模式在 wrapToolCall 逐个中断。'
  },
  {
    kind: 'note',
    tone: 'warn',
    title: 'checkpointer 不是可选项',
    text: '中断后要能恢复，必须有状态快照。`humanInTheLoopMiddleware` 依赖 checkpointer；没有它，第一次 invoke 就会报错。完整的中断/恢复机制在 4.4，本篇只到「配置与触发」。'
  },
  {
    kind: 'code',
    title: '审批后恢复：一行 Command',
    lang: 'ts',
    code: String.raw`import { Command } from '@langchain/langgraph'

// 第一次 invoke 会返回 __interrupt__；审批后用同一个 thread_id 恢复
const result = await agent.invoke(
  new Command({ resume: { decisions: [{ type: 'approve' }] } }),
  { configurable: { thread_id: 't_1024' } }
)`,
    caption:
      'approve / edit / reject 是三种决策；拒绝时要把原因回填给模型。恢复细节见 4.4。'
  },
  {
    kind: 'note',
    tone: 'tip',
    title: 'HITL 不替代权限',
    text: 'HITL 解决「这次要不要执行」，权限解决「这个人能不能执行」。工具内部的 `runtime.context` 校验仍然要保留；审计字段与脱敏策略在 11.1 展开。'
  },
  { kind: 'h2', text: '顺序与冲突：四条排错规则' },
  {
    kind: 'table',
    head: ['现象', '先查什么', '正确位置'],
    rows: [
      ['模型收到了原始邮箱', 'PII 中间件是否在模型调用前', 'beforeModel'],
      [
        '工具已经执行，才弹出审批',
        'HITL 是否挂在工具执行前',
        'afterModel（默认 batched）'
      ],
      [
        '重试把整个 Agent 重跑了一遍',
        '重试中间件是否包错了层',
        '模型重试用 wrapModelCall，工具重试用 wrapToolCall'
      ],
      [
        '同一错误被重试多次仍不成功',
        'retryOn 是否匹配、maxRetries 是否过大',
        '先缩小白名单，再谈次数'
      ]
    ]
  },
  {
    kind: 'p',
    text: '排障时不要先怀疑模型。先画一遍中间件数组，标出每个中间件挂在哪个钩子，再看执行轨迹里事件出现的先后；大多数「中间件没生效」都是挂错层或顺序反了。'
  },
  {
    kind: 'h2',
    text: '项目 02 v1 收口：把 2.1 / 2.3 / 2.4 / 2.5 装进一个服务'
  },
  {
    kind: 'p',
    text: '前四篇各自只加一个变量；项目 02 v1 把它们装成一个客服服务：2.1 的 createAgent、2.3 的工具契约、2.4 的多轮状态、2.5 的 HITL。示例在 `docs/examples/project-02-v1`。'
  },
  {
    kind: 'code',
    title: 'agent.ts：一套配置装齐四个变量',
    lang: 'ts',
    code: String.raw`const agent = createAgent({
  model,
  tools: [faqTool, refundTool],
  systemPrompt: '你是客服助手。先查 FAQ，再决定是否调用退款；退款必须人工审批。',
  contextSchema: CustomerContext,
  middleware: [
    humanInTheLoopMiddleware({
      interruptOn: {
        refund: {
          allowedDecisions: ['approve', 'edit', 'reject'],
          description: '退款需要人工审批'
        }
      }
    })
  ],
  checkpointer: new MemorySaver()
})`,
    caption:
      '片段，完整实现见 `examples/project-02-v1`：工具契约来自 2.3，contextSchema 决定权限，checkpointer 提供多轮记忆，HITL 拦住退款。'
  },
  {
    kind: 'code',
    title: 'server.ts：Hono 路由 + threadId + 审批恢复',
    lang: 'ts',
    code: String.raw`app.post('/api/chat', async (c) => {
  const input = ChatInput.parse(await c.req.json())
  const config = {
    configurable: { thread_id: input.threadId },
    context: { userId: 'u_1024', role: 'admin', tenantId: 't_acme' }
  }

  const result = input.decision
    ? await agent.invoke(
        new Command({
          resume: { decisions: [{ type: input.decision }] }
        }),
        config
      )
    : await agent.invoke(
        { messages: [{ role: 'user', content: input.message }] },
        config
      )

  if (result.__interrupt__) {
    return c.json({ status: 'pending_approval' }, 202)
  }

  return c.json({ reply: result.messages.at(-1)?.content })
})`,
    caption:
      '片段，完整实现见 `examples/project-02-v1/src/server.ts`：含 apiKeyAuth、traceId、30s 超时、错误码映射与成本估算。'
  },
  {
    kind: 'checklist',
    title: '项目 02 v1 的 3 条断言',
    items: [
      '同一个 threadId 的第二轮能记住第一轮（2.4）',
      'FAQ 工具命中并返回可引用答案（2.3）',
      'refund 触发 HITL，approve 后继续执行（2.5）'
    ]
  },
  {
    kind: 'p',
    text: '在 `docs/examples/project-02-v1` 下运行 `bun install && bun run demo`，会看到 3 个 PASS；`bun run start` 用真实模型启动 Hono 服务，需要 `SERVICE_API_KEY` 与 `OPENAI_API_KEY`。示例还包含 API Key 鉴权、traceId、30s 超时、重试 / fallback、成本估算与 README，逐条对应 §4.1 的阶段验收。结构化意图（`responseFormat`）见 2.3；收口示例为了无 Key 验收，聚焦多轮 + FAQ + HITL。'
  },
  { kind: 'h2', text: '验收清单' },
  {
    kind: 'p',
    text: '最小可运行工程在 `docs/examples/2-5-middleware`。在 `docs/` 下运行 `cd examples/2-5-middleware && bun install && bun run demo`，会看到 3 个 PASS：中间件顺序、PII 脱敏、HITL 中断与恢复。它不需要真实 LLM。'
  },
  {
    kind: 'checklist',
    title: '本篇跑通的标准',
    items: [
      '`bun run demo` 输出 3 个 PASS 与 `all middleware checks passed`',
      '能画出 `beforeModel → wrapModelCall → afterModel → wrapToolCall` 的顺序',
      '能说出 HITL 为什么依赖 checkpointer',
      '能区分 `modelRetryMiddleware` 与 `toolRetryMiddleware` 的作用域'
    ]
  },
  { kind: 'h2', text: '本讲产出' },
  {
    kind: 'p',
    text: '带走 `auditMiddleware`、重试 / PII / HITL 三组配置、一张中间件位置表和可运行的 3 断言示例。到这里项目 02 v1 的 HITL 补齐；阶段二框架主线已收口，下一篇 2.6 接入 Trace。'
  },
  {
    kind: 'exercise',
    title: '2.5 练习：把中间件放对位置',
    items: [
      {
        id: 's2-5-e1',
        level: '基础',
        question:
          '给 `auditMiddleware` 增加 `tool_call_id` 与工具耗时日志，跑一次天气 Agent，确认工具调用前后各有一条记录。',
        hint: '`request.toolCall.id` 是工具调用 id；在 `handler` 前后各记一次时间。',
        answer: '工具调用前后各一条日志，带 `tool_call_id`、工具名与耗时。',
        solution:
          '注意 `handler` 只调用一次；不要在 `wrapToolCall` 里手动再执行一次工具，否则会重复副作用。'
      },
      {
        id: 's2-5-e2',
        level: '改造',
        question:
          '把 `piiMiddleware` 的 `applyToOutput` 打开，观察模型输出里的邮箱是否也被脱敏。',
        hint: '默认 `applyToInput: true`、`applyToOutput: false`；显式打开后者。',
        answer:
          '输出中的邮箱也应变成 `[REDACTED_EMAIL]`；否则检查策略是否只作用于输入。',
        solution:
          '输出脱敏会影响用户看到的文本，确认产品是否接受；日志与 UI 可能需要不同策略。'
      },
      {
        id: 's2-5-e3',
        level: '排障',
        question:
          '模型一直 429，已经配置 `modelRetryMiddleware()` 但没重试，先查什么？',
        hint: '先确认中间件真的在数组里，再看 `retryOn` 是否过滤掉了这个错误，最后看 `onFailure`。',
        answer:
          '中间件是否注册、`retryOn` 是否匹配、`maxRetries` / `onFailure` 是否符合预期。',
        solution:
          '打印 `error.name` 与 `status`；不同 SDK 的 429 错误类型不同，默认 `retryOn` 可能不匹配。'
      },
      {
        id: 's2-5-e4',
        level: '设计',
        question:
          '设计退款审批方案：哪些工具中断、允许哪些决策、拒绝后如何回到模型、审计哪些字段。',
        hint: '从工具风险分级、`allowedDecisions`、拒绝消息、审批人四个维度写。',
        answer:
          'refund / transfer 中断，允许 approve / edit / reject；拒绝时把原因回填给模型；审计记录 `tool_call_id`、审批人、决策、参数摘要。',
        solution:
          '高风险写操作默认中断，读操作放行；`edit` 要限制参数 Schema；审计与 11.1 的脱敏/权限对齐。'
      }
    ]
  },
  { kind: 'h2', text: '面试问答' },
  {
    kind: 'table',
    head: ['问题', '一句话答案'],
    rows: [
      [
        '中间件在 Agent 循环的哪个位置执行？',
        'beforeModel / wrapModelCall / afterModel 在模型前后，wrapToolCall 在工具前后；before* 顺序、after* 逆序，wrap* 是洋葱。'
      ],
      [
        'HITL 怎么实现？',
        'humanInTheLoopMiddleware 在 afterModel 拦截需要审批的 tool_calls，配合 checkpointer 保存快照；审批后用 Command.resume 继续，细节在 4.4。'
      ],
      [
        '重试、PII、HITL 应该放在哪一层？',
        '模型重试放 wrapModelCall，工具重试放 wrapToolCall，PII 放 beforeModel / afterModel，HITL 放 afterModel。'
      ]
    ]
  },
  {
    kind: 'note',
    tone: 'interview',
    title: '追问：中间件顺序写反会怎样？',
    text: 'PII 晚于模型调用，原始数据已经泄露；HITL 晚于工具执行，审批变成事后通知；重试放错层，会把整个 Agent 重跑一遍。顺序是语义，不是风格。'
  },
  {
    kind: 'links',
    title: '官方参考',
    items: [
      {
        label: 'LangChain Middleware 总览',
        href: 'https://docs.langchain.com/oss/javascript/langchain/middleware/overview',
        note: '钩子模型与执行流程'
      },
      {
        label: 'LangChain 自定义中间件',
        href: 'https://docs.langchain.com/oss/javascript/langchain/middleware/custom',
        note: 'createMiddleware 与四个常用钩子'
      },
      {
        label: 'LangChain 内置中间件',
        href: 'https://docs.langchain.com/oss/javascript/langchain/middleware/built-in',
        note: '重试、PII、HITL、todo 与调用上限'
      },
      {
        label: 'LangChain Model Retry',
        href: 'https://docs.langchain.com/oss/javascript/langchain/middleware/built-in#model-retry',
        note: 'maxRetries / retryOn / onFailure'
      }
    ]
  }
]
