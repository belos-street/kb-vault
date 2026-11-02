// Spike：验证 wrapModelCall 的 AsyncGenerator 洋葱与零 chunk 重试。
// 该文件是设计验证代码，不是最终 core 实现。

export type ModelChunk =
  | { type: 'text-delta'; delta: string }
  | { type: 'reasoning-delta'; delta: string }
  | { type: 'tool-call-started'; toolCallId: string; name: string }
  | { type: 'tool-call'; call: { id: string; name: string; input: unknown } }
  | { type: 'usage'; usage: { inputTokens: number; outputTokens: number } }
  | { type: 'done'; finishReason: 'stop' | 'tool-calls' | 'length' | 'error' }

export interface StreamContext {
  signal?: AbortSignal
}

export type ChunkHandler<TIn> = (
  input: TIn,
  ctx: StreamContext,
) => AsyncGenerator<ModelChunk>

export type ChunkWrapper<TIn> = (
  input: TIn,
  ctx: StreamContext,
  next: ChunkHandler<TIn>,
) => AsyncGenerator<ModelChunk>

export function composeStream<TIn>(
  wrappers: ChunkWrapper<TIn>[],
  core: ChunkHandler<TIn>,
): ChunkHandler<TIn> {
  return wrappers.reduceRight<ChunkHandler<TIn>>(
    (next, wrap) => (input, ctx) => wrap(input, ctx, next),
    core,
  )
}

export class RetryableProviderError extends Error {
  override readonly name = 'RetryableProviderError'
}

export class FatalProviderError extends Error {
  override readonly name = 'FatalProviderError'
}

export interface RetryOptions {
  maxAttempts?: number
  isRetryable?: (error: unknown) => boolean
  sleep?: (attempt: number) => Promise<void>
}

export function withModelRetry<TIn>(
  options: RetryOptions = {},
): ChunkWrapper<TIn> {
  const maxAttempts = options.maxAttempts ?? 3
  // 默认只重试明确的 retryable ProviderError；Abort / fatal 一律不重试。
  const isRetryable =
    options.isRetryable ??
    ((error: unknown) => error instanceof RetryableProviderError)
  const sleep = options.sleep ?? (async () => {})

  return async function* (input, ctx, next) {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      let emitted = false
      try {
        for await (const chunk of next(input, ctx)) {
          emitted = true
          yield chunk
        }
        return
      } catch (error) {
        if (emitted || !isRetryable(error) || attempt === maxAttempts - 1) {
          throw error
        }
        await sleep(attempt)
      }
    }
    throw new Error('unreachable: retry loop exhausted')
  }
}
