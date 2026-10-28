/**
 * Spike D —— Send fan-out + ReducedValue 单条语义（todo.md §1）
 *
 * 验证点：
 *   1. dimensions 有几项就扇出几个 renderChart 任务
 *   2. 节点返回单条 option（不是 [option]），reducer 负责追加
 *   3. 空维度不扇出，charts 为空数组
 *
 * 用法：bun scripts/spike-d-send.ts
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

const chartOptionSchema = z.object({
  title: z.string(),
  values: z.array(z.number())
})

const ChartState = new StateSchema({
  dimensions: z.array(z.object({ name: z.string(), data: z.string() })),
  charts: new ReducedValue(
    z.array(chartOptionSchema).default(() => []),
    // inputSchema 是「单次节点更新」的类型：节点返回一个 option，reducer 负责追加
    { inputSchema: chartOptionSchema, reducer: (cur, next) => [...cur, next] }
  )
})

const renderChart = async ({ dimension }: { dimension: { name: string } }) => {
  await new Promise((resolve) => setTimeout(resolve, 10)) // 模拟逐图生成耗时
  return { charts: { title: dimension.name, values: [1, 2, 3] } } // ⚠️ 单条
}

const graph = new StateGraph(ChartState)
  .addNode('renderChart', renderChart)
  .addNode('split', async () => ({}))
  .addEdge(START, 'split')
  .addConditionalEdges('split', (s) =>
    s.dimensions.map((d) => new Send('renderChart', { dimension: d }))
  )
  .addEdge('renderChart', END)
  .compile({ name: 'chart_map_reduce' })

const started = Date.now()
const out = await graph.invoke({
  dimensions: [
    { name: '按月趋势', data: '[]' },
    { name: '按品类占比', data: '[]' },
    { name: '按区域对比', data: '[]' }
  ]
})

console.log(`[spike-d] charts 长度 = ${out.charts.length}（预期 3）`)
console.log('[spike-d] charts =', out.charts)
console.log(
  `[spike-d] 并行耗时 ≈ ${Date.now() - started}ms（3 × 10ms 顺序应为 30ms+）`
)

const empty = await graph.invoke({ dimensions: [] })
console.log(`[spike-d] 空维度 charts 长度 = ${empty.charts.length}（预期 0）`)
