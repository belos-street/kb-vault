import type { LedgerEntry } from '../data/types.ts'
import { exportStore, importStore, todayKey } from './progress.ts'

/**
 * 仅开发用：造三条今天到期的台账，覆盖 stage 0 / 1 / 3。
 * 通过 export → append → import 走正式的校验路径，不绕过存储层。
 */
export function seedDueEntries(): boolean {
  const store = JSON.parse(exportStore()) as {
    ledger?: LedgerEntry[]
  } & Record<string, unknown>
  const today = todayKey()
  const now = new Date().toISOString()
  const seeds: LedgerEntry[] = [
    {
      id: `seed-${today}-0`,
      createdAt: now,
      lessonId: 'p01',
      mySentence: 'She open the shop before six.',
      targetSentence: 'She opens the shop before six.',
      tag: 'agreement',
      patternKey: 'third-person-s',
      tagSource: 'prefill',
      stage: 0,
      nextReviewAt: today
    },
    {
      id: `seed-${today}-1`,
      createdAt: now,
      lessonId: 'p01',
      mySentence: 'He is a engineer.',
      targetSentence: 'He is an engineer.',
      tag: 'article',
      patternKey: 'article-omission',
      tagSource: 'prefill',
      stage: 1,
      nextReviewAt: today
    },
    {
      id: `seed-${today}-2`,
      createdAt: now,
      lessonId: 'p01',
      mySentence: 'I go to the bakary every morning.',
      targetSentence: 'I go to the bakery every morning.',
      tag: 'spelling',
      patternKey: 'spelling',
      tagSource: 'prefill',
      stage: 3,
      nextReviewAt: today
    }
  ]
  store.ledger = [
    ...(Array.isArray(store.ledger) ? store.ledger : []),
    ...seeds
  ]
  return importStore(JSON.stringify(store)).ok
}
