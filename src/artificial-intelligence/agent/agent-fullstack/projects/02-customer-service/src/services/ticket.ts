import type { CreateTicketParams, Ticket } from './type.ts'

/** 内存工单存储数组 */
const tickets: Ticket[] = []

/** 生成工单号：TK + 时间戳 + 3 位随机数 */
function generateTicketId(): string {
  const timestamp = Date.now()
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, '0')
  return `TK${timestamp}${random}`
}

/**
 * 创建工单
 * @param params 创建参数
 * @returns 新工单号
 */
export function createTicket(params: CreateTicketParams): string {
  const ticket: Ticket = {
    ticketId: generateTicketId(),
    userId: params.userId,
    summary: params.summary,
    status: 'open',
    createdAt: new Date()
  }
  tickets.push(ticket)
  return ticket.ticketId
}

/**
 * 按工单号查询工单
 * @param ticketId 工单号
 * @returns 匹配工单；未找到返回 null
 */
export function getTicket(ticketId: string): Ticket | null {
  return tickets.find((t) => t.ticketId === ticketId) ?? null
}
