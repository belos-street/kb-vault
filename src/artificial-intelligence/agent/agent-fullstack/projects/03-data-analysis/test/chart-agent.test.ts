/**
 * render_charts 的 option 解析：合法 option 直通，原始行/坏 JSON 回落生成
 */
import { describe, expect, it } from 'bun:test'
import { parseChartOption } from '@/agents/chart-agent.ts'
import type { ChartOption } from '@/prompts/chart-schema.ts'

describe('parseChartOption', () => {
  it('合法 ECharts option 直接返回', () => {
    const option: ChartOption = {
      title: { text: '示例' },
      series: [{ name: '示例', type: 'bar', data: [1, 2] }]
    }
    expect(parseChartOption(JSON.stringify(option))).toEqual(option)
  })

  it('原始行数组返回 undefined，交给生成器', () => {
    expect(
      parseChartOption(JSON.stringify([{ month: '9月', sales: 100 }]))
    ).toBeUndefined()
  })

  it('非法 JSON 返回 undefined', () => {
    expect(parseChartOption('not-json')).toBeUndefined()
  })
})
