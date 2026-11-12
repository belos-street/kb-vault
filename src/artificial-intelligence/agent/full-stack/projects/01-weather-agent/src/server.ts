import { Hono } from 'hono'
import { streamSSE } from 'hono/streaming'
import { createChat } from './chat.ts'
import { createLlm } from './llm.ts'

const app = new Hono()
const chat = createChat(createLlm())

app.post('/api/chat', async (c) => {
  const body = await c.req.json<{ message?: string }>().catch(() => null)
  const message = body?.message?.trim()

  if (!message) {
    return c.json({ error: 'message 不能为空' }, 400)
  }

  return streamSSE(c, async (stream) => {
    for await (const text of chat.stream(message)) {
      await stream.writeSSE({ event: 'delta', data: text })
    }
    await stream.writeSSE({ event: 'done', data: '' })
  })
})

if (import.meta.main) {
  const port = Number(process.env.PORT ?? 8787)
  Bun.serve({ port, fetch: app.fetch })
  console.log('http://127.0.0.1:' + port)
}

export default app
