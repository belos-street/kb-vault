/**
 * process_refund —— 发起退款（敏感工具，将被 humanInTheLoopMiddleware 拦截审批）
 *
 * 错误处理策略（README）：校验失败返回原因字符串（ToolMessage 进上下文），
 * 不抛异常——模型拿到原因可自纠或礼貌转告用户。
 * 校验规则在 order-service（纯代码），本工具只做编排：查单 → 鉴权 → 校验 → 落库。
 */
import type { ToolRuntime } from '@langchain/core/tools'
import { tool } from 'langchain'
import { z } from 'zod'
import { getOrderById, refundOrder } from '../../services/db.ts'
import { checkRefundable } from '../../services/order-service.ts'
import type { AgentContext } from '../context.ts'

export const processRefund = tool(
  async ({ order_id, reason }, runtime: ToolRuntime<unknown, AgentContext>) => {
    const userId = runtime.context?.userId
    if (!userId) return '系统异常：缺少用户身份，无法执行退款'

    const order = await getOrderById(order_id)
    if (!order) return `未找到订单 ${order_id}，请确认订单号是否正确`
    if (order.user_id !== userId) return '无权操作他人订单'

    const check = checkRefundable(order)
    if (!check.ok) {
      return `订单 ${order_id} 不可退款：${check.reason}`
    }

    const updated = await refundOrder(order_id, reason)
    if (!updated) return `退款失败：订单 ${order_id} 状态更新异常，请稍后重试`

    return `订单 ${order_id}（${updated.item_name}，¥${updated.amount}）已发起退款，原因：${reason}。状态已更新为「退款中」，预计 1-3 个工作日原路到账。`
  },
  {
    name: 'process_refund',
    description:
      '对当前用户的订单发起退款（敏感操作，执行前需人工审批）。会校验订单状态与退款时效，校验不通过时返回原因。',
    schema: z.object({
      order_id: z.string().min(1).describe('要退款的订单号'),
      reason: z
        .string()
        .min(1)
        .describe('退款原因，如「七天无理由」「质量问题」')
    })
  }
)
