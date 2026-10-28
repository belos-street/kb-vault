/**
 * 图表专家：createAgent + render_charts 工具
 *
 * 工具内部顺序生成每个维度的 option 并落盘（副作用归工具）；
 * 并行版见 demo/chart-map-reduce.ts（Send 使用同一份 chartOptionSchema）。
 */
import type { BaseChatModel } from '@langchain/core/language_models/chat_models'
import { HumanMessage, SystemMessage } from '@langchain/core/messages'
import { createAgent, tool } from 'langchain'
import * as z from 'zod'
import { CHART_EXPERT_PROMPT } from '@/prompts/chart-expert.ts'
import { type ChartOption, chartOptionSchema } from '@/prompts/chart-schema.ts'
import { resolveReportDir, saveCharts } from '@/services/export.ts'

export interface ChartDimension {
  name: string
  data: string
}

const CHART_SYSTEM_PROMPT = `你是 ECharts 配置工程师。根据给定维度的数据生成 option JSON。
要求：柱子/折线图用 xAxis.data + series.data；饼图用 series.data 的 {name, value} 形式；
数字必须来自输入数据，不得编造；标题用中文概括该维度。
不同量纲的指标不要共用同一数值轴；bar/line 的 legend.data 用 series.name，pie 的 legend.data 用 series.data[].name，或省略 legend。`

/** 单维度生成器（测试与 demo 复用同一入口）；解析失败重试一次 */
export function createChartGenerator(model: BaseChatModel) {
  return async (dimension: ChartDimension): Promise<ChartOption> => {
    const structured = model.withStructuredOutput(chartOptionSchema, {
      method: 'jsonMode'
    })
    const messages = [
      new SystemMessage(CHART_SYSTEM_PROMPT),
      new HumanMessage(JSON.stringify(dimension))
    ]
    try {
      return await structured.invoke(messages)
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error)
      return await structured.invoke([
        ...messages,
        new HumanMessage(
          `上一次输出未通过 schema 校验：${reason.slice(0, 500)}\n请重新输出合法 JSON：series 的 name 必填；bar/line 的 legend.data 对应 series.name，pie 对应数据项 name；不同量纲不要共轴。`
        )
      ])
    }
  }
}

/** 图表专家偶尔会把生成好的 option 直接放进 data：合法则跳过二次生成 */
export function parseChartOption(data: string): ChartOption | undefined {
  try {
    const result = chartOptionSchema.safeParse(JSON.parse(data))
    return result.success ? result.data : undefined
  } catch {
    return undefined
  }
}

export function createChartAgent(model: BaseChatModel) {
  const generate = createChartGenerator(model)

  const renderCharts = tool(
    async ({ dimensions }, runConfig) => {
      // 顺序生成是刻意设计：与 demo/chart-map-reduce.ts 的 Send 并行版对照
      const charts: ChartOption[] = []
      for (const dimension of dimensions) {
        charts.push(
          parseChartOption(dimension.data) ?? (await generate(dimension))
        )
      }
      const threadId = String(runConfig?.configurable?.thread_id ?? 'adhoc')
      const dir = resolveReportDir(threadId)
      const files = await saveCharts(dir, charts)
      return JSON.stringify({ count: files.length, dir: `${dir}/charts/` })
    },
    {
      name: 'render_charts',
      description: '按维度生成 ECharts option 并落盘，返回图表数量与目录',
      schema: z.object({
        dimensions: z.array(
          z.object({
            name: z.string().describe('维度名称，如「按月趋势」'),
            data: z.string().describe('该维度的 JSON 数据（来自 SQL 结果）')
          })
        )
      })
    }
  )

  return createAgent({
    model,
    tools: [renderCharts],
    name: 'chart_expert',
    systemPrompt: CHART_EXPERT_PROMPT,
    description: '把表格数据按维度转成 ECharts option 并落盘'
  }).graph
}
