import { AIMessage } from '@langchain/core/messages'
import { BaseChatModel } from '@langchain/core/language_models/chat_models'
import type { BindToolsInput } from '@langchain/core/language_models/chat_models'
import type { ChatResult } from '@langchain/core/outputs'
import type { Runnable } from '@langchain/core/runnables'
import { createAgent, toolStrategy } from 'langchain'
import { TicketIntent, ToolPermissionError, runRefund } from './contract.ts'

interface Check {
  name: string
  pass: boolean
  detail: string
}

const checks: Check[] = []

/** 假模型：第一轮调用结构化输出工具，把结果交给 createAgent 解析 */
class StructuredChatModel extends BaseChatModel {
  toolName = ''
  calls = 0

  _llmType() {
    return 'structured-scripted'
  }

  override bindTools(tools: BindToolsInput[]): Runnable {
    const first = tools[0] as { function?: { name?: string } } | undefined
    this.toolName = first?.function?.name ?? ''
    return this
  }

  async _generate(): Promise<ChatResult> {
    this.calls += 1
    const message =
      this.calls === 1
        ? new AIMessage({
            content: '',
            tool_calls: [
              {
                id: 'call_structured',
                name: this.toolName,
                args: {
                  intent: 'refund_status',
                  orderId: 'ORD-1024',
                  reply: '3-5 个工作日到账'
                },
                type: 'tool_call'
              }
            ]
          })
        : new AIMessage({ content: 'done' })

    return {
      generations: [
        {
          text: typeof message.content === 'string' ? message.content : '',
          message
        }
      ]
    }
  }
}

const invalid = runRefund(
  { orderId: '1024', reason: 'late' },
  { userId: 'u_1', role: 'admin', tenantId: 't_acme' }
)
checks.push({
  name: '非法入参被 Zod 拒绝',
  pass: !invalid.ok && invalid.code === 'invalid_input',
  detail: invalid.message
})

let deniedMessage = ''
let deniedPass = false
try {
  runRefund(
    { orderId: 'ORD-1024', reason: 'late' },
    { userId: 'u_1', role: 'agent', tenantId: 't_acme' }
  )
} catch (error) {
  deniedPass = error instanceof ToolPermissionError
  deniedMessage = error instanceof Error ? error.message : String(error)
}
checks.push({
  name: 'agent 角色被权限上下文拒绝',
  pass: deniedPass,
  detail: deniedMessage
})

const accepted = runRefund(
  { orderId: 'ORD-1024', reason: 'late' },
  { userId: 'u_1', role: 'admin', tenantId: 't_acme' }
)
checks.push({
  name: 'admin 角色通过并返回结构化结果',
  pass: accepted.ok,
  detail: accepted.message
})

const structuredAgent = createAgent({
  model: new StructuredChatModel({}),
  tools: [],
  responseFormat: toolStrategy(TicketIntent)
})
const structured = await structuredAgent.invoke({
  messages: [{ role: 'user', content: '查一下退款进度' }]
})
const parsed = TicketIntent.safeParse(structured.structuredResponse)
checks.push({
  name: 'responseFormat 产出符合 Schema 的结构化结果',
  pass: parsed.success,
  detail: parsed.success
    ? parsed.data.reply
    : parsed.error.issues.map((issue) => issue.message).join('; ')
})

for (const check of checks) {
  console.log(
    (check.pass ? 'PASS' : 'FAIL') + '  ' + check.name + '  ' + check.detail
  )
}

if (checks.some((check) => !check.pass)) {
  process.exit(1)
}

console.log('all contract checks passed')
