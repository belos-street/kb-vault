import {
  AIMessage,
  HumanMessage,
  type BaseMessage
} from '@langchain/core/messages'
import { BaseChatModel } from '@langchain/core/language_models/chat_models'
import type { BindToolsInput } from '@langchain/core/language_models/chat_models'
import type { ChatResult } from '@langchain/core/outputs'
import type { Runnable } from '@langchain/core/runnables'
import { MemorySaver } from '@langchain/langgraph'
import { createAgent, trimMessages } from 'langchain'

const ORDER_PATTERN = /ORD-\d{4}/

function textOf(message: BaseMessage): string {
  return typeof message.content === 'string' ? message.content : ''
}

function orderIdFrom(messages: BaseMessage[]): string | undefined {
  for (const message of messages) {
    const orderId = textOf(message).match(ORDER_PATTERN)?.[0]
    if (orderId) return orderId
  }
  return undefined
}

/** 假模型：按客服工单语境回答，用来观察模型实际看到了哪些历史 */
class TicketModel extends BaseChatModel {
  seen: BaseMessage[][] = []

  constructor() {
    super({})
  }

  _llmType() {
    return 'ticket'
  }

  override bindTools(_tools: BindToolsInput[]): Runnable {
    return this
  }

  async _generate(messages: BaseMessage[]): Promise<ChatResult> {
    this.seen.push(messages)

    const lastHuman = [...messages]
      .reverse()
      .find((message) => message.getType() === 'human')
    const question = lastHuman ? textOf(lastHuman) : ''
    const direct = question.match(ORDER_PATTERN)?.[0]
    const remembered = direct ?? orderIdFrom(messages)

    const text = direct
      ? '订单 ' + direct + ' 已发货，预计明天 18:00 前送达。'
      : remembered &&
          (question.includes('什么时候') || question.includes('到哪'))
        ? '订单 ' + remembered + ' 已发货，预计明天 18:00 前送达。'
        : '请提供订单号，例如 ORD-1024。'

    const response = new AIMessage({ content: text })
    return { generations: [{ text, message: response }] }
  }
}

interface Check {
  name: string
  pass: boolean
  detail: string
}

const checks: Check[] = []

// 1) 同一工单的第二轮能沿用第一轮的订单号
const model = new TicketModel()
const agent = createAgent({
  model,
  tools: [],
  checkpointer: new MemorySaver()
})

const ticket1001 = { configurable: { thread_id: 'ticket-1001' } }
await agent.invoke(
  { messages: [{ role: 'user', content: '订单 ORD-1024 到哪了？' }] },
  ticket1001
)
const followUp = await agent.invoke(
  { messages: [{ role: 'user', content: '那什么时候能到？' }] },
  ticket1001
)

const secondCall = model.seen[1] ?? []
checks.push({
  name: '同一工单第二轮带上订单号',
  pass:
    secondCall.some((message) => textOf(message).includes('ORD-1024')) &&
    (followUp.messages.at(-1)?.text ?? '').includes('明天 18:00'),
  detail: '第二轮模型看到了 ORD-1024，直接回答 ETA'
})

// 2) 不同工单的消息互不影响
const ticket1002 = { configurable: { thread_id: 'ticket-1002' } }
const isolated = await agent.invoke(
  { messages: [{ role: 'user', content: '那什么时候能到？' }] },
  ticket1002
)

const thirdCall = model.seen[2] ?? []
checks.push({
  name: '不同工单上下文隔离',
  pass:
    !thirdCall.some((message) => textOf(message).includes('ORD-1024')) &&
    (isolated.messages.at(-1)?.text ?? '').includes('请提供订单号'),
  detail: '工单 1002 没有 ORD-1024，模型反问订单号'
})

// 3) trimMessages 能把工单历史裁回预算内
const history = [
  new HumanMessage('订单 ORD-1024 到哪了？'),
  new AIMessage('订单 ORD-1024 已发货，预计明天 18:00 前送达。'),
  new HumanMessage('那能改地址吗？'),
  new AIMessage('可以，请提供新地址。'),
  new HumanMessage('谢谢')
]

const trimmed = await trimMessages(history, {
  maxTokens: 3,
  strategy: 'last',
  tokenCounter: (messages) => messages.length,
  startOn: 'human',
  endOn: 'human'
})

checks.push({
  name: 'trimMessages 裁掉旧消息',
  pass: trimmed.length < history.length,
  detail: '从 ' + history.length + ' 条裁到 ' + trimmed.length + ' 条'
})

for (const check of checks) {
  console.log(
    (check.pass ? 'PASS' : 'FAIL') + '  ' + check.name + '  ' + check.detail
  )
}

if (checks.some((check) => !check.pass)) {
  process.exit(1)
}

console.log('all memory checks passed')
