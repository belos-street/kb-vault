import { contents } from '../content/index.ts'
import { projects } from '../data/projects.ts'
import type { Block } from '../data/types.ts'
import {
  allLessons,
  chapters,
  depthCounts,
  lessonById,
  liveLessons,
  totalMinutes
} from '../data/syllabus.ts'
import { chapterSchema, contentSchema } from './schema.ts'

const EXPECTED_CHAPTERS = 11
const EXPECTED_LESSONS = 49
const EXPECTED_PROJECTS = 8
const EXPECTED_LIVE_IDS = [
  's1-1',
  's1-2',
  's1-3',
  's1-4',
  's2-1',
  's2-2',
  's2-3',
  's2-4',
  's2-5',
  's2-6',
  's3-1'
]
const EXPECTED_DEPTH_COUNTS = { 精讲: 34, 速过: 12, 引子: 3 }
const EXPECTED_MINUTES = 3480

const errors: string[] = []

function report(label: string, error: unknown): void {
  if (error && typeof error === 'object' && 'issues' in error) {
    const issues = (
      error as { issues: Array<{ path: PropertyKey[]; message: string }> }
    ).issues
    for (const issue of issues) {
      const path = issue.path.length > 0 ? `.${issue.path.join('.')}` : ''
      errors.push(`${label}${path}: ${issue.message}`)
    }
    return
  }
  errors.push(`${label}: ${String(error)}`)
}

if (chapters.length !== EXPECTED_CHAPTERS) {
  errors.push(`阶段数应为 ${EXPECTED_CHAPTERS}，实际为 ${chapters.length}`)
}

if (allLessons.length !== EXPECTED_LESSONS) {
  errors.push(`篇数应为 ${EXPECTED_LESSONS}，实际为 ${allLessons.length}`)
}

if (totalMinutes !== EXPECTED_MINUTES) {
  errors.push(`总时长应为 ${EXPECTED_MINUTES} 分钟，实际为 ${totalMinutes}`)
}

if (projects.length !== EXPECTED_PROJECTS) {
  errors.push(`项目数应为 ${EXPECTED_PROJECTS}，实际为 ${projects.length}`)
}

const projectIds = new Set<string>()
for (const project of projects) {
  if (projectIds.has(project.id)) {
    errors.push(`项目 ID 重复：${project.id}`)
  }
  projectIds.add(project.id)
  if (!lessonById.has(project.startLessonId)) {
    errors.push(`项目 ${project.id} 的起始篇不存在：${project.startLessonId}`)
  }
  if (project.landingCount <= 0) {
    errors.push(`项目 ${project.id} 的落点篇数必须大于 0`)
  }
  if (project.stages.length === 0) {
    errors.push(`项目 ${project.id} 至少要有 1 个阶段`)
  }
}

if (
  depthCounts.精讲 !== EXPECTED_DEPTH_COUNTS.精讲 ||
  depthCounts.速过 !== EXPECTED_DEPTH_COUNTS.速过 ||
  depthCounts.引子 !== EXPECTED_DEPTH_COUNTS.引子
) {
  errors.push(
    `深度分布应为 ${JSON.stringify(EXPECTED_DEPTH_COUNTS)}，实际为 ${JSON.stringify(depthCounts)}`
  )
}

const chapterIds = new Set<string>()
const lessonIds = new Set<string>()
const lessonNumbers = new Set<string>()

chapters.forEach((chapter, chapterIndex) => {
  const expectedChapterId = `s${chapterIndex + 1}`
  if (chapter.id !== expectedChapterId) {
    errors.push(`阶段 ID 应为 ${expectedChapterId}，实际为 ${chapter.id}`)
  }
  if (chapterIds.has(chapter.id)) {
    errors.push(`阶段 ID 重复：${chapter.id}`)
  }
  chapterIds.add(chapter.id)

  const result = chapterSchema.safeParse(chapter)
  if (!result.success) {
    report(`阶段 ${chapter.id}`, result.error)
  }

  chapter.lessons.forEach((lesson, lessonIndex) => {
    const expectedId = `s${chapterIndex + 1}-${lessonIndex + 1}`
    if (lesson.id !== expectedId) {
      errors.push(`篇 ID 应为 ${expectedId}，实际为 ${lesson.id}`)
    }
    const expectedNumber = `${chapterIndex + 1}.${lessonIndex + 1}`
    if (lesson.number !== expectedNumber) {
      errors.push(`篇编号应为 ${expectedNumber}，实际为 ${lesson.number}`)
    }
    if (lessonIds.has(lesson.id)) {
      errors.push(`篇 ID 重复：${lesson.id}`)
    }
    lessonIds.add(lesson.id)
    if (lessonNumbers.has(lesson.number)) {
      errors.push(`篇编号重复：${lesson.number}`)
    }
    lessonNumbers.add(lesson.number)

    const expectedMinutes =
      lesson.depth === '精讲' ? 90 : lesson.depth === '速过' ? 30 : 20
    if (lesson.minutes !== expectedMinutes) {
      errors.push(
        `篇 ${lesson.number} 的时长应为 ${expectedMinutes} 分钟，实际为 ${lesson.minutes}`
      )
    }

    if (lesson.live) {
      if (lesson.assertions.length < 3) {
        errors.push(`已上线篇 ${lesson.number} 至少要有 3 条验收`)
      }
      if (lesson.interview.length < 3) {
        errors.push(`已上线篇 ${lesson.number} 至少要有 3 个面试问题`)
      }
    } else {
      if (lesson.assertions.length > 0) {
        errors.push(`未上线篇 ${lesson.number} 不应有验收断言`)
      }
      if (lesson.interview.length > 0) {
        errors.push(`未上线篇 ${lesson.number} 不应有面试问题`)
      }
      if (lesson.artifact !== '待更新') {
        errors.push(`未上线篇 ${lesson.number} 的产物应为「待更新」`)
      }
    }
  })
})

const actualLiveIds = liveLessons.map((lesson) => lesson.id)
if (actualLiveIds.join(',') !== EXPECTED_LIVE_IDS.join(',')) {
  errors.push(
    `已上线篇应为 ${EXPECTED_LIVE_IDS.join(', ')}，实际为 ${actualLiveIds.join(', ')}`
  )
}

const contentEntries = Object.entries(contents).flatMap(
  ([chapterId, lessonMap]) => {
    const chapter = chapters.find((item) => item.id === chapterId)
    if (!chapter) {
      errors.push(`讲义引用未知阶段：${chapterId}`)
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
    errors.push(`讲义引用未知篇：${lessonId}`)
    continue
  }
  if (chapterOfLesson.get(lessonId) !== chapterId) {
    errors.push(`讲义阶段归属错误：${lessonId} 不属于 ${chapterId}`)
  }
  if (!lesson.live) {
    errors.push(`未上线篇不应有讲义：${lessonId}`)
  }
  if (blocks.length === 0) {
    errors.push(`讲义内容为空：${lessonId}`)
  }

  const h2Count = blocks.filter((block) => block.kind === 'h2').length
  const codeCount = blocks.filter((block) => block.kind === 'code').length
  const demoCount = blocks.filter((block) => block.kind === 'demo').length
  const exerciseCount = blocks.filter(
    (block) => block.kind === 'exercise'
  ).length

  if (h2Count < 3) errors.push(`讲义 ${lessonId} 至少要有 3 个 h2 小节`)
  if (codeCount < 1) errors.push(`讲义 ${lessonId} 至少要有 1 个代码块`)
  if (demoCount < 1) errors.push(`讲义 ${lessonId} 至少要有 1 个交互 demo`)
  if (exerciseCount < 1) errors.push(`讲义 ${lessonId} 至少要有 1 组练习`)

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

function validateBlock(label: string, block: Block, index: number): void {
  const at = `${label} 第 ${index + 1} 块`
  if (block.kind === 'code' && block.code.trim().length === 0) {
    errors.push(`${at}: 代码块为空`)
  }
  if (block.kind === 'links') {
    block.items.forEach((item, itemIndex) => {
      if (!item.href.startsWith('https://')) {
        errors.push(`${at} 第 ${itemIndex + 1} 个链接必须是 https://`)
      }
    })
  }
}

for (const lesson of liveLessons) {
  if (!contentEntries.some((entry) => entry.lessonId === lesson.id)) {
    errors.push(`已上线篇缺少讲义：${lesson.id}`)
  }
}

if (errors.length > 0) {
  console.error(`✗ 课程数据校验失败，共 ${errors.length} 项：`)
  errors.forEach((error, index) => {
    console.error(`  ${index + 1}. ${error}`)
  })
  process.exit(1)
}

console.log(
  `✓ 课程数据校验通过：${chapters.length} 阶段 / ${allLessons.length} 篇 / ${totalMinutes} 分钟 / ${liveLessons.length} 篇已上线`
)
