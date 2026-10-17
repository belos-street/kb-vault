import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'
import { lessonsSchema } from '../schema/lesson.ts'
import { dataFile, loadLessonsFromSource } from './source.ts'

// 构建数据（T3）：扫 lessons/book-01/**/lesson.md → src/data/lessons.json
// 单源管线：产物由 md 确定性生成，不手写、不审校。

const { lessons, errors, warnings } = loadLessonsFromSource()

// 硬失败（解析/结构错误）→ 构建红
if (errors.length > 0) {
  console.error(`✖ ${errors.length} 条解析错误（构建红）：`)
  for (const e of errors) {
    console.error(`  [${e.lesson} ${e.where}] ${e.message}`)
  }
  process.exit(1)
}

const parsed = lessonsSchema.safeParse(lessons)
if (!parsed.success) {
  console.error('✖ 生成数据未过 schema 校验：')
  for (const issue of parsed.error.issues) {
    console.error(`  ${issue.path.join('.')} : ${issue.message}`)
  }
  process.exit(1)
}

mkdirSync(dirname(dataFile), { recursive: true })
writeFileSync(dataFile, JSON.stringify(parsed.data, null, 2) + '\n', 'utf8')

const qCount = parsed.data.reduce(
  (n, l) => n + l.practice.length + l.quiz.length,
  0
)
console.log(`✓ lessons.json：${parsed.data.length} 课 / ${qCount} 题`)
if (warnings.length > 0) {
  console.warn(`⚠ ${warnings.length} 条告警：`)
  for (const w of warnings) {
    console.warn(`  [${w.lesson} ${w.where}] ${w.message}`)
  }
}
