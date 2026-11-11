import { lessonById } from '../data/syllabus.ts'

const STORAGE_KEY = 'kb-agent-fullstack-progress-v1'

export function loadProgress(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return new Set()
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return new Set()
    return new Set(
      parsed.filter(
        (id): id is string => typeof id === 'string' && lessonById.has(id)
      )
    )
  } catch {
    return new Set()
  }
}

export function saveProgress(done: Set<string>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...done]))
  } catch {
    // 隐私模式下写入可能失败，进度仅本次会话有效
  }
}
