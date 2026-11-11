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

/** 记录模型看到的 messages，并回显最后一条用户消息 */
class EchoModel extends BaseChatModel {
  seen: BaseMessage[][] = []

  constructor() {
    super({})
  }

  _llmType() {
    return 'echo'
  }

  override bindTools(_tools: BindToolsInput[]): Runnable {
    return this
  }

  async _generate(messages: BaseMessage[]): Promise<ChatResult> {
    this.seen.push(messages)
    const last = messages.at(-1)
    const text = '收到: ' + String(last?.content ?? '')
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

// 1) 同一 thread_id 的第二轮能看到第一轮消息
const model = new EchoModel()
const agent = createAgent({
  model,
  tools: [],
  checkpointer: new MemorySaver()
})

const alice = { configurable: { thread_id: 'alice' } }
await agent.invoke(
  { messages: [{ role: 'user', content: '我叫 Alice，喜欢喝美式' }] },
  alice
)
await agent.invoke(
  { messages: [{ role: 'user', content: '我叫什么？' }] },
  alice
)

const secondCall = model.seen[1] ?? []
checks.push({
  name: '同 thread 第二轮带上历史',
  pass:
    secondCall.some((message) =>
      String(message.content).includes('我叫 Alice')
    ) &&
    secondCall.some((message) => String(message.content).includes('我叫什么')),
  detail: '第二轮模型看到了 ' + secondCall.length + ' 条消息'
})

// 2) 不同 thread_id 的消息互不影响
const bob = { configurable: { thread_id: 'bob' } }
await agent.invoke({ messages: [{ role: 'user', content: '我叫 Bob' }] }, bob)

const bobCall = model.seen[2] ?? []
checks.push({
  name: '不同 thread 消息隔离',
  pass:
    bobCall.some((message) => String(message.content).includes('我叫 Bob')) &&
    !bobCall.some((message) => String(message.content).includes('Alice')),
  detail: 'Bob 的上下文里没有 Alice'
})

// 3) trimMessages 能把历史裁回预算内
const history = [
  new HumanMessage('第一句'),
  new AIMessage('第二句'),
  new HumanMessage('第三句'),
  new AIMessage('第四句'),
  new HumanMessage('第五句')
]

const trimmed = await trimMessages(history, {
  maxTokens: 3,
  strategy: 'last',
  tokenCounter: (messages) => messages.length,
  startOn: 'human',
  endOn: 'ai'
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
