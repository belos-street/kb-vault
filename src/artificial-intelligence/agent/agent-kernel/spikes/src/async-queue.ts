// Spike：工具 execute 是 Promise，但 emitOutput 需要在 await 期间把事件推给 loop。
// 用异步队列把「回调 push」转换成「async generator 消费」。
// 这里只验证条数上限（256）；64KB 字节上限与丢最旧策略在 v0.1 实现。

export class AsyncQueue<T> implements AsyncIterable<T> {
  private readonly buffer: T[] = []
  private readonly waiters: Array<(result: IteratorResult<T>) => void> = []
  private closed = false
  private dropped = 0

  constructor(private readonly maxItems = 256) {}

  get droppedCount(): number {
    return this.dropped
  }

  push(value: T): void {
    if (this.closed) return

    const waiter = this.waiters.shift()
    if (waiter !== undefined) {
      waiter({ value, done: false })
      return
    }

    if (this.buffer.length >= this.maxItems) {
      this.buffer.shift()
      this.dropped += 1
    }
    this.buffer.push(value)
  }

  close(): void {
    if (this.closed) return
    this.closed = true

    for (const waiter of this.waiters.splice(0)) {
      waiter({ value: undefined as never, done: true })
    }
  }

  async next(): Promise<IteratorResult<T>> {
    if (this.buffer.length > 0) {
      return { value: this.buffer.shift()!, done: false }
    }
    if (this.closed) {
      return { value: undefined as never, done: true }
    }
    return new Promise((resolve) => this.waiters.push(resolve))
  }

  [Symbol.asyncIterator](): AsyncIterator<T> {
    return this
  }
}
