import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { lessonsSchema } from '../schema/lesson.ts'
import { dataFile, loadLessonsFromSource } from './source.ts'

// 构建数据（T3）：扫 lessons/book-01/**/lesson.md → src/data/lessons.json
// 单源管线：产物由 md 确定性生成，不手写、不审校。
// bundle 分包（T19）：lessons.json 是工具链 canonical（validate/scan-vocab 消费）；
// 平台端走 course.json 瘦清单（静态进包）+ units/uNN.json 按单元分包（动态 import）。

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

// 瘦清单：目录/徽标同步消费（题 id/类型 + dataVersion），不含题面/课文
writeFileSync(
  join(dirname(dataFile), 'course.json'),
  JSON.stringify(
    {
      lessons: parsed.data.map((l) => ({
        id: l.id,
        dataVersion: l.dataVersion,
        questions: [...l.practice, ...l.quiz].map((q) => ({
          id: q.id,
          kind: q.kind
        }))
      }))
    },
    null,
    2
  ) + '\n',
  'utf8'
)

// 单元分包：课号前缀 U01..U09 各一文件，平台按需动态 import
const unitsDir = join(dirname(dataFile), 'units')
mkdirSync(unitsDir, { recursive: true })
const byUnit = new Map<string, typeof parsed.data>()
for (const l of parsed.data) {
  const unitId = l.id.slice(0, 3)
  const list = byUnit.get(unitId)
  if (list === undefined) byUnit.set(unitId, [l])
  else list.push(l)
}
for (const [unitId, list] of byUnit) {
  writeFileSync(
    join(unitsDir, `${unitId.toLowerCase()}.json`),
    JSON.stringify(list, null, 2) + '\n',
    'utf8'
  )
}

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
