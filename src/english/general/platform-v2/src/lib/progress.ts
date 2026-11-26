import type { LedgerEntry, ReadingDraft, ReadingEntry } from '../data/types.ts'
import { ledgerEntrySchema, readingEntrySchema } from '../schema/content.ts'
import { todayKey } from './dates.ts'
import { initialReviewDate, isDue, nextReviewDate } from './review.ts'

export { todayKey } from './dates.ts'

const STORAGE_KEY = 'lexio-v2:store:v2'
const LEGACY_KEY = 'lexio-v2:progress:v1'
export const SCHEMA_VERSION = 5

export interface AnswerRecord {
  value: string
  correct?: boolean
}

export interface DrillRecord {
  firstTryCorrect: boolean
}

export interface LessonProgress {
  /** 旧版单任务草稿，只读保留，不再写入 */
  draft: string
  /** 按 output task id 存草稿，一讲可以有多个输出任务 */
  drafts: Record<string, string>
  submitted: boolean
  submittedTasks: Record<string, boolean>
  answers: Record<string, AnswerRecord>
  drill: Record<string, DrillRecord>
}

export interface Store {
  schemaVersion: number
  lessons: Record<string, LessonProgress>
  readings: ReadingEntry[]
  ledger: LedgerEntry[]
  /** 迁移时未通过校验的旧记录：不参与计算，但保留并进导出 */
  readingsLegacy: unknown[]
  ledgerLegacy: unknown[]
}

function emptyLesson(): LessonProgress {
  return {
    draft: '',
    drafts: {},
    submitted: false,
    submittedTasks: {},
    answers: {},
    drill: {}
  }
}

function emptyStore(): Store {
  return {
    schemaVersion: SCHEMA_VERSION,
    lessons: {},
    readings: [],
    ledger: [],
    readingsLegacy: [],
    ledgerLegacy: []
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function readStore(): Store {
  let raw: string | null = null
  try {
    raw = localStorage.getItem(STORAGE_KEY)
  } catch {
    return emptyStore()
  }
  if (raw) {
    try {
      const parsed: unknown = JSON.parse(raw)
      if (isRecord(parsed) && isRecord(parsed.lessons)) {
        const rawReadings = Array.isArray(parsed.readings)
          ? parsed.readings
          : []
        const readings: ReadingEntry[] = []
        const dropped: unknown[] = []
        for (const entry of rawReadings) {
          if (readingEntrySchema.safeParse(entry).success) {
            readings.push(entry as ReadingEntry)
          } else {
            dropped.push(entry)
          }
        }
        const previousLegacy = Array.isArray(parsed.readingsLegacy)
          ? parsed.readingsLegacy
          : []
        const rawLedger = Array.isArray(parsed.ledger) ? parsed.ledger : []
        const ledger: LedgerEntry[] = []
        const droppedLedger: unknown[] = []
        for (const entry of rawLedger) {
          if (ledgerEntrySchema.safeParse(entry).success) {
            ledger.push(entry as LedgerEntry)
          } else {
            droppedLedger.push(entry)
          }
        }
        const previousLedgerLegacy = Array.isArray(parsed.ledgerLegacy)
          ? parsed.ledgerLegacy
          : []
        return {
          schemaVersion:
            typeof parsed.schemaVersion === 'number'
              ? parsed.schemaVersion
              : SCHEMA_VERSION,
          lessons: parsed.lessons as Record<string, LessonProgress>,
          readings,
          ledger,
          readingsLegacy: [...previousLegacy, ...dropped],
          ledgerLegacy: [...previousLedgerLegacy, ...droppedLedger]
        }
      }
    } catch {
      // 解析失败按空仓处理，下面还会尝试旧键迁移。
    }
  }
  return migrateLegacy()
}

function migrateLegacy(): Store {
  try {
    const raw = localStorage.getItem(LEGACY_KEY)
    if (!raw) return emptyStore()
    const parsed: unknown = JSON.parse(raw)
    if (!isRecord(parsed) || !isRecord(parsed.lessons)) return emptyStore()
    const store: Store = {
      schemaVersion: SCHEMA_VERSION,
      lessons: parsed.lessons as Record<string, LessonProgress>,
      readings: [],
      ledger: [],
      readingsLegacy: [],
      ledgerLegacy: []
    }
    writeStore(store)
    return store
  } catch {
    return emptyStore()
  }
}

/** 写入失败返回 false，由界面提示；不静默吞掉整个流程 */
function writeStore(store: Store): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
    return true
  } catch {
    return false
  }
}

export function storageAvailable(): boolean {
  try {
    const probe = `${STORAGE_KEY}:probe`
    localStorage.setItem(probe, '1')
    localStorage.removeItem(probe)
    return true
  } catch {
    return false
  }
}

export function getLessonProgress(lessonId: string): LessonProgress {
  const stored = readStore().lessons[lessonId]
  if (!stored) return emptyLesson()
  return {
    ...emptyLesson(),
    ...stored,
    drafts: stored.drafts ?? {},
    submittedTasks: stored.submittedTasks ?? {},
    drill: stored.drill ?? {}
  }
}

function updateLesson(
  lessonId: string,
  update: (lesson: LessonProgress) => LessonProgress
): LessonProgress {
  const store = readStore()
  const next = update(store.lessons[lessonId] ?? emptyLesson())
  store.lessons[lessonId] = next
  writeStore(store)
  return next
}

export function getDraft(lessonId: string, taskId: string): string {
  return getLessonProgress(lessonId).drafts[taskId] ?? ''
}

export function saveDraft(
  lessonId: string,
  taskId: string,
  draft: string
): void {
  updateLesson(lessonId, (lesson) => ({
    ...lesson,
    drafts: { ...lesson.drafts, [taskId]: draft }
  }))
}

export function isTaskSubmitted(lessonId: string, taskId: string): boolean {
  return getLessonProgress(lessonId).submittedTasks[taskId] === true
}

export function markSubmitted(lessonId: string, taskId: string): void {
  updateLesson(lessonId, (lesson) => ({
    ...lesson,
    submitted: true,
    submittedTasks: { ...lesson.submittedTasks, [taskId]: true }
  }))
}

export function saveAnswer(
  lessonId: string,
  exerciseId: string,
  record: AnswerRecord
): void {
  updateLesson(lessonId, (lesson) => ({
    ...lesson,
    answers: { ...lesson.answers, [exerciseId]: record }
  }))
}

export function getDrillRecord(
  lessonId: string,
  drillId: string
): DrillRecord | undefined {
  return getLessonProgress(lessonId).drill[drillId]
}

/**
 * 首错只记一次：已有记录不再覆盖，避免重练把 false 刷成 true。
 */
export function recordDrillResult(
  lessonId: string,
  drillId: string,
  firstTryCorrect: boolean
): DrillRecord {
  const existing = getDrillRecord(lessonId, drillId)
  if (existing) return existing
  const record: DrillRecord = { firstTryCorrect }
  updateLesson(lessonId, (lesson) => ({
    ...lesson,
    drill: { ...lesson.drill, [drillId]: record }
  }))
  return record
}

function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `r-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export function listReadings(): ReadingEntry[] {
  return [...readStore().readings].sort((a, b) =>
    a.date === b.date ? b.id.localeCompare(a.id) : b.date.localeCompare(a.date)
  )
}

export function readingsOn(date: string): ReadingEntry[] {
  return listReadings().filter((entry) => entry.date === date)
}

export function addReading(draft: ReadingDraft): ReadingEntry {
  const entry: ReadingEntry = { ...draft, id: newId(), date: todayKey() }
  const store = readStore()
  store.readings = [...store.readings, entry]
  writeStore(store)
  return entry
}

export function removeReading(id: string): void {
  const store = readStore()
  store.readings = store.readings.filter((entry) => entry.id !== id)
  writeStore(store)
}

export function dailyReadingWords(date = todayKey()): number {
  return readingsOn(date).reduce((total, entry) => total + entry.words, 0)
}

/** 最近 N 天（含今天）的泛读词数，用来按周结算 */
export function recentReadingWords(days: number): number {
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - (days - 1))
  const from = todayKey(cutoff)
  return readStore()
    .readings.filter((entry) => entry.date >= from)
    .reduce((total, entry) => total + entry.words, 0)
}

export function exportStore(): string {
  return JSON.stringify(readStore(), null, 2)
}

export function importStore(
  raw: string
): { ok: true; count: number } | { ok: false; message: string } {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return { ok: false, message: '不是合法的 JSON' }
  }
  if (!isRecord(parsed) || !isRecord(parsed.lessons)) {
    return { ok: false, message: '缺少 lessons 字段' }
  }
  const rawReadings = Array.isArray(parsed.readings) ? parsed.readings : []
  const readings: ReadingEntry[] = []
  const dropped: unknown[] = []
  for (const entry of rawReadings) {
    if (readingEntrySchema.safeParse(entry).success) {
      readings.push(entry as ReadingEntry)
    } else {
      dropped.push(entry)
    }
  }
  const previousLegacy = Array.isArray(parsed.readingsLegacy)
    ? parsed.readingsLegacy
    : []
  const rawLedger = Array.isArray(parsed.ledger) ? parsed.ledger : []
  const ledger: LedgerEntry[] = []
  const droppedLedger: unknown[] = []
  for (const entry of rawLedger) {
    if (ledgerEntrySchema.safeParse(entry).success) {
      ledger.push(entry as LedgerEntry)
    } else {
      droppedLedger.push(entry)
    }
  }
  const previousLedgerLegacy = Array.isArray(parsed.ledgerLegacy)
    ? parsed.ledgerLegacy
    : []
  const store: Store = {
    schemaVersion: SCHEMA_VERSION,
    lessons: parsed.lessons as Record<string, LessonProgress>,
    readings,
    ledger,
    readingsLegacy: [...previousLegacy, ...dropped],
    ledgerLegacy: [...previousLedgerLegacy, ...droppedLedger]
  }
  if (!writeStore(store)) {
    return { ok: false, message: '写入本地存储失败' }
  }
  return { ok: true, count: Object.keys(store.lessons).length }
}

export function submittedLessonCount(): number {
  return Object.values(readStore().lessons).filter((lesson) => lesson.submitted)
    .length
}

/** 旧格式记录条数：不参与统计，只提醒不要清缓存 */
export function legacyReadingCount(): number {
  return readStore().readingsLegacy.length
}

export interface LedgerInput {
  lessonId: string
  mySentence: string
  targetSentence: string
  tag: LedgerEntry['tag']
  patternKey: string
  tagSource: LedgerEntry['tagSource']
}

export function listLedger(): LedgerEntry[] {
  return readStore().ledger
}

export function addLedgerEntry(input: LedgerInput): LedgerEntry {
  const store = readStore()
  const existing = store.ledger.find(
    (entry) =>
      entry.lessonId === input.lessonId &&
      entry.mySentence === input.mySentence &&
      entry.targetSentence === input.targetSentence
  )
  if (existing) return existing
  const entry: LedgerEntry = {
    ...input,
    id: newId(),
    createdAt: new Date().toISOString(),
    stage: 0,
    nextReviewAt: initialReviewDate()
  }
  store.ledger = [...store.ledger, entry]
  writeStore(store)
  return entry
}

export function dueLedger(today = todayKey()): LedgerEntry[] {
  return listLedger()
    .filter((entry) => isDue(entry, today))
    .sort((left, right) => left.nextReviewAt.localeCompare(right.nextReviewAt))
}

export function reviewLedgerEntry(id: string, passed: boolean): void {
  const store = readStore()
  store.ledger = store.ledger.map((entry) => {
    if (entry.id !== id) return entry
    if (!passed) {
      return { ...entry, stage: 0, nextReviewAt: initialReviewDate() }
    }
    const stage = entry.stage + 1
    return { ...entry, stage, nextReviewAt: nextReviewDate(stage) }
  })
  writeStore(store)
}

/** 最近 N 天各 patternKey 的出现次数；复现率没有读数时用它看趋势 */
export function ledgerPatternCounts(
  days: number
): Array<{ patternKey: string; count: number }> {
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - (days - 1))
  const from = todayKey(cutoff)
  const counts = new Map<string, number>()
  for (const entry of listLedger()) {
    if (entry.createdAt.slice(0, 10) < from) continue
    counts.set(entry.patternKey, (counts.get(entry.patternKey) ?? 0) + 1)
  }
  return [...counts.entries()]
    .map(([patternKey, count]) => ({ patternKey, count }))
    .sort((left, right) => right.count - left.count)
}
