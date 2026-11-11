import { Hono } from 'hono'
import { apiKeyAuth, type AppVariables } from './middleware/auth.ts'
import { registerChatRoutes } from './routes/chat.ts'
import { registerChatStream } from './routes/chat-stream.ts'

export const app = new Hono<{ Variables: AppVariables }>()

// 先挂鉴权，再注册业务路由
app.use('/api/*', apiKeyAuth())
registerChatRoutes(app)
registerChatStream(app)

if (import.meta.main) {
  const port = Number(process.env.PORT ?? '8787')
  Bun.serve({ port, fetch: app.fetch })
  console.log('listening on http://127.0.0.1:' + port)
}
