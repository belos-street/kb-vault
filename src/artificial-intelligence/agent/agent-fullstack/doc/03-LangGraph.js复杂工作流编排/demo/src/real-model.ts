/**
 * 可选的真模型入口：读取 .env，创建一个 OpenAI 兼容的 ChatModel。
 *
 * 只有 `bun run 06:real` 会用到；默认六课完全不碰这个文件。
 * Bun 会自动加载项目根目录的 .env，不需要额外的 dotenv。
 */
import { ChatOpenAI } from '@langchain/openai'

export function createRealModel(): ChatOpenAI {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY 未设置')
  }

  const model = process.env.DEFAULT_MODEL ?? 'gpt-4o-mini'
  const baseURL = process.env.OPENAI_BASE_URL

  // DeepSeek 的思考模式要求多轮工具调用时回传 reasoning_content，
  // 而 @langchain/openai 的转换层会丢弃该字段 —— 工具循环因此 400。
  // 这里按仓库 03 项目的做法，在 DeepSeek 端点下关闭 thinking。
  const isDeepSeek =
    model.includes('deepseek') || (baseURL ?? '').includes('deepseek')

  return new ChatOpenAI({
    model,
    apiKey,
    temperature: 0,
    ...(baseURL ? { configuration: { baseURL } } : {}),
    ...(isDeepSeek ? { modelKwargs: { thinking: { type: 'disabled' } } } : {})
  })
}
