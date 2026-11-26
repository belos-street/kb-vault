import type { LessonContent } from '../data/types.ts'
import { p01 } from './pilot/p01.ts'

export const contents: Record<string, Record<string, LessonContent>> = {
  pilot: {
    p01
  }
}

export function findContent(id: string): LessonContent | undefined {
  for (const lessonMap of Object.values(contents)) {
    const found = lessonMap[id]
    if (found) return found
  }
  return undefined
}
