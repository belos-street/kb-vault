/**
 * PostgreSQL 访问层（orders / tickets）
 *
 * 只做数据访问，不做业务规则判定（可退校验等留给后续的 order-service，
 * 「纯代码判定，不让 LLM 比较数值」）。
 * 模块级单例连接池：CLI / Agent / 脚本共享，进程退出前调用 closePool()。
 */
import { Pool } from 'pg'
import { config } from '../config.ts'

export type OrderStatus = '已支付' | '已发货' | '已签收' | '退款中'
export type TicketStatus = 'open' | 'escalated' | 'resolved'
export type TicketType =
  | 'refund'
  | 'logistics'
  | 'account'
  | 'complaint'
  | 'other'

export interface OrderRow {
  order_id: string
  user_id: string
  item_name: string
  /** NUMERIC 经 pg 返回为字符串，避免浮点误差，展示/比对时原样使用 */
  amount: string
  status: OrderStatus
  tracking_number: string | null
  created_at: Date
  delivered_at: Date | null
  refund_reason: string | null
}

export interface TicketRow {
  id: number
  user_id: string
  type: TicketType
  summary: string
  status: TicketStatus
  transcript: string | null
  created_at: Date
}

const pool = new Pool({ connectionString: config.DATABASE_URL })

export async function getOrderById(orderId: string): Promise<OrderRow | null> {
  const { rows } = await pool.query<OrderRow>(
    'SELECT * FROM orders WHERE order_id = $1',
    [orderId]
  )
  return rows[0] ?? null
}

export async function getOrdersByUserId(userId: string): Promise<OrderRow[]> {
  const { rows } = await pool.query<OrderRow>(
    'SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC',
    [userId]
  )
  return rows
}

/** 退款落库：置「退款中」并记录原因（返回 null 即订单不存在） */
export async function refundOrder(
  orderId: string,
  reason: string
): Promise<OrderRow | null> {
  const { rows } = await pool.query<OrderRow>(
    `UPDATE orders SET status = '退款中', refund_reason = $2
     WHERE order_id = $1 RETURNING *`,
    [orderId, reason]
  )
  return rows[0] ?? null
}

export async function createTicket(input: {
  userId: string
  type: TicketType
  summary: string
  transcript?: string | null
}): Promise<TicketRow> {
  const { rows } = await pool.query<TicketRow>(
    `INSERT INTO tickets (user_id, type, summary, transcript)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [input.userId, input.type, input.summary, input.transcript ?? null]
  )
  const row = rows[0]
  if (!row) throw new Error('[db] 创建工单未返回行')
  return row
}

export async function listTickets(): Promise<TicketRow[]> {
  const { rows } = await pool.query<TicketRow>(
    'SELECT * FROM tickets ORDER BY created_at DESC'
  )
  return rows
}

/** 进程退出前收连接池（Spike A 纪律：否则 pg 连接挂住进程） */
export async function closePool(): Promise<void> {
  await pool.end()
}
