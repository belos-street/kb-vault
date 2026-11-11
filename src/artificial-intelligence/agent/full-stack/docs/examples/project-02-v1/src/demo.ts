import {
  AIMessage,
  ToolMessage,
  type BaseMessage
} from '@langchain/core/messages'
import { BaseChatModel } from '@langchain/core/language_models/chat_models'
import type { BindToolsInput } from '@langchain/core/language_models/chat_models'
import type { ChatResult } from '@langchain/core/outputs'
import type { Runnable } from '@langchain/core/runnables'
import { Command } from '@langchain/langgraph'
import { createCustomerAgent } from './agent.ts'

/** 可编排的假模型：按顺序返回 AIMessage，不调用真实 LLM */
class ScriptedChatModel extends BaseChatModel {
  responses: AIMessage[]
  seen: BaseMessage[][] = []

  constructor(responses: AIMessage[]) {
    super({})
    this.responses = responses
  }

  _llmType() {
    return 'scripted'
  }

  override bindTools(_tools: BindToolsInput[]): Runnable {
    return this
  }

  async _generate(messages: BaseMessage[]): Promise<ChatResult> {
    this.seen.push(messages)
    const response =
      this.responses.shift() ?? new AIMessage({ content: 'done' })
    return {
      generations: [
        {
          text: typeof response.content === 'string' ? response.content : '',
          message: response
        }
      ]
    }
  }
}

interface Check {
  name: string
  pass: boolean
  detail: string
}

const checks: Check[] = []
const context = {
  userId: 'u_1024',
  role: 'admin' as const,
  tenantId: 't_acme'
}

// 1) 同一 thread 记住上一轮
const memoryModel = new ScriptedChatModel([
  new AIMessage({ content: '你好 Alice' }),
  new AIMessage({ content: '你叫 Alice' })
])
const memoryAgent = createCustomerAgent({ model: memoryModel })
const memoryConfig = {
  configurable: { thread_id: 'alice' },
  context
}
await memoryAgent.invoke(
  { messages: [{ role: 'user', content: '我叫 Alice' }] },
  memoryConfig
)
await memoryAgent.invoke(
  { messages: [{ role: 'user', content: '我叫什么？' }] },
  memoryConfig
)
const secondSeen = memoryModel.seen[1] ?? []
checks.push({
  name: '同 thread 记住上一轮',
  pass: secondSeen.some((message) =>
    String(message.content).includes('我叫 Alice')
  ),
  detail: '第二轮模型看到了 ' + secondSeen.length + ' 条消息'
})

// 2) FAQ 工具命中
const faqModel = new ScriptedChatModel([
  new AIMessage({
    content: '',
    tool_calls: [
      {
        id: 'call_faq',
        name: 'search_faq',
        args: { question: '退款多久到账？' },
        type: 'tool_call'
      }
    ]
  }),
  new AIMessage({ content: '退款 3-5 个工作日到账。' })
])
const faqAgent = createCustomerAgent({ model: faqModel })
const faqResult = await faqAgent.invoke(
  { messages: [{ role: 'user', content: '退款多久到账？' }] },
  { configurable: { thread_id: 'faq' }, context }
)
const faqToolMessage = faqResult.messages.find((message) =>
  ToolMessage.isInstance(message)
)
checks.push({
  name: 'FAQ 工具命中',
  pass:
    ToolMessage.isInstance(faqToolMessage) &&
    faqToolMessage.content.toString().includes('3-5 个工作日'),
  detail: 'search_faq 返回了退款时效'
})

// 3) refund 触发 HITL，approve 后继续
const refundModel = new ScriptedChatModel([
  new AIMessage({
    content: '',
    tool_calls: [
      {
        id: 'call_refund',
        name: 'refund',
        args: { orderId: 'ORD-1024', reason: 'late' },
        type: 'tool_call'
      }
    ]
  }),
  new AIMessage({ content: '退款已提交' })
])
const refundAgent = createCustomerAgent({ model: refundModel })
const refundConfig = {
  configurable: { thread_id: 'refund' },
  context
}
const paused = await refundAgent.invoke(
  { messages: [{ role: 'user', content: '退掉 ORD-1024' }] },
  refundConfig
)
const pausedOk =
  Array.isArray(paused['__interrupt__']) && paused['__interrupt__'].length > 0
const resumed = await refundAgent.invoke(
  new Command({ resume: { decisions: [{ type: 'approve' }] } }),
  refundConfig
)
checks.push({
  name: 'refund 触发 HITL 并恢复',
  pass: pausedOk && resumed.messages.at(-1)?.content === '退款已提交',
  detail: pausedOk ? '审批通过后继续' : '没有触发中断'
})

for (const check of checks) {
  console.log(
    (check.pass ? 'PASS' : 'FAIL') + '  ' + check.name + '  ' + check.detail
  )
}

if (checks.some((check) => !check.pass)) {
  process.exit(1)
}

console.log('all project 02 v1 checks passed')
