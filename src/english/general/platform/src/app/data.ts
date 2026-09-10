import { lessonSchema, type Lesson } from '../schema/lesson.ts'

// 自动发现全部课程数据：book-01-foundation/<单元>/<讲目录>/lesson.json
// 新增讲次只需按 skill 生成 lesson.json，无需改代码（F5 课程导航数据源）
const modules = import.meta.glob(
  '../../../book-01-foundation/*/*/lesson.json',
  { eager: true }
)

export interface LessonEntry {
  book: string
  unit: string
  id: string
  title: string
  lesson: Lesson
}

function collect(): LessonEntry[] {
  const out: LessonEntry[] = []
  for (const [path, data] of Object.entries(modules)) {
    const parsed = lessonSchema.safeParse(data)
    if (!parsed.success) {
      console.warn(`[platform] lesson.json 校验失败，已跳过：${path}`)
      continue
    }
    const l = parsed.data
    out.push({
      book: l.book,
      unit: l.unit,
      id: l.id,
      title: l.title,
      lesson: l
    })
  }
  return out.sort(
    (a, b) =>
      a.book.localeCompare(b.book) ||
      a.unit.localeCompare(b.unit) ||
      a.id.localeCompare(b.id)
  )
}

export const lessonEntries: LessonEntry[] = collect()

export interface UnitNode {
  unit: string
  lessons: LessonEntry[]
}

export interface BookNode {
  book: string
  units: UnitNode[]
}

/** 分组为 册 → 单元 → 讲 的课程树 */
export function buildCourseTree(entries: LessonEntry[]): BookNode[] {
  const books = new Map<string, Map<string, LessonEntry[]>>()
  for (const e of entries) {
    const units = books.get(e.book) ?? new Map<string, LessonEntry[]>()
    const list = units.get(e.unit) ?? []
    list.push(e)
    units.set(e.unit, list)
    books.set(e.book, units)
  }
  return [...books.entries()].map(([book, units]) => ({
    book,
    units: [...units.entries()].map(([unit, lessons]) => ({ unit, lessons }))
  }))
}

/** 展示用：book-01-foundation → 第一册 */
export function bookLabel(book: string): string {
  const m = /^book-(\d+)-/.exec(book)
  return m ? `第${Number(m[1])}册` : book
}

/** 展示用：01-句子工程 → 句子工程 */
export function unitLabel(unit: string): string {
  return unit.replace(/^\d+-/, '')
}
