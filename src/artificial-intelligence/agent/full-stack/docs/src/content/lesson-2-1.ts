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
    text: '这一篇的目标不是背 `createAgent` 的配置项，而是先用 30 分钟把 1.4 的天气 Agent 跑起来，再回头看框架替你收走了哪几件事。没有跑通之前，不要开始比较抽象。'
  },
  {
    kind: 'note',
    tone: 'definition',
    title: 'Model + Harness',
    text: 'Model 是推理引擎，负责决定下一步做什么；Harness 是模型外面的工程壳：循环、工具、Prompt、状态、中间件。`createAgent` 就是 LangChain 提供的默认 Harness。'
  },
  { kind: 'h2', text: '先跑通：3 行创建 Agent' },
  {
    kind: 'code',
    title: 'agent.ts',
    lang: 'ts',
    code: String.raw`import { createAgent, tool } from 'langchain'
import { z } from 'zod'

const weatherTool = tool(
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

const agent = createAgent({
  model: 'openai:gpt-4o-mini',
  tools: [weatherTool],
  systemPrompt: '你是天气助手。只回答天气相关问题；需要实时天气时调用 weather 工具。'
})

const result = await agent.invoke({
  messages: [{ role: 'user', content: '杭州明天要带伞吗？' }]
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
      '`bun run agent.ts` 能打印回答，日志里至少有一次 `weather` 工具调用',
      '把 `city` 改成空字符串，能看到工具参数校验失败并被回填'
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
    text: '依赖关系不用背：`langchain` 依赖 `@langchain/core` 与 `@langchain/langgraph`；provider 包按需安装。真正要记住的是「消息与 Runnable 在 core，状态与图在 langgraph，Agent 装配在 langchain」。'
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
  { messages: [{ role: 'user', content: '杭州天气' }] },
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
    text: '最小可运行工程在 `docs/examples/2-1-create-agent`。在 `docs/` 下运行 `cd examples/2-1-create-agent && bun install && bun run demo`，会看到 3 个 PASS：工具调用与回填、非法参数回填、stream 节点更新。它使用假模型，不需要真实 LLM。'
  },
  {
    kind: 'checklist',
    title: '本篇跑通的标准',
    items: [
      '`bun run demo` 输出 3 个 PASS 与 `all createAgent checks passed`',
      '能说出 createAgent 接管的六项职责：循环、消息、Schema、校验、执行、状态',
      '能把 1.4 的 `chat.ts` / `agent.ts` 改写成 createAgent 版本',
      '能说出 invoke / stream / batch 的差别'
    ]
  },
  { kind: 'h2', text: '本讲产出' },
  {
    kind: 'p',
    text: '带走一个 createAgent 版天气 Agent、一张 1.4/2.1 职责对照表和可运行的 3 断言示例。下一篇 2.2 把模型初始化、消息类型与流式事件拆开讲。'
  },
  {
    kind: 'exercise',
    title: '2.1 练习：用框架重写，不改业务',
    items: [
      {
        id: 's2-1-e1',
        level: '基础',
        question:
          '把 1.4 的 `run()` 改写成 `createAgent`，保持 weather 工具的行为不变，跑一次并打印最后一条 AI 消息。',
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
