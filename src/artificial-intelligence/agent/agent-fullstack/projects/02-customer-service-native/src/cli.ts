/**
 * 入口：只负责组装依赖、解析参数、驱动 REPL。
 *
 * 作用
 * - 唯一知道"业务 + agent"如何拼装的地方：
 *   config → seed → createBusinessTools → runTurn。
 * - 读一行输入、调用 runTurn、打印结果；审批界面与 resume 入口也在这里。
 *
 * 不负责
 * - 任何业务规则和循环逻辑；这里只做 I/O。
 */
import { createInterface } from 'node:readline/promises'
import { runTurn } from './agent/loop'
import {
  loadThread,
  newThread,
  saveThread,
  type ThreadState
} from './agent/store'
import { loadSeed } from './business/seed'
import { createBusinessTools } from './business/tools'
import { loadConfig } from './config'

function parseResumeId(argv: string[]): string | undefined {
  const index = argv.indexOf('--resume')
  return index >= 0 ? argv[index + 1] : undefined
}

function newThreadId(): string {
  const stamp = new Date()
    .toISOString()
    .replace(/[-:.TZ]/g, '')
    .slice(0, 14)
  return `t_${stamp}`
}

async function main(): Promise<void> {
  const config = loadConfig()
  const seed = await loadSeed()
  const tools = createBusinessTools(seed, config.userId)

  const resumeId = parseResumeId(process.argv.slice(2))
  const threadId = resumeId ?? newThreadId()

  let state: ThreadState
  if (resumeId) {
    // 第 2 步实现前 loadThread 会抛错，这里先降级为新会话
    state =
      (await loadThread(resumeId).catch(() => null)) ?? newThread(threadId)
  } else {
    state = newThread(threadId)
  }

  console.log(`会话 ${threadId}｜用户 ${config.userId}`)
  console.log('输入内容开始对话，/exit 退出。\n')

  const rl = createInterface({ input: process.stdin, output: process.stdout })
  try {
    while (true) {
      // REPL 是刻意串行的：必须等用户回答完这一行，才处理下一行
      // oxlint-disable-next-line no-await-in-loop
      const line = (await rl.question('> ')).trim()
      if (!line) continue
      if (line === '/exit') break

      try {
        // 一次 turn 内部本身就是串行状态机，不能和下一轮并行
        // oxlint-disable-next-line no-await-in-loop
        const outcome = await runTurn({
          threadId,
          input: line,
          config,
          tools: Object.values(tools),
          state
        })
        state = outcome.state

        if (outcome.kind === 'suspended') {
          console.log(`[审批] ${outcome.pending.summary}`)
          console.log(
            'TODO 第 6 步：在这里渲染 approve / reject，并调用 resume()'
          )
          continue
        }

        console.log(`\n助手：${outcome.answer}\n`)
        console.log(`[结论] ${JSON.stringify(outcome.result)}`)
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        console.error(`\n[未实现] ${message}\n`)
      }
    }
  } finally {
    rl.close()
    await saveThread(state).catch(() => undefined)
  }
}

if (import.meta.main) {
  await main()
}
