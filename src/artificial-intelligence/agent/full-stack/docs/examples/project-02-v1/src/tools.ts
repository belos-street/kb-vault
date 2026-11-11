import { tool } from 'langchain'
import { z } from 'zod'

export const faqTool = tool(
  async ({ question }) => {
    if (question.includes('退款')) {
      return {
        answer: '退款会在 3-5 个工作日原路退回。',
        source: 'faq/refund-time'
      }
    }
    return { answer: '没有命中 FAQ。', source: 'faq/miss' }
  },
  {
    name: 'search_faq',
    description: '检索客服 FAQ。用户问政策、到账时间、发票规则时调用。',
    schema: z.object({
      question: z.string().min(2).describe('用户问题')
    })
  }
)

export const refundTool = tool(
  async ({ orderId, reason }, runtime) => {
    const role = runtime.context?.role
    if (role !== 'admin') {
      throw new Error('permission_denied: refund 需要 admin 角色')
    }
    return { ok: true, orderId, reason, refundCny: 199 }
  },
  {
    name: 'refund',
    description: '提交退款申请。仅当用户明确要求退款时调用。',
    schema: z.object({
      orderId: z.string().regex(/^ORD-\d{4}$/),
      reason: z.enum(['damaged', 'late', 'other'])
    })
  }
)
