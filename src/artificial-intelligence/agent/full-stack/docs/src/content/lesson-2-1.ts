import type { Block } from '../data/types.ts'

export const lesson21: Block[] = [
  {
    kind: 'p',
    text: '这一篇只加一个变量：**框架**。1.4 已经用 OpenAI SDK + 手写 core 把 ReAct 循环写通了；这一篇不改业务、不改工具，只把循环、消息回填、工具执行和状态交给 `createAgent`。'
  },
  {
    kind: 'note',
    tone: 'decision',
    title: '先跑通，再拆架构',
    text: '这一篇的目标不是背 `createAgent` 的配置项，而是先用最小配置把 1.4 的客服 Agent v0 跑起来，再回头看框架替你收走了哪几件事。没有跑通之前，不要开始比较抽象。'
  },
  {
    kind: 'note',
    tone: 'definition',
    title: 'Model + Harness',
    text: 'Model 是推理引擎，负责决定下一步做什么；Harness 是模型外面的工程壳：循环、工具、Prompt、状态、中间件。`createAgent` 就是 LangChain 提供的默认 Harness。'
  },
  {
    kind: 'diagram',
    title: 'Model + Harness：谁负责决策，谁负责工程',
    caption:
      'Harness 是模型外面的工程壳：循环、工具、State、中间件都在壳里；Model 只负责决定下一步。',
    width: 920,
    height: 420,
    groups: [
      { label: '你的代码', x: 20, y: 16, w: 880, h: 78 },
      {
        label: 'Harness',
        x: 20,
        y: 122,
        w: 880,
        h: 164,
        tone: 'accent'
      },
      { label: 'Model', x: 20, y: 316, w: 880, h: 84, tone: 'blue' }
    ],
    nodes: [
      {
        id: 'invoke',
        label: 'agent.invoke(...)',
        x: 70,
        y: 38,
        w: 220,
        h: 42,
        mono: true,
        tone: 'amber'
      },
      {
        id: 'loop',
        label: '工具循环',
        sub: '退出条件 / 消息回填',
        x: 70,
        y: 176,
        w: 170,
        h: 56,
        tone: 'accent'
      },
      {
        id: 'tools',
        label: '工具执行',
        sub: 'ToolNode + Zod',
        x: 280,
        y: 176,
        w: 160,
        h: 56
      },
      {
        id: 'state',
        label: 'State / 消息',
        sub: '每步更新',
        x: 480,
        y: 176,
        w: 170,
        h: 56
      },
      {
        id: 'middleware',
        label: '中间件钩子',
        sub: '重试 / 审批 / 脱敏',
        x: 690,
        y: 176,
        w: 170,
        h: 56
      },
      {
        id: 'model',
        label: 'ChatModel',
        sub: '决定下一步',
        x: 40,
        y: 348,
        w: 220,
        h: 42,
        tone: 'blue'
      }
    ],
    edges: [
      { from: 'invoke', to: 'loop', label: 'invoke' },
      { from: 'loop', to: 'tools' },
      { from: 'loop', to: 'model' },
      {
        from: 'model',
        to: 'loop',
        label: 'tool_calls 回填',
        dashed: true,
        bend: 80
      }
    ]
  },
  { kind: 'h2', text: '先跑通：最小 createAgent' },
  {
    kind: 'code',
    title: 'src/agent.ts',
    lang: 'ts',
    code: String.raw`import { createAgent, tool } from 'langchain'
import { z } from 'zod'

const getOrderTool = tool(
  async ({ orderId }) => ({
    orderId,
    status: '已发货',
    eta: '明天 18:00 前'
  }),
  {
    name: 'getOrder',
    description: '查询订单状态。仅当用户明确询问订单时调用。',
    schema: z.object({
      orderId: z.string().regex(/^ORD-\d{4}$/).describe('订单号，例如 ORD-1024')
    })
  }
)

const agent = createAgent({
  model: 'openai:gpt-4o-mini',
  tools: [getOrderTool],
  systemPrompt:
    '你是客服助手。只回答订单与售后相关问题；需要订单状态时调用 getOrder 工具。'
})

const result = await agent.invoke({
  messages: [{ role: 'user', content: '订单 ORD-1024 到哪了？' }]
})

console.log(result.messages.at(-1)?.content)`,
    caption:
      '工具定义、循环、消息回填、工具执行都在 createAgent 内部；你只写工具语义、system prompt 和调用入口。'
  },
  {
    kind: 'checklist',
    title: '运行前检查',
    items: [
      '`bun add langchain @langchain/openai zod` 已安装',
      '`OPENAI_API_KEY` 已设置；模型名按当期清单替换',
      '在 `02-customer-agent` 下执行 `bun run agent "订单 ORD-1024 到哪了？"`，能打印回答，且回答包含 `getOrder` 返回的物流信息',
      '把用户问题里的订单号改成 `1024`，观察 Agent 不返回具体物流信息，而是要求修正订单号格式'
    ]
  },
  {
    kind: 'note',
    tone: 'info',
    title: '模型字符串需要 provider 包',
    text: '`model: "openai:gpt-4o-mini"` 依赖 `@langchain/openai`；换成 Anthropic / Google 时安装对应集成包。也可以直接传 `new ChatOpenAI(...)` 实例，配置更直观。'
  },
  { kind: 'h2', text: 'createAgent 替你做了什么' },
  {
    kind: 'p',
    text: '把 1.4 的代码和上面这段并排看，框架主要收走了六件事。注意「收走」不等于「消失」：它们只是从业务文件搬到了框架内部。'
  },
  {
    kind: 'table',
    head: ['职责', '1.4 手写', '2.1 createAgent'],
    rows: [
      ['工具循环', 'for + maxSteps + tool_calls 判断', 'agent.invoke 内部循环'],
      [
        '消息回填',
        '手动 push assistant / tool 消息',
        '框架维护 State.messages'
      ],
      ['工具 Schema', '请求里手写 JSON parameters', 'tool() 由 Zod 生成'],
      ['参数校验', 'runTool 里 parse + safeParse', '执行前自动过 Zod'],
      ['工具执行', '查表、执行、序列化结果', 'ToolNode 查找与执行'],
      ['多轮状态', '自己维护 messages 数组', '需配置 checkpointer + thread_id']
    ]
  },
  { kind: 'demo', id: 'framework-rewrite' },
  {
    kind: 'note',
    tone: 'tip',
    title: '框架接管循环，不接管业务判断',
    text: '工具什么时候该调用、参数有什么业务含义、失败后是重试还是转人工，仍然由你决定。框架只保证循环跑得稳、消息接得上、Schema 不漂移。'
  },
  { kind: 'h2', text: '项目 02 的目录：按职责平铺' },
  {
    kind: 'p',
    text: '02 是新项目，不要照搬 01 的 `adapters / core / entries` 三层。这个规模下，按职责平铺更好读：模型配置、Agent、意图契约、入口各一个文件，不单独维护 demo 目录。'
  },
  {
    kind: 'code',
    title: '02-customer-agent/src',
    lang: 'text',
    code: String.raw`src/
├── model.ts          # ChatOpenAI 配置（唯一 provider 出口）
├── contracts.ts      # TicketIntent + CustomerContext
├── tools.ts          # getOrder / search_faq / refund
├── agent.ts          # createAgent + responseFormat + MemorySaver + middleware
├── server.ts         # Hono：单入口 /api/chat
├── cli-chat.ts       # CLI：只打印回复
└── cli-agent.ts      # CLI：回复 + 结构化输出`,
    caption:
      '按职责分文件，而不是按抽象层分目录；这是 2.5 收口时的结构，2.1 只需要 model / agent / 入口，contracts 与 tools 在 2.3 加入。'
  },
  {
    kind: 'note',
    tone: 'info',
    title: '02 用真实模型验收',
    text: '`02-customer-agent` 不再维护假模型 demo；配置 `.env` 后直接跑 `bun run agent` / `bun run chat`，用真实模型的回答内容验收。'
  },
  {
    kind: 'note',
    tone: 'tip',
    title: '什么时候才需要再分层',
    text: '当同一职责被多个入口复用、或单文件超过两三百行时，再抽 `core/`、`adapters/`。目录结构服务于阅读路径，不是为了凑架构。'
  },
  { kind: 'h2', text: '包生态地图：哪个包管什么' },
  {
    kind: 'table',
    head: ['包', '负责什么', '典型导入'],
    rows: [
      [
        'langchain',
        '高层 Agent、工具、中间件、模型初始化',
        'createAgent、tool、initChatModel'
      ],
      [
        '@langchain/core',
        '消息、Prompt、Runnable、基础工具类型',
        'HumanMessage、ChatPromptTemplate、trimMessages'
      ],
      [
        '@langchain/langgraph',
        '图运行时、Checkpointer、Store',
        'MemorySaver、InMemoryStore、Command'
      ],
      ['@langchain/openai 等', 'Provider 适配', 'ChatOpenAI、ChatAnthropic'],
      ['langsmith', 'Trace、评估 SDK', 'traceable、Client（2.6 展开）']
    ]
  },
  {
    kind: 'p',
    text: '依赖关系不用背：`langchain` 直接依赖 `@langchain/langgraph`、`zod` 与 `langsmith`，`@langchain/core` 是 peer dependency，由 provider 包或显式安装带入。真正要记住的是「消息与 Runnable 在 core，状态与图在 langgraph，Agent 装配在 langchain」。'
  },
  { kind: 'h2', text: 'Runnable 协议：invoke / stream / batch 够用' },
  {
    kind: 'p',
    text: '`createAgent` 返回的 Agent 仍然是一个 Runnable。你不需要学完整套 LCEL，先掌握三个调用方式和一种事件流。'
  },
  {
    kind: 'table',
    head: ['方法', '返回什么', '什么时候用'],
    rows: [
      ['invoke(input, config)', '一次完整结果', '普通请求 / 后台任务'],
      ['stream(input, config)', '按节点或消息的流', '需要过程可见'],
      ['batch(inputs, config)', '批量结果数组', '离线批处理'],
      [
        'streamEvents(input, { version: "v2" })',
        '细粒度事件流',
        '调试 / 前端事件（2.2）'
      ]
    ]
  },
  {
    kind: 'code',
    title: '用 stream(updates) 看循环节点',
    lang: 'ts',
    code: String.raw`const stream = await agent.stream(
  { messages: [{ role: 'user', content: '订单 ORD-1024 到哪了？' }] },
  { streamMode: 'updates' }
)

for await (const update of stream) {
  console.log(update)
}`,
    caption:
      'updates 按节点返回状态增量；需要逐 token 时用 messages，需要细粒度事件时用 streamEvents。'
  },
  {
    kind: 'code',
    title: 'LCEL 只是 Runnable 的 pipe 组合',
    lang: 'ts',
    code: String.raw`import { RunnableLambda } from '@langchain/core/runnables'

const trim = RunnableLambda.from((text: string) => text.trim())
const chain = prompt.pipe(model).pipe(trim)`,
    caption:
      '片段：prompt / model 来自上文示例。本篇不需要自己写 LCEL 链；看到 pipe 时知道它在组合 Runnable 即可。'
  },
  { kind: 'h2', text: '和 1.4 的 diff：你还需要自己写什么' },
  {
    kind: 'list',
    items: [
      '**工具语义**：description 写清什么时候用、什么时候不要用；Schema 是硬约束。',
      '**Prompt**：system prompt 仍然要版本化、要评估，不能因为用了框架就省掉 1.3。',
      '**权限**：工具内部的 `runtime.context` 校验仍然要保留，框架不替你做业务鉴权。',
      '**失败策略**：模型重试、工具重试、fail closed、转人工，仍然要在 2.5 里配置。',
      '**状态**：多轮对话要配 checkpointer 与 thread_id，见 2.4。',
      '**评估**：Trace 与评估集是框架之外的工程，见 2.6 与 10.4。'
    ]
  },
  {
    kind: 'note',
    tone: 'warn',
    title: '不要用框架掩盖协议',
    text: '1.4 的 `tool_calls`、`tool_call_id`、`finish_reason` 仍然值得知道。框架出问题时，Trace 里看到的还是这些字段；不懂协议就只能猜。'
  },
  { kind: 'h2', text: '验收清单' },
  {
    kind: 'p',
    text: '最小可运行工程是 `02-customer-agent`。配置 `.env` 后运行 `bun run agent "订单 ORD-1024 到哪了？"`，会看到基于 `getOrder` 结果的最终回答；不再维护单独的假模型 demo。'
  },
  {
    kind: 'checklist',
    title: '本篇跑通的标准',
    items: [
      '`bun run agent "订单 ORD-1024 到哪了？"` 能打印包含物流信息的回答',
      '能说出 createAgent 接管的六项职责：循环、消息、Schema、校验、执行、状态',
      '能把 1.4 的手写循环换成 `createAgent`，并保持 `getOrder` 与入口行为不变',
      '能说出 invoke / stream / batch 的差别'
    ]
  },
  { kind: 'h2', text: '本讲产出' },
  {
    kind: 'p',
    text: '带走一个可直接用真实模型跑的 createAgent 版客服 Agent v0、一套按职责平铺的 02 项目结构、一张 1.4/2.1 职责对照表。下一篇 2.2 把模型初始化、消息类型与流式事件拆开讲。'
  },
  {
    kind: 'exercise',
    title: '2.1 练习：用框架重写，不改业务',
    items: [
      {
        id: 's2-1-e1',
        level: '基础',
        question:
          '把 1.4 的 `run()` 改写成 `createAgent`，保持 getOrder 工具的行为不变，跑一次并打印最后一条 AI 消息。',
        hint: '工具用 `tool()` + Zod；模型先用字符串，跑通后再换成实例。',
        answer: 'createAgent 自动执行工具并把结果回填给模型，你只需要 invoke。',
        solution:
          '对比改造前后的差异：删掉了循环、runTool、消息回填；保留工具实现、description 与 system prompt。'
      },
      {
        id: 's2-1-e2',
        level: '改造',
        question:
          '把模型从字符串换成 `new ChatOpenAI({ model, temperature: 0.2 })`，再跑一次。',
        hint: '`ChatOpenAI` 从 `@langchain/openai` 导入；temperature 放构造参数。',
        answer: '行为不变，但模型配置更直观，方便按环境切 provider。',
        solution:
          '字符串适合快速跑通；实例适合需要自定义 baseURL、headers、temperature 的场景。'
      },
      {
        id: 's2-1-e3',
        level: '排障',
        question:
          '换成一个新 provider 后，`createAgent` 报「model not found」，先查什么？',
        hint: '先查 provider 包是否安装，再查模型字符串前缀与模型名。',
        answer: 'provider 包缺失或模型名前缀不对。',
        solution:
          '`openai:` 需要 `@langchain/openai`，`anthropic:` 需要 `@langchain/anthropic`；模型名以当期清单为准。'
      },
      {
        id: 's2-1-e4',
        level: '设计',
        question:
          '给一个客服 Agent 设计「什么时候用 createAgent，什么时候手写循环」的判断清单。',
        hint: '从控制流复杂度、可观测性、状态、团队维护成本四个维度写。',
        answer:
          '单 Agent + 标准工具循环优先 createAgent；需要显式分支、断点、人工审批或自定义调度时再上 LangGraph / 手写。',
        solution:
          '如果路径能枚举、需要精确控制每一步，图或手写更合适；如果只是模型决定调哪个工具，createAgent 更省。'
      }
    ]
  },
  { kind: 'h2', text: '面试问答' },
  {
    kind: 'table',
    head: ['问题', '一句话答案'],
    rows: [
      [
        'createAgent 解决了什么问题？',
        '把工具循环、消息回填、工具执行与状态管理收进框架，业务只写工具语义与 Prompt。'
      ],
      [
        'LangChain 的抽象基类是什么？',
        'Runnable：统一 invoke / stream / batch；Agent、模型、工具、Prompt 都是 Runnable 或可组合对象。'
      ],
      [
        'Runnable 解决什么问题？',
        '让不同组件用同一套调用协议组合，同步 / 流式 / 批量不需要改业务代码。'
      ]
    ]
  },
  {
    kind: 'note',
    tone: 'interview',
    title: '追问：用了 createAgent 还需要懂 ReAct 吗？',
    text: '需要。框架只是把循环藏起来，Trace 里仍然是 assistant(tool_calls) → tool → assistant。不懂协议，遇到漏回填、并行调用、死循环时只能猜。'
  },
  {
    kind: 'links',
    title: '官方参考',
    items: [
      {
        label: 'LangChain createAgent 参考',
        href: 'https://reference.langchain.com/javascript/langchain/index/createAgent',
        note: 'createAgent 配置与返回类型'
      },
      {
        label: 'LangChain Agents',
        href: 'https://docs.langchain.com/oss/javascript/langchain/agents',
        note: 'Agent 总览与最小示例'
      },
      {
        label: 'LangChain Models',
        href: 'https://docs.langchain.com/oss/javascript/langchain/models',
        note: '模型初始化与 provider 集成'
      },
      {
        label: 'LangChain Runnable API',
        href: 'https://reference.langchain.com/javascript/langchain_core/runnables/',
        note: 'invoke / stream / batch 协议'
      }
    ]
  }
]
