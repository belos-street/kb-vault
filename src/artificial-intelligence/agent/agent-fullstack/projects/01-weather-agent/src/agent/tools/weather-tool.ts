/**
 * 工具定义与 Zod 参数校验
 */
import { z } from 'zod'
import type { ChatCompletionTool } from 'openai/resources/chat/completions'
import type { Tool } from '../type'
import { WeatherService } from '../../services/weather'

// 工具调用参数的 Zod Schema
export const getWeatherSchema = z.object({
  city: z
    .string()
    .min(1, '城市名不能为空')
    .describe(
      "城市名称（支持中文名、英文名或别名，如'北京'、'beijing'、'帝都'）"
    )
})

const { getWeather } = WeatherService()

/**
 * get_weather 工具定义
 * - JSON Schema：供 LLM 理解工具用途和参数格式
 * - execute：实际执行逻辑
 */
export const getWeatherTool: Tool = {
  name: 'get_weather',
  description:
    '查询指定城市的实时天气信息，返回温度、湿度、风速、天气状况等数据。',
  parameters: z.toJSONSchema(getWeatherSchema),
  execute: async (args: Record<string, unknown>) => {
    // Zod 校验参数
    const result = getWeatherSchema.safeParse(args)
    if (!result.success) {
      const errors = result.error.issues.map(
        (i) => `${i.path.join('.')}: ${i.message}`
      )
      throw new Error(`参数校验失败：${errors.join('；')}`)
    }

    const { city } = result.data

    // 调用天气服务
    const weatherData = getWeather(city)
    return JSON.stringify(weatherData)
  }
}

/**
 * 获取所有工具列表
 */
export const tools: Tool[] = [getWeatherTool]

/**
 * 根据工具名查找工具
 */
export function getToolByName(name: string): Tool | undefined {
  return tools.find((t) => t.name === name)
}

/**
 * 将内部 Tool 定义转换为 OpenAI 工具格式
 */
export function toOpenAiTools(): ChatCompletionTool[] {
  return tools.map((tool) => ({
    type: 'function',
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters as Record<string, unknown>
    }
  }))
}
