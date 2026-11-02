import { readFileSync } from 'node:fs'
import { renderToString } from 'katex'
import { z } from 'zod'
import {
  continuityKinds,
  functionLabFamilies,
  infinitesimalHint,
  infinitesimalLegend,
  infinitesimalReadout,
  inverseFormulas,
  inverseHint,
  inverseTitle,
  ivtHint,
  ivtReadout,
  limitHint,
  limitReadout,
  sequenceHint,
  sequenceReadout
} from '../demos/formulas.ts'
import { contents } from '../content/index.ts'
import { lessonPriorities } from '../data/priorities.ts'
import type { Block } from '../data/types.ts'
import {
  allLessons,
  chapters,
  lessonById,
  multivariableLessonCount,
  totalMinutes,
  upperLessonCount
} from '../data/syllabus.ts'
import { chapterSchema, contentSchema, prioritySchema } from './schema.ts'

const EXPECTED_CHAPTERS = 8
const EXPECTED_LESSONS = 48
const EXPECTED_MINUTES = 2214
const EXPECTED_UPPER_LESSONS = 40
const EXPECTED_MULTIVARIABLE_LESSONS = 8

const CHAPTER_LABELS = [
  '第一章',
  '第二章',
  '第三章',
  '第四章',
  '第五章',
  '第六章',
  '第七章',
  '第八章'
]

const errors: string[] = []
let texCount = 0

function validateTex(label: string, tex: string, displayMode: boolean): void {
  texCount += 1
  try {
    renderToString(tex, {
      displayMode,
      throwOnError: true,
      strict: false,
      trust: false
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    errors.push(`${label}: KaTeX 编译失败 — ${message}`)
  }
}

function validateInlineMath(label: string, text: string): void {
  const dollars = text.match(/\$/g)?.length ?? 0
  if (dollars % 2 !== 0) {
    errors.push(`${label}: 行内公式的 $ 数量不成对`)
  }

  for (const match of text.matchAll(/\$([^$\n]+)\$/g)) {
    validateTex(`${label} 行内公式`, match[1] ?? '', false)
  }
}

function validateBlock(label: string, block: Block, index: number): void {
  const at = `${label} 第 ${index + 1} 块`

  switch (block.kind) {
    case 'p':
    case 'h2':
    case 'h3':
      validateInlineMath(at, block.text)
      break
    case 'formula':
      validateTex(`${at} 独立公式`, block.tex, true)
      if (block.caption) validateInlineMath(`${at} 公式说明`, block.caption)
      break
    case 'list':
      block.items.forEach((item, itemIndex) => {
        validateInlineMath(`${at} 列表第 ${itemIndex + 1} 项`, item)
      })
      break
    case 'note':
      validateInlineMath(`${at} 提示标题`, block.title)
      validateInlineMath(`${at} 提示正文`, block.text)
      if (block.tex) validateTex(`${at} 提示公式`, block.tex, true)
      break
    case 'example':
      validateInlineMath(`${at} 题目标题`, block.title)
      validateInlineMath(`${at} 题目`, block.problem)
      block.steps.forEach((step, stepIndex) => {
        validateInlineMath(`${at} 第 ${stepIndex + 1} 步`, step)
      })
      if (block.answer) validateInlineMath(`${at} 答案`, block.answer)
      break
    case 'table':
      block.head.forEach((cell, cellIndex) => {
        validateInlineMath(`${at} 表头第 ${cellIndex + 1} 列`, cell)
      })
      block.rows.forEach((row, rowIndex) => {
        row.forEach((cell, cellIndex) => {
          validateInlineMath(
            `${at} 表格第 ${rowIndex + 1} 行第 ${cellIndex + 1} 列`,
            cell
          )
        })
      })
      break
    case 'graph':
      break
    case 'exercise':
      validateInlineMath(`${at} 练习标题`, block.title)
      block.items.forEach((item, itemIndex) => {
        validateInlineMath(`${at} 练习 ${itemIndex + 1} 题目`, item.question)
        validateInlineMath(`${at} 练习 ${itemIndex + 1} 答案`, item.answer)
        validateInlineMath(`${at} 练习 ${itemIndex + 1} 解析`, item.solution)
      })
      break
  }
}

function validateDemoFormulas(): void {
  validateInlineMath('demo 反函数标题', inverseTitle)
  validateInlineMath('demo 反函数说明', inverseHint)

  for (const [kind, formulas] of Object.entries(inverseFormulas)) {
    validateTex(`demo 反函数 ${kind} 原函数`, formulas.original, false)
    validateTex(`demo 反函数 ${kind} 反函数`, formulas.inverse, false)
    validateTex(`demo 反函数 ${kind} 对称轴`, formulas.axis, false)
  }

  for (const [family, config] of Object.entries(functionLabFamilies)) {
    validateTex(`demo 函数图像 ${family}`, config.formula(1, 1), false)
  }

  validateInlineMath('demo 数列说明', sequenceHint)
  validateInlineMath('demo 数列读数', sequenceReadout(0.1, 10))
  validateInlineMath('demo 极限说明', limitHint)
  validateInlineMath('demo 极限读数', limitReadout(0.05, Math.sqrt(0.3)))
  validateInlineMath('demo 无穷小说明', infinitesimalHint)
  validateInlineMath('demo 无穷小图例 y=x', infinitesimalLegend.identity)
  validateInlineMath('demo 无穷小图例 y=sin x', infinitesimalLegend.sine)
  validateInlineMath('demo 无穷小图例 y=x²', infinitesimalLegend.square)
  validateInlineMath('demo 无穷小读数', infinitesimalReadout)

  for (const [kind, item] of Object.entries(continuityKinds)) {
    validateInlineMath(`demo 间断点 ${kind}`, item.point)
  }

  validateInlineMath('demo 介值定理说明', ivtHint)
  validateInlineMath('demo 介值定理读数', ivtReadout(0, 0.347))
}

function report(label: string, error: z.ZodError): void {
  for (const issue of error.issues) {
    const path = issue.path.length > 0 ? `.${issue.path.join('.')}` : ''
    errors.push(`${label}${path}: ${issue.message}`)
  }
}

const chapterIds = new Set<string>()

chapters.forEach((chapter, chapterIndex) => {
  const expectedChapterId = `ch${chapterIndex + 1}`
  if (chapter.id !== expectedChapterId) {
    errors.push(`章节 ID 应为 ${expectedChapterId}，实际为 ${chapter.id}`)
  }
  if (chapter.label !== CHAPTER_LABELS[chapterIndex]) {
    errors.push(
      `章节 ${chapter.id} 标签应为 ${CHAPTER_LABELS[chapterIndex]}，实际为 ${chapter.label}`
    )
  }
  if (chapterIds.has(chapter.id)) {
    errors.push(`章节 ID 重复：${chapter.id}`)
  }
  chapterIds.add(chapter.id)

  const result = chapterSchema.safeParse(chapter)
  if (!result.success) {
    report(`章节 ${chapter.id}`, result.error)
    return
  }

  const chapterNumber = chapter.id.replace('ch', '')
  chapter.lessons.forEach((lesson, index) => {
    const expectedNumber = `${chapterNumber}.${index + 1}`
    if (lesson.number !== expectedNumber) {
      errors.push(
        `讲次 ${lesson.id}: 编号应为 ${expectedNumber}，实际为 ${lesson.number}`
      )
    }

    const expectedId = `${chapter.id}-${index + 1}`
    if (lesson.id !== expectedId) {
      errors.push(`讲次 ID 应为 ${expectedId}，实际为 ${lesson.id}`)
    }
  })
})

if (chapters.length !== EXPECTED_CHAPTERS) {
  errors.push(`章节数应为 ${EXPECTED_CHAPTERS}，实际为 ${chapters.length}`)
}

if (allLessons.length !== EXPECTED_LESSONS) {
  errors.push(`讲次数应为 ${EXPECTED_LESSONS}，实际为 ${allLessons.length}`)
}

if (totalMinutes !== EXPECTED_MINUTES) {
  errors.push(`总时长应为 ${EXPECTED_MINUTES} 分钟，实际为 ${totalMinutes}`)
}

if (upperLessonCount !== EXPECTED_UPPER_LESSONS) {
  errors.push(
    `上册讲数应为 ${EXPECTED_UPPER_LESSONS}，实际为 ${upperLessonCount}`
  )
}

if (multivariableLessonCount !== EXPECTED_MULTIVARIABLE_LESSONS) {
  errors.push(
    `多元讲数应为 ${EXPECTED_MULTIVARIABLE_LESSONS}，实际为 ${multivariableLessonCount}`
  )
}

const readme = readFileSync(
  new URL('../../../readme.md', import.meta.url),
  'utf8'
)
const readmeRows = new Map<string, { minutes: number; title: string }>()
for (const match of readme.matchAll(
  /^\|\s*(\d+\.\d+)\s*\|\s*([^|\n]+?)\s*\|[^|\n]*\|\s*(\d+)\s*min\s*\|$/gm
)) {
  const number = match[1]
  const title = match[2]?.trim() ?? ''
  const minutes = Number(match[3])
  if (!number) continue
  if (readmeRows.has(number)) {
    errors.push(`readme 讲次重复：${number}`)
  }
  readmeRows.set(number, { minutes, title })

  const lesson = allLessons.find((item) => item.number === number)
  if (!lesson) {
    errors.push(`readme 存在未知讲次：${number}`)
  } else {
    if (lesson.title !== title) {
      errors.push(
        `readme 讲次 ${number} 标题应为「${lesson.title}」，实际为「${title}」`
      )
    }
    if (lesson.minutes !== minutes) {
      errors.push(
        `readme 讲次 ${number} 时长应为 ${lesson.minutes}，实际为 ${minutes}`
      )
    }
  }
}

for (const lesson of allLessons) {
  if (!readmeRows.has(lesson.number)) {
    errors.push(`readme 缺少讲次：${lesson.number}`)
  }
}

const readmeHeadings = [
  ...readme.matchAll(/^### (第[一二三四五六七八]章) ([^（\n]+)（(\d+) 讲/gm)
]
if (readmeHeadings.length !== chapters.length) {
  errors.push(
    `readme 章节标题数应为 ${chapters.length}，实际为 ${readmeHeadings.length}`
  )
}
readmeHeadings.forEach((heading, index) => {
  const chapter = chapters[index]
  if (!chapter) return
  if (heading[1] !== chapter.label) {
    errors.push(
      `readme 第 ${index + 1} 个章节标签应为 ${chapter.label}，实际为 ${heading[1]}`
    )
  }
  if (heading[2]?.trim() !== chapter.title) {
    errors.push(
      `readme 第 ${index + 1} 个章节标题应为 ${chapter.title}，实际为 ${heading[2]?.trim()}`
    )
  }
  if (Number(heading[3]) !== chapter.lessons.length) {
    errors.push(
      `readme 第 ${index + 1} 个章节讲数应为 ${chapter.lessons.length}，实际为 ${heading[3]}`
    )
  }
})

if (
  !readme.includes('6 章 40 讲') ||
  !readme.includes('2 章 8 讲') ||
  !readme.includes('8 章 48 讲')
) {
  errors.push('readme 章节划分账目应为 6 章 40 讲 + 2 章 8 讲 = 8 章 48 讲')
}

const lessonIds = new Set<string>()
const lessonNumbers = new Set<string>()
for (const lesson of allLessons) {
  if (lessonIds.has(lesson.id)) {
    errors.push(`讲次 ID 重复：${lesson.id}`)
  }
  lessonIds.add(lesson.id)

  if (lessonNumbers.has(lesson.number)) {
    errors.push(`讲次编号重复：${lesson.number}`)
  }
  lessonNumbers.add(lesson.number)
}

const missingPriorities = allLessons.filter(
  (lesson) => lessonPriorities[lesson.id] === undefined
)
if (missingPriorities.length > 0) {
  errors.push(
    `缺少考试优先级：${missingPriorities.map((lesson) => lesson.id).join(', ')}`
  )
}

const extraPriorities = Object.keys(lessonPriorities).filter(
  (id) => !lessonById.has(id)
)
if (extraPriorities.length > 0) {
  errors.push(`优先级表存在未知讲次：${extraPriorities.join(', ')}`)
}

for (const [id, priority] of Object.entries(lessonPriorities)) {
  const result = prioritySchema.safeParse(priority)
  if (!result.success) {
    report(`优先级 ${id}`, result.error)
  }
}

const contentEntries = Object.entries(contents).flatMap(
  ([chapterId, lessonMap]) => {
    const chapter = chapters.find((item) => item.id === chapterId)
    if (!chapter) {
      errors.push(`讲义引用未知章节：${chapterId}`)
      return []
    }

    const result = contentSchema.safeParse(lessonMap)
    if (!result.success) {
      report(`${chapter.title} 讲义`, result.error)
    }

    return Object.entries(lessonMap).map(([lessonId, blocks]) => ({
      chapterId,
      lessonId,
      blocks
    }))
  }
)

const chapterOfLesson = new Map(
  chapters.flatMap((chapter) =>
    chapter.lessons.map((lesson) => [lesson.id, chapter.id] as const)
  )
)

const exerciseIds = new Set<string>()

for (const { chapterId, lessonId, blocks } of contentEntries) {
  const lesson = lessonById.get(lessonId)
  if (!lesson) {
    errors.push(`讲义引用未知讲次：${lessonId}`)
    continue
  }
  if (chapterOfLesson.get(lessonId) !== chapterId) {
    errors.push(`讲义章节归属错误：${lessonId} 不属于 ${chapterId}`)
  }
  if (!lesson.live) {
    errors.push(`未上线讲次不应有讲义：${lessonId}`)
  }
  if (blocks.length === 0) {
    errors.push(`讲义内容为空：${lessonId}`)
  }

  blocks.forEach((block, index) => {
    validateBlock(lessonId, block, index)
    if (block.kind === 'exercise') {
      block.items.forEach((item) => {
        if (exerciseIds.has(item.id)) {
          errors.push(`练习题 ID 重复：${item.id}`)
        }
        exerciseIds.add(item.id)
        if (!item.id.startsWith(`${lessonId}-e`)) {
          errors.push(`练习题 ID 应属于 ${lessonId}：${item.id}`)
        }
      })
    }
    if (block.kind !== 'table') return
    block.rows.forEach((row, rowIndex) => {
      if (row.length !== block.head.length) {
        errors.push(
          `讲义 ${lessonId} 第 ${index + 1} 个表格第 ${rowIndex + 1} 行列数不一致`
        )
      }
    })
  })
}

const liveLessons = allLessons.filter((lesson) => lesson.live)
for (const lesson of liveLessons) {
  if (!contentEntries.some((entry) => entry.lessonId === lesson.id)) {
    errors.push(`已上线讲次缺少讲义：${lesson.id}`)
  }
}

validateDemoFormulas()

if (errors.length > 0) {
  console.error(`✗ 课程数据校验失败，共 ${errors.length} 项：`)
  errors.forEach((error, index) => {
    console.error(`  ${index + 1}. ${error}`)
  })
  process.exit(1)
}

console.log(
  `✓ 课程数据校验通过：${chapters.length} 章 / ${allLessons.length} 讲 / ${totalMinutes} 分钟 / ${texCount} 个 KaTeX 公式`
)
