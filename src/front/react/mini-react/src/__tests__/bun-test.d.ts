// bun:test 的最小类型声明：只声明本套件用到的 API，避免为此引入 @types/bun 依赖
declare module 'bun:test' {
  export interface Expect<T> {
    toBe(expected: T): void
    toEqual(expected: T): void
    toBeNull(): void
    toContain(expected: unknown): void
  }
  export function describe(name: string, fn: () => void): void
  export function it(name: string, fn: () => Promise<void> | void): void
  export function expect<T>(actual: T): Expect<T>
}
