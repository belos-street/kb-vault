import { describe, expect, test } from 'bun:test'

import { AsyncQueue } from './async-queue'

describe('AsyncQueue', () => {
  test('drops oldest items when maxItems is exceeded', async () => {
    const queue = new AsyncQueue<number>(2)
    queue.push(1)
    queue.push(2)
    queue.push(3)

    expect(queue.droppedCount).toBe(1)
    expect(await queue.next()).toEqual({ value: 2, done: false })
    expect(await queue.next()).toEqual({ value: 3, done: false })

    queue.close()
    expect(await queue.next()).toEqual({ value: undefined as never, done: true })
  })

  test('preserves push order before close', async () => {
    const queue = new AsyncQueue<string>(3)
    queue.push('a')
    queue.push('b')
    queue.close()

    expect(await queue.next()).toEqual({ value: 'a', done: false })
    expect(await queue.next()).toEqual({ value: 'b', done: false })
    expect(await queue.next()).toEqual({ value: undefined as never, done: true })
  })
})
