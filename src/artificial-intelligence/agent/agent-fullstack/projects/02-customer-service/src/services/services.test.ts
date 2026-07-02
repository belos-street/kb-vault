import { describe, expect, it } from 'bun:test'
import { canRefund, getOrderById } from './order.ts'
import { createTicket, getTicket } from './ticket.ts'

describe('order service', () => {
  describe('getOrderById', () => {
    it('有效订单号与用户返回正确订单', () => {
      const order = getOrderById('ORD-2026001', 'USER-001')
      expect(order).not.toBeNull()
      expect(order?.orderId).toBe('ORD-2026001')
      expect(order?.userId).toBe('USER-001')
    })

    it('无效订单号返回 null', () => {
      expect(getOrderById('ORD-NOT-EXIST', 'USER-001')).toBeNull()
    })

    it('用户不匹配返回 null', () => {
      expect(getOrderById('ORD-2026001', 'USER-002')).toBeNull()
    })
  })

  describe('canRefund', () => {
    it('已发货订单不可退款', () => {
      const order = getOrderById('ORD-2026001', 'USER-001')!
      const result = canRefund(order)
      expect(result.ok).toBe(false)
      expect(result.reason).toContain('未签收')
    })

    it('已签收 7 天内订单可退款', () => {
      const order = getOrderById('ORD-2026002', 'USER-001')!
      expect(canRefund(order).ok).toBe(true)
    })

    it('已签收超过 7 天订单不可退款', () => {
      const order = getOrderById('ORD-2026003', 'USER-001')!
      const result = canRefund(order)
      expect(result.ok).toBe(false)
      expect(result.reason).toContain('超过签收后')
    })

    it('已取消订单不可退款', () => {
      const order = getOrderById('ORD-2026004', 'USER-002')!
      const result = canRefund(order)
      expect(result.ok).toBe(false)
      expect(result.reason).toContain('已取消')
    })

    it('已退款订单不可退款', () => {
      const order = getOrderById('ORD-2026005', 'USER-002')!
      const result = canRefund(order)
      expect(result.ok).toBe(false)
      expect(result.reason).toContain('已退款')
    })

    it('退款中订单不可退款', () => {
      const order = getOrderById('ORD-2026006', 'USER-002')!
      const result = canRefund(order)
      expect(result.ok).toBe(false)
      expect(result.reason).toContain('正在退款')
    })

    it('不支持退款的商品不可退款', () => {
      const order = getOrderById('ORD-2026011', 'USER-004')!
      const result = canRefund(order)
      expect(result.ok).toBe(false)
      expect(result.reason).toContain('不支持退款')
    })
  })
})

describe('ticket service', () => {
  it('创建工单后可通过工单号查询到', () => {
    const ticketId = createTicket({ userId: 'USER-001', summary: '测试问题' })
    expect(ticketId.startsWith('TK')).toBe(true)

    const ticket = getTicket(ticketId)
    expect(ticket).not.toBeNull()
    expect(ticket?.userId).toBe('USER-001')
    expect(ticket?.summary).toBe('测试问题')
    expect(ticket?.status).toBe('open')
  })

  it('无效工单号返回 null', () => {
    expect(getTicket('TK-NOT-EXIST')).toBeNull()
  })
})

import { searchKnowledge } from './knowledge.ts'

describe('knowledge service', () => {
  it('退货政策能命中退货相关答案', () => {
    const results = searchKnowledge('退货政策')
    expect(results.length).toBeGreaterThan(0)
    expect(results[0].answer).toContain('7 天内')
  })

  it('无匹配问题返回空数组', () => {
    const results = searchKnowledge('你们的 CEO 是谁')
    expect(results).toEqual([])
  })

  it('物流相关 query 命中物流 FAQ', () => {
    const results = searchKnowledge('快递到哪了')
    expect(results.length).toBeGreaterThan(0)
    expect(results[0].answer).toContain('物流')
  })

  it('topK 限制返回条数', () => {
    const results = searchKnowledge('退货', 2)
    expect(results.length).toBeLessThanOrEqual(2)
  })
})
