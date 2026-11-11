import { useSyncExternalStore } from 'react'
import { contents } from '../content/index.ts'

export type ExerciseResult = 'correct' | 'wrong'

const STORAGE_KEY = 'kb-agent-fullstack-exercises-v1'
const EMPTY: Record<string, ExerciseResult> = {}

const validExerciseIds = new Set<string>()
for (const lessonMap of Object.values(contents)) {
  for (const blocks of Object.values(lessonMap)) {
    for (const block of blocks) {
      if (block.kind === 'exercise') {
        block.items.forEach((item) => validExerciseIds.add(item.id))
      }
    }
  }
}

let cached: Record<string, ExerciseResult> | null = null
const listeners = new Set<() => void>()

function sanitize(
  raw: Record<string, unknown>
): Record<string, ExerciseResult> {
  const results: Record<string, ExerciseResult> = {}
  for (const [id, value] of Object.entries(raw)) {
    if (
      validExerciseIds.has(id) &&
      (value === 'correct' || value === 'wrong')
    ) {
      results[id] = value
    }
  }
  return results
}

export function loadExerciseResults(): Record<string, ExerciseResult> {
  if (cached) return cached
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      cached = EMPTY
      return cached
    }
    const parsed: unknown = JSON.parse(raw)
    cached =
      typeof parsed === 'object' && parsed !== null
        ? sanitize(parsed as Record<string, unknown>)
        : EMPTY
    return cached
  } catch {
    cached = EMPTY
    return cached
  }
}

export function saveExerciseResults(
  results: Record<string, ExerciseResult>
): void {
  const next = sanitize(results)
  cached = next
  listeners.forEach((listener) => listener())
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    // 隐私模式下写入可能失败，自测结果仅本次会话有效
  }
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function useExerciseResults(): Record<string, ExerciseResult> {
  return useSyncExternalStore(subscribe, loadExerciseResults, () => EMPTY)
}

const REVEALED_KEY = 'kb-agent-fullstack-revealed-v1'
const EMPTY_REVEALED: Set<string> = new Set()

let revealedCache: Set<string> | null = null

export function loadRevealed(): Set<string> {
  if (revealedCache) return revealedCache
  try {
    const raw = localStorage.getItem(REVEALED_KEY)
    if (!raw) {
      revealedCache = EMPTY_REVEALED
      return revealedCache
    }
    const parsed: unknown = JSON.parse(raw)
    revealedCache = new Set(
      Array.isArray(parsed)
        ? parsed.filter(
            (id): id is string =>
              typeof id === 'string' && validExerciseIds.has(id)
          )
        : []
    )
    return revealedCache
  } catch {
    revealedCache = EMPTY_REVEALED
    return revealedCache
  }
}

export function saveRevealed(ids: Set<string>): void {
  const next = new Set([...ids].filter((id) => validExerciseIds.has(id)))
  revealedCache = next
  listeners.forEach((listener) => listener())
  try {
    localStorage.setItem(REVEALED_KEY, JSON.stringify([...next]))
  } catch {
    // 隐私模式下写入可能失败，仅本次会话有效
  }
}

export function useRevealedExercises(): Set<string> {
  return useSyncExternalStore(subscribe, loadRevealed, () => EMPTY_REVEALED)
}
