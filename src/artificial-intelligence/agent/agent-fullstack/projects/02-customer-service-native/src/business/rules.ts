/**
 * 业务规则：权限、可退判定、FAQ 检索、工单写入。
 *
 * 作用
 * - 全是纯函数或接近纯函数的逻辑，方便单测。
 * - 工具层只做参数校验和调用这里；循环层完全不认识这些规则。
 *
 * 约定
 * - 失败返回 { ok: false, reason }，不要抛异常；由工具层转成 observation。
 * - 金额一律取订单里的 amount，不让模型参与数值计算。
 * - 越权按"不存在"处理，不泄露订单是否存在。
 */
import type { Order, PolicyFaq, Ticket, TicketType } from './types'

/** 权限：只能操作自己的订单；越权按不存在处理。 */
export function canAccessOrder(_order: Order, _userId: string): boolean {
  throw new Error('TODO 第 1 步：实现权限判定')
}

/**
 * 可退判定（纯函数，必须单测）。
 * 规则：paid / shipped / delivered 可退；已签收按 deliveredAt 起 7 天，
 * 未签收按 paidAt 起 7 天；refunding / refunded 直接拒绝。
 */
export function checkRefundable(
  _order: Order,
  _now: Date = new Date()
): { ok: true } | { ok: false; reason: string } {
  throw new Error('TODO 第 1 步：实现 7 天边界与状态判定')
}

/** FAQ 关键词检索：命中返回条目，未命中返回 null（由工具层转成"未覆盖"）。 */
export function searchFaq(
  _faqs: PolicyFaq[],
  _query: string
): PolicyFaq | null {
  throw new Error('TODO 第 1 步：中文关键词滑动窗口 + 重叠比阈值')
}

/** 校验通过后把订单状态改为 refunding；失败抛错由工具层兜底。 */
export async function applyRefund(
  _orders: Order[],
  _orderId: string,
  _reason: string
): Promise<Order> {
  throw new Error('TODO 第 1 步：校验状态与权限后更新内存副本')
}

/** 生成工单号并追加到内存列表。 */
export async function appendTicket(
  _tickets: Ticket[],
  _input: { userId: string; type: TicketType; summary: string }
): Promise<Ticket> {
  throw new Error('TODO 第 1 步：生成 TK-xxxx 并写入内存列表')
}
