/**
 * CLI 入口：对话循环 + 审批输入 + --stream 观察模式
 *
 * 用法：
 *   bun run cli                # 普通模式
 *   bun run cli --stream       # 打印每个节点的更新（含子图事件）
 *   bun run cli --thread=xxx   # 复用会话（报告目录同名）
 */
import { createInterface } from 'node:readline/promises'
import { HumanMessage } from '@langchain/core/messages'
import { Command } from '@langchain/langgraph'
import { buildDefaultWorkflow } from '@/graph/workflow.ts'
import { safeThreadId } from '@/services/export.ts'

const args = process.argv.slice(2)
const stream = args.includes('--stream')
const threadArg = args.find((arg) => arg.startsWith('--thread='))
const threadId = safeThreadId(
  threadArg?.slice('--thread='.length) || `cli-${Date.now()}`
)

if (process.env.OPENAI_API_KEY === 'sk-your-api-key-here') {
  console.warn(
    '[cli] 检测到占位 API Key（.env 里的 OPENAI_API_KEY），真实调用会 401'
  )
}

const { graph, close } = await buildDefaultWorkflow()
const cfg = { configurable: { thread_id: threadId }, recursionLimit: 50 }

interface InterruptPayload {
  action?: string
  summary?: string
  targetPath?: string
}

interface CliMessage {
  text?: string
  tool_calls?: { name: string; args: unknown }[]
}

type GraphResult = {
  messages?: CliMessage[]
  intent?: 'analysis' | 'metrics' | 'chat'
  structuredResponse?: { summary: string; markdown: string }
  status?: 'skipped' | 'rejected' | 'exported'
  reportPath?: string
  __interrupt__?: { id: string; value: InterruptPayload }[]
}

function printResult(result: GraphResult) {
  // 只有当轮是 analysis 且确实收口了，才展示报告摘要；
  // 防止多轮会话里 last-value channel 把上一轮的 structuredResponse 带出来
  if (result.intent === 'analysis' && result.structuredResponse) {
    console.log(`\n[汇总] ${result.structuredResponse.summary}`)
  } else {
    const last = result.messages?.at(-1)?.text
    if (last) console.log(`\n[回复] ${last}`)
  }
  if (result.intent !== 'analysis') return
  if (result.status === 'exported' && result.reportPath) {
    console.log(`[导出] ${result.reportPath}`)
  } else if (result.status === 'rejected') {
    console.log('[导出] 已拒绝，未写 report.md（图表已作为分析中间产物落盘）')
  }
}

async function askApproval(
  rl: ReturnType<typeof createInterface>
): Promise<boolean> {
  while (true) {
    const answer = (await rl.question('        approve / reject > '))
      .trim()
      .toLowerCase()
    if (answer === 'approve' || answer === 'a' || answer === 'y') return true
    if (answer === 'reject' || answer === 'r' || answer === 'n') return false
    console.log('        请输入 approve 或 reject')
  }
}

async function handleInterrupts(
  result: GraphResult,
  rl: ReturnType<typeof createInterface>
): Promise<GraphResult> {
  let current = result
  while (current.__interrupt__?.length) {
    const payload = current.__interrupt__[0]?.value
    console.log(
      `\n[审批] ${payload?.summary ?? '报告已生成'}${payload?.targetPath ? `\n        目标：${payload.targetPath}` : ''}`
    )
    const approved = await askApproval(rl)
    current = (await graph.invoke(
      new Command({ resume: { approved } }),
      cfg
    )) as unknown as GraphResult
  }
  return current
}

/** --stream：打印节点更新；namespace 非空即子图内部事件 */
async function runStreaming(input: string): Promise<GraphResult> {
  const interrupts: InterruptPayload[] = []
  const chunks = await graph.stream(
    { messages: [new HumanMessage(input)] },
    { ...cfg, streamMode: 'updates', subgraphs: true }
  )

  for await (const chunk of chunks as AsyncIterable<unknown>) {
    // subgraphs: true 时 chunk 形如 [namespace, data]；顶层为纯 data
    const pair = chunk as [string[], Record<string, unknown>]
    const namespace =
      Array.isArray(pair) && Array.isArray(pair[0]) ? pair[0] : []
    const data = (
      Array.isArray(pair) && Array.isArray(pair[0]) ? pair[1] : chunk
    ) as Record<string, unknown>
    const prefix = namespace.length ? `[子图 ${namespace.join('.')}]` : '[主图]'

    for (const [node, update] of Object.entries(data)) {
      if (node === '__interrupt__') {
        const list = update as { id: string; value: InterruptPayload }[]
        interrupts.push(...list.map((item) => item.value))
        continue
      }
      console.log(`${prefix} ${node}`)
      const messages = (update as { messages?: unknown[] })?.messages
      for (const message of messages ?? []) {
        const toolCalls = (
          message as { tool_calls?: { name: string; args: unknown }[] }
        ).tool_calls
        for (const call of toolCalls ?? []) {
          console.log(
            `${prefix}   [调用] ${call.name} ${JSON.stringify(call.args)}`
          )
        }
      }
    }
  }

  const snapshot = await graph.getState(cfg)
  const values = snapshot.values as unknown as GraphResult
  return {
    ...values,
    __interrupt__: interrupts.length
      ? interrupts.map((value, index) => ({ id: String(index), value }))
      : undefined
  }
}

const rl = createInterface({ input: process.stdin, output: process.stdout })
const STREAM_HINT = stream ? '（--stream：打印节点事件）' : ''
console.log(`销售数据分析助手 ready. thread_id: ${threadId}${STREAM_HINT}`)
console.log('输入问题回车；exit / quit 退出。')

try {
  while (true) {
    let input: string
    try {
      input = (await rl.question('\n> ')).trim()
    } catch {
      break // stdin 关闭（EOF / 管道结束）时正常退出
    }
    if (!input || input === 'exit' || input === 'quit') break

    const raw = stream
      ? await runStreaming(input)
      : ((await graph.invoke(
          { messages: [new HumanMessage(input)] },
          cfg
        )) as unknown as GraphResult)

    try {
      const resolved = await handleInterrupts(raw, rl)
      printResult(resolved)
    } catch (error) {
      if ((error as { code?: string }).code === 'ERR_USE_AFTER_CLOSE') break
      throw error
    }
  }
} finally {
  rl.close()
  await close()
  console.log('\n[cli] 已关闭 MCP 子进程')
}
