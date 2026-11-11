import type { Hono } from 'hono'
import { streamSSE } from 'hono/streaming'
import type { AppVariables } from '../middleware/auth.ts'
import { ChatInput } from './chat.ts'

export function registerChatStream(
  app: Hono<{ Variables: AppVariables }>
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

      // 1.2 先用假分片；1.4 接真实模型流时替换这里
      for (const delta of ['杭州', '明天', '有中雨', '，建议', '带伞']) {
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
}
