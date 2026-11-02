import { describe, expect, test } from 'bun:test'

import {
  composeStream,
  FatalProviderError,
  RetryableProviderError,
  type ChunkHandler,
  type ChunkWrapper,
  type ModelChunk,
  withModelRetry,
} from './stream-middleware'

function flakyProvider(options: {
  failuresBeforeFirstChunk?: number
  failAfterFirstChunk?: boolean
}): { handler: ChunkHandler<string>; calls: () => number } {
  let calls = 0

  const handler: ChunkHandler<string> = async function* () {
    calls += 1
    if (calls <= (options.failuresBeforeFirstChunk ?? 0)) {
      throw new RetryableProviderError(`fail-before-${calls}`)
    }

    yield { type: 'text-delta', delta: 'hello' }
    if (options.failAfterFirstChunk) {
      throw new RetryableProviderError('fail-after-first-chunk')
    }
    yield { type: 'done', finishReason: 'stop' }
  }

  return { handler, calls: () => calls }
}

async function collect(stream: AsyncGenerator<ModelChunk>): Promise<ModelChunk[]> {
  const chunks: ModelChunk[] = []
  for await (const chunk of stream) {
    chunks.push(chunk)
  }
  return chunks
}

describe('composeStream', () => {
  test('wraps in registration order, outer first', async () => {
    const events: string[] = []

    const outer: ChunkWrapper<string> = async function* (input, ctx, next) {
      events.push('outer:before')
      yield* next(input, ctx)
      events.push('outer:after')
    }

    const inner: ChunkWrapper<string> = async function* (input, ctx, next) {
      events.push('inner:before')
      yield* next(input, ctx)
      events.push('inner:after')
    }

    const core: ChunkHandler<string> = async function* () {
      events.push('core')
      yield { type: 'done', finishReason: 'stop' }
    }

    await collect(composeStream([outer, inner], core)('input', {}))
    expect(events).toEqual([
      'outer:before',
      'inner:before',
      'core',
      'inner:after',
      'outer:after',
    ])
  })
})

describe('withModelRetry', () => {
  test('retries only before first chunk', async () => {
    const provider = flakyProvider({ failuresBeforeFirstChunk: 2 })
    const stream = composeStream<string>(
      [withModelRetry<string>({ sleep: async () => {} })],
      provider.handler,
    )('input', {})

    const chunks = await collect(stream)
    expect(chunks).toEqual([
      { type: 'text-delta', delta: 'hello' },
      { type: 'done', finishReason: 'stop' },
    ])
    expect(provider.calls()).toBe(3)
  })

  test('does not retry after first chunk', async () => {
    const provider = flakyProvider({ failAfterFirstChunk: true })
    const stream = composeStream<string>(
      [withModelRetry<string>({ sleep: async () => {} })],
      provider.handler,
    )('input', {})

    const seen: ModelChunk[] = []
    await expect(
      (async () => {
        for await (const chunk of stream) {
          seen.push(chunk)
        }
      })(),
    ).rejects.toThrow('fail-after-first-chunk')

    expect(seen).toEqual([{ type: 'text-delta', delta: 'hello' }])
    expect(provider.calls()).toBe(1)
  })

  test('does not retry non-retryable errors', async () => {
    let calls = 0
    const provider: ChunkHandler<string> = async function* () {
      calls += 1
      throw new FatalProviderError('fatal')
    }

    const stream = composeStream<string>(
      [withModelRetry<string>({ sleep: async () => {} })],
      provider,
    )('input', {})

    await expect(collect(stream)).rejects.toThrow('fatal')
    expect(calls).toBe(1)
  })
})
