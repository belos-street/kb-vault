import type { Block } from '../data/types.ts'

export const lesson27: Block[] = [
  {
    kind: 'p',
    text: '这一篇不加新能力，也不改项目代码，只做一件事：把 2.1–2.6 出现过的对象与函数按「什么时候调用」重新排一遍。学完前六篇，API 是散落的；这一篇把它们收成一张可检索的地图。'
  },
  {
    kind: 'note',
    tone: 'decision',
    title: '速查不是 API 文档',
    text: '本篇只覆盖阶段二用过的调用面；参数全量与边界情况以官方 reference 为准。目标是看到需求能立刻想起「用哪个、何时调、放错会怎样」，而不是背签名。'
  },
  {
    kind: 'note',
    tone: 'tip',
    title: '按速查用，不必顺序读完',
    text: '先看「需求 → API」与「症状 → 篇目」两个索引，再按需跳代码块。代码是片段，依赖前六篇的工具与 Schema，不保证单独复制可编译。'
  },
  {
    kind: 'checklist',
    title: '运行前检查',
    items: [
      '前六篇至少跑过一遍：`docs/examples/project-02-v1` 能执行 `bun install && bun run demo`，输出 3 个 PASS',
      '本篇不新增依赖；跟练用 `docs/examples/project-02-v1`，项目主线 `02-customer-agent` 在独立仓库',
      '签名拿不准时，先查本篇「需求 → API」索引，再回对应篇目看细节'
    ]
  },
  { kind: 'h2', text: '先看生命周期：装配期 / 请求期 / 循环内' },
  {
    kind: 'p',
    text: '同一份代码里，不同 API 的调用频率完全不同。先分清装配期、请求期、循环内三种调用时机，再单独看可观测与排障入口，比背参数表有效。'
  },
  {
    kind: 'diagram',
    title: '从装配到排障，API 分别在哪一层被调用',
    caption:
      'Agent、工具、checkpointer 在装配期确定；thread_id 与 context 每请求传入；模型、工具与中间件由框架在循环内回调；可观测在启动时接入，排障工具只在出问题时用。',
    width: 1000,
    height: 360,
    groups: [
      {
        label: '装配期 · 启动一次',
        x: 16,
        y: 16,
        w: 216,
        h: 300,
        tone: 'amber'
      },
      { label: '请求期 · 每次请求', x: 248, y: 16, w: 216, h: 300 },
      {
        label: '循环内 · 框架回调',
        x: 480,
        y: 16,
        w: 300,
        h: 300,
        tone: 'accent'
      },
      {
        label: '可观测 · 接入与排障',
        x: 796,
        y: 16,
        w: 180,
        h: 300,
        tone: 'muted'
      }
    ],
    nodes: [
      {
        id: 'assemble',
        label: 'createAgent',
        sub: 'tool / model / 中间件',
        x: 40,
        y: 82,
        w: 168,
        h: 64,
        mono: true,
        tone: 'amber'
      },
      {
        id: 'memory',
        label: 'MemorySaver',
        sub: '启动时装配',
        x: 40,
        y: 196,
        w: 168,
        h: 56,
        mono: true
      },
      {
        id: 'invoke',
        label: 'agent.invoke',
        sub: 'stream / batch',
        x: 272,
        y: 82,
        w: 168,
        h: 64,
        mono: true
      },
      {
        id: 'config',
        label: 'config',
        sub: 'thread_id / context / tags',
        x: 272,
        y: 196,
        w: 168,
        h: 56,
        mono: true
      },
      {
        id: 'model',
        label: 'model',
        sub: '每轮',
        x: 504,
        y: 82,
        w: 116,
        h: 64,
        mono: true,
        tone: 'accent'
      },
      {
        id: 'middleware',
        label: 'middleware',
        sub: '每步回调',
        x: 644,
        y: 82,
        w: 116,
        h: 64,
        mono: true,
        tone: 'violet'
      },
      {
        id: 'tool',
        label: 'tool',
        sub: '按需执行',
        x: 574,
        y: 196,
        w: 116,
        h: 56,
        mono: true,
        tone: 'blue'
      },
      {
        id: 'trace',
        label: 'Trace',
        sub: 'getState',
        x: 826,
        y: 132,
        w: 120,
        h: 64,
        mono: true
      }
    ],
    edges: [
      { from: 'assemble', to: 'invoke', label: '装配一次' },
      {
        from: 'memory',
        to: 'invoke',
        label: '取 / 存',
        dashed: true,
        bend: 40
      },
      { from: 'config', to: 'invoke', label: '请求参数', dashed: true },
      { from: 'invoke', to: 'model', label: '循环' },
      { from: 'model', to: 'middleware', label: '每步' },
      { from: 'middleware', to: 'tool', label: 'tool_calls' },
      { from: 'tool', to: 'model', label: '回填', dashed: true, bend: -70 },
      { from: 'invoke', to: 'trace', label: '排障', dashed: true, bend: -60 }
    ]
  },
  {
    kind: 'table',
    head: ['时机', '什么时候', '典型 API', '放错位置的后果'],
    rows: [
      [
        '**装配期**',
        '进程启动时一次',
        '`createAgent`、`tool`、`ChatOpenAI` / `initChatModel`、`ChatPromptTemplate`、`MemorySaver`、中间件实例',
        '每次请求重建 Agent，会话状态、连接池、Trace 全部断开'
      ],
      [
        '**请求期**',
        '每次用户请求',
        '`invoke` / `stream` / `batch`；`config` 里的 `thread_id`、`context`、`tags`、`metadata`',
        '多轮串号、权限错位、Trace 无法过滤'
      ],
      [
        '**循环内**',
        '框架每步回调',
        '`tool()` 的函数体、`before*` / `wrap*` / `after*` 钩子、`responseFormat` 解析',
        '脱敏晚于模型、审批晚于工具、重试包错层'
      ],
      [
        '**可观测 / 排障**',
        '启动时接入，出问题时查看',
        '`LANGSMITH_*` 环境变量、`traceable`、`agent.graph.getState`、LangSmith 控制台',
        'Trace 没开只能猜；State 不看不知道历史存了什么'
      ]
    ]
  },
  {
    kind: 'note',
    tone: 'tip',
    title: '一句话记住',
    text: 'Agent、工具、模型、中间件在启动时装配；thread_id、context、消息在请求时传入；重试、脱敏、审批只在钩子上生效。'
  },
  { kind: 'h2', text: '需求 → API：30 秒索引' },
  {
    kind: 'table',
    head: ['你要做什么', '用哪个', '关键配置', '篇目'],
    rows: [
      [
        '把工具循环交给框架',
        '`createAgent`',
        '`model` / `tools` / `systemPrompt`',
        '2.1'
      ],
      [
        '定义模型可调用的工具',
        '`tool(fn, { name, description, schema })`',
        'Zod Schema + 写给模型看的 description',
        '2.3'
      ],
      [
        '让工具知道「谁在调」',
        '`contextSchema` + `runtime.context`',
        '`role` / `tenantId` / `userId`',
        '2.3'
      ],
      [
        '让最终输出可解析',
        '`responseFormat: toolStrategy(Schema)`',
        '读取 `result.structuredResponse`',
        '2.3'
      ],
      [
        '多轮对话接上',
        '`checkpointer` + `configurable.thread_id`',
        '同一会话复用同一个 `thread_id`',
        '2.4'
      ],
      [
        '历史超 token 预算',
        '`trimMessages` / `summarizationMiddleware`',
        '`maxTokens` / `trigger` / `keep`',
        '2.4'
      ],
      [
        '加横切逻辑',
        '`createMiddleware` 或内置中间件',
        '先选钩子，再选中间件',
        '2.5'
      ],
      [
        '写操作要人审',
        '`humanInTheLoopMiddleware` + `checkpointer` + `Command`',
        '`interruptOn` / `allowedDecisions`',
        '2.5'
      ],
      [
        '换 provider',
        '`initChatModel` 或 `new ChatOpenAI`',
        'provider 包 + 模型前缀',
        '2.2'
      ],
      [
        '一次拿完整结果',
        '`agent.invoke`',
        '`result.messages` / `structuredResponse`',
        '2.1'
      ],
      [
        '看循环过程',
        '`agent.stream(..., { streamMode: "updates" })`',
        '按节点返回状态增量',
        '2.1'
      ],
      [
        '前端逐 token',
        '`agent.streamEvents(..., { version: "v2" })`',
        '监听 `on_chat_model_stream`',
        '2.2'
      ],
      [
        '定位一次失败',
        'LangSmith 环境变量 + `tags` / `metadata`',
        '先找最深的错误 span',
        '2.6'
      ]
    ]
  },
  { kind: 'demo', id: 'api-lifecycle' },
  { kind: 'h2', text: 'Agent：装配一次，调用每请求' },
  {
    kind: 'code',
    title: '片段：agent.ts 的装配段',
    lang: 'ts',
    code: String.raw`import { createAgent, toolStrategy } from 'langchain'
import { MemorySaver } from '@langchain/langgraph'
import { z } from 'zod'

// getOrderTool / refundTool 见 2.3；TicketIntent 见下文 responseFormat 片段
const AgentContext = z.object({
  userId: z.string(),
  role: z.enum(['agent', 'admin']),
  tenantId: z.string()
})

const agent = createAgent({
  model: 'openai:gpt-4o-mini',
  tools: [getOrderTool, refundTool],
  systemPrompt: '你是客服助手，只回答订单与售后相关问题。',
  contextSchema: AgentContext,
  responseFormat: toolStrategy(TicketIntent),
  middleware: [],
  checkpointer: new MemorySaver()
})`,
    caption:
      '装配期只做一次；请求处理函数里只调用 agent.invoke，不重建 Agent。片段依赖 2.3 的工具与下文的 TicketIntent，不单独复制。'
  },
  {
    kind: 'table',
    head: ['参数', '什么时候必须写', '不写的后果'],
    rows: [
      ['`model`', '总是', '无法创建 Agent'],
      ['`tools`', '需要模型产生动作时', '只能纯对话，不会调用工具'],
      [
        '`systemPrompt`',
        '有身份、边界、风格要求时',
        '行为全靠模型默认值，不可评估'
      ],
      [
        '`contextSchema`',
        '工具要读 `runtime.context` 时',
        '类型与运行时校验都不完整，权限上下文形同虚设'
      ],
      ['`responseFormat`', '下游要解析结果时', '业务代码只能从字符串里找 JSON'],
      [
        '`middleware`',
        '有重试、脱敏、审批、限流时',
        '横切逻辑散落在业务函数里'
      ],
      [
        '`checkpointer`',
        '多轮对话、HITL、断点恢复时',
        '每次 invoke 都是全新消息数组；HITL 直接报错'
      ]
    ]
  },
  {
    kind: 'table',
    head: ['方法', '返回什么', '什么时候用'],
    rows: [
      ['`invoke(input, config)`', '一次完整结果', '普通请求、后台任务'],
      [
        '`stream(input, { streamMode: "updates" })`',
        '按节点的状态增量',
        '需要看循环过程'
      ],
      [
        '`stream(input, { streamMode: "messages" })`',
        '按消息 / token 的流',
        '需要逐 token 输出'
      ],
      ['`batch(inputs, config)`', '批量结果数组', '离线批处理、评估集'],
      [
        '`streamEvents(input, { version: "v2" })`',
        '细粒度事件流',
        '前端事件、调试'
      ]
    ]
  },
  {
    kind: 'note',
    tone: 'info',
    title: 'Agent 的 v3 事件流',
    text: 'langchain 1.6.x 的 Agent 还提供 `streamEvents(..., { version: "v3" })`，返回面向消息、工具调用的 AgentRunStream 投影。2.2 与本篇统一用 v2 示例；需要 v3 时以官方 streaming 文档为准。'
  },
  {
    kind: 'code',
    title: '请求期：消息、thread_id、context 一起传',
    lang: 'ts',
    code: String.raw`const result = await agent.invoke(
  { messages: [{ role: 'user', content: '订单 ORD-1024 到哪了？' }] },
  {
    configurable: { thread_id: 'ticket-1001' },
    context: { userId: 'u_1024', role: 'agent', tenantId: 't_acme' },
    tags: ['production', 'customer-service'],
    metadata: { userId: 'u_1024', env: 'prod' }
  }
)

console.log(result.messages.at(-1)?.content)`,
    caption:
      'thread_id 标识一段对话，不是一个人；context 必须与 contextSchema 一致。'
  },
  {
    kind: 'table',
    head: ['config 字段', '什么时候写', '说明'],
    rows: [
      [
        '`configurable.thread_id`',
        '多轮、HITL、断点恢复',
        '标识「一段对话」，不是「一个人」'
      ],
      ['`context`', '工具需要身份 / 租户', '必须与 `contextSchema` 一致'],
      ['`tags`', '需要在 Trace 里粗筛', '字符串数组，按业务线 / 环境打'],
      ['`metadata`', '需要精确定位', '键值对；不要写手机号、身份证等敏感信息'],
      [
        '`signal`',
        '需要超时 / 取消',
        '传 `AbortController.signal`，示例工程用 30s 超时'
      ]
    ]
  },
  {
    kind: 'table',
    head: ['返回字段', '什么时候读', '说明'],
    rows: [
      [
        '`result.messages`',
        '每次调用后',
        '完整消息历史；最后一条通常是最终回答'
      ],
      [
        '`result.structuredResponse`',
        '配了 `responseFormat` 后',
        '结构化结果；运行时仍建议 `safeParse` 一次'
      ],
      [
        '`result.__interrupt__`',
        '配了 HITL 后',
        '存在且非空表示本轮暂停，等待审批'
      ]
    ]
  },
  {
    kind: 'note',
    tone: 'info',
    title: '成本字段不在本篇范围',
    text: '项目 02 示例用 `message.usage_metadata` 估算 token 成本；它属于成本主题（10.5），2.1–2.6 未展开，本篇不列为速查项。'
  },
  { kind: 'h2', text: '模型、消息与 Prompt' },
  {
    kind: 'p',
    text: '这三件事都属于「请求前的输入组织」，但只有模型实例适合在装配期创建；消息与 Prompt 参数每次请求都可能不同。'
  },
  {
    kind: 'note',
    tone: 'info',
    title: '换 provider 的排查顺序',
    text: '报 model not found 时，先查 provider 包是否安装，再查模型字符串前缀与模型名；不是先改 Prompt。'
  },
  {
    kind: 'table',
    head: ['写法', '什么时候用', '注意'],
    rows: [
      [
        '`new ChatOpenAI(...)`',
        '单 provider，需要自定义 baseURL、headers、超时',
        '自己要装并维护 provider 包'
      ],
      [
        '`initChatModel("provider:model")`',
        '按环境切 provider',
        '前缀与包名必须对应'
      ],
      [
        '`createAgent({ model: "provider:model" })`',
        '快速跑通',
        '内部同样依赖 provider 包'
      ]
    ]
  },
  {
    kind: 'table',
    head: ['消息', '作用', '谁创建', '关键字段'],
    rows: [
      [
        '`SystemMessage`',
        '规则、边界、身份',
        '你（通常在历史开头）',
        '`content`'
      ],
      [
        '`HumanMessage`',
        '用户输入，可多模态',
        '你',
        '`content` / `contentBlocks`'
      ],
      [
        '`AIMessage`',
        '模型输出，可能带工具调用',
        '生产由框架；测试 / 假模型由你',
        '`content` / `tool_calls`'
      ],
      [
        '`ToolMessage`',
        '工具结果回填',
        '生产由框架；测试 / 假模型由你',
        '`tool_call_id` / `content`'
      ]
    ]
  },
  {
    kind: 'code',
    title: '一次工具调用的四个角色',
    lang: 'ts',
    code: String.raw`import {
  AIMessage,
  HumanMessage,
  SystemMessage,
  ToolMessage
} from '@langchain/core/messages'

const history = [
  new SystemMessage('你是客服助手，回答不超过三句话。'),
  new HumanMessage('退款多久到账？'),
  new AIMessage({
    content: '',
    tool_calls: [
      {
        id: 'call_1',
        name: 'getOrder',
        args: { orderId: 'ORD-1024' },
        type: 'tool_call'
      }
    ]
  }),
  new ToolMessage({
    tool_call_id: 'call_1',
    content: '{"status":"refunded","eta":"3-5 个工作日"}'
  })
]`,
    caption:
      '生产代码只构造 System / Human 消息；AI 与 Tool 消息由框架生成。测试与假模型才需要自己造 tool_calls。'
  },
  {
    kind: 'note',
    tone: 'tip',
    title: '多模态与流式内容',
    text: '用 `message.contentBlocks` 过滤 `type === "text"`；不要直接摸 provider 原始字段，否则流式里容易拼出 `[object Object]`。'
  },
  {
    kind: 'note',
    tone: 'warn',
    title: 'Prompt 只在两个地方写',
    text: 'createAgent 里写 systemPrompt；自己组链时用 ChatPromptTemplate + MessagesPlaceholder。历史必须是消息数组，不要拼成「用户：… AI：…」字符串，否则角色、tool_calls 与 tool_call_id 全丢。'
  },
  { kind: 'h2', text: '工具与输出契约' },
  {
    kind: 'p',
    text: '工具和输出是同一套 Zod 契约的两端：工具入参是「模型 → 运行时」的契约，responseFormat 是「模型 → 业务」的契约。中间夹着的权限上下文，决定谁能调用。'
  },
  {
    kind: 'code',
    title: 'tools.ts：tool() + Zod + runtime.context',
    lang: 'ts',
    code: String.raw`import { tool } from 'langchain'
import { z } from 'zod'

export const refundTool = tool(
  async ({ orderId, reason }, runtime) => {
    const role = runtime.context?.role
    if (role !== 'admin') {
      throw new Error('permission_denied: refund 需要 admin 角色')
    }
    return { ok: true, orderId, reason, refundCny: 199 }
  },
  {
    name: 'refund',
    description: '提交退款申请。仅当用户明确要求退款时调用。',
    schema: z.object({
      orderId: z.string().regex(/^ORD-\d{4}$/),
      reason: z.enum(['damaged', 'late', 'other'])
    })
  }
)`,
    caption:
      'description 是给模型看的 API 文档；Zod 是给运行时的校验器；权限校验必须落在函数体或 wrapToolCall 里。'
  },
  {
    kind: 'table',
    head: ['层', '什么时候生效', '失败时发生什么'],
    rows: [
      [
        '入参 Schema',
        '模型出参、运行时入参',
        '运行时拒绝，把错误回填给模型重试'
      ],
      [
        '权限上下文',
        '工具真正执行前',
        '业务函数不执行，返回 permission_denied'
      ],
      [
        '输出 Schema',
        '最终结果交给下游前',
        '解析失败可重试，或降级到人工 / 原始文本'
      ]
    ]
  },
  {
    kind: 'table',
    head: ['错误类型', '例子', '默认行为', '建议'],
    rows: [
      [
        '入参校验失败',
        '`orderId: "1024"`',
        'Zod 拒绝，错误回填',
        '让模型修正一次；Schema 不要放宽'
      ],
      [
        '权限拒绝',
        'agent 调用 refund',
        '转成 error ToolMessage 回填',
        '`toolErrorMiddleware` fail closed，或配重试上限'
      ],
      [
        '瞬时故障',
        '超时 / 429',
        '取决于中间件',
        '`toolRetryMiddleware` 指数退避，最多 2 次'
      ],
      [
        '业务错误',
        '订单不存在',
        '回填给模型',
        '返回结构化错误，由 Agent 决定是否转人工'
      ]
    ]
  },
  {
    kind: 'table',
    head: ['危险工具的约束', '默认值', '不加会怎样'],
    rows: [
      ['超时', '10s，超时杀进程', '死循环拖垮整轮请求'],
      ['输出上限', 'stdout / stderr 各 8 KB', '日志刷爆上下文'],
      ['工作目录', '固定到任务目录，只读', '越权读写仓库或主目录'],
      ['命令白名单', '只放登记过的命令', '被注入后执行任意命令'],
      ['非交互执行', '`shell: false`，参数数组传入', '字符串拼接导致命令注入']
    ]
  },
  {
    kind: 'note',
    tone: 'warn',
    title: '进程级约束不是沙箱',
    text: '超时、白名单、只读目录只防「误用」，防不住「逃逸」：工具仍跑在宿主进程里，能读环境变量、能访问网络。真正的隔离要换执行环境，见 11.4。'
  },
  {
    kind: 'code',
    title: '片段：在装配段追加 responseFormat',
    lang: 'ts',
    code: String.raw`import { createAgent, toolStrategy } from 'langchain'
import { z } from 'zod'

const TicketIntent = z.object({
  intent: z.enum(['refund_status', 'invoice', 'account', 'other']),
  orderId: z.string().regex(/^ORD-\d{4}$/).optional(),
  reply: z.string().min(1).max(120)
})

const agent = createAgent({
  model: 'openai:gpt-4o-mini',
  tools: [getOrderTool],
  contextSchema: AgentContext,
  responseFormat: toolStrategy(TicketIntent), // 只新增这一行
  // middleware / checkpointer 沿用上文的装配段
})

const result = await agent.invoke(/* ... */)
const parsed = TicketIntent.safeParse(result.structuredResponse)`,
    caption:
      'toolStrategy 让不支持原生 JSON Schema 的模型也能经工具调用产出结构化结果；读取后仍建议 safeParse 一次。'
  },
  {
    kind: 'note',
    tone: 'tip',
    title: '结构化输出失败的三级处理',
    text: '一级：把 Zod 错误回填给模型，要求按 Schema 重试一次；二级：降级到「原始文本 + 正则兜底」，并记录失败样本；三级：仍然失败就 fail closed，转人工或返回可解释错误。不要无限重试。'
  },
  {
    kind: 'p',
    text: '工具太多时：先按业务域分组 → 用意图识别只暴露当前组 → 超过阈值再做工具检索 → 高风险写操作加权限与人工确认。不要一上来就「向量检索所有工具」。'
  },
  { kind: 'h2', text: '记忆与状态：四个动作分开配' },
  {
    kind: 'code',
    title: 'memory.ts：checkpointer + thread_id',
    lang: 'ts',
    code: String.raw`import { createAgent } from 'langchain'
import { MemorySaver } from '@langchain/langgraph'

const agent = createAgent({
  model: 'openai:gpt-4o-mini',
  tools: [],
  checkpointer: new MemorySaver()
})

const config = { configurable: { thread_id: 'ticket-1001' } }

await agent.invoke(
  { messages: [{ role: 'user', content: '订单 ORD-1024 到哪了？' }] },
  config
)
await agent.invoke(
  { messages: [{ role: 'user', content: '那什么时候能到？' }] },
  config
)`,
    caption:
      '同一 thread_id 的第二轮会自动带上第一轮消息；用户不需要重复订单号。'
  },
  {
    kind: 'table',
    head: ['Checkpointer', '什么时候用', '边界'],
    rows: [
      [
        '`MemorySaver`',
        '开发、测试、单进程演示',
        '进程重启就丢，不能跨进程恢复'
      ],
      [
        '`PostgresSaver`',
        '生产、HITL、断点恢复',
        '依赖 PostgreSQL，需要建表与清理策略'
      ],
      ['`SqliteSaver`', '单机轻量', '并发与多实例能力有限'],
      ['自定义 Saver', '已有存储体系', '要自己保证一致性、TTL 与迁移']
    ]
  },
  {
    kind: 'code',
    title: 'trimMessages：送模型前裁回预算',
    lang: 'ts',
    code: String.raw`import { trimMessages } from 'langchain'

// state 来自 agent.graph.getState(config)；只用于排障与离线裁剪
const trimmed = await trimMessages(state.values.messages, {
  maxTokens: 1200,
  strategy: 'last',
  tokenCounter: (messages) => messages.length * 40,
  startOn: 'human',
  endOn: ['human', 'tool']
})`,
    caption:
      'tokenCounter 这里是粗估；生产要换成真实 tokenizer。startOn 保证从 Human 开始，endOn 必须包含 tool：工具循环的最后一条通常是 ToolMessage，只写 human 会把它裁掉，留下没有回填的 tool_calls。'
  },
  {
    kind: 'note',
    tone: 'warn',
    title: '裁剪前先看消息以什么结尾',
    text: '历史以 Human 结尾（新一轮提问）或 Tool 结尾（工具刚返回）时，上面的边界都安全；历史以 AI 结尾且需要保留最终回答时，不要用 endOn，或把 ai 也加入数组。历史里有 SystemMessage 时加 includeSystem: true，否则系统提示可能被裁掉。'
  },
  {
    kind: 'note',
    tone: 'warn',
    title: 'HITL 跨进程审批不能用 MemorySaver',
    text: '中断后要能恢复，必须有状态快照。审批发生在另一个进程或第二天时，MemorySaver 已经丢了，必须用持久化 Saver。短期记忆是「这段对话说过什么」，长期记忆是「这个用户是谁」，后者走 store，不要混进同一个 thread。'
  },
  { kind: 'h2', text: '中间件与 HITL：钩子不是主动调用' },
  {
    kind: 'table',
    head: ['钩子', '触发时机', '典型用途'],
    rows: [
      ['`beforeAgent`', '每次 invoke 开始，一次', '初始化、鉴权、注入 traceId'],
      ['`beforeModel`', '每次模型调用前', '裁剪历史、PII 脱敏、注入 system'],
      ['`wrapModelCall`', '包住模型调用', '重试、fallback、改模型或 Prompt'],
      [
        '`afterModel`',
        '模型返回后、工具执行前',
        '检查 tool_calls、审批拦截、调用上限'
      ],
      ['`wrapToolCall`', '包住每次工具调用', '权限、缓存、重试、审计'],
      ['`afterAgent`', '每次 invoke 结束，一次', '统计、清理、写审计']
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
      'before* 按数组顺序，after* 按数组逆序，wrap* 是洋葱；顺序写反，语义就反了。'
  },
  {
    kind: 'table',
    head: ['内置中间件', '挂在哪', '什么时候用', '关键配置'],
    rows: [
      [
        '`modelRetryMiddleware`',
        '`wrapModelCall`',
        '429、超时、网络错误',
        '`maxRetries` / `retryOn` / `onFailure`'
      ],
      [
        '`modelCallLimitMiddleware`',
        '`beforeModel`',
        '限制模型调用次数',
        '`runLimit` / `threadLimit` / `exitBehavior`'
      ],
      [
        '`toolRetryMiddleware`',
        '`wrapToolCall`',
        '工具瞬时故障',
        '`tools` / `maxRetries` / `onFailure`'
      ],
      [
        '`toolCallLimitMiddleware`',
        '`afterModel`',
        '防无限循环',
        '`runLimit` / `threadLimit` / `exitBehavior`'
      ],
      [
        '`piiMiddleware`',
        '`beforeModel` / `afterModel`',
        '输入输出脱敏',
        '`piiType`（首参）/ `strategy` / `applyToInput` / `applyToOutput`'
      ],
      [
        '`humanInTheLoopMiddleware`',
        '`afterModel`（默认）',
        '写操作审批',
        '`interruptOn` / `allowedDecisions`'
      ],
      [
        '`todoListMiddleware`',
        '`wrapModelCall` + `afterModel`',
        '多步任务',
        '`systemPrompt` / `toolDescription`'
      ],
      [
        '`toolErrorMiddleware`',
        '`wrapToolCall`',
        '工具异常 fail closed',
        '`onError`'
      ]
    ]
  },
  {
    kind: 'note',
    tone: 'info',
    title: 'fallback 不在本篇范围',
    text: '项目 02 v1 示例还用了 `modelFallbackMiddleware(...models)` 做备用模型链；它属于降级主题（5.3 / 10.5），2.1–2.6 未展开，本篇不列入速查表。'
  },
  {
    kind: 'code',
    title: 'HITL：工具执行前中断，审批后恢复',
    lang: 'ts',
    code: String.raw`import { createAgent, humanInTheLoopMiddleware } from 'langchain'
import { Command, MemorySaver } from '@langchain/langgraph'

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
})

// 第一次 invoke 返回 __interrupt__；审批后用同一个 thread_id 恢复
const result = await agent.invoke(
  new Command({ resume: { decisions: [{ type: 'approve' }] } }),
  { configurable: { thread_id: 't_1024' } }
)`,
    caption:
      'humanInTheLoopMiddleware 依赖 checkpointer；没有它，第一次 invoke 就会报错。'
  },
  {
    kind: 'note',
    tone: 'warn',
    title: 'HITL 不替代权限',
    text: 'HITL 解决「这次要不要执行」，权限解决「这个人能不能执行」。工具内部的 runtime.context 校验仍然要保留；审计字段与脱敏策略在 11.1 展开。'
  },
  { kind: 'h2', text: '可观测与排障' },
  {
    kind: 'code',
    title: '环境变量：零代码接入',
    lang: 'bash',
    code: String.raw`export LANGSMITH_TRACING=true
export LANGSMITH_API_KEY=lsv2_sk_xxx
export LANGSMITH_PROJECT=customer-service-v1

# 自部署或非 US 区域才需要
export LANGSMITH_ENDPOINT=https://api.smith.langchain.com`,
    caption:
      'createAgent、模型、工具默认会读取这些变量并上报 Trace；Trace 会记录输入输出，上线前先脱敏。'
  },
  {
    kind: 'code',
    title: '自定义步骤用 traceable 包一层',
    lang: 'ts',
    code: String.raw`import { traceable } from 'langsmith/traceable'

const retrieve = traceable(
  async (query: string) => {
    return []
  },
  { name: 'retrieve' }
)`,
    caption:
      '自定义检索 / 数据库 / 外部 API 也能进入同一棵 Trace；name 用稳定的英文名，方便按 span 名筛选。'
  },
  {
    kind: 'table',
    head: ['现象', '先查什么', '篇目'],
    rows: [
      [
        '第二轮忘了第一轮的订单号',
        'thread_id 是否一致 → checkpointer 是否挂上 → 是否被裁剪',
        '2.4'
      ],
      ['模型收到了原始邮箱', 'PII 中间件是否在模型调用前', '2.5'],
      ['工具已经执行，才弹审批', 'HITL 是否挂在工具执行前', '2.5'],
      ['重试把整个 Agent 重跑一遍', '重试中间件是否包错层', '2.5'],
      [
        '流式文本拼出 `[object Object]`',
        '用 contentBlocks 归一化，不要 String(chunk)',
        '2.2'
      ],
      [
        '模型重复调用同一工具',
        'tool 消息是否漏回填、tool_call_id 是否对上、是否配调用上限',
        '2.3 / 2.5'
      ],
      ['参数校验一直失败', '改 description 与示例，不要放宽 Schema', '2.3'],
      [
        '换 provider 报 model not found',
        'provider 包、模型名前缀',
        '2.1 / 2.2'
      ],
      ['进程重启后历史全丢', '是否还在用 MemorySaver', '2.4'],
      [
        'Trace 里找不到失败点',
        '先看根 span 是否 error，再找最深的错误子 span',
        '2.6'
      ]
    ]
  },
  { kind: 'h2', text: '常见误用' },
  {
    kind: 'table',
    head: ['误用', '后果', '正确做法'],
    rows: [
      [
        '每次请求都 `createAgent`',
        '状态、连接、Trace 全部断裂',
        '启动时装配一次'
      ],
      [
        '把历史拼成字符串',
        '角色与 tool_call_id 丢失',
        '消息数组 + MessagesPlaceholder'
      ],
      [
        '`thread_id` 用 `user_id`',
        '同一用户的不同会话互相污染',
        '按会话 / 工单生成'
      ],
      [
        'HITL 用 `MemorySaver` 跨进程审批',
        '重启后中断现场丢失',
        'PostgresSaver 等持久化实现'
      ],
      [
        '把权限只写进 system prompt',
        '注入后可绕过',
        'runtime.context + 工具内校验'
      ],
      [
        '为了让模型通过而放宽 Schema',
        '契约失效，下游仍会炸',
        '改 description / few-shot，Schema 保持严格'
      ],
      [
        '用 Prompt 约束代替工具边界',
        '`rm -rf` 仍可能执行',
        '白名单 + 超时 + 输出上限 + 沙箱'
      ],
      ['无限重试结构化输出', '白烧 token', '回填一次 → 降级 → fail closed']
    ]
  },
  { kind: 'h2', text: '验收清单' },
  {
    kind: 'checklist',
    title: '本篇跑通的标准',
    items: [
      '能说出 `createAgent` / `tool` / `MemorySaver` 属于装配期，不在每次请求里重建',
      '能给「多轮 / 结构化输出 / 审批 / 追踪」四个需求各选出一个 API 与关键配置',
      '能在 demo 里按生命周期筛选，并说出每个阶段至少 3 个 API',
      '能按症状索引在 2 分钟内定位到篇目与 API'
    ]
  },
  { kind: 'h2', text: '本讲产出' },
  {
    kind: 'p',
    text: '带走一张按调用时机组织的 API 速查地图、一个可检索的交互 demo、一张症状索引与一张常见误用表。阶段二到此收口；下一篇 3.1 换到检索主线，只引入「检索闭环」一个变量。'
  },
  {
    kind: 'exercise',
    title: '2.7 练习：把 API 放回正确的时机',
    items: [
      {
        id: 's2-7-e1',
        level: '基础',
        question:
          '打开 `docs/examples/project-02-v1/src/server.ts`，把其中出现的对象与函数按「装配期 / 请求期 / 循环内」分类，指出哪些代码应该移到模块顶层。',
        hint: '先找 `createAgent`、模型、checkpointer，再找每次请求里的 `invoke` 与 config。',
        answer:
          '`createAgent`、模型、`MemorySaver` 应移出请求处理函数；`invoke`、`thread_id`、`context` 留在请求期。',
        solution:
          '请求处理函数里只保留入参校验、config 组装、`agent.invoke` 与错误映射；Agent 重建会导致状态与连接断裂。'
      },
      {
        id: 's2-7-e2',
        level: '改造',
        question:
          '给「退款后发送短信」设计一个工具，列出它的入参 Schema、权限上下文与输出 Schema 分别放在哪一层。',
        hint: '入参是模型 → 运行时；权限是「谁能调」；输出是模型 → 业务。',
        answer:
          '入参：orderId + reason；权限：`contextSchema` + `runtime.context.role`；输出：`{ ok, smsId }` + responseFormat。',
        solution:
          '入参 Schema 与 description 放 `tool()`；权限校验放函数体或 `wrapToolCall`；最终输出契约放 `responseFormat`。'
      },
      {
        id: 's2-7-e3',
        level: '排障',
        question:
          '现象：同一 thread_id 的第二轮仍然反问订单号。按本篇的症状索引，写出检查顺序。',
        hint: '创建 → 读取 → 持久化 → 裁剪。',
        answer:
          '先查 thread_id 是否一致，再查 checkpointer 是否真的挂上，最后查 trimMessages 是否把订单号裁掉。',
        solution:
          '打印两次 invoke 的 config 与 `agent.graph.getState(config).values.messages`；State 有历史但模型没看到，再查裁剪与摘要。'
      },
      {
        id: 's2-7-e4',
        level: '设计',
        question:
          '为一个客服系统各写 3 个装配期、请求期、循环内的 API，并说明放错位置会怎样。',
        hint: '从 2.1–2.6 的清单里挑，不要引入本章没出现的 API。',
        answer:
          '装配期：createAgent、tool、MemorySaver；请求期：invoke、thread_id、context；循环内：tool 函数体、wrapToolCall、responseFormat。',
        solution:
          '装配期放错会导致每次请求重建；请求期漏传会导致串号或越权；循环内放反会导致脱敏、审批、重试失效。'
      }
    ]
  },
  { kind: 'h2', text: '面试问答' },
  {
    kind: 'table',
    head: ['问题', '一句话答案'],
    rows: [
      [
        'createAgent 的哪些配置启动时一次，哪些要每次请求传？',
        '模型、工具、systemPrompt、中间件、checkpointer 启动时一次；thread_id、context、tags / metadata 每次请求传。'
      ],
      [
        '中间件为什么不是主动调用？',
        '它挂在 Agent 循环已定义的钩子上，由框架在模型前、模型后、工具前后触发；你只声明位置与逻辑。'
      ],
      [
        '工具、输出、记忆、追踪各用哪个 API 收口？',
        'tool + Zod 收入参，responseFormat 收输出，checkpointer + thread_id 收状态，LangSmith + traceable 收 Trace。'
      ],
      [
        '怎么快速定位一次 Agent 失败？',
        '先看根 span 是否 error，再找最深的错误子 span；工具看 input/output，模型看 token 与 finish_reason，中间件看拦截点。'
      ]
    ]
  },
  {
    kind: 'note',
    tone: 'decision',
    title: '课程定位：2.7 是收口篇，不是新能力篇',
    text: '它不引入任何新对象，只把前六篇的调用面按频率重新组织。新能力仍然遵守「一章一个变量」，2.7 承担阶段的收口与检索层。'
  },
  {
    kind: 'links',
    title: '参考与源码',
    items: [
      {
        label: '项目源码 agent-fullstack-handcraft',
        href: 'https://github.com/belos-street/agent-fullstack-handcraft',
        note: '02-customer-agent 等项目的独立仓库'
      },
      {
        label: 'LangChain createAgent',
        href: 'https://reference.langchain.com/javascript/langchain/index/createAgent',
        note: 'createAgent 配置与返回类型'
      },
      {
        label: 'LangChain Tools',
        href: 'https://docs.langchain.com/oss/javascript/langchain/tools',
        note: 'tool()、Schema 与 runtime.context'
      },
      {
        label: 'LangChain Structured Output',
        href: 'https://docs.langchain.com/oss/javascript/langchain/structured-output',
        note: 'responseFormat 与 toolStrategy'
      },
      {
        label: 'LangGraph Persistence',
        href: 'https://docs.langchain.com/oss/javascript/langgraph/persistence',
        note: 'Checkpointer、thread_id 与状态快照'
      },
      {
        label: 'LangChain Middleware',
        href: 'https://docs.langchain.com/oss/javascript/langchain/middleware/overview',
        note: '钩子模型与内置中间件'
      },
      {
        label: 'LangSmith Observability',
        href: 'https://docs.langchain.com/langsmith/observability-quickstart',
        note: '环境变量与 Trace'
      }
    ]
  }
]
