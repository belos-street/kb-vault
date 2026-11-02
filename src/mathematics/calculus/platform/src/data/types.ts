export const tones = [
  'tip',
  'warn',
  'info',
  'definition',
  'theorem',
  'method'
] as const

export type Tone = (typeof tones)[number]

export const demoIds = [
  'mapping',
  'function-lab',
  'inverse',
  'sequence',
  'limit',
  'infinitesimal',
  'continuity',
  'ivt'
] as const

export type DemoId = (typeof demoIds)[number]

export type Priority = 1 | 2 | 3 | 4 | 5

export const exerciseLevels = ['基础', '考研', '易错'] as const

export type ExerciseLevel = (typeof exerciseLevels)[number]

export interface ExerciseItem {
  id: string
  level: ExerciseLevel
  question: string
  answer: string
  solution: string
}

export interface LessonMeta {
  id: string
  /** 章节内序号，如 1.1 */
  number: string
  title: string
  /** 一句话概括本讲目标 */
  tagline: string
  /** 预计学习时长（分钟），含视频与讲义 */
  minutes: number
  /** 本讲细分知识点 */
  points: string[]
  /** 是否已产出讲义内容 */
  live: boolean
  /** 考试优先级：5 = 必考核心，1 = 了解 */
  priority: Priority
}

export interface Chapter {
  id: string
  /** 第一章 / 第二章 */
  label: string
  title: string
  goal: string
  lessons: LessonMeta[]
}

export type LessonMetaInput = Omit<LessonMeta, 'priority'>

export type ChapterInput = Omit<Chapter, 'lessons'> & {
  lessons: LessonMetaInput[]
}

export type Block =
  | { kind: 'p'; text: string }
  | { kind: 'h2'; text: string }
  | { kind: 'h3'; text: string }
  | { kind: 'formula'; tex: string; caption?: string }
  | { kind: 'list'; items: string[]; ordered?: boolean }
  | {
      kind: 'note'
      tone: Tone
      title: string
      text: string
      tex?: string
    }
  | {
      kind: 'example'
      title: string
      problem: string
      steps: string[]
      answer?: string
    }
  | { kind: 'table'; head: string[]; rows: string[][] }
  | { kind: 'graph'; demo: DemoId }
  | { kind: 'exercise'; title: string; items: ExerciseItem[] }
