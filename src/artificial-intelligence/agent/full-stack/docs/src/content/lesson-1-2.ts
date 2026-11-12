import type { Block } from '../data/types.ts'

export const lesson12: Block[] = [
  {
    kind: 'p',
    text: '1.1 已经有了一次能跑的 SDK 调用。这一篇只加一个变量：**入口**。把调用收进一个 core，CLI 和 Hono 都只做最小适配；同时立住入口必须有的三道最小防线：Zod 校验、API Key 身份、统一错误码。配额、JWT、审计留到 9.4 / 11.1。'
  },
  {
    kind: 'note',
    tone: 'decision',
    title: '第一章只立最小防线',
    text: '本篇只做三件最小工程化：环境变量与请求体 Zod 校验、API Key 身份（只认身份，不做配额）、统一错误码。限流、JWT / session、审计日志属于 9.4 / 11.1，不在这一篇展开。'
  },
  { kind: 'h2', text: '目标：一个 core，两个最小入口' },
  {
    kind: 'p',
    text: '依赖方向只有一条：入口依赖 core，core 依赖自己定义的类型，SDK 实现反过来接在类型上。core 不认识 Hono，也不认识 OpenAI SDK。'
  },
  {
    kind: 'diagram',
    title: '依赖方向：入口 → core → 适配层',
    caption:
      '箭头只指向下层：入口依赖 core，core 只依赖自己定义的 `Llm` 类型，OpenAI SDK 被挡在 llm.ts 里。',
    width: 920,
    height: 430,
    groups: [
      { label: '入口层', x: 20, y: 16, w: 880, h: 92 },
      { label: 'core', x: 20, y: 132, w: 880, h: 92, tone: 'accent' },
      { label: '适配层', x: 20, y: 248, w: 880, h: 92, tone: 'violet' }
    ],
    nodes: [
      {
        id: 'cli',
        label: 'cli.ts',
        sub: '命令行入口',
        x: 90,
        y: 48,
        w: 160,
        h: 46,
        mono: true,
        tone: 'amber'
      },
      {
        id: 'server',
        label: 'server.ts',
        sub: 'Hono + SSE',
        x: 670,
        y: 48,
        w: 160,
        h: 46,
        mono: true,
        tone: 'amber'
      },
      {
        id: 'chat',
        label: 'chat.ts',
        sub: '组织 messages',
        x: 380,
        y: 164,
        w: 160,
        h: 46,
        mono: true,
        tone: 'accent'
      },
      {
        id: 'llm',
        label: 'llm.ts',
        sub: "唯一 import 'openai'",
        x: 370,
        y: 280,
        w: 180,
        h: 46,
        mono: true,
        tone: 'violet'
      },
      {
        id: 'api',
        label: 'OpenAI 兼容端点',
        sub: '模型服务',
        x: 360,
        y: 372,
        w: 200,
        h: 44,
        tone: 'blue'
      }
    ],
    edges: [
      { from: 'cli', to: 'chat', label: 'ask / stream' },
      { from: 'server', to: 'chat', label: 'ask / stream' },
      { from: 'chat', to: 'llm', label: 'complete / stream' },
      { from: 'llm', to: 'api', label: 'HTTPS' }
    ]
  },
  {
    kind: 'code',
    title: '目录',
    lang: 'text',
    code: String.raw`src/
├── llm.ts       # 唯一 import 'openai'：complete + stream
├── chat.ts      # core：组织 messages
├── cli.ts       # CLI 入口
└── server.ts    # Hono：POST /api/chat 流式输出
package.json     # scripts 与依赖`,
    caption: '四个源码文件加一个 package.json：core 不碰入口，入口不碰 SDK。'
  },
  {
    kind: 'code',
    title: 'package.json',
    lang: 'json',
    code: String.raw`{
  "type": "module",
  "scripts": {
    "dev": "bun --watch src/server.ts",
    "chat": "bun run src/cli.ts"
  },
  "dependencies": {
    "hono": "^4.13.18",
    "openai": "^7.55.0",
    "zod": "^4.6.7"
  }
}`,
    caption:
      '`bun run chat` / `bun run dev` 来自这里；没有它，讲义里的命令找不到脚本。'
  },
  { kind: 'h2', text: '第一步：把 SDK 收进 llm.ts' },
  {
    kind: 'p',
    text: 'core 只需要两个能力：一次性拿完整回答、逐段拿流式文本。先定义自己的类型，再让 SDK 适配它，避免 `openai` 的类型泄漏到业务层。'
  },
  {
    kind: 'code',
    title: 'llm.ts',
    lang: 'ts',
    code: String.raw`import OpenAI from 'openai'
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions'

export type ChatMessage = {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export type Llm = {
  complete(messages: ChatMessage[]): Promise<string>
  stream(messages: ChatMessage[]): AsyncIterable<string>
}

export function createLlm(
  env: Record<string, string | undefined> = process.env
): Llm {
  const apiKey = env.OPENAI_API_KEY
  if (!apiKey) throw new Error('缺少 OPENAI_API_KEY')

  const client = new OpenAI({
    apiKey,
    baseURL: env.OPENAI_BASE_URL ?? 'https://api.openai.com/v1',
    timeout: Number(env.LLM_TIMEOUT_MS ?? 30_000),
    maxRetries: 2
  })

  const model = env.DEFAULT_MODEL ?? 'gpt-4o-mini'

  return {
    async complete(messages) {
      const response = await client.chat.completions.create({
        model,
        messages: messages as ChatCompletionMessageParam[]
      })
      return response.choices[0]?.message.content ?? ''
    },

    async *stream(messages) {
      const stream = await client.chat.completions.create({
        model,
        messages: messages as ChatCompletionMessageParam[],
        stream: true
      })

      for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content
        if (text) yield text
      }
    }
  }
}`,
    caption:
      '`complete` 与 `stream` 只差 `stream: true` 和消费方式；超时、重试、baseURL 仍然交给 SDK。'
  },
  {
    kind: 'note',
    tone: 'tip',
    title: '为什么先定类型再写实现',
    text: '`ChatMessage` 与 `Llm` 是 core 的边界。以后换 Anthropic、换本地模型，只要再写一个满足 `Llm` 的工厂，`chat.ts` 一行都不用改。'
  },
  {
    kind: 'code',
    title: 'chat.ts',
    lang: 'ts',
    code: String.raw`import type { Llm } from './llm.ts'

export function createChat(llm: Llm) {
  return {
    ask(question: string): Promise<string> {
      return llm.complete([{ role: 'user', content: question }])
    },

    stream(question: string): AsyncIterable<string> {
      return llm.stream([{ role: 'user', content: question }])
    }
  }
}`,
    caption:
      'core 只有一件事：把「问题」翻译成 messages。它不读 env、不建 client、不碰 HTTP。'
  },
  { kind: 'h2', text: '第二步：CLI 是最小入口' },
  {
    kind: 'code',
    title: 'cli.ts',
    lang: 'ts',
    code: String.raw`import { createChat } from './chat.ts'
import { createLlm } from './llm.ts'

const question = Bun.argv.slice(2).join(' ').trim()

if (!question) {
  console.error('用法：bun run chat "你的问题"')
  process.exit(1)
}

const chat = createChat(createLlm())
console.log(await chat.ask(question))`,
    caption: '读 argv → 组装 → 打印，三件事。没有业务逻辑，也没有 Prompt。'
  },
  {
    kind: 'checklist',
    title: '运行前检查',
    items: [
      '`bun install` 已执行（hono / openai / zod）',
      '`.env` 里有 `OPENAI_API_KEY` 与至少 8 位的 `SERVICE_API_KEY`',
      '`bun run chat "用一句话解释什么是 token"` 能打印回答',
      '`chat.ts` 里没有 `process.env`、`hono`、`openai`'
    ]
  },
  { kind: 'h2', text: '第三步：Hono 流式接口' },
  {
    kind: 'p',
    text: 'HTTP 入口做四件事：验身份、校验请求体、把 core 的输出逐段写回去、把失败转成统一错误码。校验用 Zod；鉴权只认最小 API Key，不做配额。'
  },
  {
    kind: 'code',
    title: 'server.ts',
    lang: 'ts',
    code: String.raw`import { Hono } from 'hono'
import { streamSSE } from 'hono/streaming'
import { z } from 'zod'
import { createChat } from './chat.ts'
import { createLlm } from './llm.ts'

const EnvSchema = z.object({
  OPENAI_API_KEY: z.string().min(1),
  OPENAI_BASE_URL: z.url().optional(),
  DEFAULT_MODEL: z.string().min(1).optional(),
  LLM_TIMEOUT_MS: z.coerce.number().int().positive().optional(),
  SERVICE_API_KEY: z.string().min(8),
  PORT: z.coerce.number().int().positive().default(8787)
})

const BodySchema = z.object({
  message: z.string().trim().min(1, 'message 不能为空').max(2000)
})

const env = EnvSchema.safeParse(process.env)
if (!env.success) {
  console.error('环境变量不合法', env.error.flatten().fieldErrors)
  process.exit(1)
}

const app = new Hono()
const chat = createChat(createLlm(process.env))

function errorBody(code: string, message: string) {
  return { error: { code, message } }
}

app.use('/api/*', async (c, next) => {
  const header = c.req.header('authorization') ?? ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : ''

  if (token !== env.data.SERVICE_API_KEY) {
    return c.json(errorBody('unauthorized', '缺少或错误的 API Key'), 401)
  }

  await next()
})

app.post('/api/chat', async (c) => {
  const body = BodySchema.safeParse(await c.req.json().catch(() => null))

  if (!body.success) {
    return c.json(
      errorBody('invalid_body', body.error.issues[0]?.message ?? '请求体不合法'),
      400
    )
  }

  return streamSSE(c, async (stream) => {
    try {
      for await (const text of chat.stream(body.data.message)) {
        await stream.writeSSE({ event: 'delta', data: text })
      }
      await stream.writeSSE({ event: 'done', data: '' })
    } catch (error) {
      console.error('upstream_error', error)
      await stream.writeSSE({
        event: 'error',
        data: JSON.stringify(errorBody('upstream_error', '模型调用失败'))
      })
    }
  })
})

if (import.meta.main) {
  Bun.serve({ port: env.data.PORT, fetch: app.fetch })
  console.log('http://127.0.0.1:' + env.data.PORT)
}

export default app`,
    caption:
      '路由不认识 SDK：它只消费 `chat.stream()` 产出的文本片段，再按 SSE 格式写给客户端；鉴权、校验、错误码都在入口。'
  },
  {
    kind: 'note',
    tone: 'info',
    title: '超时留在适配层',
    text: '`LLM_TIMEOUT_MS` 由 `llm.ts` 的 client 统一配置，入口不重复设置；上游超时或 5xx 只转换成 `upstream_error`，避免每个入口各写一套。'
  },
  {
    kind: 'p',
    text: 'SSE 就是一行行 `event: xxx` + `data: xxx` 的纯文本。这里约定三种事件：`delta` 携带增量文本，`done` 表示结束，`error` 携带统一错误码。前端用 `fetch` 的流式读取消费；原生 `EventSource` 只支持 GET，不能直接发送 POST body，所以不适用于这里的 `POST /api/chat`。'
  },
  {
    kind: 'table',
    head: ['HTTP 状态', 'code', '触发场景'],
    rows: [
      ['401', 'unauthorized', '缺失或错误的 API Key'],
      ['400', 'invalid_body', 'message 为空或超过 2000 字'],
      ['200', '—', 'SSE 内再区分 delta / done / error']
    ]
  },
  {
    kind: 'diagram',
    title: '一次流式请求：请求向右，delta 向左',
    caption:
      '请求先过入口的鉴权与请求体校验，再从左往右穿过 core；模型每产出一个 chunk，就沿虚线以 `event: delta` 回到客户端。',
    width: 920,
    height: 260,
    nodes: [
      {
        id: 'client',
        label: '客户端',
        sub: 'curl / fetch',
        x: 20,
        y: 60,
        w: 140,
        h: 54
      },
      {
        id: 'route',
        label: 'POST /api/chat',
        sub: 'auth + Zod + streamSSE',
        x: 195,
        y: 60,
        w: 165,
        h: 54,
        mono: true,
        tone: 'amber'
      },
      {
        id: 'chat',
        label: 'chat.stream',
        sub: 'AsyncIterable',
        x: 395,
        y: 60,
        w: 150,
        h: 54,
        mono: true,
        tone: 'accent'
      },
      {
        id: 'llm',
        label: 'llm.stream',
        sub: 'stream: true',
        x: 580,
        y: 60,
        w: 150,
        h: 54,
        mono: true,
        tone: 'violet'
      },
      {
        id: 'model',
        label: '模型服务',
        sub: '逐 chunk 返回',
        x: 790,
        y: 60,
        w: 110,
        h: 54,
        tone: 'blue'
      }
    ],
    edges: [
      { from: 'client', to: 'route' },
      { from: 'route', to: 'chat' },
      { from: 'chat', to: 'llm' },
      { from: 'llm', to: 'model', label: 'HTTPS' },
      {
        from: 'model',
        to: 'client',
        label: 'event: delta × N',
        dashed: true,
        bend: -130
      }
    ]
  },
  {
    kind: 'code',
    title: '用 curl 看流式输出',
    lang: 'bash',
    code: String.raw`# .env
# SERVICE_API_KEY=dev-secret

bun run dev

curl -N http://127.0.0.1:8787/api/chat \
  -H 'authorization: Bearer dev-secret' \
  -H 'content-type: application/json' \
  -d '{"message":"杭州明天要带伞吗？"}'`,
    caption:
      '`-N` 关闭缓冲；你会看到 `event: delta` 一条条出现，最后是 `event: done`。去掉 authorization 会先得到 401，不会进入模型调用。'
  },
  { kind: 'demo', id: 'sse-stream' },
  { kind: 'h2', text: '边界：什么该留在入口' },
  {
    kind: 'table',
    head: ['层', '只做什么', '不做什么'],
    rows: [
      ['cli.ts / server.ts', '读输入、组装 core、输出结果', '不写业务逻辑'],
      ['chat.ts', '组织 messages、调用 Llm', '不读 env、不碰 Hono'],
      ['llm.ts', 'SDK 调用与结构转换', '不决定 HTTP 响应']
    ]
  },
  {
    kind: 'note',
    tone: 'warn',
    title: '判断边界是否成立',
    text: '再加一个入口（队列消费者、定时任务、WebSocket）时，如果需要改 `chat.ts`，说明业务逻辑还在入口里；如果只在入口文件里换一行接线，说明边界成立。'
  },
  {
    kind: 'note',
    tone: 'info',
    title: '这一篇做到哪、留到哪',
    text: '本篇做最小身份（API Key）、统一错误码、env / body Zod 校验；配额与限流、JWT / session、审计日志留到 9.4 / 11.1。判断标准不是「有没有鉴权」，而是「换入口时能不能不改 core」。'
  },
  { kind: 'h2', text: '验收清单' },
  {
    kind: 'checklist',
    title: '本篇跑通的标准',
    items: [
      '`bun run chat "..."` 能打印回答',
      '`curl -N` 带 `authorization` 请求 `/api/chat`，能看到 `event: delta` 与 `event: done`',
      '不带 `authorization` 返回 401，body 为 `{ error: { code: "unauthorized" } }`',
      '空 `message` 返回 400，body 为 `{ error: { code: "invalid_body" } }`',
      '`chat.ts` 不依赖 `hono`、`openai`、`process.env`',
      '能在图上指出：CLI 与 HTTP 共用的是哪一行代码'
    ]
  },
  { kind: 'h2', text: '本讲产出' },
  {
    kind: 'p',
    text: '带走四个源码文件加 `package.json` 的最小工程：`llm.ts`（SDK 适配）、`chat.ts`（core）、`cli.ts`、`server.ts`（Hono + SSE + 最小鉴权）。下一篇 1.3 在 core 里加 Prompt 契约，入口层仍然不动。'
  },
  {
    kind: 'exercise',
    title: '1.2 练习：把入口写薄',
    items: [
      {
        id: 's1-2-e1',
        level: '基础',
        question:
          '给 `/api/chat` 加一个 `system` 可选参数，透传到 core，但不改 `Llm` 接口。',
        hint: '`chat.ts` 里拼 messages，`server.ts` 只负责把字符串传进去。',
        answer:
          '在 `createChat` 的 `ask` / `stream` 上加第二个参数，route 透传即可。',
        solution:
          '`messages` 的拼接属于 core；route 不做 `role` 判断，否则换入口时又要复制一遍。'
      },
      {
        id: 's1-2-e2',
        level: '改造',
        question: '把 CLI 也改成流式输出，复用同一个 `chat.stream()`。',
        hint: '`for await` 遍历，逐段 `process.stdout.write`。',
        answer: 'CLI 消费 `chat.stream`，与 HTTP 的 SSE 循环结构一致。',
        solution:
          '重点不是打印好看，而是验证「同一 core 两种消费方式」：一个逐段写 stdout，一个逐段写 SSE。'
      },
      {
        id: 's1-2-e3',
        level: '排障',
        question: '`curl` 能连上，但一直挂住看不到字，最后超时。先查哪两处？',
        hint: '一看有没有加 `-N`，二看上游是否真的在流式返回。',
        answer:
          '先确认客户端没缓冲，再确认 `stream: true` 真的生效、chunk 里有 `delta.content`。',
        solution:
          '很多「没有流式」其实是代理或终端缓冲；把 `-N` 加上再判断。若仍无输出，在 `llm.ts` 的循环里打印 chunk 结构。'
      },
      {
        id: 's1-2-e4',
        level: '设计',
        question: '如果明天要接一个 WebSocket 入口，当前的四个文件需要改哪些？',
        hint: '从「谁会变、谁不该变」划分。',
        answer:
          '只新增一个入口文件，消费 `chat.stream()`；`chat.ts` 与 `llm.ts` 不改。',
        solution:
          '如果发现要改 `chat.ts` 才能接 WebSocket，说明入口职责漏进了 core，先把它们挪回去。'
      }
    ]
  },
  { kind: 'h2', text: '面试问答' },
  {
    kind: 'table',
    head: ['问题', '一句话答案'],
    rows: [
      [
        '为什么不在 route 里直接调模型？',
        '入口会变多（CLI、队列、WebSocket），业务逻辑压在 route 里，每加一个入口就要复制一遍。'
      ],
      [
        'core 为什么不直接 import OpenAI SDK？',
        '避免厂商类型与实现泄漏进业务；用 `Llm` 类型隔开，换 SDK 或写 fake 都不用改 core。'
      ],
      [
        '流式输出怎么实现？',
        '模型侧 `stream: true` 逐 chunk 返回，入口侧用 SSE 把每个 delta 写给客户端，最后发 done。'
      ],
      [
        '为什么选 Hono，而不是 Express / Fastify？',
        '基于 Web Standard Request / Response，Bun、Node、Edge 同一套代码；依赖小、启动快，内置 SSE helper，适合课程里的最小入口。'
      ],
      [
        'SSE 与 WebSocket 怎么选？',
        'SSE 是单向服务器推送、走 HTTP 文本、浏览器自动重连，适合 token 流；WebSocket 双向、支持二进制，但要自己做心跳、重连与协议，适合协作和语音。'
      ],
      [
        '鉴权与错误码做到什么程度？',
        '对外接口从第一天就要最小身份与统一错误码：本篇用 API Key + `{ error: { code, message } }`；配额、JWT、审计再按 9.4 / 11.1 升级。'
      ]
    ]
  },
  {
    kind: 'note',
    tone: 'interview',
    title: '追问：这不就是过度设计吗？',
    text: '只有一个 HTTP 入口、永远不换模型时，确实可以直接写在 route 里。但课程后面要加 CLI、工具循环、评估和多入口，边界越早立越便宜。这里的抽象只有两个类型和一个工厂，没有 DI 容器。'
  },
  {
    kind: 'links',
    title: '官方参考',
    items: [
      {
        label: 'OpenAI Node SDK',
        href: 'https://github.com/openai/openai-node',
        note: 'client 配置与流式用法'
      },
      {
        label: 'Hono 文档',
        href: 'https://hono.dev/docs/',
        note: '路由、中间件与 app.request'
      },
      {
        label: 'Hono Streaming Helper',
        href: 'https://hono.dev/docs/helpers/streaming',
        note: 'streamSSE 与 stream 的区别'
      }
    ]
  }
]
