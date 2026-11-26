import { expect, test } from 'bun:test'
import { addDays, todayKey } from './dates.ts'

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

const { addLedgerEntry, dueLedger, listLedger, reviewLedgerEntry } =
  await import('./progress.ts')

function seedEntry() {
  mem.clear()
  return addLedgerEntry({
    lessonId: 'p01',
    mySentence: 'She open the shop.',
    targetSentence: 'She opens the shop.',
    tag: 'agreement',
    patternKey: 'third-person-s',
    tagSource: 'prefill'
  })
}

function makeDueToday() {
  const raw = JSON.parse(mem.get('lexio-v2:store:v2') ?? '{}') as {
    ledger: Array<{ nextReviewAt: string }>
  }
  const first = raw.ledger[0]
  if (first) first.nextReviewAt = todayKey()
  mem.set('lexio-v2:store:v2', JSON.stringify(raw))
}

test('新建条目第二天才到期', () => {
  const entry = seedEntry()
  expect(entry.nextReviewAt).toBe(addDays(todayKey(), 1))
  expect(entry.stage).toBe(0)
  expect(dueLedger().length).toBe(0)
})

test('到期后通过，推进到第 3 天', () => {
  const entry = seedEntry()
  makeDueToday()
  expect(dueLedger().length).toBe(1)

  reviewLedgerEntry(entry.id, true)
  const updated = listLedger()[0]
  expect(updated?.stage).toBe(1)
  expect(updated?.nextReviewAt).toBe(addDays(todayKey(), 3))
})

test('没记住则回到第 1 天', () => {
  const entry = seedEntry()
  makeDueToday()
  reviewLedgerEntry(entry.id, false)
  const updated = listLedger()[0]
  expect(updated?.stage).toBe(0)
  expect(updated?.nextReviewAt).toBe(addDays(todayKey(), 1))
})
