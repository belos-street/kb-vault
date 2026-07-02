/**
 * 订单状态枚举
 */
export type OrderStatus =
  | 'pending' // 待发货
  | 'shipped' // 已发货
  | 'delivered' // 已签收
  | 'cancelled' // 已取消
  | 'refunding' // 退款中
  | 'refunded' // 已退款

/**
 * 订单领域模型
 */
export interface Order {
  /** 订单号 */
  orderId: string
  /** 用户 ID */
  userId: string
  /** 商品名称 */
  productName: string
  /** 订单金额（元） */
  amount: number
  /** 订单状态 */
  status: OrderStatus
  /** 下单时间 */
  createdAt: Date
  /** 签收时间，未签收时为空 */
  deliveredAt?: Date
  /** 是否支持退款 */
  refundable: boolean
}

/**
 * 工单状态枚举
 */
export type TicketStatus = 'open' | 'processing' | 'resolved' | 'closed'

/**
 * 工单领域模型
 */
export interface Ticket {
  /** 工单号 */
  ticketId: string
  /** 关联用户 ID */
  userId: string
  /** 问题摘要 */
  summary: string
  /** 工单状态 */
  status: TicketStatus
  /** 创建时间 */
  createdAt: Date
}

/**
 * 创建工单所需参数
 */
export interface CreateTicketParams {
  /** 用户 ID */
  userId: string
  /** 问题摘要 */
  summary: string
}
