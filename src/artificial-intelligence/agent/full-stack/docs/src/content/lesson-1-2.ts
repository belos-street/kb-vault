import type { Block } from '../data/types.ts'

export const lesson12: Block[] = [
  {
    kind: 'p',
    text: '1.1 已经有了一次能跑的 SDK 调用。这一篇只加一个变量：**解耦**。把模型调用从入口里拿出来，做成一个不依赖 Hono、不读 env 的 core；CLI 和 HTTP 只是两个很薄的入口，调用同一个 `ask()`。'
  },
  {
    kind: 'note',
    tone: 'decision',
    title: '为什么先解耦，再谈 Hono',
    text: '如果先写路由，模型调用、超时、错误映射会自然长在 route 里；等 CLI、队列、定时任务出现时，只能复制一遍。先把 core 抽出来，HTTP 就退化成「解析请求 → 调 core → 序列化响应」，加入口不再改业务。'
  },
  { kind: 'h2', text: '目标：一个 core，两个入口' },
  {
    kind: 'p',
    text: '依赖方向只有一条：入口依赖 core，core 依赖自己定义的接口，SDK 实现反过来接在接口上。core 不认识 Hono，也不认识 OpenAI SDK。'
  },
  {
    kind: 'code',
    title: '依赖方向',
    lang: 'text',
    code: String.raw`CLI  ─┐
      ├─→ services/chat.ts ─→ llm/types.ts ←─ llm/openai.ts (OpenAI SDK)
HTTP ─┘
                              ↑
                         config.ts（只在组装根读取）`,
    caption:
      '只有 cli.ts 和 server.ts 读取配置、创建 SDK client；services 与 routes 都不直接碰 env。'
  },
  {
    kind: 'code',
    title: '目录',
    lang: 'text',
    code: String.raw`src/
├── config.ts             # Zod 校验 env
├── lib/errors.ts         # AppError
├── llm/
│   ├── types.ts          # ChatMessage / LlmReply / LlmClient
│   └── openai.ts         # 唯一 import 'openai' 的文件
├── services/chat.ts      # createChatService(deps)
├── routes/chat.ts        # HTTP 校验与序列化
├── middleware/auth.ts    # API Key 鉴权
├── app.ts                # createApp(deps)
├── cli.ts                # CLI 入口
└── server.ts             # HTTP 组装根`,
    caption: '目录名就是边界：llm 放实现，services 放用例，routes 放适配。'
  },
  { kind: 'h2', text: '第一步：定义模型边界' },
  {
    kind: 'p',
    text: 'core 不应该 import `openai` 的类型，否则换 SDK 或写测试时都会被厂商类型绑住。先定义自己的最小协议，SDK 适配器负责两边转换。'
  },
  {
    kind: 'code',
    title: 'llm/types.ts',
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

export type ChatMessage =
  | { role: 'system' | 'user'; content: string }
  | { role: 'assistant'; content: string | null; toolCalls?: ToolCall[] }
  | { role: 'tool'; toolCallId: string; content: string }

export type LlmReply = {
  content: string | null
  toolCalls: ToolCall[]
}

export interface LlmClient {
  complete(input: {
    messages: ChatMessage[]
    tools?: ToolSpec[]
    signal?: AbortSignal
  }): Promise<LlmReply>
}`,
    caption:
      '这层类型不是为了「抽象而抽象」：1.4 的 tool_calls、tool 消息回填都靠它，core 始终只面对自己的结构。'
  },
  { kind: 'h2', text: '第二步：配置与 SDK 适配器' },
  {
    kind: 'p',
    text: '配置在启动时一次性校验，缺字段直接失败，避免请求打到一半才发现没有 Key。'
  },
  {
    kind: 'code',
    title: 'config.ts',
    lang: 'ts',
    code: String.raw`import { z } from 'zod'

const envSchema = z.object({
  OPENAI_API_KEY: z.string().min(1),
  OPENAI_BASE_URL: z.url().default('https://api.openai.com/v1'),
  DEFAULT_MODEL: z.string().min(1).default('gpt-4o-mini'),
  SERVICE_API_KEY: z.string().min(1),
  PORT: z.coerce.number().int().min(1).max(65535).default(8787),
  LLM_TIMEOUT_MS: z.coerce.number().int().positive().default(30_000)
})`,
    caption:
      '`loadConfig()` 用 `safeParse` 把缺字段拼成 `invalid_env`，在组装根调用。'
  },
  {
    kind: 'code',
    title: 'llm/openai.ts（核心部分）',
    lang: 'ts',
    code: String.raw`import OpenAI from 'openai'
import { AppError } from '../lib/errors.ts'
import type { LlmClient } from './types.ts'

export function createOpenAiClient(config: {
  openaiApiKey: string
  openaiBaseUrl: string
  model: string
  llmTimeoutMs: number
  maxRetries?: number
}): LlmClient {
  const client = new OpenAI({
    apiKey: config.openaiApiKey,
    baseURL: config.openaiBaseUrl,
    timeout: config.llmTimeoutMs,
    maxRetries: config.maxRetries ?? 2
  })

  return {
    async complete(input) {
      try {
        const response = await client.chat.completions.create(
          {
            model: config.model,
            messages: input.messages.map(toSdkMessage),
            ...(input.tools?.length
              ? { tools: input.tools.map(toSdkTool) }
              : {})
          },
          input.signal ? { signal: input.signal } : {}
        )
        const message = response.choices[0]?.message
        return {
          content: message?.content ?? null,
          toolCalls: message ? toToolCalls(message) : []
        }
      } catch (error) {
        throw toAppError(error)
      }
    }
  }
}`,
    caption:
      '`toSdkMessage` / `toSdkTool` / `toToolCalls` 只做结构转换；SDK 的 `timeout` 与 `maxRetries` 在 client 上统一配置。'
  },
  {
    kind: 'code',
    title: 'llm/openai.ts：错误统一翻译',
    lang: 'ts',
    code: String.raw`function toAppError(error: unknown): AppError {
  if (error instanceof AppError) return error
  if (error instanceof OpenAI.APIUserAbortError) {
    return new AppError('upstream_timeout', 504, '模型超时')
  }
  if (error instanceof OpenAI.APIConnectionTimeoutError) {
    return new AppError('upstream_timeout', 504, '模型超时')
  }
  if (error instanceof OpenAI.RateLimitError) {
    return new AppError('upstream_rate_limited', 429, '稍后重试')
  }
  if (
    error instanceof OpenAI.AuthenticationError ||
    error instanceof OpenAI.PermissionDeniedError
  ) {
    return new AppError('server_misconfigured', 500, '模型鉴权失败')
  }
  if (error instanceof OpenAI.APIError) {
    return new AppError('upstream_error', 502, '上游返回 ' + error.status)
  }
  return new AppError('internal_error', 500, '服务内部错误')
}`,
    caption:
      'SDK 错误在适配器里收口，core 与 route 只认识 `AppError`；以后换 SDK 只改这一个文件。'
  },
  { kind: 'h2', text: '第三步：core 只依赖接口' },
  {
    kind: 'code',
    title: 'services/chat.ts',
    lang: 'ts',
    code: String.raw`import type { LlmClient } from '../llm/types.ts'

export function createChatService(deps: { llm: LlmClient }) {
  return {
    async ask(question: string): Promise<string> {
      const reply = await deps.llm.complete({
        messages: [{ role: 'user', content: question }]
      })
      return reply.content ?? ''
    }
  }
}`,
    caption:
      '这里没有 env、没有 Hono、没有 openai；测试时传一个 fake `LlmClient` 就能跑。'
  },
  { kind: 'h2', text: '第四步：CLI 是第一个入口' },
  {
    kind: 'code',
    title: 'cli.ts',
    lang: 'ts',
    code: String.raw`import { loadConfig } from './config.ts'
import { createOpenAiClient } from './llm/openai.ts'
import { createChatService } from './services/chat.ts'

const question = Bun.argv.slice(2).join(' ').trim()
if (!question) {
  console.error('用法：bun run chat "你的问题"')
  process.exit(1)
}

const config = loadConfig()
const { ask } = createChatService({
  llm: createOpenAiClient(config)
})

console.log(await ask(question))`,
    caption:
      'CLI 只做三件事：读 argv、组装依赖、打印结果。超时、错误映射、Prompt 都在 core 里，不在这里重复。'
  },
  {
    kind: 'checklist',
    title: '运行前检查',
    items: [
      '`bun run chat "用一句话解释什么是 token"` 能打印回答',
      '把 `OPENAI_API_KEY` 改错，CLI 打印的是 `AppError` 的可读信息，而不是 SDK 原始堆栈',
      '`services/chat.ts` 里没有 `process.env`、`hono`、`openai`'
    ]
  },
  { kind: 'h2', text: '第五步：HTTP 是第二个入口' },
  {
    kind: 'p',
    text: 'HTTP 入口只负责四件事：鉴权、解析 JSON、校验入参、把 `AppError` 翻译成状态码。它不拼 Prompt，也不决定超时。'
  },
  {
    kind: 'code',
    title: 'middleware/auth.ts',
    lang: 'ts',
    code: String.raw`import type { MiddlewareHandler } from 'hono'

export function apiKeyAuth(
  expected: string
): MiddlewareHandler<{ Variables: { tenantId: string } }> {
  return async (c, next) => {
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
      '期望 Key 由组装根传入，中间件不读 env；生产还要补常量时间比较、Key 轮换与租户隔离。'
  },
  {
    kind: 'code',
    title: 'routes/chat.ts',
    lang: 'ts',
    code: String.raw`import type { Hono } from 'hono'
import { z } from 'zod'
import { AppError } from '../lib/errors.ts'
import type { AppVariables } from '../middleware/auth.ts'

export const ChatInput = z.object({
  threadId: z.string().min(1),
  message: z.string().min(1).max(4000)
})

export type Ask = (question: string) => Promise<string>

export function registerChatRoutes(
  app: Hono<{ Variables: AppVariables }>,
  deps: { ask: Ask }
) {
  app.post('/api/chat', async (c) => {
    const body = await c.req.json().catch(() => null)
    const parsed = ChatInput.safeParse(body)
    if (!parsed.success) {
      return c.json({ code: 'invalid_input', message: '参数不合法' }, 400)
    }

    try {
      const reply = await deps.ask(parsed.data.message)
      return c.json({ threadId: parsed.data.threadId, reply })
    } catch (error) {
      if (error instanceof AppError) {
        return c.json(
          { code: error.code, message: error.message },
          error.status
        )
      }
      return c.json({ code: 'internal_error', message: '服务内部错误' }, 500)
    }
  })
}`,
    caption:
      'route 依赖的是 `ask` 函数，不是 `createOpenAiClient`，也不是某个具体的 service 实例。'
  },
  {
    kind: 'code',
    title: 'app.ts + server.ts',
    lang: 'ts',
    code: String.raw`// app.ts
export function createApp(deps: { ask: Ask; serviceApiKey: string }) {
  const app = new Hono<{ Variables: AppVariables }>()
  app.use('/api/*', apiKeyAuth(deps.serviceApiKey))
  registerChatRoutes(app, { ask: deps.ask })
  return app
}

// server.ts（组装根）
const config = loadConfig()
const { ask } = createChatService({
  llm: createOpenAiClient(config)
})
const app = createApp({
  ask,
  serviceApiKey: config.serviceApiKey
})
Bun.serve({ port: config.port, fetch: app.fetch })`,
    caption:
      '`server.ts` 和 `cli.ts` 是仅有的两个组装根：都创建同一个 core，只是最后接的入口不同。'
  },
  {
    kind: 'table',
    head: ['层', '只做什么', '不做什么'],
    rows: [
      [
        'cli.ts / server.ts',
        '读配置、创建 client、组装 core 与入口',
        '不写业务逻辑'
      ],
      [
        'services/chat.ts',
        '组织 messages、调用 LlmClient、返回结果',
        '不读 env、不碰 Hono'
      ],
      ['llm/openai.ts', 'SDK 调用、结构转换、错误翻译', '不决定 HTTP 状态码'],
      ['routes/chat.ts', '校验、序列化、AppError 映射', '不拼 Prompt、不调 SDK']
    ]
  },
  {
    kind: 'note',
    tone: 'warn',
    title: '判断解耦是否成立',
    text: '加一个入口（CLI、队列消费者、定时任务）时，如果需要改 `services/`，说明业务逻辑还在入口里；如果只需要在组装根里换一行接线，说明边界成立。'
  },
  { kind: 'h2', text: '错误码与超时' },
  {
    kind: 'p',
    text: 'SDK 已经自带超时与重试，所以不要在 route 里再写一层 `AbortController`。适配器负责把 SDK 错误翻译成稳定的业务错误码，route 只负责输出。'
  },
  {
    kind: 'table',
    head: ['场景', '返回码', '前端动作'],
    rows: [
      ['入参不合法', '400 invalid_input', '提示具体字段'],
      ['缺少 / 错误 API Key', '401 unauthorized', '跳登录或提示配置'],
      ['模型鉴权失败', '500 server_misconfigured', '找运维检查 Key'],
      ['上游限流', '429 upstream_rate_limited', '退避重试，展示倒计时'],
      ['上游超时', '504 upstream_timeout', '重试或换备用模型'],
      ['上游其他错误', '502 upstream_error', '重试 + 告警'],
      ['自身异常', '500 internal_error', '提示稍后再试，带 traceId']
    ]
  },
  {
    kind: 'note',
    tone: 'warn',
    title: '超时要算上重试',
    text: '`timeout: 30_000` 是单次请求的超时，`maxRetries: 2` 意味着最坏情况下总耗时接近 90s。对延迟敏感的场景要显式调小 `LLM_TIMEOUT_MS` 或 `maxRetries`，不要只改一层。'
  },
  {
    kind: 'note',
    tone: 'info',
    title: '流式入口放后面',
    text: '本篇只做请求/响应，CLI 与 HTTP 的行为因此完全一致。SSE 是另一种入口形态，涉及事件协议、断线续传与背压，放在 8.2 完整展开；下面先看事件形状，不展开实现。'
  },
  { kind: 'demo', id: 'sse-stream' },
  { kind: 'h2', text: '验收清单' },
  {
    kind: 'checklist',
    title: '本篇跑通的标准',
    items: [
      '`bun run chat "..."` 能打印回答',
      '`bun run dev` 后，`/api/chat` 对同一问题返回与 CLI 一致的答案',
      '非法入参返回 400 `invalid_input`，不带 Key 返回 401',
      '把 Key 改错，HTTP 返回 500 `server_misconfigured`；限流返回 429',
      '`services/chat.ts` 不依赖 `hono`、`openai`、`process.env`',
      '`bun run check` 通过：typecheck + 单测 + 验收'
    ]
  },
  { kind: 'h2', text: '本讲产出' },
  {
    kind: 'p',
    text: '带走一套真正解耦的基线：`LlmClient` 接口、OpenAI SDK 适配器、`createChatService`、CLI 入口、Hono 入口，以及一套不调用真实模型的测试。下一篇 1.3 会在 core 里加 Prompt 契约，入口层仍然不动。'
  },
  {
    kind: 'exercise',
    title: '1.2 练习：把边界写硬',
    items: [
      {
        id: 's1-2-e1',
        level: '基础',
        question:
          '给 `ChatInput` 加一个 `maxTokens` 可选参数（1~4096，默认 800），并透传到 `LlmClient`。',
        hint: '在 Zod Schema 里用 `.int().min(1).max(4096).default(800)`，再把它放进 `LlmClient.complete` 的入参。',
        answer:
          'Schema 加字段；`ChatMessage` 不变，`LlmClient.complete` 增加 `maxTokens?: number`。',
        solution:
          '默认值写在 Schema 里；服务层直接用 `parsed.data.maxTokens`，不要在 route 里再写一次 `?? 800`。'
      },
      {
        id: 's1-2-e2',
        level: '改造',
        question:
          '新增一个 `bun run summary "..."` CLI，复用同一个 `ask()`，只改变输出格式。',
        hint: '不要再建一个 service；在 cli 层做参数解析与打印。',
        answer:
          '新增入口文件，调用 `createChatService` 的 `ask`，不复制 Prompt 与错误映射。',
        solution:
          '如果实现时发现需要改 `services/chat.ts`，说明 core 里混入了入口相关逻辑，先把它们移回入口层。'
      },
      {
        id: 's1-2-e3',
        level: '排障',
        question:
          '前端说「点发送后一直转圈，最后报 504」。按本篇的分层，先查哪一层？',
        hint: '先看适配器有没有把超时翻译成 `upstream_timeout`，再看 SDK 的 `timeout` 与 `maxRetries`。',
        answer:
          '先查 `llm/openai.ts` 的错误映射，再查 config 里的超时与重试配置。',
        solution:
          '日志里有 `upstream_timeout` 说明适配器工作正常，问题在上游或超时配置；没有的话，检查异常是否在更早的层被吞掉。'
      },
      {
        id: 's1-2-e4',
        level: '设计',
        question: '如果要把 core 拆成独立 npm 包，目录与依赖应该怎么切？',
        hint: '从「哪些文件不依赖 Hono / env / SDK」开始划。',
        answer:
          '`llm/types.ts` + `services/*` + `lib/errors.ts` 可以独立；`llm/openai.ts`、routes、组装根留在应用侧。',
        solution:
          '包只导出类型与纯函数，不读 env、不单例化 client；应用侧通过参数注入具体实现，测试与 CLI 都能复用。'
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
        '入口会变多（HTTP、CLI、队列），业务逻辑压在 route 里，每加一个入口就要复制超时、错误映射与 Prompt。'
      ],
      [
        '怎么保证 CLI 和 HTTP 行为一致？',
        '两者只做输入输出适配，调用同一个 core；Prompt、超时、错误映射只在 core 里维护一份。'
      ],
      [
        '为什么 core 不直接 import OpenAI SDK？',
        '避免厂商类型和实现泄漏进业务；用 `LlmClient` 接口隔开，换 SDK 或写 fake 都不改 core。'
      ],
      [
        '错误应该在哪一层翻译？',
        'SDK 错误在适配器翻译成 `AppError`，route 只把 `AppError` 转成 HTTP 状态码。'
      ]
    ]
  },
  {
    kind: 'note',
    tone: 'interview',
    title: '追问：这不就是过度设计吗？',
    text: '如果只有一个 HTTP 入口、永远不换模型，确实可以直接写在 route 里。但课程后面要加 CLI、工具循环、评估与多入口，边界越早立越便宜。这里的抽象只有一个接口和一个工厂，没有 DI 容器。'
  },
  {
    kind: 'links',
    title: '官方参考',
    items: [
      {
        label: 'OpenAI Node SDK',
        href: 'https://github.com/openai/openai-node',
        note: 'client 配置、超时、重试与错误类型'
      },
      {
        label: 'Hono 文档',
        href: 'https://hono.dev/docs/',
        note: '路由、中间件与 app.request'
      },
      {
        label: 'Zod',
        href: 'https://zod.dev/',
        note: '入参校验与默认值'
      }
    ]
  }
]
