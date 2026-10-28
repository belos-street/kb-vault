import * as z from 'zod'

/**
 * 窄版 ECharts option Schema（2.4 结构化输出）
 *
 * 只保留本项目用到的字段：模型少编一个字段，少一个幻觉点；
 * 真正渲染时由 ECharts 自己补默认值。
 */
const dataPoint = z.union([
  z.number(),
  z.object({ name: z.string(), value: z.number() })
])

const axisSchema = z.object({
  type: z.enum(['category', 'value']).optional(),
  data: z.array(z.union([z.string(), z.number()])).optional(),
  name: z.string().optional()
})

export const chartOptionSchema = z
  .object({
    title: z.object({ text: z.string() }),
    tooltip: z
      .object({ trigger: z.enum(['item', 'axis']).optional() })
      .optional(),
    legend: z.object({ data: z.array(z.string()).optional() }).optional(),
    // 双 Y 轴（销售额 + 订单量）是常见形态，ECharts 允许轴配置为数组
    xAxis: z.union([axisSchema, z.array(axisSchema)]).optional(),
    yAxis: z.union([axisSchema, z.array(axisSchema)]).optional(),
    series: z.array(
      z.object({
        name: z.string(),
        type: z.enum(['bar', 'line', 'pie']),
        data: z.array(dataPoint),
        yAxisIndex: z.number().optional(),
        smooth: z.boolean().optional()
      })
    )
  })
  .superRefine((option, ctx) => {
    // bar/line 的 legend 对应 series.name；pie 的 legend 对应 data[].name
    const legendNames = new Set<string>()
    for (const series of option.series) {
      if (series.type === 'pie') {
        for (const point of series.data) {
          if (typeof point === 'object' && point !== null) {
            legendNames.add(point.name)
          }
        }
      } else {
        legendNames.add(series.name)
      }
    }
    for (const name of option.legend?.data ?? []) {
      if (!legendNames.has(name)) {
        ctx.addIssue({
          code: 'custom',
          path: ['legend', 'data'],
          message: `legend.data 中的「${name}」没有对应的 series.name（pie 对应 data[].name）`
        })
      }
    }
  })

export type ChartOption = z.infer<typeof chartOptionSchema>
