import { describe, expect, test } from 'bun:test'
import { createMemoryStore } from '../progress.ts'

// 进度契约（T12，requirements F7）：dataVersion 失配整讲清空 + stale 标记；
// 判定按课隔离；lastKey 记忆上次课。localStorage 后端同契约（仅差持久化）。

describe('ProgressStore 内存实现', () => {
  test('判定写入 / 读出', () => {
    const store = createMemoryStore()
    store.setVerdict('U01L01', 'v1', 'B1', { ok: true, mode: 'machine' })
    const p = store.getLesson('U01L01', 'v1')
    expect(p.stale).toBe(false)
    expect(p.verdicts['B1']).toEqual({ ok: true, mode: 'machine' })
  })

  test('dataVersion 失配 → 整讲清空 + stale 标记', () => {
    const store = createMemoryStore()
    store.setVerdict('U01L01', 'v1', 'B1', { ok: true, mode: 'machine' })
    store.setVerdict('U01L01', 'v1', 'Q1', { ok: false, mode: 'machine' })
    const p = store.getLesson('U01L01', 'v2')
    expect(p.stale).toBe(true)
    expect(p.verdicts).toEqual({})
    // 清空后回「未开始」：再读同版本也不残留旧判定
    const again = store.getLesson('U01L01', 'v2')
    expect(again.verdicts).toEqual({})
    expect(again.stale).toBe(false)
  })

  test('判定按课隔离', () => {
    const store = createMemoryStore()
    store.setVerdict('U01L01', 'v1', 'B1', { ok: true, mode: 'machine' })
    expect(store.getLesson('U01L02', 'v1').verdicts).toEqual({})
  })

  test('resetLesson 清空该课', () => {
    const store = createMemoryStore()
    store.setVerdict('U01L01', 'v1', 'B1', { ok: true, mode: 'machine' })
    store.resetLesson('U01L01')
    expect(store.getLesson('U01L01', 'v1').verdicts).toEqual({})
  })

  test('lastKey 记忆上次课', () => {
    const store = createMemoryStore()
    expect(store.getLastKey()).toBeUndefined()
    store.setLastKey('U01L03')
    expect(store.getLastKey()).toBe('U01L03')
  })
})
