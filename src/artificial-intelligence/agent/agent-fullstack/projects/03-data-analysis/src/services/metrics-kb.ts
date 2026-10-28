/**
 * 指标口径知识库（3.3 的检索源）
 *
 * 5 条足够演示 Agentic RAG 的「模型决定要不要查口径」；
 * 关键词检索复用 01/02 的手法（命中即返回，不做向量检索——第四章升级）。
 */
export interface MetricEntry {
  term: string
  aliases: string[]
  definition: string
}

export const METRICS: MetricEntry[] = [
  {
    term: '销售额',
    aliases: ['销售', '营业额', '收入'],
    definition:
      '销售额 = 有效订单金额之和。有效订单指 amount > 0 且 region 非空；退款订单按负金额记账，统计时需剔除。'
  },
  {
    term: 'GMV',
    aliases: ['成交总额', '交易总额'],
    definition:
      'GMV（Gross Merchandise Volume）= 下单金额总额，包含未支付、已退款订单，反映交易规模，不等于收入。'
  },
  {
    term: '退款率',
    aliases: ['退货率', '退单率'],
    definition:
      '退款率 = 退款订单数 / 总订单数。本项目以 amount < 0 的订单视为退款记录。'
  },
  {
    term: '客单价',
    aliases: ['平均订单金额', '单均'],
    definition: '客单价 = 有效销售额 / 有效订单数，剔除脏数据后计算。'
  },
  {
    term: '环比',
    aliases: ['MoM', '月度环比'],
    definition:
      '环比 =（本月销售额 - 上月销售额）/ 上月销售额，衡量相邻两个周期的变化。'
  }
]

/** 关键词命中（term 或 aliases 包含于查询文本） */
export function searchMetrics(keyword: string): MetricEntry[] {
  const text = keyword.toLowerCase()
  return METRICS.filter((entry) =>
    [entry.term, ...entry.aliases].some((word) =>
      text.includes(word.toLowerCase())
    )
  )
}
