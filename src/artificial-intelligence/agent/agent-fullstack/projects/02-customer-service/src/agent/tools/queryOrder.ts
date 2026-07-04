import { tool, type ToolRuntime } from 'langchain'
import { z } from 'zod'
import { getOrderById } from '@/services/order.ts'

/**
 * 查询订单工具
 *
 * 根据订单号查询订单信息，同时校验订单所属用户。
 * 未找到时返回引导话术，提示用户检查订单号。
 */
export const queryOrder = tool(
  async ({ orderId }, runtime: ToolRuntime) => {
    const userId = (runtime.context as { userId: string }).userId

    const order = getOrderById(orderId, userId)

    if (!order) {
      return `未找到订单号为「${orderId}」的订单，请检查订单号是否正确。您可以在「我的订单」中查看所有订单列表。`
    }

    const statusMap: Record<string, string> = {
      pending: '待发货',
      shipped: '已发货',
      delivered: '已签收',
      cancelled: '已取消',
      refunding: '退款中',
      refunded: '已退款'
    }

    return [
      `📦 订单号：${order.orderId}`,
      `商品：${order.productName}`,
      `金额：¥${order.amount}`,
      `状态：${statusMap[order.status] ?? order.status}`,
      `下单时间：${order.createdAt.toLocaleDateString('zh-CN')}`
    ].join('\n')
  },
  {
    name: 'queryOrder',
    description:
      '根据订单号查询订单的详细信息，包括订单状态、商品名称、金额、下单时间等。',
    schema: z.object({
      orderId: z.string().describe('订单号，如 ORD-001')
    })
  }
)
