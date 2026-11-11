import {
  AIMessage,
  ToolMessage,
  type BaseMessage
} from '@langchain/core/messages'
import { BaseChatModel } from '@langchain/core/language_models/chat_models'
import type { BindToolsInput } from '@langchain/core/language_models/chat_models'
import type { ChatResult } from '@langchain/core/outputs'
import type { Runnable } from '@langchain/core/runnables'
import { createAgent, tool } from 'langchain'
import { z } from 'zod'

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

const weatherTool = tool(
  async ({ city }) => ({ city, tempC: 24, condition: '多云' }),
  {
    name: 'weather',
    description: '查询城市天气。仅当用户明确问天气时调用。',
    schema: z.object({
      city: z.string().min(1).describe('城市名，例如 杭州')
    })
  }
)

interface Check {
  name: string
  pass: boolean
  detail: string
}

const checks: Check[] = []

// 1) createAgent 自动执行工具并把结果回填给模型
const model = new ScriptedChatModel([
  new AIMessage({
    content: '',
    tool_calls: [
      {
        id: 'call_1',
        name: 'weather',
        args: { city: '杭州' },
        type: 'tool_call'
      }
    ]
  }),
  new AIMessage({ content: '杭州 24 度，多云' })
])
const agent = createAgent({
  model,
  tools: [weatherTool],
  systemPrompt: '你是天气助手。'
})
const result = await agent.invoke({
  messages: [{ role: 'user', content: '杭州天气' }]
})
const toolMessage = result.messages.find(
  (message) => message.getType() === 'tool'
)
checks.push({
  name: '框架自动执行工具并回填',
  pass:
    result.messages.at(-1)?.content === '杭州 24 度，多云' &&
    Boolean(toolMessage) &&
    model.seen[1]?.some((message) => message.getType() === 'tool') === true,
  detail: 'assistant(tool_calls) → tool → assistant'
})

// 2) 非法参数由工具 Schema 拒绝，错误回填给模型
const badModel = new ScriptedChatModel([
  new AIMessage({
    content: '',
    tool_calls: [
      { id: 'call_bad', name: 'weather', args: { city: '' }, type: 'tool_call' }
    ]
  }),
  new AIMessage({ content: '请提供城市名' })
])
const badAgent = createAgent({ model: badModel, tools: [weatherTool] })
const bad = await badAgent.invoke({
  messages: [{ role: 'user', content: '天气' }]
})
const badTool = bad.messages.find((message) => message.getType() === 'tool')
checks.push({
  name: '非法参数返回 error ToolMessage',
  pass:
    ToolMessage.isInstance(badTool) &&
    badTool.status === 'error' &&
    badTool.content.toString().includes('did not match expected schema'),
  detail: 'Zod 校验失败，模型可据此修正'
})

// 3) stream 能按节点返回更新
const streamModel = new ScriptedChatModel([
  new AIMessage({ content: '流式完成' })
])
const streamAgent = createAgent({ model: streamModel, tools: [] })
let updates = 0
for await (const update of await streamAgent.stream(
  { messages: [{ role: 'user', content: '你好' }] },
  { streamMode: 'updates' }
)) {
  void update
  updates += 1
}
checks.push({
  name: 'stream(updates) 返回节点更新',
  pass: updates > 0,
  detail: '收到 ' + updates + ' 个 update'
})

for (const check of checks) {
  console.log(
    (check.pass ? 'PASS' : 'FAIL') + '  ' + check.name + '  ' + check.detail
  )
}

if (checks.some((check) => !check.pass)) {
  process.exit(1)
}

console.log('all createAgent checks passed')
