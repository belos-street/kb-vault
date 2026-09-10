import type { Lesson, Sentence } from '../../schema/lesson.ts'
import { normalizeText, stem, tokenize, usesAnyWord } from './text.ts'

/**
 * 核心句筛选（F3 听写 / F2 句子默写共用，requirements.md Q2）：
 * 关键句（keyPoints 覆盖的句子）+ 含精讲词的句子
 */
export function selectCoreSentences(lesson: Lesson): Sentence[] {
  const coreSet = new Set<string>(lesson.vocab.core.map((w) => stem(w.word)))
  return lesson.reading.sentences.filter((s) => {
    const isKey = lesson.reading.keyPoints.some((k) => {
      const frag = normalizeText(k.sentence)
      const full = normalizeText(s.en)
      return full.includes(frag) || frag.includes(full)
    })
    return isKey || usesAnyWord(s.en, coreSet)
  })
}

/** 首字母提示：每个单词保留首字符，其余以 _ 占位（保留大小写） */
export function initialHint(sentence: string): string {
  return tokenize(sentence)
    .map((t) => `${t.charAt(0)}${'_'.repeat(t.length - 1)}`)
    .join(' ')
}
