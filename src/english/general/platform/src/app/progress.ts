/**
 * 学习进度持久化（F6 简易版，localStorage）：
 * - passed：各练习模式（words / dictation / sentences）已通过的条目 key
 * - practice：练习判分记录（题 id → 判定）
 * 条目 key：单词用 word 原文，句子用 en 原文（同一 lesson 内稳定唯一）
 */

const STORAGE_KEY = 'english-platform-progress-v1'

export type Verdict = 'correct' | 'wrong'

export interface LessonProgress {
  passed: Record<string, string[]>
  practice: Record<string, Verdict>
  updatedAt: number
}

export type Progress = Record<string, LessonProgress>

export const PROGRESS_MODES = {
  words: 'words',
  dictation: 'dictation',
  sentences: 'sentences'
} as const

function readAll(): Progress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw === null ? {} : (JSON.parse(raw) as Progress)
  } catch {
    return {}
  }
}

function writeAll(p: Progress): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(p))
  } catch {
    // 存储不可用（隐私模式等）时静默降级为不持久化
  }
}

function emptyLesson(): LessonProgress {
  return { passed: {}, practice: {}, updatedAt: 0 }
}

export const progressStore = {
  readLesson(lessonId: string): LessonProgress {
    return readAll()[lessonId] ?? emptyLesson()
  },

  /** 上次学习的讲 id（课程导航默认选中项） */
  getSelectedId(): string {
    try {
      const raw = JSON.parse(
        localStorage.getItem(STORAGE_KEY) ?? '{}'
      ) as Record<string, unknown>
      return typeof raw.selectedId === 'string' ? raw.selectedId : ''
    } catch {
      return ''
    }
  },

  setSelectedId(id: string): void {
    try {
      const raw = JSON.parse(
        localStorage.getItem(STORAGE_KEY) ?? '{}'
      ) as Record<string, unknown>
      raw.selectedId = id
      localStorage.setItem(STORAGE_KEY, JSON.stringify(raw))
    } catch {
      // 存储不可用时静默降级
    }
  },

  passedSet(lessonId: string, mode: string): Set<string> {
    return new Set(this.readLesson(lessonId).passed[mode] ?? [])
  },

  markPassed(lessonId: string, mode: string, key: string): void {
    const all = readAll()
    const lp = all[lessonId] ?? emptyLesson()
    const list = lp.passed[mode] ?? []
    if (!list.includes(key)) list.push(key)
    lp.passed[mode] = list
    lp.updatedAt = Date.now()
    all[lessonId] = lp
    writeAll(all)
  },

  practiceVerdicts(lessonId: string): Record<string, Verdict> {
    return this.readLesson(lessonId).practice
  },

  savePractice(lessonId: string, verdicts: Record<string, Verdict>): void {
    const all = readAll()
    const lp = all[lessonId] ?? emptyLesson()
    lp.practice = verdicts
    lp.updatedAt = Date.now()
    all[lessonId] = lp
    writeAll(all)
  },

  clearPractice(lessonId: string): void {
    const all = readAll()
    const lp = all[lessonId] ?? emptyLesson()
    lp.practice = {}
    lp.updatedAt = Date.now()
    all[lessonId] = lp
    writeAll(all)
  }
}
