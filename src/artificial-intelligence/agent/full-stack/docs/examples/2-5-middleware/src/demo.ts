import { AIMessage, type BaseMessage } from '@langchain/core/messages'
import { BaseChatModel } from '@langchain/core/language_models/chat_models'
import type { BindToolsInput } from '@langchain/core/language_models/chat_models'
import type { ChatResult } from '@langchain/core/outputs'
import type { Runnable } from '@langchain/core/runnables'
import { Command, MemorySaver } from '@langchain/langgraph'
import {
  createAgent,
  createMiddleware,
  humanInTheLoopMiddleware,
  piiMiddleware,
  tool
} from 'langchain'
import { z } from 'zod'

// 注：LangChain 1.6.4 的内置中间件 contextSchema 类型在
// exactOptionalPropertyTypes: true 下会报不兼容；示例工程的 tsconfig 关闭了该选项。

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

  bindTools(_tools: BindToolsInput[]): Runnable {
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

const weatherTool = tool(async ({ city }) => ({ city, tempC: 24 }), {
  name: 'weather',
  description: '查询城市天气',
  schema: z.object({ city: z.string() })
})

const refundTool = tool(
  async ({ orderId }) => ({ ok: true, orderId, refundCny: 199 }),
  {
    name: 'refund',
    description: '提交退款申请',
    schema: z.object({ orderId: z.string() })
  }
)

interface Check {
  name: string
  pass: boolean
  detail: string
}

const checks: Check[] = []

// 1) 顺序：beforeModel → wrapModelCall → afterModel → wrapToolCall
const events: string[] = []
const orderMiddleware = createMiddleware({
  name: 'OrderMiddleware',
  beforeModel: () => {
    events.push('beforeModel')
  },
  afterModel: () => {
    events.push('afterModel')
  },
  wrapModelCall: async (request, handler) => {
    events.push('wrapModelCall:in')
    const response = await handler(request)
    events.push('wrapModelCall:out')
    return response
  },
  wrapToolCall: async (request, handler) => {
    events.push('wrapToolCall:in:' + request.toolCall.name)
    const response = await handler(request)
    events.push('wrapToolCall:out:' + request.toolCall.name)
    return response
  }
})

const orderModel = new ScriptedChatModel([
  new AIMessage({
    content: '',
    tool_calls: [
      {
        id: 'call_weather',
        name: 'weather',
        args: { city: '杭州' },
        type: 'tool_call'
      }
    ]
  }),
  new AIMessage({ content: '杭州 24 度' })
])

const orderAgent = createAgent({
  model: orderModel,
  tools: [weatherTool],
  middleware: [orderMiddleware]
})
await orderAgent.invoke({ messages: [{ role: 'user', content: '杭州天气' }] })

const beforeModel = events.indexOf('beforeModel')
const wrapModelCall = events.indexOf('wrapModelCall:in')
const wrapModelCallOut = events.indexOf('wrapModelCall:out')
const afterModel = events.indexOf('afterModel')
const wrapToolCall = events.indexOf('wrapToolCall:in:weather')
checks.push({
  name: '中间件按循环位置执行',
  pass:
    beforeModel >= 0 &&
    wrapModelCall > beforeModel &&
    wrapModelCallOut > wrapModelCall &&
    afterModel > wrapModelCallOut &&
    wrapToolCall > afterModel,
  detail: events.join(' → ')
})

// 2) PII：脱敏发生在模型调用前
let captured: BaseMessage[] = []
const spyMiddleware = createMiddleware({
  name: 'SpyMiddleware',
  wrapModelCall: async (request, handler) => {
    captured = request.messages
    return handler(request)
  }
})

const piiModel = new ScriptedChatModel([new AIMessage({ content: '收到' })])
const piiAgent = createAgent({
  model: piiModel,
  middleware: [
    spyMiddleware,
    piiMiddleware('email', { strategy: 'redact', applyToInput: true })
  ]
})
await piiAgent.invoke({
  messages: [{ role: 'user', content: '联系 alice@example.com' }]
})

const piiOk = captured.some((message) =>
  String(message.content).includes('[REDACTED_EMAIL]')
)
checks.push({
  name: 'PII 在模型调用前脱敏',
  pass: piiOk,
  detail: captured.map((message) => String(message.content)).join(' | ')
})

// 3) HITL：refund 执行前中断，approve 后继续
const hitlModel = new ScriptedChatModel([
  new AIMessage({
    content: '',
    tool_calls: [
      {
        id: 'call_refund',
        name: 'refund',
        args: { orderId: 'ORD-1024' },
        type: 'tool_call'
      }
    ]
  }),
  new AIMessage({ content: '退款已提交' })
])

const hitlAgent = createAgent({
  model: hitlModel,
  tools: [refundTool],
  middleware: [
    humanInTheLoopMiddleware({
      interruptOn: {
        refund: {
          allowedDecisions: ['approve', 'reject'],
          description: '退款需要人工审批'
        }
      }
    })
  ],
  checkpointer: new MemorySaver()
})

const config = { configurable: { thread_id: 'demo-thread' } }
const paused = await hitlAgent.invoke(
  { messages: [{ role: 'user', content: '退掉 ORD-1024' }] },
  config
)
const interrupts = paused['__interrupt__']
const pausedOk = Array.isArray(interrupts) && interrupts.length > 0

const resumed = await hitlAgent.invoke(
  new Command({ resume: { decisions: [{ type: 'approve' }] } }),
  config
)
checks.push({
  name: 'HITL 审批前中断、通过后继续',
  pass: pausedOk && resumed.messages.at(-1)?.content === '退款已提交',
  detail: pausedOk ? '审批通过后 refund 执行' : '没有触发中断'
})

for (const check of checks) {
  console.log(
    (check.pass ? 'PASS' : 'FAIL') + '  ' + check.name + '  ' + check.detail
  )
}

if (checks.some((check) => !check.pass)) {
  process.exit(1)
}

console.log('all middleware checks passed')
