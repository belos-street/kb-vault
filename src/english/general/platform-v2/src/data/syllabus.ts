import type { Book, LessonMeta } from './types.ts'

const pilotLessons: LessonMeta[] = [
  {
    id: 'p01',
    number: '1.1',
    title: 'The Corner Bakery',
    tagline: '一间面包店的清晨：先听读，再写五句，最后查句型。',
    topic: 'daily-life',
    live: true
  },
  {
    id: 'p02',
    number: '1.2',
    title: 'The Night Bus',
    tagline: '末班车上的人：习惯与正在发生，怎么分开说。',
    topic: 'travel-place',
    live: false
  },
  {
    id: 'p03',
    number: '1.3',
    title: 'The Library Hold Queue',
    tagline: '一本书到你手里之前：用被动语态讲清一个流程。',
    topic: 'society-culture',
    live: false
  },
  {
    id: 'p04',
    number: '1.4',
    title: 'The Rooftop Garden',
    tagline: '楼顶的一方土：比较、数量与存在。',
    topic: 'science-nature',
    live: false
  },
  {
    id: 'p05',
    number: '1.5',
    title: 'The Walk-In Clinic',
    tagline: '一次小病：建议、可能与条件。',
    topic: 'society-culture',
    live: false
  },
  {
    id: 'p06',
    number: '1.6',
    title: 'The Sunday Market',
    tagline: '周末市场：把一次经历讲成一段过去。',
    topic: 'travel-place',
    live: false
  }
]

export const books: Book[] = [
  {
    id: 'book-01-foundation',
    title: '第一册 · 巩固篇',
    units: [
      {
        id: 'pilot',
        title: 'Unit 01 · 城市醒来 / A City Wakes Up',
        goal: '用 6 个城市片段建立「先读/听、再写、再查语法」的循环；覆盖生活、旅行、社会、科学 4 类主题。',
        lessons: pilotLessons
      }
    ]
  }
]

export const allLessons: LessonMeta[] = books.flatMap((book) =>
  book.units.flatMap((unit) => unit.lessons)
)

export const liveLessons: LessonMeta[] = allLessons.filter(
  (lesson) => lesson.live
)

export function findLesson(id: string): LessonMeta | undefined {
  return allLessons.find((lesson) => lesson.id === id)
}

export function findUnitOfLesson(id: string) {
  for (const book of books) {
    for (const unit of book.units) {
      if (unit.lessons.some((lesson) => lesson.id === id)) {
        return { book, unit }
      }
    }
  }
  return undefined
}

export function nextLesson(id: string): LessonMeta | undefined {
  const index = allLessons.findIndex((lesson) => lesson.id === id)
  if (index < 0) return undefined
  return allLessons[index + 1]
}
