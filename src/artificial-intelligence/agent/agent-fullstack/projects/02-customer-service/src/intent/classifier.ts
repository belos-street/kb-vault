/**
 * 意图分类器（2.4 意图识别与槽位填充）：withStructuredOutput(RouteSchema)
 * 一次调用完成「分类 + 抽槽 + 闲聊话术」三合一（temperature: 0）
 *
 * 设计点：
 *   - 三合一是刻意的：intent + slots + reply 同一份结构化输出，避免两跳 LLM 调用
 *   - 槽位缺失不是错误：order_id 为 null 时由调用方注入「追问」提示给 Agent，
 *     对话式补全（Slot Filling 的多轮实现）
 *   - 模型可注入（createClassifier）：测试用 fakeModel 驱动，零真钱；
 *     默认走 config.classifierModel（CLASSIFIER_MODEL 可选覆盖位，缺省同主力模型）
 *   - 防注入：用户输入特殊分隔符包裹（wrapUserInput，见 classifier-prompt.ts）
 */
import type { BaseChatModel } from '@langchain/core/language_models/chat_models'
import { HumanMessage, SystemMessage } from '@langchain/core/messages'
import { initChatModel } from 'langchain'
import { z } from 'zod'
import {
  CLASSIFIER_SYSTEM_PROMPT,
  wrapUserInput
} from '@/agent/prompts/classifier-prompt.ts'
import { config } from '@/config.ts'

/** 分类器结构化输出契约（README §意图识别与槽位填充） */
export const RouteSchema = z.object({
  intent: z.enum(['consult', 'order_ops', 'complaint', 'chit_chat']),
  // 槽位：order_ops 需要订单号；complaint 需要问题类别
  slots: z.object({
    order_id: z.string().nullable(),
    category: z.enum(['logistics', 'refund', 'account', 'other']).nullable()
  }),
  reply: z.string().nullable() // chit_chat 时的直接回复
})

export type Route = z.infer<typeof RouteSchema>

export type Classifier = (userInput: string) => Promise<Route>

/** 测试注入 fakeModel 用；生产走 classifyIntent 默认档 */
export function createClassifier(model: BaseChatModel): Classifier {
  const structured = model.withStructuredOutput<Route>(RouteSchema)
  return (userInput) =>
    structured.invoke([
      new SystemMessage(CLASSIFIER_SYSTEM_PROMPT),
      new HumanMessage(wrapUserInput(userInput))
    ])
}

let defaultClassifier: Classifier | undefined

export async function classifyIntent(userInput: string): Promise<Route> {
  if (!defaultClassifier) {
    // temperature: 0 —— 分类任务要稳定不要创意
    const model = await initChatModel(config.classifierModel, {
      temperature: 0
    })
    defaultClassifier = createClassifier(model)
  }
  return defaultClassifier(userInput)
}
