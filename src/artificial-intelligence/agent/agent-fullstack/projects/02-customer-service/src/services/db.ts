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

/**
 * 按订单号精确查询单条（query_order 工具的主查询）
 *
 * 参数化查询：$1 占位符 + 参数数组，值永不参与 SQL 语法解析（防注入）。
 * 无匹配返回 null 而非抛错——调用方（工具）把「未找到」转为 ToolMessage 让模型自纠。
 */
export async function getOrderById(orderId: string): Promise<OrderRow | null> {
  const { rows } = await pool.query<OrderRow>(
    'SELECT * FROM orders WHERE order_id = $1',
    [orderId]
  )
  return rows[0] ?? null
}

/** 查询指定用户的全部订单，按下单时间倒序（「我的订单」类追问 / 权限归属判断用） */
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

/**
 * 创建工单并返回完整行（含自增 id，对外展示 TK-0001 形态）
 *
 * 只负责落库，不管「该不该建单」——是否升级人工由 Agent + HITL 决策。
 * INSERT ... RETURNING *：一条语句完成写入并拿回结果（pg 特性，省一次 SELECT）。
 */
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

/** 全量列出工单队列，按创建时间倒序（bun run tickets:list 的数据源，坐席侧视角） */
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
