import type { Lesson, PracticeItem, QuizItem } from './schema/lesson.ts'

// 进度契约（T12，自 grammar-play progress.ts 迁移适配）：
// 判定读写、重置本轮、dataVersion 询问。消费方只依赖 ProgressStore；
// localStorage 后端是唯一持久化实现，内存实现供测试。
// 本项目题模型：practice（choice/drill/produce）+ quiz（choice/fill）。

export type VerdictMode = 'machine' | 'self'

export interface Verdict {
  ok: boolean
  mode: VerdictMode
}

export interface LessonProgress {
  verdicts: Record<string, Verdict>
  // dataVersion 失配 → 整讲判定清空并标记 stale（UI 提示「本讲内容已更新」）
  stale: boolean
}

export interface ProgressStore {
  getLesson(lessonKey: string, dataVersion: string): LessonProgress
  setVerdict(
    lessonKey: string,
    dataVersion: string,
    questionId: string,
    verdict: Verdict
  ): void
  resetLesson(lessonKey: string): void
  getLastKey(): string | undefined
  setLastKey(key: string): void
}

interface StoredLesson {
  dataVersion: string
  verdicts: Record<string, Verdict>
}

export function createMemoryStore(): ProgressStore {
  const lessons = new Map<string, StoredLesson>()
  let lastKey: string | undefined
  return {
    getLesson(lessonKey, dataVersion) {
      const entry = lessons.get(lessonKey)
      if (entry === undefined) return { verdicts: {}, stale: false }
      if (entry.dataVersion !== dataVersion) {
        lessons.delete(lessonKey) // 失配整讲清空
        return { verdicts: {}, stale: true }
      }
      return { verdicts: { ...entry.verdicts }, stale: false }
    },
    setVerdict(lessonKey, dataVersion, questionId, verdict) {
      const entry = lessons.get(lessonKey)
      if (entry === undefined || entry.dataVersion !== dataVersion) {
        lessons.set(lessonKey, {
          dataVersion,
          verdicts: { [questionId]: verdict }
        })
      } else {
        entry.verdicts[questionId] = verdict
      }
    },
    resetLesson(lessonKey) {
      lessons.delete(lessonKey)
    },
    getLastKey: () => lastKey,
    setLastKey(key) {
      lastKey = key
    }
  }
}

const LS_KEY = 'grammar-course-progress-v1'

interface StoredShape {
  v: 1
  lastKey: string | undefined
  lessons: Record<string, StoredLesson>
}

function createLocalStorageStore(): ProgressStore {
  const read = (): StoredShape => {
    try {
      const raw = localStorage.getItem(LS_KEY)
      if (raw === null) return { v: 1, lastKey: undefined, lessons: {} }
      const parsed = JSON.parse(raw) as StoredShape
      return { v: 1, lastKey: parsed.lastKey, lessons: parsed.lessons ?? {} }
    } catch {
      return { v: 1, lastKey: undefined, lessons: {} }
    }
  }
  const write = (shape: StoredShape) => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(shape))
    } catch {
      // 写失败（隐私模式等）静默降级为单会话
    }
  }
  return {
    getLesson(lessonKey, dataVersion) {
      const shape = read()
      const entry = shape.lessons[lessonKey]
      if (entry === undefined) return { verdicts: {}, stale: false }
      if (entry.dataVersion !== dataVersion) {
        delete shape.lessons[lessonKey]
        write(shape)
        return { verdicts: {}, stale: true }
      }
      return { verdicts: { ...entry.verdicts }, stale: false }
    },
    setVerdict(lessonKey, dataVersion, questionId, verdict) {
      const shape = read()
      const entry = shape.lessons[lessonKey]
      if (entry === undefined || entry.dataVersion !== dataVersion) {
        shape.lessons[lessonKey] = {
          dataVersion,
          verdicts: { [questionId]: verdict }
        }
      } else {
        entry.verdicts[questionId] = verdict
      }
      write(shape)
    },
    resetLesson(lessonKey) {
      const shape = read()
      delete shape.lessons[lessonKey]
      write(shape)
    },
    getLastKey: () => read().lastKey,
    setLastKey(key) {
      const shape = read()
      shape.lastKey = key
      write(shape)
    }
  }
}

/** localStorage 可用则持久化，不可用降级内存（单会话，退出不保存） */
export function createStore(): { store: ProgressStore; persistent: boolean } {
  try {
    const probe = '__gc_probe__'
    localStorage.setItem(probe, '1')
    localStorage.removeItem(probe)
    return { store: createLocalStorageStore(), persistent: true }
  } catch {
    return { store: createMemoryStore(), persistent: false }
  }
}

// ── 统计（目录徽标 / 汇总共用口径）──

/** 机判题 = choice / drill / fill；produce = 自判 */
export function isMachineQuestion(q: { kind: string }): boolean {
  return q.kind !== 'produce'
}

/** 一课全部题（练习 + 小测）统一视图 */
export function lessonQuestions(l: Lesson): (PracticeItem | QuizItem)[] {
  return [...l.practice, ...l.quiz]
}

export interface LessonStats {
  total: number
  judged: number
  correct: number
  machineTotal: number
  machineCorrect: number
  selfTotal: number
  selfCorrect: number
}

export function lessonStats(
  questions: { id: string; kind: string }[],
  verdicts: Record<string, Verdict>
): LessonStats {
  const stats: LessonStats = {
    total: 0,
    judged: 0,
    correct: 0,
    machineTotal: 0,
    machineCorrect: 0,
    selfTotal: 0,
    selfCorrect: 0
  }
  for (const q of questions) {
    stats.total++
    const machine = isMachineQuestion(q)
    if (machine) stats.machineTotal++
    else stats.selfTotal++
    const v = verdicts[q.id]
    if (v === undefined) continue
    stats.judged++
    if (v.ok) {
      stats.correct++
      if (machine) stats.machineCorrect++
      else stats.selfCorrect++
    }
  }
  return stats
}

/** 目录徽标：未开始 / x/y 题 / ✓ 全对（全部判定且全为 ✓） */
export function lessonBadge(stats: LessonStats): { text: string; cls: string } {
  if (stats.judged === 0) return { text: '未开始', cls: '' }
  if (stats.judged === stats.total && stats.correct === stats.total) {
    return { text: '✓ 全对', cls: 'ok' }
  }
  return { text: `${stats.judged}/${stats.total} 题`, cls: 'doing' }
}
