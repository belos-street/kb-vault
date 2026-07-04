import { tool, type ToolRuntime } from 'langchain'
import { z } from 'zod'
import { getOrderById, canRefund } from '@/services/order.ts'
import { createTicket } from '@/services/ticket.ts'

/**
 * 退款申请工具
 *
 * 先校验订单是否可退款（状态、时间窗口、退款属性），
 * 条件满足时自动创建退款工单并返回工单号。
 */
export const createRefund = tool(
  async ({ orderId, reason }, runtime: ToolRuntime) => {
    const userId = (runtime.context as { userId: string }).userId

    const order = getOrderById(orderId, userId)

    if (!order) {
      return `未找到订单号为「${orderId}」的订单，请检查订单号是否正确。`
    }

    const check = canRefund(order)

    if (!check.ok) {
      return `订单 ${orderId}（${order.productName}）无法申请退款：${check.reason}。如需进一步帮助，可转接人工客服。`
    }

    const ticketId = createTicket({
      userId,
      summary: `退款申请 - 订单 ${orderId}（${order.productName}）：${reason}，金额 ¥${order.amount}`
    })

    return `退款申请已提交！工单号为 ${ticketId}，请耐心等待审核，预计 1-3 个工作日处理完毕。`
  },
  {
    name: 'createRefund',
    description:
      '根据订单号和退款原因创建退款申请。调用前请先通过 queryOrder 确认订单存在，再调用此工具。',
    schema: z.object({
      orderId: z.string().describe('要退款的订单号，如 ORD-001'),
      reason: z.string().describe('退款原因，如商品破损、质量问题、不想要了等')
    })
  }
)
