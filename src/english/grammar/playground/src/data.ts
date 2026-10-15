import raw from './data/lessons.json'
import { lessonsSchema, type Lesson } from './schema/lesson.ts'

// 运行时只读消费构建产物（构建期已过 schema + 对账，这里再兜一次底）
export const lessons: Lesson[] = lessonsSchema.parse(raw)

export const byKey = new Map(lessons.map((l) => [l.key, l]))

export const boards: { board: string; lessons: Lesson[] }[] = (() => {
  const seen: { board: string; lessons: Lesson[] }[] = []
  for (const l of lessons) {
    const last = seen[seen.length - 1]
    if (last !== undefined && last.board === l.board) {
      last.lessons.push(l)
    } else {
      seen.push({ board: l.board, lessons: [l] })
    }
  }
  return seen
})()

/** 「详见 L23」式引用 → 目标讲 key（同板块优先，否则全局首个） */
export function resolveRef(number: string, from: Lesson): string | undefined {
  const sameBoard = lessons.find(
    (l) => l.board === from.board && l.number === number
  )
  return (sameBoard ?? lessons.find((l) => l.number === number))?.key
}

export function neighbors(lesson: Lesson): {
  prev: Lesson | undefined
  next: Lesson | undefined
} {
  const i = lessons.findIndex((l) => l.key === lesson.key)
  return {
    prev: i > 0 ? lessons[i - 1] : undefined,
    next: i < lessons.length - 1 ? lessons[i + 1] : undefined
  }
}
