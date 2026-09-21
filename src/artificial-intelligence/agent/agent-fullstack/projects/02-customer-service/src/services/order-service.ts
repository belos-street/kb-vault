/**
 * 退款校验规则（纯代码判定，不让 LLM 比较数值/日期 —— README §架构设计）
 *
 * 规则口径与 kb/policy-faq.json 的退款条目共用同一套事实：
 *   已支付            → 可退（未发货取消，全额）
 *   已签收 ≤ 7 天     → 可退（7 天无理由）
 *   已签收 > 7 天     → 不可（超无理由窗口；质量问题走工单转人工）
 *   已发货            → 不可直接退（在途：拒收退回或签收后再申请）
 *   退款中            → 不可（已有退款在处理）
 *
 * now 参数默认取当前时间，测试可注入固定时钟（可测试性约定）。
 */
import type { OrderRow } from './db.ts'

export interface RefundCheck {
  ok: boolean
  /** 不可退的原因（工具层原样转告模型，模型转告用户） */
  reason?: string
}

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000

export function checkRefundable(
  order: OrderRow,
  now = new Date()
): RefundCheck {
  switch (order.status) {
    case '退款中':
      return { ok: false, reason: '该订单已有退款在处理中，请耐心等待到账' }
    case '已发货':
      return {
        ok: false,
        reason:
          '订单已在途，无法直接退款；可拒收退回，或签收后再申请 7 天无理由退货'
      }
    case '已支付':
      return { ok: true }
    case '已签收': {
      if (!order.delivered_at) {
        return { ok: false, reason: '订单数据异常：已签收但缺少签收时间' }
      }
      if (now.getTime() - order.delivered_at.getTime() > SEVEN_DAYS_MS) {
        return { ok: false, reason: '已超过签收后 7 天无理由退货期' }
      }
      return { ok: true }
    }
  }
}
