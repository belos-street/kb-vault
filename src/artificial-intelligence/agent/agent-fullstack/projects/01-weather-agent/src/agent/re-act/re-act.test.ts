import { describe, it, expect } from 'bun:test'
import type OpenAI from 'openai'

// config.ts 在模块加载时校验环境变量（fail-fast），
// 单测环境先注入占位密钥，再动态加载被测模块
process.env.OPENAI_API_KEY ??= 'sk-test'
const { runAgent } = await import('./re-act')

/**
 * 构造最小 LLM 客户端 mock：按顺序返回预设响应，并记录每次调用的请求参数。
 * 消费 runAgent 的 client 注入参数，让主循环不依赖真实 LLM 即可测试。
 */
function createMockClient(responses: unknown[]) {
  const calls: Array<{ messages: unknown[] }> = []
  let index = 0

  const client = {
    chat: {
      completions: {
        create: async (params: { messages: unknown[] }) => {
          calls.push(params)
          return responses[Math.min(index++, responses.length - 1)]
        }
      }
    }
  }

  // 假对象只需满足 runAgent 实际用到的 chat.completions.create 形状
  return { client: client as unknown as OpenAI, calls }
}

describe('runAgent', () => {
  it('直接回答路径：LLM 不返回 tool_calls 时直接返回 content', async () => {
    const { client, calls } = createMockClient([
      { choices: [{ message: { content: '你好！我是天气助手。' } }] }
    ])

    const reply = await runAgent('你好', [], undefined, client)

    expect(reply).toBe('你好！我是天气助手。')
    expect(calls).toHaveLength(1) // 只有一次 LLM 调用，未进入 Act/Observe
  })

  it('工具调用路径：执行 get_weather 后把 tool 结果回传 LLM 生成最终回答', async () => {
    const { client, calls } = createMockClient([
      {
        choices: [
          {
            message: {
              content: '',
              tool_calls: [
                {
                  id: 'call_test_1',
                  type: 'function',
                  function: {
                    name: 'get_weather',
                    arguments: '{"city":"北京"}'
                  }
                }
              ]
            }
          }
        ]
      },
      { choices: [{ message: { content: '北京今天晴，25°C。' } }] }
    ])

    const reply = await runAgent('北京今天天气怎么样', [], undefined, client)

    expect(reply).toBe('北京今天晴，25°C。')
    expect(calls).toHaveLength(2) // Think + Observe 两次 LLM 调用

    // 第二次调用的消息里，真实 tool 结果按 tool_call_id 与请求配对
    // （few-shot 首轮注入的示例消息里也有 role: 'tool'，故不能只按 role 过滤）
    const toolMessages = (
      calls[1].messages as Array<{ role: string; tool_call_id?: string }>
    ).filter((m) => m.role === 'tool' && m.tool_call_id === 'call_test_1')
    expect(toolMessages).toHaveLength(1)
    expect(toolMessages[0].tool_call_id).toBe('call_test_1')
  })

  it('Observe 后 LLM 再次发起 tool_calls 时返回兜底文案而非空串', async () => {
    const toolCall = {
      id: 'call_test_2',
      type: 'function',
      function: { name: 'get_weather', arguments: '{"city":"上海"}' }
    }
    const { client } = createMockClient([
      { choices: [{ message: { content: '', tool_calls: [toolCall] } }] },
      // 第二次仍要求调工具且 content 为 null：未处理多轮 ReAct，应触发兜底
      { choices: [{ message: { content: null, tool_calls: [toolCall] } }] }
    ])

    const reply = await runAgent('上海天气怎么样', [], undefined, client)

    expect(reply).toBe('抱歉，我暂时无法生成回答，请重试。')
  })
})
