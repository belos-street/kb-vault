import { createAgent } from './agent.ts'
import { createLlm } from './llm.ts'

const question = Bun.argv.slice(2).join(' ').trim()

if (!question) {
  console.error('用法：bun run agent "你的问题"')
  process.exit(1)
}

const agent = createAgent(createLlm())
console.log(await agent.run(question))
