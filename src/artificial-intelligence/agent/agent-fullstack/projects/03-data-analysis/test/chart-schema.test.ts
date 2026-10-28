/**
 * ECharts option 语义校验：legend 不能列出不存在的 series
 */
import { describe, expect, it } from 'bun:test'
import { chartOptionSchema } from '@/prompts/chart-schema.ts'

const dualAxis = {
  title: { text: '按日趋势' },
  legend: { data: ['销售额', '订单数'] },
  xAxis: { type: 'category', data: ['09-01', '09-02'] },
  yAxis: [
    { type: 'value', name: '销售额' },
    { type: 'value', name: '订单数' }
  ],
  series: [
    { name: '销售额', type: 'bar', data: [258, 2995] },
    { name: '订单数', type: 'line', data: [1, 2], yAxisIndex: 1 }
  ]
}

describe('chartOptionSchema', () => {
  it('接受 legend 与 series 一致的双轴图', () => {
    expect(chartOptionSchema.safeParse(dualAxis).success).toBe(true)
  })

  it('拒绝 legend 列出不存在的 series（e2e 里的汇总图反例）', () => {
    const bad = {
      title: { text: '汇总对比' },
      legend: { data: ['总销售额', '订单数', '活跃天数', '客单价'] },
      series: [
        { name: '汇总指标', type: 'bar', data: [32432, 25, 19, 1297.28] }
      ]
    }
    expect(chartOptionSchema.safeParse(bad).success).toBe(false)
  })

  it('接受标准饼图：legend 对应 data[].name', () => {
    const pie = {
      title: { text: '品类结构' },
      legend: { data: ['家电', '数码'] },
      series: [
        {
          name: '销售额',
          type: 'pie',
          data: [
            { name: '家电', value: 10 },
            { name: '数码', value: 20 }
          ]
        }
      ]
    }
    expect(chartOptionSchema.safeParse(pie).success).toBe(true)
  })

  it('拒绝饼图 legend 只写 series.name', () => {
    const pie = {
      title: { text: '品类结构' },
      legend: { data: ['销售额'] },
      series: [
        {
          name: '销售额',
          type: 'pie',
          data: [{ name: '家电', value: 10 }]
        }
      ]
    }
    expect(chartOptionSchema.safeParse(pie).success).toBe(false)
  })
})
