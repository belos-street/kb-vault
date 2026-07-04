import { describe, expect, it } from 'bun:test'
import { InMemoryStore } from '@langchain/langgraph'

const { store } = await import('./store.ts')

describe('store', () => {
  it('应该导出一个 InMemoryStore 实例', () => {
    expect(store).toBeInstanceOf(InMemoryStore)
  })

  it('能 put 和 get 数据', async () => {
    const namespace = ['test-users']
    const key = 'user-001'
    const value = { name: '张三', lang: 'zh' }

    await store.put(namespace, key, value)
    const result = await store.get(namespace, key)

    expect(result).toBeDefined()
    expect(result?.value).toEqual(value)
    expect(result?.key).toBe(key)
  })

  it('不同 namespace 隔离数据', async () => {
    await store.put(['ns-a'], 'shared-key', { data: 'A' })
    await store.put(['ns-b'], 'shared-key', { data: 'B' })

    const resultA = await store.get(['ns-a'], 'shared-key')
    const resultB = await store.get(['ns-b'], 'shared-key')

    expect(resultA?.value).toEqual({ data: 'A' })
    expect(resultB?.value).toEqual({ data: 'B' })
  })

  it('不存在的 key 返回 null', async () => {
    const result = await store.get(['non-existent'], 'no-key')
    expect(result).toBeNull()
  })

  it('能更新已有数据', async () => {
    const ns = ['update-test']
    await store.put(ns, 'key', { count: 1 })
    await store.put(ns, 'key', { count: 2 })

    const result = await store.get(ns, 'key')
    expect(result?.value).toEqual({ count: 2 })
  })
})
