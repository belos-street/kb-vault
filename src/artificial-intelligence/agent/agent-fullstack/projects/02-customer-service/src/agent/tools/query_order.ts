// 工具：query_order —— 按订单号查询订单
// 用户身份从 runtime.context.userId 读取（文档 2.3 §4.1）
// contextSchema 定义在 Agent 层（todo 2.3），工具内无法静态推导，做一次边界断言
import { tool, type ToolRuntime } from 'langchain'
import { z } from 'zod'
import { getOrderById, type OrderStatus } from '@/services/order'

// 订单状态 → 中文描述，方便模型照实转述给用户
const STATUS_LABEL: Record<OrderStatus, string> = {
  shipped: '已发货（在途）',
  delivered: '已签收',
  cancelled: '已取消',
  refunding: '退款中',
  refunded: '已退款'
}

export const queryOrderTool = tool(
  async ({ order_id }, runtime: ToolRuntime) => {
    const userId = (runtime.context as { userId: string }).userId
    const order = getOrderById(order_id, userId)
    if (!order)
      return '未找到该订单。请引导用户核对订单号，并确认订单属于当前登录账号。'
    const rows = [
      `订单号：${order.order_id}`,
      `商品：${order.product_name}`,
      `金额：${order.amount} 元`,
      `状态：${STATUS_LABEL[order.status]}`
    ]
    // 物流文案按状态区分，避免已取消等非在途订单误报"运输中"
    if (order.status === 'shipped') {
      rows.push('物流状态：运输中，尚未签收')
    } else if (order.delivered_at) {
      rows.push(`签收时间：${order.delivered_at}`)
    }
    return rows.join('\n')
  },
  {
    name: 'query_order',
    description:
      '按订单号查询订单信息（商品、金额、状态、签收时间）。用户询问订单状态、物流、退款资格等涉及具体订单的问题时调用。',
    schema: z.object({
      order_id: z.string().describe('订单号，形如 ORD-2601')
    })
  }
)
