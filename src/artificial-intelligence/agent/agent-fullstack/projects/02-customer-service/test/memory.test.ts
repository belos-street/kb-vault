// 记忆层回归测试（todo 2.4）：
// 1. SqliteSaver 短期记忆：同 thread_id 两轮 invoke，第二轮模型输入能看到第一轮对话
// 2. Store 长期记忆：两个不同 thread_id + 同一 userId，后线程能读出先前保存的偏好
// 用 fakeModel() 驱动（@langchain/core/testing），避免真实调用 LLM API
import { describe, expect, test } from 'bun:test'
import { fakeModel } from '@langchain/core/testing'
import { AIMessage } from '@langchain/core/messages'
import { InMemoryStore } from '@langchain/langgraph'
import { createCustomerSupportAgent } from '../src/agent/agent'
import { createCheckpointer } from '../src/memory/checkpointer'

const context = { userId: 'U1001', userName: '李华' }

/** 把消息数组拼成易断言的纯文本（system 内容是块数组，其余是字符串） */
const joinMessages = (messages: { content: unknown }[]) =>
  messages
    .map((m) =>
      typeof m.content === 'string' ? m.content : JSON.stringify(m.content)
    )
    .join(' ')

describe('短期记忆（SqliteSaver）', () => {
  test('同 thread_id 第二轮能想起第一轮对话', async () => {
    const model = fakeModel()
      .respond(new AIMessage('好的，你的订单问题我先记下了。'))
      .respond(new AIMessage('我记得你刚才说订单 ORD-2601 有问题。'))

    // SqliteSaver 需要临时库：createCheckpointer(':memory:') 内部 new Database(':memory:')，
    // 同实例内多次 invoke 共享同一内存库
    const agent = createCustomerSupportAgent({
      model,
      checkpointer: createCheckpointer(':memory:'),
      store: new InMemoryStore()
    })
    const config = { configurable: { thread_id: 'thread-1' }, context }

    await agent.invoke(
      { messages: [{ role: 'user', content: '订单 ORD-2601 有问题' }] },
      config
    )
    await agent.invoke(
      { messages: [{ role: 'user', content: '我刚才说了什么？' }] },
      config
    )

    // 两轮各调用模型一次；第二轮的输入应包含第一轮的人类消息与 AI 回复
    expect(model.callCount).toBe(2)
    const round2Input = joinMessages(model.calls[1].messages)
    expect(round2Input).toContain('订单 ORD-2601 有问题')
    expect(round2Input).toContain('好的，你的订单问题我先记下了。')
  })

  test('不同 thread_id 之间互不串味', async () => {
    const model = fakeModel()
      .respond(new AIMessage('A 线程的回复。'))
      .respond(new AIMessage('B 线程的回复。'))
    const agent = createCustomerSupportAgent({
      model,
      checkpointer: createCheckpointer(':memory:'),
      store: new InMemoryStore()
    })

    await agent.invoke(
      { messages: [{ role: 'user', content: 'A 线程专属内容' }] },
      { configurable: { thread_id: 'thread-A' }, context }
    )
    await agent.invoke(
      { messages: [{ role: 'user', content: 'B 线程问题' }] },
      { configurable: { thread_id: 'thread-B' }, context }
    )

    // B 线程第二轮的输入不应包含 A 线程的消息
    expect(joinMessages(model.calls[1].messages)).not.toContain(
      'A 线程专属内容'
    )
  })
})

describe('长期记忆（Store 跨线程）', () => {
  test('同一 userId 不同 thread_id 能读出先前保存的偏好', async () => {
    const model = fakeModel()
      .respondWithTools([
        { name: 'save_preference', args: { key: 'nickname', value: '小李' } }
      ])
      .respond(new AIMessage('好的，已记住叫你小李。'))
      .respondWithTools([{ name: 'get_preferences', args: {} }])
      .respond(new AIMessage('你的偏好是 nickname：小李。'))

    const agent = createCustomerSupportAgent({
      model,
      checkpointer: createCheckpointer(':memory:'),
      store: new InMemoryStore()
    })

    // 线程 A：保存偏好
    await agent.invoke(
      { messages: [{ role: 'user', content: '以后叫我小李' }] },
      { configurable: { thread_id: 'thread-A' }, context }
    )

    // 线程 B（全新对话）：同一 userId 读出偏好；store 是共享实例
    const result = await agent.invoke(
      { messages: [{ role: 'user', content: '我叫什么？' }] },
      { configurable: { thread_id: 'thread-B' }, context }
    )

    expect(model.callCount).toBe(4)
    // 工具返回的 ToolMessage 真实反映 runtime.store 读到了上一线程保存的偏好
    const toolResult = joinMessages(
      result.messages.filter(
        (m: { getType: () => string }) => m.getType() === 'tool'
      )
    )
    expect(toolResult).toContain('nickname：小李')
    expect(joinMessages(result.messages)).toContain('小李')
  })
})
