// Mock 订单服务：提供订单查询与退款条件校验
// 真实项目中会对接电商后端 API，这里用内存数据模拟

export type OrderStatus =
  | 'shipped' // 已发货（未签收）
  | 'delivered' // 已签收
  | 'cancelled' // 已取消
  | 'refunding' // 退款中
  | 'refunded' // 已退款

/** 订单信息 */
export interface Order {
  order_id: string
  user_id: string
  product_name: string
  amount: number
  status: OrderStatus
  ordered_at: string // 下单时间（ISO 字符串）
  delivered_at: string | null // 签收时间（ISO 字符串），未签收为 null
}

/** 退款校验结果 */
export interface RefundCheck {
  ok: boolean
  reason?: string
}

// 签收后 7 天内可退款
const REFUND_WINDOW_DAYS = 7

// 每天毫秒数
const MS_PER_DAY = 86_400_000

/** 计算 n 天前的时间（ISO 字符串） */
const daysAgo = (days: number) =>
  new Date(Date.now() - days * MS_PER_DAY).toISOString()

const mockOrders: Order[] = [
  // U1001（李华）的订单
  {
    order_id: 'ORD-2601',
    user_id: 'U1001',
    product_name: '无线蓝牙耳机',
    amount: 299,
    status: 'delivered',
    ordered_at: daysAgo(5),
    delivered_at: daysAgo(2) // 7 天内，可退
  },
  {
    order_id: 'ORD-2602',
    user_id: 'U1001',
    product_name: '机械键盘',
    amount: 459,
    status: 'delivered',
    ordered_at: daysAgo(33),
    delivered_at: daysAgo(30) // 超期，不可退
  },
  {
    order_id: 'ORD-2603',
    user_id: 'U1001',
    product_name: '编织数据线',
    amount: 39,
    status: 'shipped',
    ordered_at: daysAgo(1),
    delivered_at: null // 在途，可退
  },
  {
    order_id: 'ORD-2604',
    user_id: 'U1001',
    product_name: '27 英寸显示器',
    amount: 1899,
    status: 'refunded',
    ordered_at: daysAgo(40),
    delivered_at: daysAgo(37)
  },
  {
    order_id: 'ORD-2605',
    user_id: 'U1001',
    product_name: '透明手机壳',
    amount: 59,
    status: 'refunding',
    ordered_at: daysAgo(6),
    delivered_at: daysAgo(3)
  },
  {
    order_id: 'ORD-2606',
    user_id: 'U1001',
    product_name: '护眼台灯',
    amount: 129,
    status: 'cancelled',
    ordered_at: daysAgo(26),
    delivered_at: null
  },
  // U1002（王芳）的订单
  {
    order_id: 'ORD-2607',
    user_id: 'U1002',
    product_name: '20000mAh 充电宝',
    amount: 159,
    status: 'delivered',
    ordered_at: daysAgo(4),
    delivered_at: daysAgo(1) // 7 天内，可退
  },
  {
    order_id: 'ORD-2608',
    user_id: 'U1002',
    product_name: '便携蓝牙音箱',
    amount: 399,
    status: 'delivered',
    ordered_at: daysAgo(63),
    delivered_at: daysAgo(60) // 超期，不可退
  },
  {
    order_id: 'ORD-2609',
    user_id: 'U1002',
    product_name: '无线鼠标',
    amount: 89,
    status: 'delivered',
    ordered_at: daysAgo(8),
    delivered_at: daysAgo(5) // 7 天内，可退
  },
  {
    order_id: 'ORD-2610',
    user_id: 'U1002',
    product_name: '笔记本支架',
    amount: 219,
    status: 'refunded',
    ordered_at: daysAgo(16),
    delivered_at: daysAgo(13)
  },
  {
    order_id: 'ORD-2611',
    user_id: 'U1002',
    product_name: '高清摄像头',
    amount: 349,
    status: 'delivered',
    ordered_at: daysAgo(11),
    delivered_at: daysAgo(8) // 超期（边界外），不可退
  },
  {
    order_id: 'ORD-2612',
    user_id: 'U1002',
    product_name: 'USB-C 扩展坞',
    amount: 199,
    status: 'delivered',
    ordered_at: daysAgo(10),
    delivered_at: daysAgo(7) // 恰好第 7 天，可退（边界内）
  },
  {
    order_id: 'ORD-2613',
    user_id: 'U1002',
    product_name: '电竞耳机',
    amount: 599,
    status: 'shipped',
    ordered_at: daysAgo(0),
    delivered_at: null
  }
]

/** 按订单号查询订单；订单不存在或不属于该用户时返回 null（返回浅拷贝，外部修改不影响 Mock 数据） */
export function getOrderById(orderId: string, userId: string): Order | null {
  const order = mockOrders.find((o) => o.order_id === orderId)
  if (!order || order.user_id !== userId) return null
  return { ...order }
}

/**
 * 申请退款（受控写入口）：校验可退后将订单状态改为 refunding。
 * 外部不应直接修改 getOrderById 返回的订单对象，状态变更统一走本函数。
 */
export function applyRefund(orderId: string, userId: string): RefundCheck {
  const order = mockOrders.find((o) => o.order_id === orderId)
  if (!order || order.user_id !== userId) {
    return { ok: false, reason: '未找到该订单，请检查订单号是否正确' }
  }
  const check = canRefund(order)
  if (check.ok) order.status = 'refunding'
  return check
}

/**
 * 校验订单是否可退款。
 * 规则：已签收订单在签收后 7 天内可退；在途订单可退；
 * 已取消 / 退款中 / 已退款 / 超期订单不可退。
 */
export function canRefund(order: Order): RefundCheck {
  switch (order.status) {
    case 'cancelled':
      return { ok: false, reason: '订单已取消，无法退款' }
    case 'refunding':
      return { ok: false, reason: '订单正在退款中，请勿重复申请' }
    case 'refunded':
      return { ok: false, reason: '订单已完成退款' }
    case 'shipped':
      return { ok: true }
    case 'delivered': {
      if (!order.delivered_at) {
        return { ok: false, reason: '订单缺少签收时间，无法判断退款时效' }
      }
      const days =
        (Date.now() - new Date(order.delivered_at).getTime()) / MS_PER_DAY
      // 按整天数比较：签收满 7 天（未到第 8 天）仍可退，
      // 同时规避毫秒级时间差导致"恰好第 7 天"边界被误判为超期
      if (Math.floor(days) <= REFUND_WINDOW_DAYS) return { ok: true }
      return {
        ok: false,
        reason: `已超过签收后 ${REFUND_WINDOW_DAYS} 天退款时效（签收于 ${Math.floor(days)} 天前）`
      }
    }
  }
}
