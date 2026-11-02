export class HookTimeoutError extends Error {
  override readonly name = 'HookTimeoutError'

  constructor(
    readonly label: string,
    readonly timeoutMs: number,
  ) {
    super(`hook timeout: ${label} (${timeoutMs}ms)`)
  }
}

export async function withTimeout<T>(
  operation: Promise<T>,
  timeoutMs: number,
  label: string,
): Promise<T> {
  if (timeoutMs <= 0) return operation

  let timer: ReturnType<typeof setTimeout> | undefined
  const timeout = new Promise<never>((_resolve, reject) => {
    timer = setTimeout(() => {
      reject(new HookTimeoutError(label, timeoutMs))
    }, timeoutMs)
  })

  try {
    return await Promise.race([operation, timeout])
  } finally {
    if (timer !== undefined) clearTimeout(timer)
  }
}

export async function* withFirstChunkTimeout<T>(
  source: AsyncGenerator<T>,
  timeoutMs: number,
  label: string,
): AsyncGenerator<T> {
  const iterator = source[Symbol.asyncIterator]()
  let first: IteratorResult<T>

  try {
    first = await withTimeout(iterator.next(), timeoutMs, label)
  } catch (error) {
    await iterator.return?.(undefined)
    throw error
  }

  if (first.done) return
  yield first.value

  while (true) {
    const next = await iterator.next()
    if (next.done) return
    yield next.value
  }
}
