/**
 * CLI 入口：对话循环 + 槽位追问 + 审批 UI + --stream + --resume
 *
 * 用法：
 *   bun run cli                     # 新会话（thread_id 自动生成）
 *   bun run cli --resume <id>       # 恢复历史会话（PostgresSaver 持久化）
 *   bun run cli --stream            # 流式输出 + 工具/审批进度事件
 *   bun run cli --user u_002        # 切换当前用户（默认 u_001，鉴权演示用）
 *
 * 职责边界：路由/槽位注入在 run-turn.ts，这里只做 IO——
 * 意图展示、流式渲染、HITL 审批 UI（approve / edit / reject → Command resume）。
 */
/* oxlint-disable no-await-in-loop -- REPL 人机问答与逐轮审批必须串行 */
import { createInterface } from 'node:readline/promises'
import { parseArgs } from 'node:util'
import type { StreamEvent } from '@langchain/core/tracers/log_stream'
import { Command } from '@langchain/langgraph'
import type { Decision, HITLRequest } from 'langchain'
import { createCustomerServiceAgent } from '@/agent/agent.ts'
import {
  runTurn,
  toAgentState,
  turnConfig,
  type AgentTurnState
} from '@/agent/run-turn.ts'
import { classifyIntent, type Route } from '@/intent/classifier.ts'

type Readline = ReturnType<typeof createInterface>

function printRoute(route: Route): void {
  const slots = [
    route.slots.order_id ? `order_id=${route.slots.order_id}` : 'order_id 缺失',
    route.slots.category ? `category=${route.slots.category}` : null
  ]
    .filter(Boolean)
    .join('，')
  console.log(`  [意图] ${route.intent}（槽位：${slots}）`)
}

function renderEvent(event: StreamEvent): void {
  const data = event.data as { input?: unknown; chunk?: { content?: unknown } }
  if (event.event === 'on_tool_start') {
    console.log(`\n  [工具] ${event.name} ${JSON.stringify(data.input ?? {})}`)
  } else if (event.event === 'on_tool_end') {
    console.log(`  [工具] ${event.name} ✓\n`)
  } else if (event.event === 'on_chat_model_stream') {
    const content = data.chunk?.content
    if (typeof content === 'string' && content) process.stdout.write(content)
  }
}

function lastAssistantText(state: AgentTurnState): string {
  for (let i = state.messages.length - 1; i >= 0; i--) {
    const msg = state.messages[i]
    if (msg?.getType() !== 'ai') continue
    return typeof msg.content === 'string'
      ? msg.content
      : JSON.stringify(msg.content)
  }
  return ''
}

function printConclusion(state: AgentTurnState): void {
  const sr = state.structuredResponse
  if (sr) {
    console.log(
      `  [结论] resolution=${sr.resolution}，follow_up_needed=${sr.follow_up_needed}`
    )
  }
}

/** HITL 审批 UI：渲染待审批工具调用，收 approve / edit / reject 决策 */
async function reviewInterrupts(
  rl: Readline,
  request: HITLRequest
): Promise<Decision> {
  for (const action of request.actionRequests) {
    console.log(`  [审批] ⚠️ 即将执行工具 ${action.name}`)
    console.log(`         参数：${JSON.stringify(action.args)}`)
    if (action.description) console.log(`         说明：${action.description}`)
  }
  const allowed = request.reviewConfigs[0]?.allowedDecisions ?? [
    'approve',
    'edit',
    'reject'
  ]

  while (true) {
    const answer = (
      await rl.question(`  [审批] 决策（${allowed.join(' / ')}）：`)
    )
      .trim()
      .toLowerCase()
    const action = request.actionRequests[0]
    if (answer === 'approve') return { type: 'approve' }
    if (answer === 'reject') {
      const message =
        (await rl.question('  [审批] 拒绝原因：')).trim() ||
        '坐席拒绝执行该操作'
      return { type: 'reject', message }
    }
    if (answer === 'edit' && action) {
      const raw = (
        await rl.question('  [审批] 修订参数（JSON，可只写要改的字段）：')
      ).trim()
      try {
        const patch = JSON.parse(raw) as Record<string, unknown>
        return {
          type: 'edit',
          editedAction: {
            name: action.name,
            args: { ...action.args, ...patch }
          }
        }
      } catch {
        console.log('  [审批] JSON 解析失败，请重试')
      }
      continue
    }
    console.log(`  [审批] 请输入 ${allowed.join(' / ')}`)
  }
}

async function handleTurn(
  rl: Readline,
  agent: Awaited<ReturnType<typeof createCustomerServiceAgent>>['agent'],
  threadId: string,
  userId: string,
  input: string,
  stream: boolean
): Promise<void> {
  let state: AgentTurnState
  try {
    const result = await runTurn(
      { classify: classifyIntent, agent },
      { input, threadId, userId },
      { onRoute: printRoute, onEvent: stream ? renderEvent : undefined }
    )
    if (result.kind === 'chit_chat') {
      console.log(`助手: ${result.reply}`)
      return
    }
    state = result.state
  } catch (err) {
    console.log(`[错误] ${(err as Error).message}`)
    return
  }

  // 敏感工具中断：逐个审批，Command resume 直到没有新中断
  const hadInterrupts = state.interrupts.length > 0
  while (state.interrupts.length > 0) {
    const interrupt = state.interrupts[0]
    if (!interrupt) break
    const decision = await reviewInterrupts(rl, interrupt.value)
    const resumed = await agent.invoke(
      new Command({ resume: { decisions: [decision] } }),
      turnConfig(threadId, userId)
    )
    state = toAgentState(resumed)
  }

  // 流式模式正文已实时输出；但 resume 后的收尾话术没走流式，需补打印
  const text = lastAssistantText(state)
  if (text && (!stream || hadInterrupts)) console.log(`助手: ${text}`)
  if (stream) console.log()
  printConclusion(state)
}

async function main(): Promise<void> {
  const { values } = parseArgs({
    options: {
      stream: { type: 'boolean', default: false },
      resume: { type: 'string' },
      user: { type: 'string', default: 'u_001' }
    }
  })

  const threadId = values.resume ?? `cs-${crypto.randomUUID().slice(0, 8)}`
  const userId = values.user ?? 'u_001'
  const { agent, close } = await createCustomerServiceAgent()
  const rl = createInterface({ input: process.stdin, output: process.stdout })

  console.log('智能客服 CLI（输入 exit 退出）')
  console.log(`  thread_id: ${threadId}（重启后 --resume ${threadId} 接续）`)
  console.log(`  当前用户: ${userId}（--user 可切换）`)

  try {
    while (true) {
      const input = (await rl.question('\n> ')).trim()
      if (!input) continue
      if (['exit', 'quit', '退出'].includes(input.toLowerCase())) break
      await handleTurn(
        rl,
        agent,
        threadId,
        userId,
        input,
        values.stream ?? false
      )
    }
  } finally {
    rl.close()
    await close()
  }
}

if (import.meta.main) {
  await main()
}
