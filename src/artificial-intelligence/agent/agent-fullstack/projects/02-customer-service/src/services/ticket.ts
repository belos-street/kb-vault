// Mock 工单服务：内存数组存储，创建工单并返回工单号
// 真实项目中会对接工单系统 API

export type TicketStatus = 'open' | 'processing' | 'resolved' | 'closed'

export interface Ticket {
  ticket_id: string // 工单号：TK + 时间戳 + 自增序号
  user_id: string
  summary: string // 问题摘要
  status: TicketStatus
  created_at: string // ISO 字符串
}

export interface CreateTicketParams {
  user_id: string
  summary: string
}

const tickets: Ticket[] = []

// 自增序号，避免同一毫秒内创建多个工单时工单号冲突
let seq = 0

/** 创建工单，返回完整工单对象（含生成的工单号；返回浅拷贝，外部修改不影响存储） */
export function createTicket(params: CreateTicketParams): Ticket {
  const ticket: Ticket = {
    ticket_id: `TK-${Date.now()}-${++seq}`,
    user_id: params.user_id,
    summary: params.summary,
    status: 'open',
    created_at: new Date().toISOString()
  }
  tickets.push(ticket)
  return { ...ticket }
}

/** 按工单号查询，未找到返回 null（返回浅拷贝） */
export function getTicket(ticketId: string): Ticket | null {
  const ticket = tickets.find((t) => t.ticket_id === ticketId)
  return ticket ? { ...ticket } : null
}
