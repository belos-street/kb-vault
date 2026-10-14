/**
 * query_order —— 按订单号查订单快照
 *
 * ⚠️ returnDirect 取舍（框架坑记录）：原设计用 returnDirect: true 让确定性
 * 结果直传用户，但 langchain 1.5.x 实测（1.5.16 未修）该特性在
 * 「responseFormat + afterModel 中间件」组合下会死循环——returnDirect 工具执行后
 * AgentNode 早退，而 afterModel 路由器在「结构化输出未产出」时又把任务送回
 * model 节点，无限空转打满 recursion limit；且框架语义下 returnDirect 会终止
 * 整轮对话，README 的退款全链（查单→退单→工单单轮完成）也跑不完。
 * 决策：改普通工具，确定性快照照样原样回传（模型不改写数据行）。
 *
 * 权限约束：runtime.context.userId 限定只能查本人订单（权限最小化）。
 * 数据坑：SO-2026-0702 已发货但缺物流单号、SO-2026-0950 下单 1 天即签收——
 * 快照只如实呈现字段，矛盾由模型结合政策如实转告，不编造。
 */
import type { ToolRuntime } from '@langchain/core/tools'
import { tool } from 'langchain'
import { z } from 'zod'
import type { OrderRow } from '@/services/db.ts'
import { getOrderById } from '@/services/db.ts'
import type { AgentContext } from '@/agent/context.ts'

function fmtTime(d: Date): string {
  return d.toLocaleString('zh-CN', {
    timeZone: 'Asia/Shanghai',
    hour12: false
  })
}

function fmtOrder(order: OrderRow): string {
  const lines = [
    `订单 ${order.order_id}`,
    `商品：${order.item_name}`,
    `金额：¥${order.amount}`,
    `状态：${order.status}`,
    `物流单号：${order.tracking_number ?? '暂未录入'}`,
    `下单时间：${fmtTime(order.created_at)}`
  ]
  if (order.delivered_at) lines.push(`签收时间：${fmtTime(order.delivered_at)}`)
  if (order.refund_reason) lines.push(`退款原因：${order.refund_reason}`)
  return lines.join('\n')
}

export const queryOrder = tool(
  async ({ order_id }, runtime: ToolRuntime<unknown, AgentContext>) => {
    const userId = runtime.context?.userId
    if (!userId) return '系统异常：缺少用户身份，无法查询订单'

    const order = await getOrderById(order_id)
    if (!order) return `未找到订单 ${order_id}，请确认订单号是否正确`
    if (order.user_id !== userId) return '无权查看他人订单'

    return fmtOrder(order)
  },
  {
    name: 'query_order',
    description:
      '按订单号查询当前用户的订单快照（商品/金额/状态/物流/时间）。仅能查询调用者本人的订单；订单号格式形如 SO-2026-0812。',
    schema: z.object({
      order_id: z.string().min(1).describe('订单号，如 SO-2026-0812')
    })
  }
)
