// 意图分类 + 槽位 Zod Schema
// 结构遵循文档 2.4 §4：z.object + .describe() 帮助模型理解字段
// 兜底策略（todo 2.1）：非法意图解析失败时不抛错，落到 'unknown'。
// ⚠️ zod 4.4 的 enum 不允许 .catch() 非枚举值（TS 类型报错），故把 'unknown' 并入 union：
// 合法意图 → 枚举原值；其余字符串 → union 兜底 → 'unknown'
import { z } from 'zod'

export const IntentSchema = z.object({
  intent: z
    .union([
      z.enum([
        'order_query', // 查订单（状态/物流/退款资格）
        'refund', // 退款
        'complaint', // 投诉
        'faq_query', // 政策咨询（退换货/物流规则等）
        'handoff', // 转人工
        'greeting' // 打招呼
      ]),
      z.literal('unknown')
    ])
    .catch('unknown')
    .describe('用户本次会话的意图分类（英文枚举，非法值解析为 unknown）'),
  slots: z
    .object({
      order_id: z.string().optional().describe('订单号，形如 ORD-2601'),
      product_name: z.string().optional().describe('涉及的商品名称'),
      amount: z.number().optional().describe('涉及金额（元）'),
      reason: z.string().optional().describe('退款或投诉原因'),
      contact: z
        .string()
        .optional()
        .describe('用户留下的联系方式（手机号 / 邮箱）')
    })
    .describe('意图相关的槽位，未提取到的字段留空不填'),
  reply: z
    .string()
    .optional()
    .describe(
      'greeting / handoff 意图下可直接使用的回复文案；其余意图请留空，由主 Agent 生成回复'
    )
})

/** 意图分类结果：{ intent, slots, reply? } */
export type IntentOutput = z.infer<typeof IntentSchema>
