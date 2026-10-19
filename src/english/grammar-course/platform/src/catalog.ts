import syllabusRaw from '../../syllabus.json'
import { isLive } from './data.ts'

// 课程目录（T7，requirements F1 混合数据源）：
// syllabus.json 管 68 课全景目录；lesson.json（构建产物）管「已上线」判定。
// 未上线课 = 仅在 syllabus 中、内容未产出 → 徽标「未上线」置灰不可点。

export interface SyllabusLessonInfo {
  id: string
  title: string
  outcome: string
  points: string[]
  refs: string[]
  /** 是否已上线（有 lesson.json） */
  live: boolean
}

export interface SyllabusUnit {
  id: string
  title: string
  goal: string
  story: string
  lessons: SyllabusLessonInfo[]
  liveCount: number
}

const raw = syllabusRaw as {
  units: {
    id: string
    title: string
    goal: string
    story: string
    lessons: {
      id: string
      title: string
      outcome: string
      points: string[]
      refs: string[]
    }[]
  }[]
}

export const units: SyllabusUnit[] = raw.units.map((u) => ({
  id: u.id,
  title: u.title,
  goal: u.goal,
  story: u.story,
  lessons: u.lessons.map((l) => ({ ...l, live: isLive(l.id) })),
  liveCount: u.lessons.filter((l) => isLive(l.id)).length
}))

export const totalLessons = raw.units.reduce((n, u) => n + u.lessons.length, 0)

/** 课号 → 标题（pager 等轻量标题场景，无需拉课目全量） */
export const lessonTitles = new Map(
  raw.units.flatMap((u) => u.lessons.map((l) => [l.id, l.title] as const))
)

/** 上线课按 id 排序（上下课切换仅在已上线课间） */
export const liveIds: string[] = raw.units
  .flatMap((u) => u.lessons.map((l) => l.id))
  .filter((id) => isLive(id))
  .sort()

export function neighbors(id: string): {
  prev: string | undefined
  next: string | undefined
} {
  const i = liveIds.indexOf(id)
  return {
    prev: i > 0 ? liveIds[i - 1] : undefined,
    next: i >= 0 && i < liveIds.length - 1 ? liveIds[i + 1] : undefined
  }
}
