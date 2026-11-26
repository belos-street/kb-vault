const STORAGE_KEY = 'lexio-v2:progress:v1'

export interface AnswerRecord {
  value: string
  correct?: boolean
}

export interface DrillRecord {
  firstTryCorrect: boolean
}

export interface LessonProgress {
  draft: string
  submitted: boolean
  answers: Record<string, AnswerRecord>
  drill: Record<string, DrillRecord>
}

interface Progress {
  lessons: Record<string, LessonProgress>
}

function emptyLesson(): LessonProgress {
  return { draft: '', submitted: false, answers: {}, drill: {} }
}

function readAll(): Progress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { lessons: {} }
    const parsed = JSON.parse(raw) as Progress
    return parsed && typeof parsed === 'object' && parsed.lessons
      ? parsed
      : { lessons: {} }
  } catch {
    return { lessons: {} }
  }
}

function writeAll(progress: Progress): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress))
  } catch {
    // 本地存储不可用时，学习流程仍然可以继续，只是不保存进度。
  }
}

export function getLessonProgress(lessonId: string): LessonProgress {
  const stored = readAll().lessons[lessonId]
  if (!stored) return emptyLesson()
  return {
    ...emptyLesson(),
    ...stored,
    drill: stored.drill ?? {}
  }
}

function updateLesson(
  lessonId: string,
  update: (lesson: LessonProgress) => LessonProgress
): LessonProgress {
  const all = readAll()
  const next = update(all.lessons[lessonId] ?? emptyLesson())
  all.lessons[lessonId] = next
  writeAll(all)
  return next
}

export function saveDraft(lessonId: string, draft: string): LessonProgress {
  return updateLesson(lessonId, (lesson) => ({ ...lesson, draft }))
}

export function markSubmitted(lessonId: string): LessonProgress {
  return updateLesson(lessonId, (lesson) => ({ ...lesson, submitted: true }))
}

export function saveAnswer(
  lessonId: string,
  exerciseId: string,
  record: AnswerRecord
): LessonProgress {
  return updateLesson(lessonId, (lesson) => ({
    ...lesson,
    answers: { ...lesson.answers, [exerciseId]: record }
  }))
}

export function saveDrillResult(
  lessonId: string,
  drillId: string,
  firstTryCorrect: boolean
): LessonProgress {
  return updateLesson(lessonId, (lesson) => ({
    ...lesson,
    drill: {
      ...lesson.drill,
      [drillId]: { firstTryCorrect }
    }
  }))
}
