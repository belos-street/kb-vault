#!/usr/bin/env bun
/**
 * CLI 入口
 *
 * 提供命令行交互，支持用户身份注入、对话循环、HITL 审批决策输入。
 * 相同 --user 重启后，checkpointer 自动恢复上轮对话历史。
 *
 * 用法：
 *   bun run cli --user=李华
 */
import { createInterface } from 'node:readline/promises'
import { stdin as input, stdout as output } from 'node:process'
import { agent } from '@/agent/agent.ts'

// ─── 参数解析 ────────────────────────────────────────────────────────────────

const userArg = process.argv.find((a) => a.startsWith('--user='))
const userName = userArg?.split('=')[1] ?? '测试用户'
const userId = `USER-${userName}`
const threadId = `cs-${userId}`

const config = {
  configurable: { thread_id: threadId },
  context: { userId, userName }
}

// ─── 对话循环 ────────────────────────────────────────────────────────────────

export async function runCli() {
  const rl = createInterface({ input, output, terminal: true })

  rl.on('SIGINT', () => {
    console.log('\n👋 再见！')
    rl.close()
    process.exit(0)
  })

  console.log(`\n╔══════════════════════════════════════════╗`)
  console.log(`║   🐱 哈气米客服 - ${userName.padEnd(8)}  ║`)
  console.log(`║   用户 ID: ${userId.padEnd(20)}║`)
  console.log(`║   输入 exit 退出对话                       ║`)
  console.log(`╚══════════════════════════════════════════╝\n`)

  while (true) {
    const input = await rl.question('🙋 我 > ')
    const trimmed = input.trim()

    if (trimmed.toLowerCase() === 'exit') break
    if (!trimmed) continue

    process.stdout.write('\n')
    const result = await agent.invoke(
      { messages: [{ role: 'user', content: trimmed }] },
      config
    )

    // 打印所有 AI 回复消息
    const msgs: any[] = result.messages ?? []
    const assistantMessages = msgs.filter(
      (m) =>
        m._getType?.() === 'ai' && typeof m.content === 'string' && m.content
    )

    if (assistantMessages.length > 0) {
      for (const msg of assistantMessages) {
        console.log(`🤖 哈气米 > ${msg.content}\n`)
      }
    }

    // 检查 HITL 待审批
    const lastMsg = msgs[msgs.length - 1]
    const isToolCall =
      lastMsg?._getType?.() === 'ai' && (lastMsg?.tool_calls?.length ?? 0) > 0

    if (isToolCall && assistantMessages.length === 0) {
      await handleHitl(lastMsg.tool_calls, rl)
    }
  }

  rl.close()
  console.log(`\n👋 对话已结束，使用 --user=${userName} 重启可继续上轮对话。\n`)
}

// ─── HITL 处理 ───────────────────────────────────────────────────────────────

async function handleHitl(
  toolCalls: any[],
  rl: ReturnType<typeof createInterface>
) {
  for (const tc of toolCalls) {
    console.log(`🔔 需要审批：调用「${tc.name}」`)
    console.log(`   参数：${JSON.stringify(tc.args, null, 4)}\n`)
  }

  while (true) {
    const decision = await rl.question('📋 审批决定 (approve/reject) > ')
    const trimmed = decision.trim().toLowerCase()

    if (trimmed === 'approve' || trimmed === 'reject') {
      console.log(`\n⏳ 正在处理「${trimmed}」...\n`)
      const resumeResult = await agent.invoke(null as any, config)

      const resumeMsgs: any[] = resumeResult.messages ?? []
      const resumeAssistant = resumeMsgs.filter(
        (m) =>
          m._getType?.() === 'ai' && typeof m.content === 'string' && m.content
      )
      for (const msg of resumeAssistant) {
        console.log(`🤖 哈气米 > ${msg.content}\n`)
      }
      break
    } else {
      console.log('❌ 无效选项，请输入 approve 或 reject。\n')
    }
  }
}

// 直接执行时才启动对话循环
const isMain = import.meta.path === Bun.main
if (isMain) {
  await runCli()
}
