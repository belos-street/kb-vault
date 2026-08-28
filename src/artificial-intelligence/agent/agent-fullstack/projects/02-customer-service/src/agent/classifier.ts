// 意图分类器：独立 Agent，负责意图分类 + 槽位填充（todo 3.1）
//
// ⚠️ 已实测适配（DeepSeek 推理模式，必须看）：
// - 本想用 responseFormat 结构化输出，但该模型既不支持 toolStrategy（报
//   "Thinking mode does not support this tool_choice"），也不支持 providerStrategy 的
//   json_schema（报 "This response_format type is unavailable now"）。
// - 故降级为「提示词要求输出 JSON + 手工解析 + zod 兜底」：模型不可靠时优雅回退到
//   { intent: "unknown", slots: {} }，不会抛错。
// - 若后续换用支持 structured output 的模型，可改回来 responseFormat + structuredResponse。
import { createAgent } from 'langchain'
import { IntentSchema, type IntentOutput } from './schema'

type CreateAgentParams = Parameters<typeof createAgent>[0]

const CLASSIFIER_PROMPT = `你是电商客服的意图分类器。只输出一个 JSON 对象，不要输出任何解释、无关文字或 Markdown 代码块。

JSON 字段：
- "intent"：字符串，取值如下
  - "order_query"：查询订单状态 / 物流 / 退款资格
  - "refund"：申请退款
  - "complaint"：投诉、表达不满
  - "faq_query"：咨询政策（退换货 / 退款时效 / 物流 / 售后规则）
  - "handoff"：明确要求转人工
  - "greeting"：打招呼、寒暄、开场白
  - 无法归入任何一类时用 "unknown"
- "slots"：对象，从输入中提取的槽位，未提取到的字段省略：
  - "order_id"：订单号
  - "product_name"：商品名称
  - "amount"：金额（数字，不要用字符串）
  - "reason"：退款 / 投诉原因
  - "contact"：联系方式
- "reply"：字符串或 null，仅 greeting 与 handoff 意图填写可直接使用的引导文案，其他意图填 null

示例：
输入：我要退订单号 ORD-2601，不想要了
输出：{"intent":"refund","slots":{"order_id":"ORD-2601","reason":"不想要了"},"reply":null}`

/** 依赖注入：默认走环境变量；测试用 fakeModel 可覆盖 */
interface ClassifierOverrides {
  model?: CreateAgentParams['model']
}

export function createIntentClassifier(overrides: ClassifierOverrides = {}) {
  return createAgent({
    /** Agent 标识：LangSmith Trace 中区分分类器与主 Agent 调用链 */
    name: 'intent_classifier',
    model:
      overrides.model ??
      process.env.CLASSIFIER_MODEL ??
      process.env.DEFAULT_MODEL ??
      'openai:gpt-5.4',
    systemPrompt: CLASSIFIER_PROMPT,
    tools: []
  })
}

/** 意图分类器单例：CLI / 端到端使用；测试用 createIntentClassifier 注入 fakeModel */
export const intentClassifier = createIntentClassifier()

/** 从模型文本中稳健地抽取并校验意图；任何失败都回退到 unknown，不抛错 */
export async function classify(
  agent: ReturnType<typeof createIntentClassifier>,
  input: string
): Promise<IntentOutput> {
  const result = await agent.invoke({
    messages: [{ role: 'user', content: input }]
  })
  const last = Array.isArray(result.messages)
    ? result.messages.at(-1)
    : undefined
  const text =
    typeof last?.content === 'string'
      ? last.content
      : JSON.stringify(last?.content)
  const parsed = extractObject(text)
  const checked = IntentSchema.safeParse(parsed)
  if (checked.success) return checked.data
  // 宽容回退：至少保留 intent，槽位不再强校验（模型偶发类型漂移时不会丢掉整个分类）
  return fallbackIntent(parsed)
}

/** 从文本中尽量取出一个 JSON 对象；失败返回 null */
function extractObject(text: string): unknown {
  // 去掉可能包裹的 Markdown 代码块
  const cleaned = text.replace(/```(?:json)?/gi, '').trim()
  if (!cleaned) return null
  try {
    return JSON.parse(cleaned)
  } catch {
    // fallthrough
  }
  const start = cleaned.indexOf('{')
  const end = cleaned.lastIndexOf('}')
  if (start >= 0 && end > start) {
    try {
      return JSON.parse(cleaned.slice(start, end + 1))
    } catch {
      return null
    }
  }
  return null
}

const VALID_INTENTS = [
  'order_query',
  'refund',
  'complaint',
  'faq_query',
  'handoff',
  'greeting',
  'unknown'
] as const

function fallbackIntent(raw: unknown): IntentOutput {
  const obj = (raw ?? {}) as { intent?: unknown }
  const intent = VALID_INTENTS.includes(
    obj.intent as (typeof VALID_INTENTS)[number]
  )
    ? (obj.intent as IntentOutput['intent'])
    : 'unknown'
  return { intent, slots: {} }
}
