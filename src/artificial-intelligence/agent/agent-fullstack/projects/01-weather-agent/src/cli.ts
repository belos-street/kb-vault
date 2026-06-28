/**
 * CLI 交互入口
 *
 * 通过终端与天气助手对话，支持多轮对话。
 * 使用方式：bun run src/cli.ts
 */
import ora from 'ora'
import { runAgent } from './agent/re-act/re-act'
import type { Message } from './prompts/type'
import type { StepEvent } from './agent/type'

async function main() {
  console.log('🌟 🌙 天气助手已启动（输入 exit 退出）☀️  ☁️\n')
  process.stdout.write('> ')

  const history: Message[] = []

  for await (const line of console) {
    const input = line.trim()

    if (input.toLowerCase() === 'exit') {
      break
    }

    const spinner = ora('🤔 思考中...').start()

    try {
      const reply = await runAgent(input, history, (step: StepEvent) => {
        switch (step.type) {
          case 'retrieve':
            spinner.stop()
            process.stdout.write('\r')
            console.log(`  📖 检索知识: ${step.result}`)
            break
          case 'think':
            spinner.text = '🤔 思考中...'
            break
          case 'act':
            spinner.stop()
            process.stdout.write('\r')
            console.log(`  🔧 调用工具: ${step.tool}(${step.args})`)
            break
          case 'observe':
            console.log(`  📡 观察结果: ${step.tool} → ${step.result}`)
            break
          case 'response':
            spinner.start()
            spinner.text = '💡 生成回答...'
            break
        }
      })

      spinner.stop()
      process.stdout.write('\r')
      console.log('  ✅ 回答完成')

      // 将本轮对话保存到历史
      history.push({ role: 'user', content: input })
      history.push({ role: 'assistant', content: reply })

      console.log(`助手: ${reply}\n`)
      process.stdout.write('> ')
    } catch (e) {
      spinner.fail()

      console.error(`错误: ${(e as Error).message}\n`)
      process.stdout.write('> ')
    }
  }

  console.log('再见！')
  process.exit(0)
}

main()
