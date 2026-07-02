import type { Order, OrderStatus } from './type.ts'

/** 退款有效期（签收后天数） */
const REFUND_WINDOW_DAYS = 7

/**
 * 各订单状态下不可退款的原因映射
 * - 值为 undefined 表示该状态不拦截，需继续判断其他条件
 */
const REFUND_BLOCK_REASON: Record<OrderStatus, string | undefined> = {
  pending: '订单未发货，无法申请退款',
  shipped: '订单未签收，无法申请退款',
  delivered: undefined,
  cancelled: '订单已取消，无需退款',
  refunding: '订单正在退款处理中',
  refunded: '订单已退款'
}

/** 返回指定天数前的日期，时间归零，便于构造稳定 Mock 数据 */
function daysAgo(days: number): Date {
  const d = new Date()
  d.setDate(d.getDate() - days)
  d.setHours(0, 0, 0, 0)
  return d
}

/** 内置 Mock 订单数据，覆盖常见客服场景 */
const MOCK_ORDERS: Order[] = [
  {
    orderId: 'ORD-2026001',
    userId: 'USER-001',
    productName: '无线蓝牙耳机',
    amount: 299,
    status: 'shipped',
    createdAt: daysAgo(3),
    refundable: true
  },
  {
    orderId: 'ORD-2026002',
    userId: 'USER-001',
    productName: '机械键盘',
    amount: 599,
    status: 'delivered',
    createdAt: daysAgo(10),
    deliveredAt: daysAgo(2),
    refundable: true
  },
  {
    orderId: 'ORD-2026003',
    userId: 'USER-001',
    productName: '显示器 27 寸',
    amount: 1499,
    status: 'delivered',
    createdAt: daysAgo(20),
    deliveredAt: daysAgo(10),
    refundable: true
  },
  {
    orderId: 'ORD-2026004',
    userId: 'USER-002',
    productName: 'Type-C 数据线',
    amount: 39,
    status: 'cancelled',
    createdAt: daysAgo(5),
    refundable: false
  },
  {
    orderId: 'ORD-2026005',
    userId: 'USER-002',
    productName: '鼠标垫',
    amount: 49,
    status: 'refunded',
    createdAt: daysAgo(15),
    deliveredAt: daysAgo(12),
    refundable: false
  },
  {
    orderId: 'ORD-2026006',
    userId: 'USER-002',
    productName: '移动硬盘 1TB',
    amount: 399,
    status: 'refunding',
    createdAt: daysAgo(8),
    deliveredAt: daysAgo(5),
    refundable: false
  },
  {
    orderId: 'ORD-2026007',
    userId: 'USER-003',
    productName: '人体工学椅',
    amount: 1299,
    status: 'delivered',
    createdAt: daysAgo(30),
    deliveredAt: daysAgo(1),
    refundable: true
  },
  {
    orderId: 'ORD-2026008',
    userId: 'USER-003',
    productName: '智能手环',
    amount: 199,
    status: 'pending',
    createdAt: daysAgo(1),
    refundable: true
  },
  {
    orderId: 'ORD-2026009',
    userId: 'USER-003',
    productName: 'USB 扩展坞',
    amount: 159,
    status: 'delivered',
    createdAt: daysAgo(7),
    deliveredAt: daysAgo(6),
    refundable: true
  },
  {
    orderId: 'ORD-2026010',
    userId: 'USER-004',
    productName: '降噪耳机',
    amount: 899,
    status: 'delivered',
    createdAt: daysAgo(14),
    deliveredAt: daysAgo(8),
    refundable: true
  },
  {
    orderId: 'ORD-2026011',
    userId: 'USER-004',
    productName: '高清摄像头',
    amount: 459,
    status: 'delivered',
    createdAt: daysAgo(12),
    deliveredAt: daysAgo(2),
    refundable: false
  }
]

/**
 * 按订单号和用户 ID 查询订单
 * @param orderId 订单号
 * @param userId 用户 ID
 * @returns 匹配订单；未找到返回 null
 */
export function getOrderById(orderId: string, userId: string): Order | null {
  return (
    MOCK_ORDERS.find((o) => o.orderId === orderId && o.userId === userId) ??
    null
  )
}

/**
 * 判断订单是否可以申请退款
 * @param order 订单对象
 * @returns ok 为 true 表示可退款；否则 reason 说明原因
 */
export function canRefund(order: Order): { ok: boolean; reason?: string } {
  const blockReason = REFUND_BLOCK_REASON[order.status]
  if (blockReason) {
    return { ok: false, reason: blockReason }
  }

  if (!order.deliveredAt) {
    return { ok: false, reason: '缺少签收时间，无法判断退款条件' }
  }

  const deadline = new Date(order.deliveredAt)
  deadline.setDate(deadline.getDate() + REFUND_WINDOW_DAYS)
  if (new Date() > deadline) {
    return {
      ok: false,
      reason: `已超过签收后 ${REFUND_WINDOW_DAYS} 天退款有效期`
    }
  }

  if (!order.refundable) {
    return { ok: false, reason: '该订单商品不支持退款' }
  }

  return { ok: true }
}
