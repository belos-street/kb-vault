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

export const chartOptionSchema = z.object({
  title: z.object({ text: z.string() }),
  tooltip: z
    .object({ trigger: z.enum(['item', 'axis']).optional() })
    .optional(),
  legend: z.object({}).optional(),
  xAxis: z
    .object({
      type: z.enum(['category', 'value']).optional(),
      data: z.array(z.union([z.string(), z.number()])).optional()
    })
    .optional(),
  yAxis: z
    .object({ type: z.enum(['category', 'value']).optional() })
    .optional(),
  series: z.array(
    z.object({
      name: z.string(),
      type: z.enum(['bar', 'line', 'pie']),
      data: z.array(dataPoint)
    })
  )
})

export type ChartOption = z.infer<typeof chartOptionSchema>
