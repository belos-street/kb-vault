import { describe, expect, it } from 'bun:test'
import { createScriptedModel, final, toolCall } from '@/shared/scripted-model'
import { AgentStepLimitError, runAgent, type Tool } from './src/index'

const weatherTool: Tool = {
  name: 'get_weather',
  description: '查询指定城市的天气',
  async run(args) {
    return { city: args.city, weather: '晴', temperature: 25 }
  }
}

const clockTool: Tool = {
  name: 'get_time',
  description: '获取当前时间',
  async run() {
    return '2026-11-03 10:00'
  }
}

describe('runAgent', () => {
  it('调用工具后给出最终答案', async () => {
    const model = createScriptedModel([
      toolCall('get_weather', { city: '北京' }),
      final('北京今天晴，25℃。')
    ])

    const result = await runAgent('北京今天天气怎么样？', model, [weatherTool])

    expect(result.answer).toBe('北京今天晴，25℃。')
    expect(result.steps).toHaveLength(2)

    const first = result.steps[0]
    if (first?.type !== 'tool') throw new Error('第一步应该是工具调用')
    expect(first.name).toBe('get_weather')
    expect(first.args).toEqual({ city: '北京' })
    expect(first.observation).toBe(
      JSON.stringify({ city: '北京', weather: '晴', temperature: 25 })
    )

    expect(result.steps.at(-1)?.type).toBe('final')
  })

  it('初始消息是 system + user', async () => {
    const model = createScriptedModel([final('直接回答')])

    await runAgent('你好', model, [])

    const initial = model.calls[0]
    expect(initial).toHaveLength(2)
    expect(initial?.[0]).toMatchObject({ role: 'system' })
    expect(initial?.[1]).toMatchObject({ role: 'user', content: '你好' })
  })

  it('把工具结果作为 tool 消息回填给模型', async () => {
    const model = createScriptedModel([
      toolCall('get_weather', { city: '上海' }),
      final('上海今天晴。')
    ])

    await runAgent('上海天气', model, [weatherTool])

    expect(model.calls).toHaveLength(2)
    const lastMessage = model.calls[1]?.at(-1)
    expect(lastMessage).toMatchObject({ role: 'tool', toolName: 'get_weather' })
    if (lastMessage?.role !== 'tool')
      throw new Error('最后一条应该是 tool 消息')
    expect(lastMessage.content).toContain('25')
  })

  it('工具返回字符串时 observation 不加引号', async () => {
    const model = createScriptedModel([
      toolCall('get_time'),
      final('现在时间是 10:00。')
    ])

    const result = await runAgent('现在几点了？', model, [clockTool])

    const first = result.steps[0]
    if (first?.type !== 'tool') throw new Error('第一步应该是工具调用')
    expect(first.observation).toBe('2026-11-03 10:00')
  })

  it('未知工具不中断循环', async () => {
    const model = createScriptedModel([
      toolCall('search_web', { query: 'LangGraph' }),
      final('没有找到相关资料。')
    ])

    const result = await runAgent('搜一下 LangGraph', model, [weatherTool])

    const first = result.steps[0]
    if (first?.type !== 'tool') throw new Error('第一步应该是工具调用')
    expect(first.error).toContain('Unknown tool: search_web')
    expect(first.observation).toBe('Unknown tool: search_web')
    expect(result.answer).toBe('没有找到相关资料。')
  })

  it('工具抛错时把异常转成 observation', async () => {
    const brokenTool: Tool = {
      name: 'get_weather',
      description: '查询指定城市的天气',
      async run() {
        throw new Error('天气服务超时')
      }
    }

    const model = createScriptedModel([
      toolCall('get_weather', { city: '北京' }),
      final('暂时无法查询天气。')
    ])

    const result = await runAgent('北京天气', model, [brokenTool])

    const first = result.steps[0]
    if (first?.type !== 'tool') throw new Error('第一步应该是工具调用')
    expect(first.error).toBe('天气服务超时')
    expect(first.observation).toBe('Error: 天气服务超时')
    expect(result.answer).toBe('暂时无法查询天气。')
  })

  it('超过 maxSteps 抛 AgentStepLimitError，且不继续调用模型', async () => {
    const model = createScriptedModel([
      toolCall('get_weather', { city: '北京' }),
      toolCall('get_weather', { city: '北京' }),
      toolCall('get_weather', { city: '北京' })
    ])

    await expect(
      runAgent('北京天气', model, [weatherTool], { maxSteps: 2 })
    ).rejects.toThrow(AgentStepLimitError)
    expect(model.calls).toHaveLength(2)
  })

  it('maxSteps 小于 1 抛 RangeError', async () => {
    const model = createScriptedModel([final('不应该被执行')])

    await expect(
      runAgent('任意任务', model, [weatherTool], { maxSteps: 0 })
    ).rejects.toThrow(RangeError)
    expect(model.calls).toHaveLength(0)
  })
})
