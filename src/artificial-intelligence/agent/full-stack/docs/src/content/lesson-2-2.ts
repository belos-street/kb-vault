import type { Block } from '../data/types.ts'

export const lesson22: Block[] = [
  {
    kind: 'p',
    text: '这一篇只加一个变量：**模型与消息**。Agent 的循环已经跑通，但每次换 provider、加多模态、接流式，消息结构都会变。这一篇把「模型怎么初始化、消息有哪些类型、Prompt 怎么组装、流式事件怎么消费」收成一套可迁移的写法。'
  },
  {
    kind: 'note',
    tone: 'decision',
    title: '消息是 Agent 的通用语言',
    text: '不同 provider 的原始协议不一样：OpenAI 用 `tool_calls`，Anthropic 用 `tool_use` 内容块。LangChain 把它们归一到 `SystemMessage / HumanMessage / AIMessage / ToolMessage`，业务只跟这套消息打交道。'
  },
  { kind: 'h2', text: '模型初始化：字符串快跑，实例可控' },
  {
    kind: 'code',
    title: '两种初始化方式',
    lang: 'ts',
    code: String.raw`import { ChatOpenAI } from '@langchain/openai'
import { initChatModel } from 'langchain'

// 1) 直接实例：配置最直观
const model = new ChatOpenAI({
  model: 'gpt-4o-mini',
  temperature: 0.2
})

// 2) 字符串 + 通用初始化：适合按环境切 provider
const modelFromEnv = await initChatModel('openai:gpt-4o-mini', {
  temperature: 0.2
})`,
    caption:
      '字符串写法需要安装对应 provider 包；实例写法适合自定义 baseURL、headers、超时与重试。'
  },
  {
    kind: 'table',
    head: ['写法', '适合', '注意'],
    rows: [
      [
        'new ChatOpenAI(...)',
        '单 provider、需要细配置',
        '要自己管理 provider 包'
      ],
      [
        'initChatModel("provider:model")',
        '多 provider、配置驱动',
        '前缀与包名必须对应'
      ],
      ['createAgent({ model: "..." })', '快速跑通', '内部同样需要 provider 包']
    ]
  },
  {
    kind: 'checklist',
    title: '运行前检查',
    items: [
      '本篇是阅读型速过篇，不单独提供示例工程',
      '可运行验证沿用 `docs/examples/2-1-create-agent`：`cd examples/2-1-create-agent && bun run demo` 输出 3 个 PASS',
      '跟练消息类型时，在已安装 `langchain` 的工程里新建 `message-roles.ts`，跑本页代码'
    ]
  },
  { kind: 'h2', text: '消息类型：四个常用角色，一套字段' },
  {
    kind: 'code',
    title: '一次工具调用里的四个角色',
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
      'AI 消息可以同时有 content 与 tool_calls；Tool 消息必须带 tool_call_id，否则模型对不上是哪个调用。'
  },
  {
    kind: 'table',
    head: ['消息', '作用', '关键字段'],
    rows: [
      ['SystemMessage', '规则、边界、身份', 'content'],
      ['HumanMessage', '用户输入，可多模态', 'content / contentBlocks'],
      ['AIMessage', '模型输出，可能带工具调用', 'content / tool_calls'],
      ['ToolMessage', '工具结果回填', 'tool_call_id / content']
    ]
  },
  {
    kind: 'note',
    tone: 'info',
    title: '四类不是穷举',
    text: '这四类是业务最常用的；LangChain 还提供 `FunctionMessage`、`RemoveMessage` 等类型。先把四个常用角色用对，需要时再查消息 API，不要把「四类」当完整清单。'
  },
  {
    kind: 'code',
    title: '用 contentBlocks 读统一块结构',
    lang: 'ts',
    code: String.raw`const blocks = history[1]?.contentBlocks ?? []
// [{ type: 'text', text: '退款多久到账？' }]

for (const block of blocks) {
  if (block.type === 'text') {
    console.log(block.text)
  }
}`,
    caption:
      'contentBlocks 把文本、图片、工具块统一成标准块；不要在业务里直接摸 provider 原始字段。'
  },
  { kind: 'demo', id: 'message-roles' },
  { kind: 'h2', text: 'Prompt 模板：把多轮对话组装成 messages' },
  {
    kind: 'code',
    title: 'prompt.ts',
    lang: 'ts',
    code: String.raw`import { ChatPromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts'
import { AIMessage, HumanMessage } from '@langchain/core/messages'

const prompt = ChatPromptTemplate.fromMessages([
  ['system', '你是客服助手。回答不超过三句话；没有依据时直接说不知道。'],
  new MessagesPlaceholder('history'),
  ['human', '{message}']
])

const chain = prompt.pipe(model)

const reply = await chain.invoke({
  history: [
    new HumanMessage('我叫 Bob'),
    new AIMessage('你好，Bob')
  ],
  message: '我叫什么？'
})`,
    caption:
      'MessagesPlaceholder 负责把历史消息原样放回去；历史不要拼成一段字符串，否则角色与 tool_call_id 都会丢。'
  },
  {
    kind: 'note',
    tone: 'warn',
    title: '不要把历史拼成字符串',
    text: '把多轮历史拼成「用户：… AI：…」会丢掉角色、tool_calls 与 tool_call_id。需要裁剪时用 `trimMessages`，需要摘要时用中间件，不要用字符串拼接代替消息结构。'
  },
  { kind: 'h2', text: '流式事件：消费 on_chat_model_stream' },
  {
    kind: 'code',
    title: 'streamEvents 最小消费',
    lang: 'ts',
    code: String.raw`const stream = await chain.streamEvents(
  { history: [], message: '用一句话解释 token' },
  { version: 'v2' }
)

for await (const event of stream) {
  if (event.event === 'on_chat_model_stream') {
    process.stdout.write(String(event.data.chunk.content ?? ''))
  }
}`,
    caption:
      'streamEvents 是 Runnable 的通用事件流：on_chat_model_start / stream / end、on_tool_start / end 都能拿到。'
  },
  {
    kind: 'table',
    head: ['事件', '用途'],
    rows: [
      ['on_chat_model_start', '模型开始，记录输入与耗时'],
      ['on_chat_model_stream', '逐 token / chunk 输出'],
      ['on_tool_start / on_tool_end', '工具过程可见'],
      ['on_chain_end / on_chain_error', '收口与错误定位']
    ]
  },
  {
    kind: 'note',
    tone: 'tip',
    title: '流式只解决「过程可见」',
    text: '流式不是协议的全部：前端还要处理断线、重连、取消与错误事件。那部分在阶段八；本篇只保证你能消费模型与工具事件。'
  },
  { kind: 'h2', text: '验收清单' },
  {
    kind: 'checklist',
    title: '本篇跑通的标准',
    items: [
      '能用字符串与实例两种方式初始化同一个模型',
      '能写出 System / Human / AI(tool_calls) / Tool 四个角色并让 tool_call_id 对上',
      '能用 ChatPromptTemplate + MessagesPlaceholder 组装多轮 Prompt',
      '能只打印 on_chat_model_stream 的文本 chunk，不打印整段事件'
    ]
  },
  { kind: 'h2', text: '本讲产出' },
  {
    kind: 'p',
    text: '带走模型初始化两种写法、常用消息速查表、Prompt 模板和 streamEvents 消费代码。下一篇 2.3 把工具入参与输出都收进同一套 Zod 契约（已上线，可回看）。'
  },
  {
    kind: 'exercise',
    title: '2.2 练习：把消息写对',
    items: [
      {
        id: 's2-2-e1',
        level: '基础',
        question:
          '构造一轮「用户问订单状态 → AI 调 getOrder → 工具返回已退款」的消息序列，并打印每条消息的 `getType()`。',
        hint: 'AI 消息用 `tool_calls`；Tool 消息用 `tool_call_id`。',
        answer:
          'system / human / ai / tool 四个常用角色，tool 消息的 id 与 ai 的 tool_calls[0].id 一致。',
        solution:
          '检查 tool_calls 的 id 与 ToolMessage.tool_call_id 是否完全相同；不一致时模型会重复调用工具。'
      },
      {
        id: 's2-2-e2',
        level: '排障',
        question:
          '流式输出里 `on_chat_model_stream` 有事件，但前端拼出来的文本是 `[object Object]`，先查什么？',
        hint: 'chunk.content 可能是字符串，也可能是 content block 数组。',
        answer: '先把 chunk 归一化成文本块，再拼接；不要直接 String(chunk)。',
        solution:
          '用 `chunk.contentBlocks` 过滤 `type === "text"`，或按 provider 的 content 结构取文本。'
      },
      {
        id: 's2-2-e3',
        level: '设计',
        question:
          '为同时接入 OpenAI / Anthropic 的消息层设计一个归一化方案：哪些字段统一，哪些保留在 provider 扩展里？',
        hint: '从 role、content、tool_calls、多模态四类信息分别判断。',
        answer:
          'role 与纯文本 content 统一；tool_calls / tool_call_id 统一成内部结构；多模态与 provider 专有字段放 contentBlocks 或 metadata。',
        solution:
          '归一化只做业务需要的字段；不要试图抹平所有 provider 差异，否则会丢能力。'
      }
    ]
  },
  { kind: 'h2', text: '面试问答' },
  {
    kind: 'table',
    head: ['问题', '一句话答案'],
    rows: [
      [
        '消息角色怎么设计？',
        'System 放规则与边界，Human 放用户输入，AI 放模型输出与 tool_calls，Tool 放带 tool_call_id 的结果。'
      ],
      [
        '流式事件怎么消费？',
        '用 streamEvents(version: "v2") 监听 on_chat_model_stream 拼文本，on_tool_start/end 展示工具过程。'
      ],
      [
        '多 Provider 怎么初始化？',
        '用 initChatModel 或 provider 实例，把模型注入 Agent；业务不直接依赖某个 provider 的原始协议。'
      ]
    ]
  },
  {
    kind: 'note',
    tone: 'interview',
    title: '追问：为什么不能直接拼历史字符串？',
    text: '字符串会丢掉角色、tool_calls 与 tool_call_id，模型无法区分「谁说的」和「哪个工具结果」。多轮与工具调用必须用消息结构，不用文本拼接。'
  },
  {
    kind: 'links',
    title: '官方参考',
    items: [
      {
        label: 'LangChain Messages',
        href: 'https://docs.langchain.com/oss/javascript/langchain/messages',
        note: '消息类型与 content blocks'
      },
      {
        label: 'LangChain Prompts API',
        href: 'https://reference.langchain.com/javascript/langchain_core/prompts/',
        note: 'ChatPromptTemplate 与 MessagesPlaceholder'
      },
      {
        label: 'LangChain Streaming',
        href: 'https://docs.langchain.com/oss/javascript/langchain/streaming',
        note: 'stream 与 streamEvents'
      },
      {
        label: 'LangChain Models',
        href: 'https://docs.langchain.com/oss/javascript/langchain/models',
        note: 'provider 初始化与配置'
      }
    ]
  }
]
