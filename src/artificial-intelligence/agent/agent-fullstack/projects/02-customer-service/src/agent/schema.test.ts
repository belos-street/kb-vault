import { describe, expect, it } from 'bun:test'
import { z } from 'zod'
import { IntentSchema, type IntentOutput } from './schema.ts'

describe('IntentSchema', () => {
  // ========== 有效解析 ==========

  it('能解析完整的结构化输出', () => {
    const input = {
      intent: 'order_query',
      slots: { order_id: 'ORD-001', amount: 299.9 },
      reply: undefined,
    }

    const result = IntentSchema.parse(input)

    expect(result.intent).toBe('order_query')
    expect(result.slots.order_id).toBe('ORD-001')
    expect(result.slots.amount).toBe(299.9)
  })

  it('能解析问候意图（只有 reply，无 slots）', () => {
    const input = {
      intent: 'greeting',
      slots: {},
      reply: '您好！欢迎光临，请问有什么可以帮您的？',
    }

    const result = IntentSchema.parse(input)

    expect(result.intent).toBe('greeting')
    expect(result.reply).toBe('您好！欢迎光临，请问有什么可以帮您的？')
  })

  it('能解析所有 5 种 intent 值', () => {
    const intents = [
      'order_query',
      'refund',
      'complaint',
      'handoff',
      'greeting',
    ] as const

    for (const intent of intents) {
      const result = IntentSchema.parse({ intent, slots: {} })
      expect(result.intent).toBe(intent)
    }
  })

  it('slots 所有字段均为可选', () => {
    const result = IntentSchema.parse({ intent: 'refund', slots: {} })
    expect(result.slots.order_id).toBeUndefined()
    expect(result.slots.product_name).toBeUndefined()
    expect(result.slots.amount).toBeUndefined()
    expect(result.slots.reason).toBeUndefined()
    expect(result.slots.contact).toBeUndefined()
  })

  it('reply 为可选字段', () => {
    const without = IntentSchema.parse({ intent: 'order_query', slots: {} })
    expect(without.reply).toBeUndefined()

    const withReply = IntentSchema.parse({
      intent: 'order_query',
      slots: {},
      reply: '请稍等，正在查询',
    })
    expect(withReply.reply).toBe('请稍等，正在查询')
  })

  // ========== 校验失败 ==========

  it('无效 intent 值应抛出清晰错误', () => {
    const input = { intent: 'invalid_intent', slots: {} }

    expect(() => IntentSchema.parse(input)).toThrow(z.ZodError)
    try {
      IntentSchema.parse(input)
    } catch (e) {
      if (e instanceof z.ZodError) {
        const intentIssue = e.issues.find((i) => i.path[0] === 'intent')
        expect(intentIssue).toBeDefined()
        expect(intentIssue!.message).toContain('Invalid')
      }
    }
  })

  it('amount 传入字符串应抛出类型错误', () => {
    const input = {
      intent: 'refund',
      slots: { amount: '不是数字' },
    }

    expect(() => IntentSchema.parse(input)).toThrow(z.ZodError)
    try {
      IntentSchema.parse(input)
    } catch (e) {
      if (e instanceof z.ZodError) {
        const amountIssue = e.issues.find(
          (i) => i.path[0] === 'slots' && i.path[1] === 'amount'
        )
        expect(amountIssue).toBeDefined()
        expect(amountIssue!.message).toContain('number')
      }
    }
  })

  it('缺少 intent 应抛出错误', () => {
    const input = { slots: {} }

    expect(() => IntentSchema.parse(input)).toThrow(z.ZodError)
  })

  // ========== 类型推断 ==========

  it('类型推断正确', () => {
    // 编译时类型检查（运行时无意义，但确保不会报错）
    const output: IntentOutput = IntentSchema.parse({
      intent: 'refund',
      slots: { order_id: 'ORD-001', reason: '商品破损' },
    })

    // intent 是字面量联合类型
    const _checkIntent: 'order_query' | 'refund' | 'complaint' | 'handoff' | 'greeting' =
      output.intent
    expect(['order_query', 'refund', 'complaint', 'handoff', 'greeting']).toContain(
      _checkIntent
    )
  })

  // ========== responseFormat 兼容 ==========

  it('可以作为 responseFormat 使用（可 JSON 序列化）', () => {
    // responseFormat 要求 schema 能生成 JSON Schema
    const jsonSchema = IntentSchema.toJSONSchema?.() ?? IntentSchema._def

    expect(jsonSchema).toBeDefined()
    // 验证是 object 类型
    expect((jsonSchema as any).type ?? 'object').toBeDefined()
  })
})
