import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { lessonSchema, type Lesson } from '../schema/lesson.ts'
import {
  checkPracticeAlignment,
  extractReadingBlock,
  findMissingSentences,
  findMissingVocab,
  parsePracticeGroups
} from './reconcile.ts'

const bookRoot = join(import.meta.dir, '../../../book-01-foundation')

interface LessonPaths {
  lessonDir: string
  id: string
}

function discoverLessons(): LessonPaths[] {
  const out: LessonPaths[] = []
  for (const unit of readdirSync(bookRoot, { withFileTypes: true })) {
    if (!unit.isDirectory() || !/^\d{2}-/.test(unit.name)) continue
    const unitDir = join(bookRoot, unit.name)
    for (const dir of readdirSync(unitDir, { withFileTypes: true })) {
      if (!dir.isDirectory() || !/^L\d{2}-/.test(dir.name)) continue
      out.push({ lessonDir: join(unitDir, dir.name), id: dir.name.slice(0, 3) })
    }
  }
  return out.sort((a, b) => a.id.localeCompare(b.id))
}

function validateLesson({ lessonDir, id }: LessonPaths): {
  ok: boolean
  skipped: boolean
  message: string
} {
  const jsonPath = join(lessonDir, 'lesson.json')
  if (!existsSync(jsonPath)) {
    return { ok: true, skipped: true, message: `${id} ⏭ 无 lesson.json，跳过` }
  }

  let raw: unknown
  try {
    raw = JSON.parse(readFileSync(jsonPath, 'utf8'))
  } catch (err) {
    return {
      ok: false,
      skipped: false,
      message: `${id} ❌ lesson.json 解析失败（${jsonPath}）：${String(err)}`
    }
  }
  const parsed = lessonSchema.safeParse(raw)
  if (!parsed.success) {
    const details = parsed.error.issues
      .slice(0, 5)
      .map((i) => `${i.path.join('.')}: ${i.message}`)
      .join('；')
    return {
      ok: false,
      skipped: false,
      message: `${id} ❌ schema 校验失败：${details}`
    }
  }
  const lesson: Lesson = parsed.data

  const problems: string[] = []
  const lessonPath = join(lessonDir, 'lesson.md')
  const practicePath = join(lessonDir, 'practice.md')
  if (!existsSync(lessonPath)) problems.push('缺少 lesson.md')
  if (!existsSync(practicePath)) problems.push('缺少 practice.md')
  if (problems.length > 0) {
    return {
      ok: false,
      skipped: false,
      message: `${id} ❌ ${problems.join('；')}`
    }
  }

  const lessonMd = readFileSync(lessonPath, 'utf8')
  const practiceMd = readFileSync(practicePath, 'utf8')

  // 自然段分组必须完整覆盖句子下标（每个下标恰好出现一次）
  const paras = lesson.reading.paragraphs
  if (paras) {
    const flat = [...paras.flat()].sort((a, b) => a - b)
    const expected = lesson.reading.sentences.map((_, i) => i)
    const covered =
      flat.length === expected.length && flat.every((v, i) => v === expected[i])
    if (!covered) problems.push('paragraphs 未完整覆盖句子下标')
  }

  const missingSentences = findMissingSentences(
    lesson,
    extractReadingBlock(lessonMd)
  )
  if (missingSentences.length > 0) {
    problems.push(`课文缺句：${missingSentences.join(' / ')}`)
  }
  const missingVocab = findMissingVocab(lesson, lessonMd)
  if (missingVocab.length > 0)
    problems.push(`词汇表缺词：${missingVocab.join(' / ')}`)
  problems.push(
    ...checkPracticeAlignment(parsePracticeGroups(practiceMd), lesson)
  )

  if (problems.length > 0) {
    return {
      ok: false,
      skipped: false,
      message: `${id} ❌ ${problems.join('；')}`
    }
  }
  const questionCount = lesson.practice.reduce(
    (n, g) => n + g.questions.length,
    0
  )
  return {
    ok: true,
    skipped: false,
    message: `${id} ✅ ${lesson.reading.sentences.length} 句 / ${lesson.vocab.core.length} 精讲词 / ${lesson.vocab.wordGroups.length} 词群 / ${lesson.practice.length} 题组 / ${questionCount} 题`
  }
}

const results = discoverLessons().map(validateLesson)
for (const r of results) console.log(r.message)
const failed = results.filter((r) => !r.ok).length
const passed = results.filter((r) => r.ok && !r.skipped).length
const skipped = results.filter((r) => r.skipped).length
console.log(`\n通过 ${passed} / 失败 ${failed} / 跳过 ${skipped}`)
process.exit(failed > 0 ? 1 : 0)
