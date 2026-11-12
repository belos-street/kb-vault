import { Hono } from 'hono'
import { apiKeyAuth, type AppVariables } from './middleware/auth.ts'
import { registerChatRoutes, type Ask } from './routes/chat.ts'

// HTTP 适配层：只做鉴权、校验、序列化；业务逻辑全部在 ask 里。
export function createApp(deps: { ask: Ask; serviceApiKey: string }) {
  const app = new Hono<{ Variables: AppVariables }>()
  app.use('/api/*', apiKeyAuth(deps.serviceApiKey))
  registerChatRoutes(app, { ask: deps.ask })
  return app
}
