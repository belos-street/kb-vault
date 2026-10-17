import raw from './data/lessons.json'
import { lessonsSchema, type Lesson } from './schema/lesson.ts'

// 运行时只读消费构建产物（构建期已过 schema + 校验，这里兜底）
export const lessons: Lesson[] = lessonsSchema.parse(raw)

export const byKey = new Map(lessons.map((l) => [l.id, l]))
