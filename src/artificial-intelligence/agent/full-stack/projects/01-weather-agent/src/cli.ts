import { loadConfig } from './config.ts'
import { createOpenAiClient } from './llm/openai.ts'
import { createChatService } from './services/chat.ts'

// CLI 适配层：与 HTTP 共用 services/chat.ts 里的同一个 ask()。
if (!import.meta.main) {
  throw new Error('cli.ts 是可执行入口，不能被 import')
}

const question = Bun.argv.slice(2).join(' ').trim()
if (!question) {
  console.error('用法：bun run chat "你的问题"')
  process.exit(1)
}

try {
  const config = loadConfig()
  const { ask } = createChatService({ llm: createOpenAiClient(config) })
  console.log(await ask(question))
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
}
