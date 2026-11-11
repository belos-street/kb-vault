import { callModel } from '../agents/chat.ts'
import { AppError } from '../lib/errors.ts'

function defaultTimeoutMs(): number {
  const value = Number(process.env.LLM_TIMEOUT_MS ?? '30000')
  return Number.isFinite(value) && value > 0 ? value : 30_000
}

export async function chat(input: {
  message: string
  timeoutMs?: number
}): Promise<string> {
  const controller = new AbortController()
  const timer = setTimeout(
    () => controller.abort(),
    input.timeoutMs ?? defaultTimeoutMs()
  )

  try {
    return await callModel({
      messages: [{ role: 'user', content: input.message }],
      signal: controller.signal
    })
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new AppError('upstream_timeout', 504, '模型超时')
    }

    if (
      error instanceof Error &&
      error.message.includes('missing LLM_API_KEY')
    ) {
      throw new AppError('server_misconfigured', 500, '缺少 LLM_API_KEY')
    }

    const status = (error as Error & { status?: number }).status
    if (status === 429) {
      throw new AppError('upstream_rate_limited', 429, '稍后重试')
    }
    if (typeof status === 'number') {
      throw new AppError('upstream_error', 502, '上游返回 ' + status)
    }
    throw new AppError('internal_error', 500, '服务内部错误')
  } finally {
    clearTimeout(timer)
  }
}
