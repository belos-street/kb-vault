import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Lesson } from '../schema/lesson.ts'
import { resolveDeepDiveUrl } from './deepdive-links.ts'
import { parseLesson, type ParseIssue } from './parser.ts'

// 讲义源扫描（T3/T4 共用）：build-data 落盘、validate 校验都走这里
// 单源：lessons/book-01/Uxx-单元/UxxLnn/lesson.md 唯一手写源

const here = dirname(fileURLToPath(import.meta.url))
export const lessonsRoot = join(here, '..', '..', '..', 'lessons')
export const dataFile = join(here, '..', 'data', 'lessons.json')

export interface SourceLoad {
  lessons: Lesson[]
  errors: ParseIssue[]
  warnings: ParseIssue[]
}

/** 扫 lessons/book-01/ 各单元下的 lesson.md，按课号排序 */
export function loadLessonsFromSource(): SourceLoad {
  const lessons: Lesson[] = []
  const errors: ParseIssue[] = []
  const warnings: ParseIssue[] = []
  const bookDir = join(lessonsRoot, 'book-01')
  const unitDirs = readdirSync(bookDir, { withFileTypes: true })
    .filter((e) => e.isDirectory() && e.name.startsWith('U'))
    .map((e) => e.name)
    .sort()
  for (const unit of unitDirs) {
    const lessonDirs = readdirSync(join(bookDir, unit), { withFileTypes: true })
      .filter((e) => e.isDirectory() && /^U\d{2}L\d{2}$/.test(e.name))
      .map((e) => e.name)
      .sort()
    for (const dir of lessonDirs) {
      const file = join(bookDir, unit, dir, 'lesson.md')
      let md: string
      try {
        md = readFileSync(file, 'utf8')
      } catch {
        errors.push({
          lesson: dir,
          where: 'file',
          message: `缺少 lesson.md：${file}`
        })
        continue
      }
      const result = parseLesson(md)
      // 标题行 id 与目录名一致性（格式契约 §1）
      if (result.lesson.id !== dir) {
        result.errors.push({
          lesson: dir,
          where: 'title',
          message: `标题行课号 ${result.lesson.id} ≠ 目录名 ${dir}`
        })
      }
      // 深读跳转 URL（T11）：Gnn + §小节 → 讲义静态页锚点；解析失败 = 硬错
      for (const ref of result.lesson.deepDive.refs) {
        const url = resolveDeepDiveUrl(ref.ref, ref.title)
        if (url === undefined) {
          result.errors.push({
            lesson: dir,
            where: 'deepDive',
            message: `深读 ${ref.ref} 无法解析跳转目标（讲义文件 / §小节）：${ref.title}`
          })
        } else {
          ref.url = url
        }
      }
      lessons.push(result.lesson)
      errors.push(...result.errors)
      warnings.push(...result.warnings)
    }
  }
  lessons.sort((a, b) => a.id.localeCompare(b.id))
  return { lessons, errors, warnings }
}
