import { z } from 'zod'

const PROMPT_ID = 'ticket-classify'
const PROMPT_VERSION = 3

export const TicketIntent = z.object({
  intent: z.enum(['refund_status', 'invoice', 'account', 'other']),
  orderId: z
    .string()
    .regex(/^ORD-\d{4}$/)
    .nullable(),
  urgency: z.enum(['low', 'normal', 'high']),
  reply: z.string().min(1).max(120)
})

export const TICKET_PROMPT = {
  id: PROMPT_ID,
  version: PROMPT_VERSION,
  render(input: { message: string; history: string[] }) {
    return [
      {
        role: 'system' as const,
        content: [
          '你是客服工单分类器，只做分类与抽取，不回答业务政策。',
          '信息不足时 intent 取 other，orderId 取 null，不要编造订单号。',
          '只输出 JSON，字段必须符合给定 Schema。',
          '模板：' + PROMPT_ID + '@' + PROMPT_VERSION
        ].join('\n')
      },
      {
        role: 'user' as const,
        content: [
          '<user_input>',
          '【历史】',
          input.history.join('\n') || '(无)',
          '【当前消息】',
          input.message,
          '</user_input>',
          '请按 Schema 输出分类结果。'
        ].join('\n')
      }
    ]
  }
}

function parseJson(
  raw: string
): { ok: true; value: unknown } | { ok: false; message: string } {
  try {
    return { ok: true, value: JSON.parse(raw) }
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : 'JSON parse failed'
    }
  }
}

function validate(
  raw: string
):
  | { ok: true; data: z.infer<typeof TicketIntent> }
  | { ok: false; message: string } {
  const json = parseJson(raw)
  if (!json.ok) return { ok: false, message: '不是合法 JSON：' + json.message }

  const parsed = TicketIntent.safeParse(json.value)
  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues
        .map((issue) => issue.path.join('.') + ' ' + issue.message)
        .join('; ')
    }
  }
  return { ok: true, data: parsed.data }
}

export async function classify(input: {
  message: string
  history: string[]
  callModel: (messages: unknown[], schema: unknown) => Promise<string>
}): Promise<z.infer<typeof TicketIntent>> {
  const messages = TICKET_PROMPT.render(input)
  const raw = await input.callModel(messages, TicketIntent)

  const first = validate(raw)
  if (first.ok) return first.data

  const retryRaw = await input.callModel(
    [
      ...messages,
      { role: 'assistant', content: raw },
      {
        role: 'user',
        content:
          '上面的输出不可用：' + first.message + '。请只输出修正后的 JSON。'
      }
    ],
    TicketIntent
  )

  const second = validate(retryRaw)
  if (second.ok) return second.data

  throw new Error('schema_unrecoverable: ' + second.message)
}
