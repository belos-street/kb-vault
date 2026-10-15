import { lessonsSchema } from '../schema/lesson.ts'

// 数据契约校验骨架（T4）：对构建产物 lessons.json 做 schema 校验。
// md ↔ json 对账逻辑在 T6（tests/）补充。
const path = new URL('../data/lessons.json', import.meta.url)

try {
  const raw = await Bun.file(path).json()
  const result = lessonsSchema.safeParse(raw)
  if (!result.success) {
    console.error('schema 校验失败：')
    for (const issue of result.error.issues) {
      console.error(`  ${issue.path.join('.')} : ${issue.message}`)
    }
    process.exit(1)
  }
  console.log(`schema 校验通过（${result.data.length} 讲）`)
} catch (e) {
  console.error(`无法读取 lessons.json：${e}`)
  process.exit(1)
}
