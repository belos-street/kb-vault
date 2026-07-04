/**
 * 结构化输出 Schema
 *
 * 定义意图分类 + 槽位填充的 Zod Schema，
 * 配合 responseFormat 使用，让模型输出结构化的 JSON 而非自由文本。
 *
 * 设计原则：
 * - intent 为枚举，限制模型只能输出预设的 5 种意图
 * - slots 所有字段可选，模型只填充识别到的，避免幻觉
 * - reply 字段用于模型可直接回复的场景（如问候），不走工具调用
 */
import { z } from 'zod'

/**
 * order_query: 订单查询意图
 * refund: 退款意图
 * complaint: 投诉意图
 * handoff: 转交意图
 * greeting: 问候意图
 */
export const IntentSchema = z
  .object({
    intent: z
      .enum(['order_query', 'refund', 'complaint', 'handoff', 'greeting'])
      .describe('用户意图分类'),
    slots: z
      .object({
        order_id: z.string().optional().describe('订单号，如 ORD-001'),
        product_name: z.string().optional().describe('商品名称'),
        amount: z.number().optional().describe('金额，单位元'),
        reason: z.string().optional().describe('退款/投诉原因'),
        contact: z.string().optional().describe('联系方式，如手机号或邮箱')
      })
      .describe('从用户消息中提取的关键信息'),
    reply: z.string().optional().describe('无需工具调用时的直接回复语')
  })
  .describe('客服 Agent 结构化输出')

export type IntentOutput = z.infer<typeof IntentSchema>
