/**
 * 上下文压缩（第 5 步）。
 *
 * 作用
 * - 估算当前 messages 的 token；超过阈值时把较早的对话压成一条摘要。
 * - 摘要通过注入的 summarize 生成，本文件不直接依赖模型客户端。
 *
 * 最关键的一条
 * - 必须按"组"裁剪：assistant(tool_calls) 和它对应的 tool 消息同进同出。
 *   从中间切，下一次请求会因为没有配对的 tool 消息而 400。
 *
 * 约定
 * - 压缩只影响"发给模型的请求视图"，不要直接改写 ThreadState.messages；
 *   磁盘上的完整历史要保留，否则没法审计和恢复。
 */
import type { ChatMessage } from './model'

/** 摘要用的系统提示；与客服业务无关，所以留在 agent 层。 */
export const COMPACT_SYSTEM_PROMPT = `你是对话摘要器。把给定的历史对话压缩成一段事实摘要。

必须保留
- 用户身份与诉求
- 订单号、金额、商品名
- 已确认的约束
- 尚未完成的待办

不要保留
- 寒暄、重复确认、工具调用的原始 JSON

只输出摘要正文，不要加标题或解释。`

export interface CompactInput {
  messages: ChatMessage[]
  /** 估算 token 超过该值时触发压缩 */
  triggerTokens: number
  /** 压缩后保留最近多少条消息 */
  keepMessages: number
  /** 摘要器：由调用方传入，测试里可以换成假实现 */
  summarize: (messages: ChatMessage[]) => Promise<string>
}

export interface CompactResult {
  /** 压缩后的请求视图；未触发压缩时原样返回 */
  messages: ChatMessage[]
  /** 被折叠进摘要的消息条数；0 表示没触发 */
  droppedMessages: number
}

/** 粗略估算 token：中文约 1 字 1 token，英文约 4 字符 1 token。 */
export function estimateTokens(_messages: ChatMessage[]): number {
  throw new Error('TODO 第 5 步：实现 token 估算')
}

/**
 * 按组裁剪 + 摘要。
 * 步骤提示：先找触发点 → 向前对齐到消息组边界 → 保留 system 与最近 N 条 →
 * 把中间部分交给 summarize → 拼成 [system, 摘要, ...保留部分]。
 */
export async function compactMessages(
  _input: CompactInput
): Promise<CompactResult> {
  throw new Error('TODO 第 5 步：按组裁剪并生成摘要')
}
