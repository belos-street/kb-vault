import type { Lesson } from '../schema/lesson.ts'
// 判分归一化与平台共用同一实现，避免口径漂移（T8）
import { normalizeText } from '../app/utils/text.ts'

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

/** 题组头：`**1. 判断句型**：…`（允许粗体与冒号之间夹注，如 `**4. 翻译**（指定句型）：`） */
const PRACTICE_GROUP_HEADER = /^\*\*(\d+)\.\s*(.+?)\*\*.*?[：:]/
/** 答案区题组头：`**1.**`、`**6.**（主观题 — …）` */
const ANSWER_GROUP_HEADER = /^\*\*(\d+)\./
/** 正文子题编号行：`1. 题干` */
const NUMBERED_LINE = /^(\d+)\.\s+(.*)$/
/** 选项行：`A. 选项文本`（题干下方缩进书写） */
const OPTION_LINE = /^([A-D])\.\s+(.*)$/
/** 答案区字母行：`1. A — 解析` */
const ANSWER_LETTER_LINE = /^(\d+)\.\s*([A-D])\s+[—–-]/

/** 解析 practice.md 题目区（## 答案 之前）：组号 → 子题数（编号行与表格行均计，表头行不计） */
export function parsePracticeGroups(practiceMd: string): PracticeGroupShape[] {
  const body = practiceMd.split(/^## 答案\s*$/m)[0] ?? ''
  const lines = body.split('\n')
  const groups: PracticeGroupShape[] = []
  let current: PracticeGroupShape | null = null
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? ''
    const header = PRACTICE_GROUP_HEADER.exec(line)
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

export interface MdChoiceQuestion {
  /** 题组内题号（md 编号行） */
  no: number
  stem: string
  /** 按 md 中出现顺序排列的选项文本（已去 `A.` 前缀） */
  options: string[]
  /** 答案区给出的字母；未给出为 undefined */
  answer?: string
}

/** 解析 practice.md 中指定题组的选择题区（编号行 + 缩进选项行）与答案区字母 */
export function parseMdChoices(
  practiceMd: string,
  groupId: number
): MdChoiceQuestion[] {
  const [body = '', answers = ''] = practiceMd.split(/^## 答案\s*$/m)

  const out: MdChoiceQuestion[] = []
  const byNo = new Map<number, MdChoiceQuestion>()
  let inGroup = false
  for (const line of body.split('\n')) {
    const header = PRACTICE_GROUP_HEADER.exec(line)
    if (header) {
      inGroup = Number(header[1]) === groupId
      continue
    }
    if (!inGroup) continue
    const trimmed = line.trim()
    const numbered = NUMBERED_LINE.exec(trimmed)
    if (numbered) {
      const q: MdChoiceQuestion = {
        no: Number(numbered[1]),
        stem: (numbered[2] ?? '').trim(),
        options: []
      }
      byNo.set(q.no, q)
      out.push(q)
      continue
    }
    const option = OPTION_LINE.exec(trimmed)
    const last = out[out.length - 1]
    if (option && last) last.options.push((option[2] ?? '').trim())
  }

  let inAnswerGroup = false
  for (const line of answers.split('\n')) {
    const header = ANSWER_GROUP_HEADER.exec(line)
    if (header) {
      inAnswerGroup = Number(header[1]) === groupId
      continue
    }
    if (!inAnswerGroup) continue
    const letter = ANSWER_LETTER_LINE.exec(line.trim())
    if (!letter?.[2]) continue
    const q = byNo.get(Number(letter[1]))
    if (q) q.answer = letter[2]
  }
  return out
}

const OPTION_LETTERS = 'ABCD'

/**
 * 选择题对账：题干、选项顺序与文本、答案字母三处都必须 md↔json 一致
 * （`checkPracticeAlignment` 只查题组数与子题数，内容漂移靠这里兜住）
 */
export function checkChoiceAlignment(
  practiceMd: string,
  lesson: Lesson
): string[] {
  const errors: string[] = []
  for (const group of lesson.practice) {
    if (!group.questions.some((q) => q.kind === 'choice')) continue
    const mdMap = new Map(
      parseMdChoices(practiceMd, group.id).map((q) => [q.no, q])
    )
    group.questions.forEach((q, i) => {
      if (q.kind !== 'choice') return
      const label = `题 ${group.id}-${i + 1}`
      const md = mdMap.get(i + 1)
      if (!md) {
        errors.push(`${label} 在 practice.md 中找不到对应题干`)
        return
      }
      if (md.stem !== q.stem) {
        errors.push(
          `${label} 题干不一致：practice.md「${md.stem}」vs lesson.json「${q.stem}」`
        )
      }
      if (md.options.length !== q.options.length) {
        errors.push(
          `${label} 选项数不一致：practice.md ${md.options.length} vs lesson.json ${q.options.length}`
        )
      } else {
        const at = q.options.findIndex((opt, j) => opt !== md.options[j])
        if (at >= 0) {
          errors.push(
            `${label} 选项 ${at + 1} 文本或顺序不一致：practice.md「${md.options[at]}」vs lesson.json「${q.options[at]}」`
          )
        }
      }
      const expected = OPTION_LETTERS[q.answer]
      if (md.answer === undefined) {
        errors.push(`${label} practice.md 答案区缺少该题字母`)
      } else if (md.answer !== expected) {
        errors.push(
          `${label} 答案字母不一致：practice.md ${md.answer} vs lesson.json ${expected}（answer=${q.answer}）`
        )
      }
    })
  }
  return errors
}
