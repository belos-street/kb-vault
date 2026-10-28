/**
 * 统一创建聊天模型。
 *
 * DeepSeek 的思考模式要求多轮工具调用时回传上一轮的 reasoning_content，
 * 而 @langchain/openai 的 completions 转换层会丢弃该字段 —— 工具循环因此 400。
 * 在 DeepSeek 端点下关闭 thinking，保证 ReAct / Supervisor 的多轮工具调用可用。
 */
import { initChatModel } from 'langchain'

export interface ChatModelOptions {
  temperature?: number
}

export function createChatModel(model: string, options: ChatModelOptions = {}) {
  const isDeepSeek =
    model.includes('deepseek') ||
    (process.env.OPENAI_BASE_URL ?? '').includes('deepseek')
  return initChatModel(model, {
    ...(isDeepSeek ? { modelKwargs: { thinking: { type: 'disabled' } } } : {}),
    ...(options.temperature !== undefined
      ? { temperature: options.temperature }
      : {})
  })
}
