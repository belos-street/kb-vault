import type { Hono } from 'hono'
import { z } from 'zod'
import { AppError } from '../lib/errors.ts'
import type { AppVariables } from '../middleware/auth.ts'
import { chat } from '../services/chat.ts'

export const ChatInput = z.object({
  threadId: z.string().min(1),
  message: z.string().min(1).max(4000)
})

export function registerChatRoutes(app: Hono<{ Variables: AppVariables }>) {
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
}
