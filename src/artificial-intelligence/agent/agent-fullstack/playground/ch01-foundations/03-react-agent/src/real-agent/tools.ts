/**
 * 能力层：工具是普通对象。描述和 parameters 是给模型看的，
 * run 是给你自己看的；失败就抛异常，由循环层统一兜底。
 *
 * 用 zod 做两件事：生成给模型看的 JSON Schema，
 * 校验模型实际传来的参数。一份定义，两处使用。
 */
import { z } from 'zod'
import type { Tool } from './types'

interface ToolConfig<TArgs extends Record<string, unknown>> {
  name: string
  description: string
  schema: z.ZodType<TArgs>
  run: (args: TArgs) => Promise<unknown>
}

/**
 * 把 zod schema 包成统一的 Tool：
 * - schema → JSON Schema，写进 parameters，随请求发给模型
 * - schema → 运行时校验，失败抛错，由循环层转成 observation
 */
function defineTool<TArgs extends Record<string, unknown>>(
  config: ToolConfig<TArgs>
): Tool {
  const jsonSchema = z.toJSONSchema(config.schema) as Record<string, unknown>
  // 有些服务端不接受 $schema 字段，去掉更保险
  delete jsonSchema.$schema

  return {
    name: config.name,
    description: config.description,
    parameters: jsonSchema,
    async run(raw) {
      const parsed = config.schema.safeParse(raw)
      if (!parsed.success) {
        const detail = parsed.error.issues
          .map((issue) => {
            const path = issue.path.map(String).join('.') || 'args'
            return `${path}: ${issue.message}`
          })
          .join('; ')
        throw new Error(`参数校验失败：${detail}`)
      }
      return config.run(parsed.data)
    }
  }
}

/** 演示工具 1：无参数 */
const getCurrentTime = defineTool({
  name: 'get_current_time',
  description: '获取当前时间（Asia/Shanghai）',
  schema: z.object({}),
  async run() {
    return new Date().toLocaleString('zh-CN', {
      timeZone: 'Asia/Shanghai'
    })
  }
})

/** 演示工具 2：带参数 */
const getWeather = defineTool({
  name: 'get_weather',
  description: '查询指定城市的天气',
  schema: z.object({
    city: z.string().min(1).describe('城市名，例如 北京')
  }),
  async run(args) {
    return { city: args.city, weather: '晴', temperature: 25 }
  }
})

export const demoTools: Tool[] = [getCurrentTime, getWeather]

/** 名字 → 工具。循环里只查表，不硬编码工具名 */
export function createRegistry(tools: Tool[]): Map<string, Tool> {
  return new Map(tools.map((tool) => [tool.name, tool]))
}
