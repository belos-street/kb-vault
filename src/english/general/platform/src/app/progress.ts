/**
 * 学习进度持久化（F6 简易版，localStorage）：
 * - passed：各练习模式（words / dictation / sentences）已通过的条目 key
 * - practice：练习判分记录（题 id → 判定）
 * 条目 key：单词用 word 原文，句子用 en 原文（同一 lesson 内稳定唯一）
 */

const STORAGE_KEY = 'english-platform-progress-v1'

export type Verdict = 'correct' | 'wrong'

/** 讲解 tab 输出任务的单项存档 */
export interface NoteDraft {
  draft: string
  /** 已勾选的 checklist 下标 */
  checked: number[]
}

export interface LessonProgress {
  passed: Record<string, string[]>
  practice: Record<string, Verdict>
  /** 输出任务草稿：任务下标（'output-0'）→ 草稿与勾选 */
  notes?: Record<string, NoteDraft>
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
  } catch (err) {
    console.warn('progress:load failed', err)
    return {}
  }
}

function writeAll(p: Progress): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(p))
  } catch (err) {
    console.warn('progress:save failed', err)
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
    } catch (err) {
      console.warn('progress:read-selected failed', err)
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
    } catch (err) {
      console.warn('progress:save-selected failed', err)
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
  },

  notesDraft(lessonId: string, key: string): NoteDraft {
    return this.readLesson(lessonId).notes?.[key] ?? { draft: '', checked: [] }
  },

  saveNotesDraft(lessonId: string, key: string, value: NoteDraft): void {
    const all = readAll()
    const lp = all[lessonId] ?? emptyLesson()
    lp.notes = { ...(lp.notes ?? {}), [key]: value }
    lp.updatedAt = Date.now()
    all[lessonId] = lp
    writeAll(all)
  }
}
