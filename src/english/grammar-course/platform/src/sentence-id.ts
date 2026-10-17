import type { Lesson } from './schema/lesson.ts'

// 课文句 domId（vocab 例句定位课文原句的互链锚点）：
// 扁平序号按段落顺序连续计数。reading.tsx 与 vocab.tsx 共用本函数——
// 两处各算一份会漂移（评审 P2-3），单源在这里。
export function sentenceDomId(lesson: Lesson, pi: number, si: number): string {
  let n = 0
  for (let p = 0; p < pi; p++) {
    n += lesson.reading.paragraphs[p]?.sentences.length ?? 0
  }
  return `sent-${n + si}`
}
