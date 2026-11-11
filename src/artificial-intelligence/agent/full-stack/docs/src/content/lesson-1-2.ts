import type { Block } from '../data/types.ts'

export const lesson12: Block[] = [
  {
    kind: 'p',
    text: '这一篇只加一个变量：**HTTP 服务基线**。上一章的 `call-llm.ts` 是一个脚本，这一篇把它包成 Hono 服务，加上 Zod 校验、最小 SSE、分层、超时与 API Key。不做 Agent 循环，也不接检索。'
  },
  {
    kind: 'note',
    tone: 'tip',
    title: '为什么第二篇就起服务',
    text: '后面所有能力最终都要以 HTTP 形式交付：Agent 要接口、RAG 要接口、流式要接口。早一步把分层与错误码立好，后面每加一个变量都只改一层，不用推倒重来。'
  },
  { kind: 'h2', text: '先跑通：把裸调用包成服务' },
  {
    kind: 'code',
    title: 'server.ts',
    lang: 'ts',
    code: String.raw`import { Hono } from 'hono'
import { z } from 'zod'
import { apiKeyAuth } from './middleware/auth.ts'

const app = new Hono<{ Variables: { tenantId: string } }>()

// 先挂鉴权，再注册业务路由
app.use('/api/*', apiKeyAuth())

export const ChatInput = z.object({
  threadId: z.string().min(1),
  message: z.string().min(1).max(4000)
})

app.post('/api/chat', async (c) => {
  const body = await c.req.json().catch(() => null)
  const parsed = ChatInput.safeParse(body)
  if (!parsed.success) {
    return c.json(
      {
        code: 'invalid_input',
        message: parsed.error.issues
          .map((issue) => issue.path.join('.') + ': ' + issue.message)
          .join('; ')
      },
      400
    )
  }

  const apiKey = process.env.LLM_API_KEY
  if (!apiKey) {
    return c.json({ code: 'server_misconfigured', message: '缺少 LLM_API_KEY' }, 500)
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 30_000)

  try {
    const response = await fetch(
      (process.env.LLM_BASE_URL ?? 'https://api.openai.com/v1') +
        '/chat/completions',
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: 'Bearer ' + apiKey
        },
        body: JSON.stringify({
          model: process.env.LLM_MODEL ?? 'gpt-4o-mini',
          messages: [{ role: 'user', content: parsed.data.message }]
        }),
        signal: controller.signal
      }
    )

    if (response.status === 429) {
      return c.json({ code: 'upstream_rate_limited', message: '稍后重试' }, 429)
    }
    if (!response.ok) {
      return c.json(
        { code: 'upstream_error', message: '上游返回 ' + response.status },
        502
      )
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>
    }
    const content = data.choices?.[0]?.message?.content ?? ''

    return c.json({ threadId: parsed.data.threadId, reply: content })
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return c.json({ code: 'upstream_timeout', message: '模型超时' }, 504)
    }
    return c.json({ code: 'internal_error', message: '服务内部错误' }, 500)
  } finally {
    clearTimeout(timer)
  }
})

export default app`,
    caption:
      '一个路由里同时做了入参校验、上游调用、错误映射与超时；这一节后半会把它拆到三层。'
  },
  {
    kind: 'checklist',
    title: '运行前检查',
    items: [
      '`bun add hono zod` 已安装',
      '`LLM_API_KEY` 已设置；`LLM_BASE_URL` / `LLM_MODEL` 可选',
      '`SERVICE_API_KEY` 已设置，调用时带 `Authorization: Bearer <key>`（见下文 `apiKeyAuth`）',
      '`bun run server.ts` 启动后，`/api/chat` 能返回 `reply`；不带 Key 应得到 401'
    ]
  },
  { kind: 'h2', text: '分层：route / service / agent' },
  {
    kind: 'p',
    text: '一个路由里塞完所有逻辑，第三篇加 Prompt、第四篇加工具时就会开始互相污染。最小分层只做三件事：route 负责 HTTP，service 负责编排与错误映射，agent 负责模型调用。'
  },
  {
    kind: 'table',
    head: ['层', '只做什么', '不做什么'],
    rows: [
      ['route', '解析请求、校验入参、返回状态码', '不拼 Prompt、不调模型'],
      ['service', '编排步骤、超时、错误映射、埋点', '不关心 HTTP 细节'],
      ['agent', '组装 messages、调用模型、解析输出', '不处理鉴权与路由']
    ]
  },
  {
    kind: 'code',
    title: 'lib/errors.ts',
    lang: 'ts',
    code: String.raw`export type AppErrorStatus = 400 | 401 | 403 | 422 | 429 | 500 | 502 | 504

export class AppError extends Error {
  constructor(
    readonly code: string,
    readonly status: AppErrorStatus,
    message: string
  ) {
    super(message)
    this.name = 'AppError'
  }
}`,
    caption: '错误码与 HTTP 状态码绑定在一处，route 只负责转成响应。'
  },
  {
    kind: 'code',
    title: 'agents/chat.ts',
    lang: 'ts',
    code: String.raw`export type ChatMessage = {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export async function callModel(input: {
  messages: ChatMessage[]
  signal: AbortSignal
}): Promise<string> {
  const apiKey = process.env.LLM_API_KEY
  if (!apiKey) throw new Error('missing LLM_API_KEY')

  const response = await fetch(
    (process.env.LLM_BASE_URL ?? 'https://api.openai.com/v1') +
      '/chat/completions',
    {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: 'Bearer ' + apiKey
      },
      body: JSON.stringify({
        model: process.env.LLM_MODEL ?? 'gpt-4o-mini',
        messages: input.messages
      }),
      signal: input.signal
    }
  )

  if (!response.ok) {
    const error = new Error('upstream ' + response.status)
    Object.assign(error, { status: response.status })
    throw error
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>
  }
  return data.choices?.[0]?.message?.content ?? ''
}`,
    caption: 'agent 层不决定错误该映射成几号状态码，只把上游状态挂在 error 上。'
  },
  {
    kind: 'code',
    title: 'services/chat.ts',
    lang: 'ts',
    code: String.raw`import { callModel } from '../agents/chat.ts'
import { AppError } from '../lib/errors.ts'

export async function chat(input: { message: string }): Promise<string> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 30_000)

  try {
    return await callModel({
      messages: [{ role: 'user', content: input.message }],
      signal: controller.signal
    })
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new AppError('upstream_timeout', 504, '模型超时')
    }

    const status = (error as Error & { status?: number }).status
    if (status === 429) {
      throw new AppError('upstream_rate_limited', 429, '稍后重试')
    }
    if (typeof status === 'number') {
      throw new AppError('upstream_error', 502, '上游返回 ' + status)
    }
    throw new AppError('internal_error', 500, '服务内部错误')
  } finally {
    clearTimeout(timer)
  }
}`,
    caption: '超时、错误映射、日志都在 service；换 CLI 入口时这一层不用动。'
  },
  {
    kind: 'code',
    title: 'routes/chat.ts',
    lang: 'ts',
    code: String.raw`import type { Hono } from 'hono'
import { z } from 'zod'
import { chat } from '../services/chat.ts'
import { AppError } from '../lib/errors.ts'

export const ChatInput = z.object({
  threadId: z.string().min(1),
  message: z.string().min(1).max(4000)
})

export function registerChatRoutes(
  app: Hono<{ Variables: { tenantId: string } }>
) {
  app.post('/api/chat', async (c) => {
    const body = await c.req.json().catch(() => null)
    const parsed = ChatInput.safeParse(body)
    if (!parsed.success) {
      return c.json(
        {
          code: 'invalid_input',
          message: parsed.error.issues
            .map((issue) => issue.path.join('.') + ': ' + issue.message)
            .join('; ')
        },
        400
      )
    }

    try {
      const reply = await chat({ message: parsed.data.message })
      return c.json({ threadId: parsed.data.threadId, reply })
    } catch (error) {
      if (error instanceof AppError) {
        return c.json({ code: error.code, message: error.message }, error.status)
      }
      return c.json({ code: 'internal_error', message: '服务内部错误' }, 500)
    }
  })
}`,
    caption:
      'route 只做两件事：把请求翻译成 service 调用，把 AppError 翻译成响应。'
  },
  {
    kind: 'code',
    title: 'server.ts（组装根）',
    lang: 'ts',
    code: String.raw`import { Hono } from 'hono'
import { apiKeyAuth } from './middleware/auth.ts'
import { registerChatRoutes } from './routes/chat.ts'
import { registerChatStream } from './routes/chat-stream.ts'

const app = new Hono<{ Variables: { tenantId: string } }>()
app.use('/api/*', apiKeyAuth())
registerChatRoutes(app)
registerChatStream(app)

export default app`,
    caption: '原来的大文件缩成组装根：建 app、挂中间件、注册路由。'
  },
  {
    kind: 'note',
    tone: 'warn',
    title: '分层的判断标准',
    text: '如果换一个入口（CLI、队列消费者）时不需要改 agent 层，分层就成立；如果每加一个入口都要复制 route 里的逻辑，说明业务逻辑还压在路由里。'
  },
  { kind: 'h2', text: '最小 SSE：先把过程送出去' },
  {
    kind: 'code',
    title: 'routes/chat-stream.ts',
    lang: 'ts',
    code: String.raw`import type { Hono } from 'hono'
import { streamSSE } from 'hono/streaming'
import { ChatInput } from './chat.ts'

export function registerChatStream(
  app: Hono<{ Variables: { tenantId: string } }>
) {
  app.post('/api/chat/stream', async (c) => {
    const body = await c.req.json().catch(() => null)
    const parsed = ChatInput.safeParse(body)
    if (!parsed.success) {
      return c.json({ code: 'invalid_input', message: '参数不合法' }, 400)
    }

    return streamSSE(c, async (stream) => {
      await stream.writeSSE({
        event: 'meta',
        data: JSON.stringify({ requestId: crypto.randomUUID() })
      })

      // 这里先用假分片；真实实现接模型 stream
      for (const delta of ['退款', '会在', ' 3-5 ', '个工作日', '到账']) {
        await stream.writeSSE({
          event: 'delta',
          data: JSON.stringify({ delta })
        })
        await stream.sleep(120)
      }

      await stream.writeSSE({
        event: 'done',
        data: JSON.stringify({ finishReason: 'stop' })
      })
    })
  })
}`,
    caption:
      '与业务路由注册到同一个 app，鉴权中间件已在 server.ts 统一挂过。只做 message 级事件：meta / delta / done；完整协议与断线重连见 8.2。'
  },
  { kind: 'demo', id: 'sse-stream' },
  {
    kind: 'table',
    head: ['事件', '用途', '前端怎么处理'],
    rows: [
      ['meta', 'requestId、模型名等元信息', '记下来，断线续传用'],
      ['delta', '增量文本', '追加到当前气泡'],
      [
        'error',
        '可重试 / 不可重试错误（设计位，本篇不触发，8.2 实现）',
        '展示重试按钮或降级提示'
      ],
      ['done', '结束原因', '关闭连接、结束 loading']
    ]
  },
  {
    kind: 'note',
    tone: 'info',
    title: 'SSE 与 WebSocket 怎么选',
    text: '单向、文本、要过普通 HTTP 中间件，选 SSE；需要双向、低延迟、二进制，选 WebSocket。Agent 的「服务端持续推送」天然是单向，SSE 足够；但浏览器自动重连只对 `EventSource` 的 GET 场景成立，POST 流要自己处理。'
  },
  {
    kind: 'note',
    tone: 'warn',
    title: 'POST SSE 没有自动重连',
    text: '`EventSource` 只支持 GET，浏览器会自动重连；本篇的 `/api/chat/stream` 是 POST，前端必须用 `fetch` + `ReadableStream` 消费，断线续传也要自己实现（`lastEventId` / 游标）。完整协议见 8.2。'
  },
  { kind: 'h2', text: '错误码与超时：别让上游错误穿透' },
  {
    kind: 'p',
    text: '上游的 401 / 429 / 500 不应该原样丢给前端。前端只关心五类：参数错（400）、没权限（401 / 403）、业务失败（422）、稍后重试（429 / 502 / 504）、服务坏了（500）。'
  },
  {
    kind: 'table',
    head: ['场景', '返回码', '前端动作'],
    rows: [
      ['入参不合法', '400 invalid_input', '提示具体字段'],
      ['缺少 / 错误 API Key', '401 unauthorized', '跳登录或提示配置'],
      ['工具权限不足', '403 permission_denied', '提示无权限或转人工'],
      [
        '业务失败（如 Agent 循环超限）',
        '422 max_steps_exceeded',
        '展示原因或转人工'
      ],
      ['上游限流', '429 upstream_rate_limited', '退避重试，展示倒计时'],
      ['上游超时', '504 upstream_timeout', '重试或换备用模型'],
      ['上游 5xx', '502 upstream_error', '重试 + 告警'],
      ['自身异常', '500 internal_error', '提示稍后再试，带 traceId']
    ]
  },
  {
    kind: 'note',
    tone: 'warn',
    title: '超时要分两层',
    text: '服务自身要有一个总超时（比如 30s），调用上游还要有单次超时。只设一层时，重试会叠加，最终用户等 90s 才看到失败。'
  },
  { kind: 'h2', text: 'API Key 最小鉴权' },
  {
    kind: 'code',
    title: 'middleware/auth.ts',
    lang: 'ts',
    code: String.raw`import type { MiddlewareHandler } from 'hono'

export function apiKeyAuth(): MiddlewareHandler {
  const expected = process.env.SERVICE_API_KEY

  return async (c, next) => {
    if (!expected) {
      return c.json({ code: 'server_misconfigured' }, 500)
    }

    const header = c.req.header('authorization') ?? ''
    const token = header.startsWith('Bearer ') ? header.slice(7) : ''

    if (!token || token !== expected) {
      return c.json({ code: 'unauthorized' }, 401)
    }

    c.set('tenantId', c.req.header('x-tenant-id') ?? 'default')
    await next()
  }
}`,
    caption:
      '只做身份，不做配额；配额、租户隔离与 RBAC 分别在阶段九、阶段十与 6.7 展开。'
  },
  {
    kind: 'p',
    text: '注意这里只是「最小鉴权」：常量时间比较、Key 轮换、配额与审计都不在本篇。它的作用是让后面的接口从第一天就有身份概念，而不是最后再补。'
  },
  { kind: 'h2', text: '验收清单' },
  {
    kind: 'checklist',
    title: '本篇跑通的标准',
    items: [
      '非法入参返回 400 与 `invalid_input`，错误信息能指出具体字段',
      '不带或带错 Key 返回 401；带对 Key 能返回 `reply`',
      '`/api/chat/stream` 能按 `meta → delta… → done` 输出事件',
      '把上游超时改成 1ms，能返回 504 而不是挂住'
    ]
  },
  { kind: 'h2', text: '本讲产出' },
  {
    kind: 'p',
    text: '带走 `server.ts`、`lib/errors.ts` 与三层拆分代码，以及错误码表与 API Key 中间件。下一篇 1.3 会在这个服务上加 Prompt 契约：结构化输出、few-shot、模板版本化与注入防护。'
  },
  {
    kind: 'exercise',
    title: '1.2 练习：把服务基线补硬',
    items: [
      {
        id: 's1-2-e1',
        level: '基础',
        question:
          '给 `/api/chat` 加一个 `maxTokens` 可选参数（1~4096），默认 800。',
        hint: '在 Zod Schema 里用 `.int().min(1).max(4096).default(800)`，再透传给上游。',
        answer: '`maxTokens: z.number().int().min(1).max(4096).default(800)`。',
        solution:
          '默认值写在 Schema 里，服务层直接用 `parsed.data.maxTokens`；不要在路由里再写一次 `?? 800`。'
      },
      {
        id: 's1-2-e2',
        level: '改造',
        question: '把 1.1 的 `call-llm.ts` 拆成 route / service / agent 三层。',
        hint: '先让 agent 只接收 messages 返回文本，再把超时和错误映射上移到 service。',
        answer:
          'route 只管校验与响应，service 管超时与错误码，agent 管模型调用。',
        solution:
          '判断标准：新增一个 CLI 入口时，如果不需要改 agent 层，拆分就合格。'
      },
      {
        id: 's1-2-e3',
        level: '排障',
        question:
          '前端说「点发送后一直转圈，30 秒后报 504」。按本篇的分层，先查哪一层？',
        hint: '先看是服务总超时还是上游单次超时；再看有没有把 AbortError 映射成 504。',
        answer: '先查 service 的超时与错误映射，再查上游响应时间。',
        solution:
          '看日志里有没有 `upstream_timeout`：有就是上游慢；没有但请求挂住，就是总超时没设或没把 AbortError 转成 504。'
      },
      {
        id: 's1-2-e4',
        level: '设计',
        question:
          '要给 SSE 加「断线后继续」能力，设计一个最小方案，不引入 Redis。',
        hint: '从 requestId + 游标（第几个 delta）入手，先想单机内存能不能做。',
        answer: 'requestId + 序号游标 + 单机内存 buffer，重连时从游标继续。',
        solution:
          '服务端为每个 requestId 保留最近 N 个事件与递增序号；前端重连带 `lastEventId`，服务端从该序号后续发。单机够用；多实例再换共享存储。'
      }
    ]
  },
  { kind: 'h2', text: '面试问答' },
  {
    kind: 'table',
    head: ['问题', '一句话答案'],
    rows: [
      [
        '为什么选 Hono？',
        '多运行时、类型友好、SSE 与 RPC 内置，Bun 下启动快；生态比 Express 小但够用。'
      ],
      [
        'SSE 与 WebSocket 的取舍？',
        '单向推送选 SSE，双向低延迟选 WebSocket；SSE 过普通 HTTP，断线重连更简单。'
      ],
      [
        '错误码怎么设计？',
        '按前端可执行动作分类：改参数、去登录、稍后重试、找运维，而不是照搬上游状态码。'
      ]
    ]
  },
  {
    kind: 'note',
    tone: 'interview',
    title: '追问：为什么不在 route 里直接调模型？',
    text: '因为入口会变多（HTTP、CLI、队列消费者），业务逻辑压在 route 里，每加一个入口就要复制一遍超时、错误映射与日志。分层是为了让「入口」和「能力」解耦。'
  },
  {
    kind: 'links',
    title: '官方参考',
    items: [
      {
        label: 'Hono 文档',
        href: 'https://hono.dev/docs/',
        note: '路由、中间件与运行时适配'
      },
      {
        label: 'Hono Streaming',
        href: 'https://hono.dev/docs/helpers/streaming',
        note: 'streamSSE 与 writeSSE'
      },
      {
        label: 'Zod',
        href: 'https://zod.dev/',
        note: '入参校验与默认值'
      },
      {
        label: 'MDN: Server-sent events',
        href: 'https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events',
        note: '事件格式与浏览器行为'
      }
    ]
  }
]
