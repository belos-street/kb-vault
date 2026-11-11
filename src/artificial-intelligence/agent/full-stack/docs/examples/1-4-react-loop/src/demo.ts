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
      name: 'weather',
      arguments: JSON.stringify(args)
    }
  }
}

const parallelCalls: ChatMessage[][] = []
const parallelReply = await runAgent({
  question: '杭州和上海明天要带伞吗？',
  chat: async (messages) => {
    parallelCalls.push(structuredClone(messages))
    if (parallelCalls.length === 1) {
      return {
        role: 'assistant',
        content: '',
        tool_calls: [
          toolCall('call_hz', { city: '杭州' }),
          toolCall('call_sh', { city: '上海' })
        ]
      }
    }
    return { role: 'assistant', content: '都要带伞' }
  }
})
const parallelToolMessages =
  parallelCalls[1]?.filter((message) => message.role === 'tool') ?? []
checks.push({
  name: '并行 tool_calls 按 id 回填',
  pass:
    parallelReply === '都要带伞' &&
    parallelToolMessages.length === 2 &&
    parallelToolMessages.some(
      (message) => message.tool_call_id === 'call_hz'
    ) &&
    parallelToolMessages.some((message) => message.tool_call_id === 'call_sh'),
  detail: '两条 tool 消息的 tool_call_id 都能对上'
})

const invalidCalls: ChatMessage[][] = []
const invalidReply = await runAgent({
  question: '杭州天气',
  chat: async (messages) => {
    invalidCalls.push(structuredClone(messages))
    if (invalidCalls.length === 1) {
      return {
        role: 'assistant',
        content: '',
        tool_calls: [toolCall('call_bad', { city: '' })]
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
  detail: 'Zod 拒绝空 city，错误回填给模型'
})

let loopCalls = 0
let loopError = ''
try {
  await runAgent({
    question: '杭州天气',
    maxSteps: 3,
    chat: async () => {
      loopCalls += 1
      return {
        role: 'assistant',
        content: '',
        tool_calls: [
          toolCall('call_' + loopCalls, { city: '杭州' + loopCalls })
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
