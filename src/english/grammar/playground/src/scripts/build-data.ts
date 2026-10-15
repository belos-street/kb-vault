import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'
import { lessonsSchema } from '../schema/lesson.ts'
import { dataFile, loadLessonsFromSource } from './source.ts'

// 构建数据（T5）：扫 grammar/ 板块目录下的讲义 md → src/data/lessons.json
// 用法：bun run build-data（构建/测试前执行，md 是唯一数据源）

const { lessons, warnings } = loadLessonsFromSource()

const parsed = lessonsSchema.safeParse(lessons)
if (!parsed.success) {
  console.error('生成数据未通过 schema 校验：')
  for (const issue of parsed.error.issues) {
    console.error(`  ${issue.path.join('.')} : ${issue.message}`)
  }
  process.exit(1)
}

mkdirSync(dirname(dataFile), { recursive: true })
writeFileSync(dataFile, JSON.stringify(parsed.data, null, 2) + '\n', 'utf8')

const qCount = parsed.data.reduce((n, l) => n + l.questions.length, 0)
console.log(`生成 lessons.json：${parsed.data.length} 讲 / ${qCount} 题`)
if (warnings.length > 0) {
  console.warn(`⚠ ${warnings.length} 条解析告警：`)
  for (const w of warnings) {
    console.warn(`  [${w.lesson} ${w.question}] ${w.message}`)
  }
} else {
  console.log('解析零告警')
}
