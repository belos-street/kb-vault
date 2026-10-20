import type { Lesson } from './schema/lesson.ts'

// 课文句 domId（朗读播放态跟随锚点，reading 逐句播放/连播用）：
// 扁平序号按段落顺序连续计数。当前唯一消费方是 reading.tsx，
// 保持独立单源（历史：vocab 例句互链曾共用，两处各算一份会漂移）。
export function sentenceDomId(lesson: Lesson, pi: number, si: number): string {
  let n = 0
  for (let p = 0; p < pi; p++) {
    n += lesson.reading.paragraphs[p]?.sentences.length ?? 0
  }
  return `sent-${n + si}`
}
