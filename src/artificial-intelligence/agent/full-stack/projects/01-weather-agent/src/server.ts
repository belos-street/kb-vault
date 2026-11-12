import { Hono } from 'hono'
import { streamSSE } from 'hono/streaming'
import { z } from 'zod'
import { createAgent } from './agent.ts'
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
const llm = createLlm(process.env)
const chat = createChat(llm)
const agent = createAgent(llm)

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

app.post('/api/agent', async (c) => {
  const body = BodySchema.safeParse(await c.req.json().catch(() => null))

  if (!body.success) {
    return c.json(
      errorBody('invalid_body', body.error.issues[0]?.message ?? '请求体不合法'),
      400
    )
  }

  try {
    return c.json({ reply: await agent.run(body.data.message) })
  } catch (error) {
    console.error('agent_error', error)
    return c.json(errorBody('agent_error', '工具循环失败'), 422)
  }
})

if (import.meta.main) {
  Bun.serve({ port: env.data.PORT, fetch: app.fetch })
  console.log('http://127.0.0.1:' + env.data.PORT)
}

export default app
