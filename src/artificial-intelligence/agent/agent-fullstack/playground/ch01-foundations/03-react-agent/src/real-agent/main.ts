/**
 * 入口：只负责组装依赖、启动、展示结果。
 * 运行：bun run ch01-foundations/03-react-agent/src/real-agent/main.ts
 */
import { runAgent } from './loop'
import { demoTools } from './tools'

async function main(): Promise<void> {
  const result = await runAgent(
    '现在几点了？顺便告诉我北京今天的天气。',
    demoTools
  )

  console.log(JSON.stringify(result.steps, null, 2))
  console.log('---')
  console.log(result.answer)
}

if (import.meta.main) {
  await main()
}
