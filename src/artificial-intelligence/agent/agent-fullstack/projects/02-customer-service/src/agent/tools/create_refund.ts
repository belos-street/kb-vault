// 工具：create_refund —— 为符合条件的订单发起退款申请
// applyRefund（src/services/order.ts）内部完成：身份校验 → canRefund 校验 → 状态改为 refunding
// 业务失败返回原因消息（模型可读、可恢复），不 throw（文档 2.3 错误返回约定）
import { tool, type ToolRuntime } from 'langchain'
import { z } from 'zod'
import { applyRefund } from '@/services/order'

export const createRefundTool = tool(
  async ({ order_id, reason }, runtime: ToolRuntime) => {
    const userId = (runtime.context as { userId: string }).userId
    const check = applyRefund(order_id, userId)
    if (!check.ok) return `无法发起退款：${check.reason}`
    return `已为订单 ${order_id} 提交退款申请（原因：${reason}）。审核通过后款项将原路退回，通常 3-7 个工作日内到账。`
  },
  {
    name: 'create_refund',
    description:
      '为当前用户符合条件的订单发起退款申请。调用前请先用 query_order 确认订单存在且属于该用户；仅当用户明确表达退款意愿时调用。',
    schema: z.object({
      order_id: z.string().describe('订单号，形如 ORD-2601'),
      reason: z.string().describe('用户提出的退款原因')
    })
  }
)
