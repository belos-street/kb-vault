import { beforeEach, expect, test } from 'bun:test'

const mem = new Map<string, string>()
Object.defineProperty(globalThis, 'localStorage', {
  value: {
    getItem: (key: string) => mem.get(key) ?? null,
    setItem: (key: string, value: string) => {
      mem.set(key, value)
    },
    removeItem: (key: string) => {
      mem.delete(key)
    }
  },
  configurable: true
})

const {
  addLedgerEntry,
  exportStore,
  getLessonProgress,
  listLedger,
  listReadings,
  removeLedgerEntry,
  updateLedgerEntry
} = await import('./progress.ts')

const NEW_KEY = 'lexio-v2:store:v2'
const OLD_KEY = 'lexio-v2:progress:v1'

beforeEach(() => {
  mem.clear()
})

test('v1 旧键迁移到 v5，并保留 lesson 进度', () => {
  mem.set(
    OLD_KEY,
    JSON.stringify({
      lessons: {
        p01: { draft: 'old', submitted: true, answers: {}, drill: {} }
      }
    })
  )

  const progress = getLessonProgress('p01')
  expect(progress.submitted).toBe(true)
  expect(progress.drafts).toEqual({})

  const store = JSON.parse(mem.get(NEW_KEY) ?? '{}') as {
    schemaVersion: number
  }
  expect(store.schemaVersion).toBe(5)
})

test('v2 旧 store 读取时补齐字段并写回 v5', () => {
  mem.set(
    NEW_KEY,
    JSON.stringify({
      schemaVersion: 2,
      lessons: { p01: { submitted: true } },
      readings: [],
      ledger: []
    })
  )

  const progress = getLessonProgress('p01')
  expect(progress.submitted).toBe(true)
  expect(progress.drafts).toEqual({})
  expect(progress.drill).toEqual({})

  const store = JSON.parse(mem.get(NEW_KEY) ?? '{}') as {
    schemaVersion: number
  }
  expect(store.schemaVersion).toBe(5)
})

test('非法泛读与台账条目保留在 legacy，不参与统计', () => {
  mem.set(
    NEW_KEY,
    JSON.stringify({
      schemaVersion: 5,
      lessons: {},
      readings: [{ bad: true }],
      ledger: [{ bad: true }]
    })
  )

  expect(listReadings()).toEqual([])
  expect(listLedger()).toEqual([])

  const exported = JSON.parse(exportStore()) as {
    readingsLegacy: unknown[]
    ledgerLegacy: unknown[]
  }
  expect(exported.readingsLegacy.length).toBe(1)
  expect(exported.ledgerLegacy.length).toBe(1)
})

test('台账条目可改标签与删除', () => {
  const entry = addLedgerEntry({
    lessonId: 'p01',
    mySentence: 'She open the shop.',
    targetSentence: 'She opens the shop.',
    tag: 'agreement',
    patternKey: 'third-person-s',
    tagSource: 'prefill'
  })

  expect(
    updateLedgerEntry(entry.id, { tag: 'tense', patternKey: 'verb-form' })
  ).toBe(true)
  expect(listLedger()[0]?.tag).toBe('tense')

  expect(removeLedgerEntry(entry.id)).toBe(true)
  expect(listLedger()).toEqual([])
})
