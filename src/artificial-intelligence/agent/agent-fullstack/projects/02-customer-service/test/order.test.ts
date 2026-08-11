import { describe, expect, test } from 'bun:test'
import {
  applyRefund,
  canRefund,
  getOrderById,
  type Order
} from '../src/services/order'

const MS_PER_DAY = 86_400_000

/** 构造测试订单，默认：已签收 2 天（可退） */
const makeOrder = (overrides: Partial<Order> = {}): Order => ({
  order_id: 'TEST-001',
  user_id: 'U1001',
  product_name: '测试商品',
  amount: 100,
  status: 'delivered',
  ordered_at: new Date(Date.now() - 5 * MS_PER_DAY).toISOString(),
  delivered_at: new Date(Date.now() - 2 * MS_PER_DAY).toISOString(),
  ...overrides
})

describe('getOrderById', () => {
  test('有效订单能查到', () => {
    const order = getOrderById('ORD-2601', 'U1001')
    expect(order).not.toBeNull()
    expect(order?.product_name).toBe('无线蓝牙耳机')
  })

  test('不存在的订单返回 null', () => {
    expect(getOrderById('ORD-9999', 'U1001')).toBeNull()
  })

  test('查询他人订单返回 null', () => {
    // ORD-2607 属于 U1002，U1001 无权查询
    expect(getOrderById('ORD-2607', 'U1001')).toBeNull()
  })
})

describe('canRefund', () => {
  test('签收 7 天内可退', () => {
    expect(canRefund(makeOrder()).ok).toBe(true)
  })

  test('恰好第 7 天可退（边界内）', () => {
    const order = makeOrder({
      delivered_at: new Date(Date.now() - 7 * MS_PER_DAY).toISOString()
    })
    expect(canRefund(order).ok).toBe(true)
  })

  test('超过 7 天不可退（边界外）', () => {
    const order = makeOrder({
      delivered_at: new Date(Date.now() - 8 * MS_PER_DAY).toISOString()
    })
    const result = canRefund(order)
    expect(result.ok).toBe(false)
    expect(result.reason).toContain('已超过')
  })

  test('在途订单（shipped）可退', () => {
    const order = makeOrder({ status: 'shipped', delivered_at: null })
    expect(canRefund(order).ok).toBe(true)
  })

  test('已取消订单不可退', () => {
    const order = makeOrder({ status: 'cancelled', delivered_at: null })
    expect(canRefund(order).ok).toBe(false)
  })

  test('退款中订单不可重复退', () => {
    expect(canRefund(makeOrder({ status: 'refunding' })).ok).toBe(false)
  })

  test('已退款订单不可退', () => {
    expect(canRefund(makeOrder({ status: 'refunded' })).ok).toBe(false)
  })
})

describe('Mock 数据完整性', () => {
  test('Mock 数据覆盖全部 5 种状态', () => {
    const statuses = new Set(
      ['ORD-2601', 'ORD-2603', 'ORD-2604', 'ORD-2605', 'ORD-2606'].map(
        (id) => getOrderById(id, 'U1001')?.status
      )
    )
    expect(statuses).toEqual(
      new Set(['delivered', 'shipped', 'refunded', 'refunding', 'cancelled'])
    )
  })

  test('超期订单在 Mock 数据中不可退', () => {
    const order = getOrderById('ORD-2602', 'U1001')
    expect(order).not.toBeNull()
    expect(canRefund(order!).ok).toBe(false)
  })

  test('ORD-2612 恰好第 7 天可退（Mock 边界数据）', () => {
    const order = getOrderById('ORD-2612', 'U1002')
    expect(order).not.toBeNull()
    expect(canRefund(order!).ok).toBe(true)
  })

  test('ORD-2611 签收第 8 天不可退（Mock 边界数据）', () => {
    const order = getOrderById('ORD-2611', 'U1002')
    expect(order).not.toBeNull()
    expect(canRefund(order!).ok).toBe(false)
  })

  test('getOrderById 返回拷贝，外部修改不影响 Mock 数据', () => {
    const order = getOrderById('ORD-2601', 'U1001')!
    order.status = 'refunded'
    expect(getOrderById('ORD-2601', 'U1001')!.status).toBe('delivered')
  })
})

describe('applyRefund', () => {
  // 使用 ORD-2609（U1002，已签收可退，未被其他用例断言）
  test('可退订单申请成功后状态变为 refunding', () => {
    const result = applyRefund('ORD-2609', 'U1002')
    expect(result.ok).toBe(true)
    expect(getOrderById('ORD-2609', 'U1002')!.status).toBe('refunding')
  })

  test('重复申请被拒绝', () => {
    const result = applyRefund('ORD-2609', 'U1002')
    expect(result.ok).toBe(false)
    expect(result.reason).toContain('退款中')
  })

  test('申请他人订单被拒绝', () => {
    const result = applyRefund('ORD-2601', 'U1002')
    expect(result.ok).toBe(false)
  })

  test('不存在的订单返回失败', () => {
    const result = applyRefund('ORD-9999', 'U1001')
    expect(result.ok).toBe(false)
    expect(result.reason).toContain('未找到')
  })
})
