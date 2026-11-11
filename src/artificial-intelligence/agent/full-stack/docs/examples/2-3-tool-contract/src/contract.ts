import { z } from 'zod'

export const RefundInput = z.object({
  orderId: z.string().regex(/^ORD-\d{4}$/),
  reason: z.enum(['damaged', 'late', 'other'])
})

export const AgentContext = z.object({
  userId: z.string().min(1),
  role: z.enum(['agent', 'admin']),
  tenantId: z.string().min(1)
})

export const TicketIntent = z.object({
  intent: z.enum(['refund_status', 'invoice', 'account', 'other']),
  orderId: z
    .string()
    .regex(/^ORD-\d{4}$/)
    .optional(),
  reply: z.string().min(1)
})

export interface ToolResult {
  ok: boolean
  code?: string
  message: string
  data?: unknown
}

export class ToolPermissionError extends Error {
  readonly code = 'permission_denied'

  constructor(message: string) {
    super(message)
    this.name = 'ToolPermissionError'
  }
}

export function runRefund(rawInput: unknown, rawContext: unknown): ToolResult {
  const input = RefundInput.safeParse(rawInput)
  if (!input.success) {
    return {
      ok: false,
      code: 'invalid_input',
      message: input.error.issues
        .map((issue) => issue.path.join('.') + ': ' + issue.message)
        .join('; ')
    }
  }

  const context = AgentContext.safeParse(rawContext)
  if (!context.success) {
    return {
      ok: false,
      code: 'invalid_context',
      message: 'context: userId / role / tenantId 不合法'
    }
  }

  if (context.data.role !== 'admin') {
    // 抛可识别错误；由调用方决定终止本轮还是回填 error ToolMessage
    throw new ToolPermissionError('permission_denied: refund 需要 admin 角色')
  }

  return {
    ok: true,
    message: 'refund accepted',
    data: { ...input.data, refundCny: 199, operator: context.data.userId }
  }
}

export function parseTicket(
  raw: string
):
  | { ok: true; data: z.infer<typeof TicketIntent> }
  | { ok: false; message: string } {
  try {
    const value: unknown = JSON.parse(raw)
    const parsed = TicketIntent.safeParse(value)
    if (!parsed.success) {
      return {
        ok: false,
        message: parsed.error.issues
          .map((issue) => issue.path.join('.') + ': ' + issue.message)
          .join('; ')
      }
    }
    return { ok: true, data: parsed.data }
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : 'JSON.parse failed'
    }
  }
}
