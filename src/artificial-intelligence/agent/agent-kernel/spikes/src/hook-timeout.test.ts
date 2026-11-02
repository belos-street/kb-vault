import { describe, expect, test } from 'bun:test'
import { withTimeout, withFirstChunkTimeout } from './hook-timeout'

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

async function collect<T>(source: AsyncGenerator<T>): Promise<T[]> {
  const values: T[] = []
  for await (const value of source) values.push(value)
  return values
}

async function* firstThenSlow(): AsyncGenerator<number> {
  yield 1
  await sleep(30)
  yield 2
}

async function* slowFirst(): AsyncGenerator<number> {
  await sleep(30)
  yield 1
}

describe('hook timeout', () => {
  test('long stream is not cut after the first chunk', async () => {
    const values = await collect(withFirstChunkTimeout(firstThenSlow(), 5, 'model'))
    expect(values).toEqual([1, 2])
  })

  test('first chunk timeout aborts before yielding', async () => {
    await expect(
      collect(withFirstChunkTimeout(slowFirst(), 5, 'model')),
    ).rejects.toBeInstanceOf(Error)
  })
})
