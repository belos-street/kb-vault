import type { Block } from '../data/types.ts'

export const lesson23: Block[] = [
  {
    kind: 'p',
    text: '这一篇只加一个变量：**工具与输出契约**。上一章的 Agent 已经能循环调用工具，但工具还只是「一个函数 + 一段描述」。这一篇把工具入参、权限上下文和最终输出都收进同一套 Zod 契约，让模型调用变得可校验、可拒绝、可解析。'
  },
  {
    kind: 'note',
    tone: 'decision',
    title: '为什么工具和输出放在一篇',
    text: '它们不是两个主题，而是同一套 Zod 契约的两端：工具入参是「模型 → 运行时」的契约，`responseFormat` 是「模型 → 业务」的契约。中间夹着的 Runtime Context，决定谁能调用。'
  },
  { kind: 'h2', text: '工具契约的三层' },
  {
    kind: 'table',
    head: ['层', '回答什么问题', '失败时发生什么'],
    rows: [
      [
        '入参 Schema',
        '模型传的参数对不对？',
        '运行时拒绝，把错误回填给模型重试'
      ],
      [
        '权限上下文',
        '这个用户 / 租户能不能调？',
        '业务函数不执行，返回 permission_denied'
      ],
      [
        '输出 Schema',
        '最终结果能不能被下游消费？',
        '解析失败可重试，或降级到人工 / 原始文本'
      ]
    ]
  },
  {
    kind: 'p',
    text: '只写第一层，工具会被模型用错；只写第二层，业务代码仍要猜参数；只写第三层，输出好看了，但越权调用已经发生。三层一起，才叫「契约」。'
  },
  { kind: 'h2', text: '入参 Schema：让模型和运行时用同一套类型' },
  {
    kind: 'code',
    title: 'tools.ts：tool() + Zod',
    lang: 'ts',
    code: String.raw`import { tool } from 'langchain'
import { z } from 'zod'

export const weatherTool = tool(
  async ({ city }) => ({
    city,
    tempC: 24,
    condition: '多云'
  }),
  {
    name: 'weather',
    description: '查询城市天气。仅当用户明确问天气时调用。',
    schema: z.object({
      city: z.string().min(1).describe('城市名，例如 杭州')
    })
  }
)

export const refundTool = tool(
  async ({ orderId, reason }, config) => {
    const role = config?.context?.role
    if (role !== 'admin') {
      // 抛错终止本轮工具循环，避免模型把拒绝当成可重试错误
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
      '`description` 是给模型看的 API 文档；Zod Schema 是给运行时看的校验器；权限拒绝抛错，而不是返回可重试的普通结果。'
  },
  {
    kind: 'p',
    text: '`tool()` 把三件事绑在一起：函数实现、给模型看的描述、运行时校验。模型只看到 `name`、`description` 和参数结构；运行时拿到参数后先过 Zod，再执行函数。任何一边缺失，都会出现「模型以为能调、运行时说不行」的错位。'
  },
  {
    kind: 'note',
    tone: 'warn',
    title: 'description 不是注释，是工具选择的主要依据',
    text: '写清三件事：什么时候用、什么时候不要用、参数长什么样。比如「查询天气」不如「查询指定城市当前天气；用户问温度、下雨、穿衣建议时调用；不要用于历史天气」。'
  },
  { kind: 'h2', text: '权限上下文：工具不是裸函数' },
  {
    kind: 'code',
    title: 'Runtime Context：把身份带进工具',
    lang: 'ts',
    code: String.raw`const context = {
  userId: 'u_1024',
  role: 'agent' as 'agent' | 'admin',
  tenantId: 't_acme'
}

const result = await agent.invoke(
  { messages: [{ role: 'user', content: '帮我把 ORD-1024 退掉' }] },
  { context }
)`,
    caption:
      'Runtime Context 的具体字段名以当期 LangChain 文档为准；重点是「身份随调用进入工具」。'
  },
  {
    kind: 'p',
    text: '权限校验必须放在工具实现或运行时中间件里，不能只写在 system prompt 里。Prompt 可以被注入绕过，运行时校验不会。工具内部的 `role !== "admin"` 是最后一道门。'
  },
  { kind: 'demo', id: 'tool-contract' },
  { kind: 'h2', text: '工具错误与重试：三类错误，三种处理' },
  {
    kind: 'table',
    head: ['错误类型', '例子', '处理方式', '是否重试'],
    rows: [
      [
        '入参校验失败',
        'orderId 格式不对',
        '把 Zod 错误回填给模型，让它修正一次',
        '一次'
      ],
      [
        '权限拒绝',
        'agent 调用 refund',
        'fail closed，返回 permission_denied',
        '不重试'
      ],
      ['瞬时故障', '超时 / 429', '指数退避，最多 2 次', '有限次'],
      [
        '业务错误',
        '订单不存在',
        '返回结构化错误，由 Agent 决定是否转人工',
        '看策略'
      ]
    ]
  },
  {
    kind: 'note',
    tone: 'warn',
    title: '权限拒绝不要返回普通业务错误',
    text: '如果权限拒绝只返回 `{ ok: false }`，模型可能把它当成可重试错误，反复调用。建议抛出可识别的 `permission_denied` 终止本轮工具循环，并把原因写进 ToolMessage。'
  },
  {
    kind: 'p',
    text: '重试只对「模型能修正的入参错误」和「瞬时故障」有意义。权限拒绝、参数越界、业务规则不满足，重试不会变好，只会多烧 token。'
  },
  { kind: 'h2', text: '输出 Schema：把「可解析」变成契约' },
  {
    kind: 'code',
    title: 'agent.ts：responseFormat + Zod',
    lang: 'ts',
    code: String.raw`import { createAgent } from 'langchain'
import { z } from 'zod'
import { refundTool, weatherTool } from './tools.ts'

const TicketIntent = z.object({
  intent: z.enum(['refund_status', 'invoice', 'account', 'other']),
  orderId: z.string().regex(/^ORD-\d{4}$/).optional(),
  reply: z.string().min(1)
})

const AgentContext = z.object({
  userId: z.string(),
  role: z.enum(['agent', 'admin']),
  tenantId: z.string()
})

const agent = createAgent({
  model: 'openai:gpt-4o-mini',
  tools: [weatherTool, refundTool],
  contextSchema: AgentContext,
  responseFormat: TicketIntent
})

const result = await agent.invoke(
  { messages: [{ role: 'user', content: '订单 ORD-1024 的退款到哪了？' }] },
  { context: { userId: 'u_1024', role: 'admin', tenantId: 't_acme' } }
)

console.log(result.structuredResponse)`,
    caption:
      '`contextSchema` 声明后，工具里的 `config.context` 才有类型与运行时校验；`structuredResponse` 的字段名以当期文档为准。`gpt-4o-mini` 只是示例，按当期模型清单替换。'
  },
  {
    kind: 'note',
    tone: 'info',
    title: 'contextSchema 不是可选项',
    text: '只传 `{ context }` 而不在 `createAgent` 里声明 `contextSchema`，类型与运行时校验都不完整。官方做法是在 agent 上声明 Schema，工具再通过 `config.context` 读取。'
  },
  {
    kind: 'p',
    text: '裸文本不是「错的」，但它把解析责任推给了下游。`responseFormat` 把「可解析」变成模型调用的一部分：解析失败可以重试，而不是让业务代码在字符串里找 JSON。'
  },
  { kind: 'demo', id: 'output-contract' },
  {
    kind: 'note',
    tone: 'tip',
    title: '结构化输出失败的三级处理',
    text: '一级：把 Zod 错误回填给模型，要求按 Schema 重试一次；二级：降级到「原始文本 + 正则兜底」，并记录失败样本；三级：仍然失败就 fail closed，转人工或返回可解释错误。不要无限重试。'
  },
  { kind: 'h2', text: '工具太多怎么办' },
  {
    kind: 'p',
    text: '工具一多，模型选错的概率会上升，上下文也会被工具描述撑爆。常见做法不是「把所有工具都塞进去」，而是分组、收窄、检索。'
  },
  {
    kind: 'table',
    head: ['策略', '适用场景', '代价'],
    rows: [
      ['命名空间 / 分组', '工具天然按业务域划分', '模型仍要在组间选'],
      [
        '工具检索（RAG over tools）',
        '几十到上百个工具',
        '多一层检索，可能召回错工具'
      ],
      ['按任务收窄', '当前意图明确', '需要先做意图识别'],
      ['合并工具', '多个工具只是参数不同', '单工具 Schema 变复杂'],
      ['人工兜底', '高风险写操作', '牺牲自动化率']
    ]
  },
  {
    kind: 'note',
    tone: 'interview',
    title: '面试追问：工具太多怎么选？',
    text: '先分类，再收窄，最后才检索。回答顺序是：按业务域分组 → 用意图识别只暴露当前组 → 工具超过阈值再做工具检索 → 高风险工具加权限与人工确认。不要一上来就说「用向量检索所有工具」。'
  },
  { kind: 'h2', text: '验收清单' },
  {
    kind: 'p',
    text: '最小可运行工程在 `docs/examples/2-3-tool-contract`。在 `docs/` 目录下运行 `cd examples/2-3-tool-contract && bun install && bun run demo`，会看到 4 个 PASS：非法入参、agent 拒绝、admin 通过、输出解析。它不需要真实 LLM，专门验证契约内核。'
  },
  {
    kind: 'checklist',
    title: '本篇跑通的标准',
    items: [
      '`bun run demo` 输出 4 个 PASS 与 `all contract checks passed`',
      '非法入参（如 `orderId: "1024"`）被 Zod 拒绝，错误信息能回填给模型',
      '合法入参触发工具，并在消息链路里看到 ToolMessage（这一条在项目 02 的真实 Agent 中验证）',
      '`responseFormat` 的输出能被 `JSON.parse`，且通过同一套 Zod Schema'
    ]
  },
  { kind: 'h2', text: '本讲产出' },
  {
    kind: 'p',
    text: '带走 `tools.ts`、`agent.ts`、可运行的契约示例工程和一张工具契约表。下一篇 2.4 会把 Thread ID、Checkpointer 与上下文裁剪串成状态生命周期。'
  },
  {
    kind: 'exercise',
    title: '2.3 练习：把契约收紧',
    items: [
      {
        id: 's2-3-e1',
        level: '基础',
        question: '给 `weather` 工具加一个可选参数 `days`（1~7），默认 1。',
        hint: '用 `z.number().int().min(1).max(7).default(1)`，别只在函数体里 `?? 1`。',
        answer: '`days: z.number().int().min(1).max(7).default(1)`。',
        solution:
          '注意默认值要在 Schema 里表达，不要只在函数体里 `?? 1`；否则模型看到的参数结构与运行时不一致。'
      },
      {
        id: 's2-3-e2',
        level: '改造',
        question:
          '把 `refund` 的权限检查从工具内部移到中间件，再跑一次 agent 角色。',
        hint: '先想清楚中间件与工具内部各负责哪一层；拒绝应发生在工具执行前。',
        answer: '结果应仍然是 `permission_denied`，但拒绝发生在工具执行前。',
        solution:
          '中间件适合做统一鉴权与审计；工具内部保留最后一道校验，防止中间件被绕过。'
      },
      {
        id: 's2-3-e3',
        level: '排障',
        question:
          '模型调用 `refund` 时传了 `orderId: "1024"`，Zod 报错。应该改 Schema、改 description，还是改 Prompt？',
        hint: '先区分硬约束与软提示：Schema 负责硬约束，description / prompt 负责少犯错。',
        answer:
          '先改 description 与示例，让模型知道格式；Schema 保持严格；Prompt 只做补充。',
        solution:
          'Schema 是硬约束，不能为了「让模型通过」而放宽；description 里写清 `ORD-1234` 的格式与示例，必要时在 system prompt 里再提醒一次。'
      },
      {
        id: 's2-3-e4',
        level: '设计',
        question: '有 30 个工具，设计一套「分组 + 收窄 + 权限」的方案。',
        hint: '按业务域分组，先写组名，再写每组暴露哪 3~5 个工具，最后标出高风险写操作。',
        answer:
          '按业务域分 4~6 组；意图识别只暴露 1 组；写操作加 admin 与人工确认；超过阈值再做工具检索。',
        solution:
          '示例：订单组（查询 / 退款 / 改地址）、发票组、账号组、知识组。默认只暴露订单组；退款工具要求 admin；高危操作走 HITL；每组工具描述控制在 10 个以内。'
      }
    ]
  },
  { kind: 'h2', text: '面试问答' },
  {
    kind: 'table',
    head: ['问题', '一句话答案'],
    rows: [
      [
        '工具怎么定义？',
        '函数实现 + 给模型看的 description + 运行时 Zod Schema，三件套缺一不可。'
      ],
      [
        '工具太多怎么办？',
        '先分组，再按意图收窄，超过阈值再做工具检索；高风险工具加权限与人工确认。'
      ],
      [
        '如何保证结构化输出稳定可解析？',
        '用 responseFormat + Zod 把解析变成契约；失败回填错误重试一次，再降级或 fail closed。'
      ]
    ]
  },
  {
    kind: 'note',
    tone: 'interview',
    title: '追问：工具调用失败，怎么区分是模型错还是工具错？',
    text: '看 ToolMessage 与 trace：参数校验失败是模型 / description 的问题；工具内部异常是业务代码的问题；权限拒绝是上下文的问题。三类错误不要都归因成「模型不行」。'
  },
  {
    kind: 'links',
    title: '官方参考',
    items: [
      {
        label: 'LangChain createAgent 参考',
        href: 'https://reference.langchain.com/javascript/langchain/index/createAgent',
        note: 'createAgent 配置与 responseFormat'
      },
      {
        label: 'LangChain Agents',
        href: 'https://docs.langchain.com/oss/javascript/langchain/agents',
        note: 'Agent 与 structured output 总览'
      },
      {
        label: 'LangChain Structured Output',
        href: 'https://docs.langchain.com/oss/javascript/langchain/structured-output',
        note: 'responseFormat 与 provider / tool strategy'
      },
      {
        label: 'LangChain JS Tools',
        href: 'https://js.langchain.com/docs/how_to/custom_tools/',
        note: 'tool() 与 Zod Schema'
      },
      {
        label: 'Zod',
        href: 'https://zod.dev/',
        note: '运行时校验与类型推导'
      },
      {
        label: 'OpenAI Structured Outputs',
        href: 'https://platform.openai.com/docs/guides/structured-outputs',
        note: '结构化输出与 JSON Schema'
      }
    ]
  }
]
