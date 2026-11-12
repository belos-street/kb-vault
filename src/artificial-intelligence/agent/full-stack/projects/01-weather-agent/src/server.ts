import { createApp } from './app.ts'
import { loadConfig, type AppConfig } from './config.ts'
import { createOpenAiClient } from './llm/openai.ts'
import type { LlmClient } from './llm/types.ts'
import { createChatService } from './services/chat.ts'

// 组装根：唯一读取配置、创建 SDK client、选择入口的地方。
export function createServerApp(
  config: AppConfig,
  llm: LlmClient = createOpenAiClient(config)
) {
  const { ask } = createChatService({ llm })
  return createApp({ ask, serviceApiKey: config.serviceApiKey })
}

if (import.meta.main) {
  const config = loadConfig()
  const app = createServerApp(config)
  Bun.serve({ port: config.port, fetch: app.fetch })
  console.log('listening on http://127.0.0.1:' + config.port)
}
