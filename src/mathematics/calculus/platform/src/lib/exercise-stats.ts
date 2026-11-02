import { contents } from '../content/index.ts'
import { chapters, lessonById } from '../data/syllabus.ts'
import type { ExerciseItem } from '../data/types.ts'

export interface ExerciseEntry {
  item: ExerciseItem
  lessonId: string
  chapterId: string
  chapterLabel: string
  chapterTitle: string
  lessonNumber: string
  lessonTitle: string
}

export const exerciseEntries: ExerciseEntry[] = chapters.flatMap((chapter) =>
  Object.entries(contents[chapter.id] ?? {}).flatMap(([lessonId, blocks]) => {
    const lesson = lessonById.get(lessonId)
    if (!lesson) return []
    return blocks.flatMap((block) =>
      block.kind === 'exercise'
        ? block.items.map((item) => ({
            item,
            lessonId,
            chapterId: chapter.id,
            chapterLabel: chapter.label,
            chapterTitle: chapter.title,
            lessonNumber: lesson.number,
            lessonTitle: lesson.title
          }))
        : []
    )
  })
)

export const exerciseEntriesByChapter = new Map<string, ExerciseEntry[]>()
for (const entry of exerciseEntries) {
  const list = exerciseEntriesByChapter.get(entry.chapterId) ?? []
  list.push(entry)
  exerciseEntriesByChapter.set(entry.chapterId, list)
}
