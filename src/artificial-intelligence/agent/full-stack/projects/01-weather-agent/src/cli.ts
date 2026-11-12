import { createChat } from './chat.ts'
import { createLlm } from './llm.ts'

const question = Bun.argv.slice(2).join(' ').trim()

if (!question) {
  console.error('用法：bun run chat "你的问题"')
  process.exit(1)
}

const chat = createChat(createLlm())
console.log(await chat.ask(question))
