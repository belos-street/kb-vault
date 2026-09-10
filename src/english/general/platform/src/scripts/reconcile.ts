import type { Lesson } from '../schema/lesson.ts'

/** 归一化：小写、去标点（保留字母数字与空格）、压缩空白 */
export function normalizeText(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** 提取 lesson.md 第 1 节的课文正文（blockquote 行） */
export function extractReadingBlock(lessonMd: string): string {
  const section = lessonMd.split(/^## 1\. 课文精读\s*$/m)[1] ?? ''
  const body = section.split(/^## 2\./m)[0] ?? ''
  return body
    .split('\n')
    .filter((l) => l.trim().startsWith('>'))
    .map((l) => l.replace(/^\s*>\s?/, ''))
    .join('\n')
}

/** 课文中缺失的句子（归一化包含判断） */
export function findMissingSentences(
  lesson: Lesson,
  readingBlock: string
): string[] {
  const norm = normalizeText(readingBlock)
  return lesson.reading.sentences
    .map((s) => s.en)
    .filter((en) => !norm.includes(normalizeText(en)))
}

/** 词汇表中缺失的精讲词（按表格行匹配） */
export function findMissingVocab(lesson: Lesson, lessonMd: string): string[] {
  const rows = lessonMd
    .split('\n')
    .filter((l) => l.trimStart().startsWith('|'))
    .map((l) => ` ${normalizeText(l)} `)
  return lesson.vocab.core
    .map((v) => v.word)
    .filter((w) => !rows.some((r) => r.includes(` ${w} `)))
}

export interface PracticeGroupShape {
  id: number
  subCount: number
}

/** 解析 practice.md 题目区（## 答案 之前）：组号 → 子题数（编号行与表格行均计，表头行不计） */
export function parsePracticeGroups(practiceMd: string): PracticeGroupShape[] {
  const body = practiceMd.split(/^## 答案\s*$/m)[0] ?? ''
  const lines = body.split('\n')
  const groups: PracticeGroupShape[] = []
  let current: PracticeGroupShape | null = null
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? ''
    // 题组头允许粗体与冒号之间夹注（如 **4. 翻译**（指定句型）：）
    const header = /^\*\*(\d+)\.\s*(.+?)\*\*.*?[：:]/.exec(line)
    if (header) {
      current = { id: Number(header[1]), subCount: 0 }
      groups.push(current)
      continue
    }
    if (!current) continue
    const trimmed = line.trim()
    if (trimmed.startsWith('|')) {
      // 表格分隔行不计；表头行（后随分隔行的表格行）不计
      if (/^\|[\s:|-]+\|$/.test(trimmed)) continue
      const next = lines[i + 1]?.trim() ?? ''
      if (/^\|[\s:|-]+\|$/.test(next)) continue
      current.subCount++
      continue
    }
    if (/^\d+\.\s/.test(trimmed)) current.subCount++
  }
  return groups
}

/** 题组对账：md 题组/子题数与 lesson.json 一致；单一主观题组允许 md 无子题 */
export function checkPracticeAlignment(
  groups: PracticeGroupShape[],
  lesson: Lesson
): string[] {
  const errors: string[] = []
  const mdMap = new Map(groups.map((g) => [g.id, g.subCount]))
  for (const g of lesson.practice) {
    const mdCount = mdMap.get(g.id)
    if (mdCount === undefined) {
      errors.push(`题组 ${g.id} 在 practice.md 中不存在`)
      continue
    }
    const first = g.questions[0]
    const isSingleSubjective =
      g.questions.length === 1 && first?.kind === 'subjective'
    const expected = isSingleSubjective ? 0 : g.questions.length
    if (mdCount !== expected) {
      errors.push(
        `题组 ${g.id} 子题数不一致：practice.md ${mdCount} vs lesson.json ${expected}`
      )
    }
  }
  const jsonIds = new Set(lesson.practice.map((g) => g.id))
  for (const g of groups) {
    if (!jsonIds.has(g.id)) {
      errors.push(`practice.md 题组 ${g.id} 在 lesson.json 中不存在`)
    }
  }
  return errors
}
