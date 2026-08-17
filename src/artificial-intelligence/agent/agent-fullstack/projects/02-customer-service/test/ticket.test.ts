import { describe, expect, test } from 'bun:test'
import { createTicket, getTicket } from '../src/services/ticket'

describe('createTicket', () => {
  test('返回 TK 前缀工单号', () => {
    const ticket = createTicket({
      user_id: 'U1001',
      summary: '商品破损，要求退款'
    })
    expect(ticket.ticket_id).toStartWith('TK-')
    expect(ticket.user_id).toBe('U1001')
    expect(ticket.summary).toBe('商品破损，要求退款')
  })

  test('新工单默认状态为 open', () => {
    const ticket = createTicket({ user_id: 'U1002', summary: '投诉物流慢' })
    expect(ticket.status).toBe('open')
  })

  test('未传优先级时默认为 normal 并落库', () => {
    const ticket = createTicket({ user_id: 'U1002', summary: '投诉物流慢' })
    expect(ticket.priority).toBe('normal')
    // 返回的是浅拷贝，但工单号映射的是同一份存储，应能查到同一优先级
    expect(getTicket(ticket.ticket_id)?.priority).toBe('normal')
  })

  test('显式传入的优先级会持久化', () => {
    const ticket = createTicket({
      user_id: 'U1002',
      summary: '商品破损，要求加急处理',
      priority: 'high'
    })
    expect(ticket.priority).toBe('high')
    expect(getTicket(ticket.ticket_id)?.priority).toBe('high')
  })

  test('连续创建的工单号唯一', () => {
    const a = createTicket({ user_id: 'U1001', summary: '问题 A' })
    const b = createTicket({ user_id: 'U1001', summary: '问题 B' })
    expect(a.ticket_id).not.toBe(b.ticket_id)
  })
})

describe('getTicket', () => {
  test('创建后能按工单号查到', () => {
    const created = createTicket({
      user_id: 'U1002',
      summary: '申请换货'
    })
    const found = getTicket(created.ticket_id)
    expect(found).toEqual(created)
  })

  test('不存在的工单返回 null', () => {
    expect(getTicket('TK-000000-0')).toBeNull()
  })
})
