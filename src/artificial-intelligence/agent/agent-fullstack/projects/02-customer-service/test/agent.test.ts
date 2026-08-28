// 端到端测试（todo 3.3）：分类器编排 + 主 Agent 上下文延续 + HITL 审批
// 1. 意图分类器对 6 种意图输出合法 { intent, slots }
// 2. 分类器 → 主 Agent 同 thread_id 上下文延续（真正的端到端链路）
// 3. HITL：退款触发暂停 → approve 继续 / reject 阻断
// 用 fakeModel()（@langchain/core/testing）驱动，避免真实调用 LLM API；中间件与真实工具走完整链路。
import { describe, expect, test } from 'bun:test'
import { fakeModel } from '@langchain/core/testing'
import { AIMessage } from '@langchain/core/messages'
import { InMemoryStore, Command } from '@langchain/langgraph'
import type { HITLRequest } from 'langchain'
import { classify, createIntentClassifier } from '../src/agent/classifier'
import { createCustomerSupportAgent } from '../src/agent/agent'
import type { IntentOutput } from '../src/agent/schema'
import { createCheckpointer } from '../src/memory/checkpointer'

const context = { userId: 'U1001', userName: '李华' }

// HITL 用另一个用户的可退订单 ORD-2613（U1002，shipped）：该订单未被任何其他测试断言状态，
// 避免真实执行 create_refund 把共享 Mock 订单改成 refunding 后污染其他用例。

/** 从 invoke 结果读取 HITL 中断内容；__interrupt__ 是 LangGraph 约定字段，运行时存在但类型未导出 */
const firstInterrupt = (result: unknown): HITLRequest | undefined => {
  const r = result as { __interrupt__?: { value?: HITLRequest }[] }
  // eslint-disable-next-line no-underscore-dangle -- __interrupt__ 是 LangGraph 约定字段名，非自定义标识
  return r.__interrupt__?.[0]?.value
}

/** 取最后一条消息的纯文本，便于断言 */
const lastMessageText = (result: {
  messages: { content: unknown }[]
}): string => {
  const content = result.messages.at(-1)?.content
  return typeof content === 'string' ? content : JSON.stringify(content)
}

describe('意图分类器（6 种意图）', () => {
  const INTENT_CASES: {
    intent: IntentOutput['intent']
    input: string
    slots: Record<string, unknown>
  }[] = [
    {
      intent: 'order_query',
      input: '查询我的订单 ORD-2601 物流',
      slots: { order_id: 'ORD-2601' }
    },
    {
      intent: 'refund',
      input: '我要退掉订单 ORD-2601，不想要了',
      slots: { order_id: 'ORD-2601', reason: '不想要了' }
    },
    { intent: 'complaint', input: '你们客服态度太差，我要投诉', slots: {} },
    { intent: 'faq_query', input: '退货政策是怎样的？', slots: {} },
    { intent: 'handoff', input: '给我转人工客服', slots: {} },
    { intent: 'greeting', input: '你好', slots: {} }
  ]

  for (const c of INTENT_CASES) {
    test(`${c.intent}：${c.input}`, async () => {
      const json = JSON.stringify({
        intent: c.intent,
        slots: c.slots,
        reply: null
      })
      const out = await classify(
        createIntentClassifier({
          model: fakeModel().respond(new AIMessage(json))
        }),
        c.input
      )
      expect(out.intent).toBe(c.intent)
      expect(out.slots).toEqual(c.slots)
    })
  }

  test('模型输出非法 JSON 时回退 unknown，不抛错', async () => {
    const out = await classify(
      createIntentClassifier({
        model: fakeModel().respond(new AIMessage('这不是一个 JSON'))
      }),
      '随便'
    )
    expect(out.intent).toBe('unknown')
  })

  test('模型输出非法 intent 字符串时落到 unknown', async () => {
    const out = await classify(
      createIntentClassifier({
        model: fakeModel().respond(
          new AIMessage('{"intent":"hacked","slots":{}}')
        )
      }),
      '随便'
    )
    expect(out.intent).toBe('unknown')
  })
})

describe('端到端：分类器编排 + 主 Agent 上下文延续', () => {
  test('同 thread_id 两轮对话，第二轮能看到第一轮上下文', async () => {
    const classifierModel = fakeModel()
      .respond(
        new AIMessage(
          '{"intent":"order_query","slots":{"order_id":"ORD-2601"},"reply":null}'
        )
      )
      .respond(
        new AIMessage('{"intent":"order_query","slots":{},"reply":null}')
      )
    const agentModel = fakeModel()
      .respond(new AIMessage('你的订单 ORD-2601 已签收。'))
      .respond(new AIMessage('物流显示已签收，请按时查收。'))
    const intentClassifier = createIntentClassifier({ model: classifierModel })
    const agent = createCustomerSupportAgent({
      model: agentModel,
      checkpointer: createCheckpointer(':memory:'),
      store: new InMemoryStore()
    })
    const config = { configurable: { thread_id: 'e2e-thread' }, context }

    // 第一轮：分类器识别 order_query，主 Agent 回复
    const first = await classify(intentClassifier, '订单 ORD-2601 到哪了')
    expect(first.intent).toBe('order_query')
    await agent.invoke(
      { messages: [{ role: 'user', content: '订单 ORD-2601 到哪了' }] },
      config
    )

    // 第二轮：接续对话
    await classify(intentClassifier, '物流到哪里了')
    await agent.invoke(
      { messages: [{ role: 'user', content: '物流到哪里了' }] },
      config
    )

    // 第二轮主模型输入应包含第一轮的人类消息与 AI 回复 → 上下文延续生效
    const round2Input = agentModel.calls[1].messages
      .map((m) =>
        typeof m.content === 'string' ? m.content : JSON.stringify(m.content)
      )
      .join(' ')
    expect(round2Input).toContain('订单 ORD-2601')
    expect(round2Input).toContain('你的订单 ORD-2601 已签收。')
  })
})

describe('HITL 审批流程', () => {
  test('退款触发暂停，approve 后继续执行', async () => {
    const model = fakeModel()
      .respondWithTools([
        {
          name: 'create_refund',
          args: { order_id: 'ORD-2613', reason: '不想要了' }
        }
      ])
      .respond(new AIMessage('退款申请已提交，请留意处理进度。'))
    const agent = createCustomerSupportAgent({
      model,
      checkpointer: createCheckpointer(':memory:'),
      store: new InMemoryStore()
    })
    const config = {
      configurable: { thread_id: 'hitl-approve' },
      context: { userId: 'U1002', userName: '王芳' }
    }

    const result = await agent.invoke(
      { messages: [{ role: 'user', content: '我要退订单 ORD-2613' }] },
      config
    )
    const interrupt = firstInterrupt(result)
    expect(interrupt).toBeTruthy()
    expect(interrupt?.actionRequests[0].name).toBe('create_refund')

    const resumed = await agent.invoke(
      new Command({ resume: { decisions: [{ type: 'approve' }] } }),
      config
    )
    // 审批后工具真实执行并再次调用模型收尾
    expect(model.callCount).toBe(2)
    expect(lastMessageText(resumed)).toContain('退款申请已提交')
  })

  test('退款触发暂停，reject 阻断工具执行', async () => {
    const model = fakeModel()
      .respondWithTools([
        {
          name: 'create_refund',
          args: { order_id: 'ORD-2613', reason: '不想要了' }
        }
      ])
      .respond(new AIMessage('本次退款申请已取消。'))
    const agent = createCustomerSupportAgent({
      model,
      checkpointer: createCheckpointer(':memory:'),
      store: new InMemoryStore()
    })
    const config = {
      configurable: { thread_id: 'hitl-reject' },
      context: { userId: 'U1002', userName: '王芳' }
    }

    const result = await agent.invoke(
      { messages: [{ role: 'user', content: '我要退订单 ORD-2613' }] },
      config
    )
    const interrupt = firstInterrupt(result)
    expect(interrupt?.actionRequests[0].name).toBe('create_refund')

    const resumed = await agent.invoke(
      new Command({
        resume: { decisions: [{ type: 'reject', message: '人工拒绝该退款' }] }
      }),
      config
    )
    expect(model.callCount).toBe(2)
    expect(lastMessageText(resumed)).toContain('取消')
  })
})
