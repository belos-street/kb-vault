/**
 * 业务类型：订单、工单、政策条目。
 *
 * 作用
 * - 业务层唯一的数据形状来源；agent/ 不 import 这个文件。
 * - 字段与 data/seed/*.json 一一对应。
 */

export type OrderStatus =
  | 'paid'
  | 'shipped'
  | 'delivered'
  | 'refunding'
  | 'refunded'

export interface Order {
  orderId: string
  userId: string
  item: string
  amount: number
  status: OrderStatus
  paidAt: string
  deliveredAt: string | null
  trackingNo: string | null
}

export type TicketType = 'refund' | 'logistics' | 'complaint' | 'other'

export interface Ticket {
  id: string
  userId: string
  type: TicketType
  summary: string
  status: 'open' | 'escalated' | 'resolved'
  createdAt: string
}

export interface PolicyFaq {
  keywords: string[]
  answer: string
  source: string
}

export interface SeedData {
  orders: Order[]
  tickets: Ticket[]
  faqs: PolicyFaq[]
}
