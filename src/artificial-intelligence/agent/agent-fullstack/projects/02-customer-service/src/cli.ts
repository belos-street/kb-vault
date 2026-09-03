// CLI 入口（todo 3.2）：解析 --user → 意图分类器 → 主 Agent 对话 → HITL 审批恢复
//
// 运行：bun run cli --user=李华，输入 exit / 退出 结束。
// ⚠️ 会真实调用 LLM，先确保 .env 配好可用 API Key。
//
// HITL 实现说明（已对齐当前 langchain 版本）：
// - 主 Agent 用 invoke 而非 streamEvents：本版本 getState/getInterrupts 属内部 API（类型返回 never），
//   且中断信息可靠读取点在 invoke 返回的 `__interrupt__`（文档 2.6 §2.2 示例即此路径）。
// - 恢复用 `new Command({ resume: { decisions: [...] } })`，同 thread_id。
import { createInterface } from 'node:readline/promises'
import { stdin as input, stdout as output } from 'node:process'
import { Command } from '@langchain/langgraph'
import type { HITLRequest } from 'langchain'
import { classify, intentClassifier } from '@/agent/classifier'
import { agent } from '@/agent/agent'
import { traceHandler } from '@/observability/tracer'

/**
 * 解析 --user=李华 与可选 --id=U1001；缺省用户李华。
 * userId 默认由用户名稳定派生（同名字恒同 ID）；--id 可显式覆盖
 *（Mock 订单归属固定 ID，走查/演示时用它对齐数据）。
 */
function parseUser(argv: string[]): { userId: string; userName: string } {
  const raw = argv.find((a) => a.startsWith('--user='))?.slice('--user='.length)
  const userName = raw?.trim() || '李华'
  const overrideId = argv
    .find((a) => a.startsWith('--id='))
    ?.slice('--id='.length)
    .trim()
  if (overrideId) return { userId: overrideId, userName }
  let code = 0
  for (const ch of userName)
    code = (code * 31 + (ch.codePointAt(0) ?? 0)) % 100000
  return { userId: `U${String(code).padStart(4, '0')}`, userName }
}

interface InvokeResultLike {
  messages?: { content?: unknown }[]
  __interrupt__?: { value?: HITLRequest }[]
}

function printReply(result: InvokeResultLike): void {
  const content = result.messages?.at(-1)?.content
  console.log(
    `客服：${typeof content === 'string' ? content : JSON.stringify(content)}`
  )
}

async function main(): Promise<void> {
  const { userId, userName } = parseUser(process.argv.slice(2))
  const config = {
    configurable: { thread_id: `cs-${userId}` },
    context: { userId, userName },
    // 自建链路追踪（Phase 4.1'）：每次 invoke 写一条 Run Tree 到 data/traces.jsonl
    callbacks: [traceHandler]
  }
  const rl = createInterface({ input, output })

  // stdin 关闭（如管道 EOF / Ctrl+D）时标记，主循环据此优雅退出，避免 question 抛 ERR_USE_AFTER_CLOSE
  let closed = false

  // 行队列模式读入：rl.question 在等待 LLM 期间会把管道缓冲的行当事件吞掉，
  // 先缓存到队列再按需取，交互式与管道输入（走查脚本）都可靠
  const lineQueue: string[] = []
  let wake: (() => void) | null = null
  rl.on('line', (line) => {
    lineQueue.push(line)
    wake?.()
    wake = null
  })
  rl.on('close', () => {
    closed = true
    wake?.()
    wake = null
  })

  /** 取一行输入；队列空且流未关闭时挂起等待 */
  async function readLine(): Promise<string | null> {
    for (;;) {
      const line = lineQueue.shift()
      if (line !== undefined) return line
      if (closed) return null
      // eslint-disable-next-line no-await-in-loop -- 等待下一行输入，天然串行
      await new Promise<void>((resolve) => {
        wake = resolve
      })
    }
  }

  console.log(
    `\n你好，${userName}（${userId}）。我是客服小智，输入问题开始，exit / 退出 结束。\n`
  )

  async function runTurn(text: string): Promise<void> {
    // 1. 意图分类（失败时降级 unknown，不阻断对话）
    let intent
    try {
      intent = await classify(intentClassifier, text, [traceHandler])
    } catch (err) {
      console.log(`[分类器] 出错：${(err as Error).message}`)
      intent = { intent: 'unknown', slots: {} }
    }
    const slotText = Object.keys(intent.slots).length
      ? ` ${JSON.stringify(intent.slots)}`
      : ''
    console.log(`[意图] ${intent.intent}${slotText}`)

    // greeting 直接用分类器回复，不调主 Agent；其余都走主 Agent（含 handoff → create_ticket → HITL）
    if (intent.intent === 'greeting' && intent.reply) {
      console.log(`客服：${intent.reply}`)
      return
    }

    // 2. 主 Agent 对话
    const result = (await agent.invoke(
      { messages: [{ role: 'user', content: text }] },
      config
    )) as unknown as InvokeResultLike

    // 3. HITL：检测到中断则收集人工决策并恢复执行
    // eslint-disable-next-line no-underscore-dangle -- __interrupt__ 是 LangGraph 约定字段名，非自定义标识
    const interrupt = result.__interrupt__?.[0]?.value
    if (interrupt && interrupt.actionRequests.length > 0) {
      console.log('\n⚠️ 以下操作需人工审批：')
      for (const action of interrupt.actionRequests) {
        console.log(`  • ${action.name}(${JSON.stringify(action.args)})`)
        if (action.description) console.log(`    ${action.description}`)
      }
      // eslint-disable-next-line no-await-in-loop -- 审批也需顺序等待人工输入
      const answer = ((await readLine()) ?? '').trim().toLowerCase()
      console.log('审批 [approve/reject]：')
      const decisions =
        answer === 'approve'
          ? [{ type: 'approve' as const }]
          : [{ type: 'reject' as const, message: '人工已拒绝该操作' }]
      const resumed = (await agent.invoke(
        new Command({ resume: { decisions } }),
        config
      )) as unknown as InvokeResultLike
      printReply(resumed)
      return
    }

    printReply(result)
  }

  while (true) {
    console.log('你：')
    // eslint-disable-next-line no-await-in-loop -- 交互式输入必须顺序等待，不可并行
    const line = await readLine()
    if (line === null) break
    const text = line.trim()
    if (!text) continue
    if (text === 'exit' || text === '退出') break
    try {
      // eslint-disable-next-line no-await-in-loop -- 每个问题串行处理，天然有依赖
      await runTurn(text)
    } catch (err) {
      console.error(`[错误] ${(err as Error).message}`)
    }
  }
  rl.close()
}

main().catch((err) => {
  console.error('CLI 异常退出：', err)
  process.exit(1)
})
