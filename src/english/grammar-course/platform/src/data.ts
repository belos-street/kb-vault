import manifestRaw from './data/course.json'
import { lessonsSchema, type Lesson } from './schema/lesson.ts'

// 运行时只读消费构建产物（构建期已过 schema + 校验，这里兜底）。
// bundle 分包（T19）：course.json 瘦清单（题 id/类型 + dataVersion）静态进包，
// 目录/徽标零等待；课目全量按单元分包（data/units/uNN.json），进课才拉本单元 chunk。

export interface QuestionMeta {
  id: string
  kind: string
}

export interface LessonMeta {
  id: string
  dataVersion: string
  questions: QuestionMeta[]
}

const manifest = manifestRaw as { lessons: LessonMeta[] }

export const lessonMetaById = new Map(manifest.lessons.map((m) => [m.id, m]))
export const liveCount = manifest.lessons.length

export function isLive(id: string): boolean {
  return lessonMetaById.has(id)
}

/** 课号 → 单元 id（U01L05 → U01） */
export function unitOfLesson(lessonId: string): string {
  return lessonId.slice(0, 3)
}

// 显式映射（9 单元）——动态 import 让打包器各切独立 chunk
const unitLoaders: Record<string, () => Promise<unknown>> = {
  U01: () => import('./data/units/u01.json'),
  U02: () => import('./data/units/u02.json'),
  U03: () => import('./data/units/u03.json'),
  U04: () => import('./data/units/u04.json'),
  U05: () => import('./data/units/u05.json'),
  U06: () => import('./data/units/u06.json'),
  U07: () => import('./data/units/u07.json'),
  U08: () => import('./data/units/u08.json'),
  U09: () => import('./data/units/u09.json')
}

const unitCache = new Map<string, Promise<Lesson[]>>()

/** 按单元懒加载课目（缓存；未上线/未知单元解析为空数组） */
export function loadUnit(unitId: string): Promise<Lesson[]> {
  const hit = unitCache.get(unitId)
  if (hit !== undefined) return hit
  const loader = unitLoaders[unitId]
  const p =
    loader === undefined
      ? Promise.resolve([] as Lesson[])
      : loader().then((m) => {
          const raw = (m as { default: unknown }).default
          return lessonsSchema.parse(raw) as Lesson[]
        })
  unitCache.set(unitId, p)
  return p
}

/** 按课号懒加载单课（经所属单元 chunk） */
export function loadLesson(lessonId: string): Promise<Lesson | undefined> {
  return loadUnit(unitOfLesson(lessonId)).then((list) =>
    list.find((l) => l.id === lessonId)
  )
}
