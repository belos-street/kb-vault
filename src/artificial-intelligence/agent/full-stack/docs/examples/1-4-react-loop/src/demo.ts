import { runAgent } from './loop.ts'
import type { ChatMessage, ToolCall } from './loop.ts'

interface Check {
  name: string
  pass: boolean
  detail: string
}

const checks: Check[] = []

function toolCall(id: string, args: Record<string, unknown>): ToolCall {
  return {
    id,
    function: {
      name: 'getOrder',
      arguments: JSON.stringify(args)
    }
  }
}

const parallelCalls: ChatMessage[][] = []
const parallelReply = await runAgent({
  question: 'ORD-1024 和 ORD-2048 到哪了？',
  chat: async (messages) => {
    parallelCalls.push(structuredClone(messages))
    if (parallelCalls.length === 1) {
      return {
        role: 'assistant',
        content: '',
        tool_calls: [
          toolCall('call_a', { orderId: 'ORD-1024' }),
          toolCall('call_b', { orderId: 'ORD-2048' })
        ]
      }
    }
    return { role: 'assistant', content: '都已发货' }
  }
})
const parallelToolMessages =
  parallelCalls[1]?.filter((message) => message.role === 'tool') ?? []
checks.push({
  name: '并行 tool_calls 按 id 回填',
  pass:
    parallelReply === '都已发货' &&
    parallelToolMessages.length === 2 &&
    parallelToolMessages.some((message) => message.tool_call_id === 'call_a') &&
    parallelToolMessages.some((message) => message.tool_call_id === 'call_b'),
  detail: '两条 tool 消息的 tool_call_id 都能对上'
})

const invalidCalls: ChatMessage[][] = []
const invalidReply = await runAgent({
  question: '订单状态',
  chat: async (messages) => {
    invalidCalls.push(structuredClone(messages))
    if (invalidCalls.length === 1) {
      return {
        role: 'assistant',
        content: '',
        tool_calls: [toolCall('call_bad', { orderId: '1024' })]
      }
    }
    return { role: 'assistant', content: '已修正' }
  }
})
const invalidToolMessage = invalidCalls[1]?.find(
  (message) => message.role === 'tool'
)
checks.push({
  name: '非法参数回填 invalid_arguments',
  pass:
    invalidReply === '已修正' &&
    invalidToolMessage?.content.includes('invalid_arguments') === true,
  detail: 'Zod 拒绝不符合 ORD-xxxx 的 orderId，错误回填给模型'
})

let loopCalls = 0
let loopError = ''
try {
  await runAgent({
    question: '订单状态',
    maxSteps: 3,
    chat: async () => {
      loopCalls += 1
      return {
        role: 'assistant',
        content: '',
        tool_calls: [
          toolCall('call_' + loopCalls, { orderId: 'ORD-100' + loopCalls })
        ]
      }
    }
  })
} catch (error) {
  loopError = error instanceof Error ? error.message : String(error)
}
checks.push({
  name: 'maxSteps 能终止无限循环',
  pass: loopError === 'max_steps_exceeded' && loopCalls === 3,
  detail: loopError
})

for (const check of checks) {
  console.log(
    (check.pass ? 'PASS' : 'FAIL') + '  ' + check.name + '  ' + check.detail
  )
}

if (checks.some((check) => !check.pass)) {
  process.exit(1)
}

console.log('all react loop checks passed')
