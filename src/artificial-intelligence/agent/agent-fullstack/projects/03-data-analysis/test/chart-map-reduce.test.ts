/**
 * Send 扇出 / ReducedValue 单条语义（todo §5）
 *
 * 不调真实模型：注入纯函数生成器，断言 fan-out 数量与 reducer 汇合结果。
 */
import { describe, expect, it } from 'bun:test'
import {
  buildChartMapReduce,
  type Dimension
} from '../demo/chart-map-reduce.ts'

function stubGenerate(dimension: Dimension) {
  return Promise.resolve({
    title: { text: dimension.name },
    xAxis: { type: 'category' as const, data: ['A', 'B'] },
    series: [{ name: dimension.name, type: 'bar' as const, data: [1, 2] }]
  })
}

describe('chart map-reduce', () => {
  it('3 个维度扇出 3 张图，reducer 按序汇合', async () => {
    const graph = buildChartMapReduce(stubGenerate)
    const out = await graph.invoke({
      dimensions: [
        { name: '按月趋势', data: '[]' },
        { name: '按品类占比', data: '[]' },
        { name: '按区域对比', data: '[]' }
      ]
    })

    expect(out.charts).toHaveLength(3)
    expect(out.charts.map((c) => c.title.text)).toEqual([
      '按月趋势',
      '按品类占比',
      '按区域对比'
    ])
  })

  it('每个 Send 拿到独立子状态（节点只看到自己的 dimension）', async () => {
    const seen: string[] = []
    const graph = buildChartMapReduce(async (dimension) => {
      seen.push(dimension.name)
      return stubGenerate(dimension)
    })

    await graph.invoke({
      dimensions: [
        { name: '维度A', data: '[]' },
        { name: '维度B', data: '[]' }
      ]
    })

    expect(seen.sort()).toEqual(['维度A', '维度B'])
  })

  it('空维度不扇出，charts 为空数组', async () => {
    const graph = buildChartMapReduce(stubGenerate)
    const out = await graph.invoke({ dimensions: [] })
    expect(out.charts).toHaveLength(0)
  })
})
