import type { LedgerEntry } from '../data/types.ts'
import { addDays, todayKey } from './dates.ts'

/** 1 / 3 / 7 / 14 天；stage 指向下一次间隔 */
export const REVIEW_INTERVALS = [1, 3, 7, 14] as const
export const GRADUATED_STAGE = REVIEW_INTERVALS.length

export function initialReviewDate(from = new Date()): string {
  return addDays(todayKey(from), REVIEW_INTERVALS[0] ?? 1)
}

/** 通过一次后推进 stage；stage 到 4 即毕业，不再排期 */
export function nextReviewDate(stage: number, from = new Date()): string {
  if (stage >= GRADUATED_STAGE) return ''
  const interval = REVIEW_INTERVALS[stage] ?? 1
  return addDays(todayKey(from), interval)
}

export function isGraduated(stage: number): boolean {
  return stage >= GRADUATED_STAGE
}

export function isDue(entry: LedgerEntry, today = todayKey()): boolean {
  return entry.nextReviewAt.length > 0 && entry.nextReviewAt <= today
}
