/**
 * Send 并行出图（3.2）—— 独立对照 demo
 *
 * 与 src/agents/chart-agent.ts 里的顺序版对照：
 *   - 顺序版：for 循环逐个生成，写进 chart_expert 的工具内部
 *   - 并行版：dimensions 有几项就 Send 扇出几个 renderChart，reducer 汇合
 *
 * 用法：bun run demo:charts
 */
import {
  END,
  ReducedValue,
  Send,
  START,
  StateGraph,
  StateSchema
} from '@langchain/langgraph'
import * as z from 'zod'
import { createChartGenerator } from '@/agents/chart-agent.ts'
import { config } from '@/config.ts'
import { type ChartOption, chartOptionSchema } from '@/prompts/chart-schema.ts'
import { getReadonlyDb } from '@/services/db.ts'
import { resolveReportDir, saveCharts } from '@/services/export.ts'
import { createChatModel } from '@/services/models.ts'

export interface Dimension {
  name: string
  data: string
}

export const ChartState = new StateSchema({
  dimensions: z.array(z.object({ name: z.string(), data: z.string() })),
  charts: new ReducedValue(
    z.array(chartOptionSchema).default(() => []),
    // inputSchema 是「单次节点更新」的类型：节点返回一个 option，reducer 负责追加
    { inputSchema: chartOptionSchema, reducer: (cur, next) => [...cur, next] }
  )
})

/** 把「生成器」注入进来：生产用真实模型，测试用纯函数 */
export function buildChartMapReduce(
  generate: (dimension: Dimension) => Promise<ChartOption>
) {
  const renderChart = async ({ dimension }: { dimension: Dimension }) => {
    const option = await generate(dimension)
    return { charts: option } // ⚠️ 不是 [option]：ReducedValue.inputSchema 是单条
  }

  return new StateGraph(ChartState)
    .addNode('renderChart', renderChart)
    .addNode('split', async () => ({}))
    .addEdge(START, 'split')
    .addConditionalEdges('split', (state) =>
      state.dimensions.map((d) => new Send('renderChart', { dimension: d }))
    )
    .addEdge('renderChart', END)
    .compile({ name: 'chart_map_reduce' })
}

/** 从业务库取两个维度（上个月品类结构 + 近 12 个月趋势） */
export function loadDemoDimensions(): Dimension[] {
  const db = getReadonlyDb()
  const iso = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date())
  const year = Number(iso.slice(0, 4))
  const month = Number(iso.slice(5, 7))
  const monthStart = (offset: number) =>
    new Date(Date.UTC(year, month - 1 - offset, 1)).toISOString().slice(0, 10)

  const from = monthStart(1)
  const to = monthStart(0)

  const byCategory = db
    .prepare(
      `SELECT category AS name, ROUND(SUM(amount), 2) AS value
       FROM orders
       WHERE amount > 0 AND region IS NOT NULL AND order_date >= ? AND order_date < ?
       GROUP BY category ORDER BY value DESC`
    )
    .all(from, to)

  const byMonth = db
    .prepare(
      `SELECT substr(order_date, 1, 7) AS name, ROUND(SUM(amount), 2) AS value
       FROM orders
       WHERE amount > 0 AND region IS NOT NULL AND order_date >= ?
       GROUP BY name ORDER BY name`
    )
    .all(monthStart(12))

  return [
    { name: '上月各品类销售额', data: JSON.stringify(byCategory) },
    { name: '近 12 个月销售额趋势', data: JSON.stringify(byMonth) }
  ]
}

if (import.meta.main) {
  const model = await createChatModel(config.chartModel)
  const generate = createChartGenerator(model)
  const graph = buildChartMapReduce(generate)

  const dimensions = loadDemoDimensions()
  console.log(`[demo] 维度：${dimensions.map((d) => d.name).join(' / ')}`)

  const started = Date.now()
  const out = await graph.invoke({ dimensions })
  const files = await saveCharts(resolveReportDir('demo'), out.charts)

  console.log(
    `[demo] Send 扇出完成：${out.charts.length} 张图，耗时 ${Date.now() - started}ms`
  )
  for (const file of files) console.log(`[demo] ${file}`)
}
