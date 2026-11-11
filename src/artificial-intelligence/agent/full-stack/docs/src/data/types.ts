export const depths = ['精讲', '速过', '引子'] as const

export type Depth = (typeof depths)[number]

export const tones = [
  'tip',
  'warn',
  'info',
  'definition',
  'interview',
  'decision'
] as const

export type Tone = (typeof tones)[number]

export const demoIds = [
  'token-cost',
  'context-window',
  'model-picker',
  'sse-stream',
  'prompt-lab',
  'react-loop',
  'tool-contract',
  'output-contract',
  'chunk-lab',
  'retrieval-pipeline'
] as const

export type DemoId = (typeof demoIds)[number]

export const exerciseLevels = ['基础', '改造', '排障', '设计'] as const

export type ExerciseLevel = (typeof exerciseLevels)[number]

export interface ExerciseItem {
  id: string
  level: ExerciseLevel
  question: string
  hint: string
  answer: string
  solution: string
}

export interface LessonMeta {
  id: string
  /** 阶段内序号，如 1.1 */
  number: string
  title: string
  /** 一句话概括本讲目标 */
  tagline: string
  /** 预计学习时长（分钟） */
  minutes: number
  depth: Depth
  /** 本讲细分知识点 */
  points: string[]
  /** 是否已产出讲义内容 */
  live: boolean
  /** 本篇只新增的变量 */
  variable: string
  /** 本篇不改什么，用来锁边界 */
  unchanged: string
  /** 本篇产物 */
  artifact: string
  /** 3 条可断言结果 */
  assertions: string[]
  /** 面试可答问题 */
  interview: string[]
}

export interface Chapter {
  id: string
  label: string
  title: string
  goal: string
  lessons: LessonMeta[]
}

export type Block =
  | { kind: 'p'; text: string }
  | { kind: 'h2'; text: string }
  | { kind: 'h3'; text: string }
  | { kind: 'list'; items: string[]; ordered?: boolean }
  | { kind: 'note'; tone: Tone; title: string; text: string }
  | {
      kind: 'table'
      head: string[]
      rows: string[][]
    }
  | {
      kind: 'code'
      title?: string
      lang: string
      code: string
      caption?: string
    }
  | { kind: 'demo'; id: DemoId }
  | {
      kind: 'links'
      title: string
      items: { label: string; href: string; note?: string }[]
    }
  | {
      kind: 'example'
      title: string
      problem: string
      steps: string[]
      answer?: string
    }
  | { kind: 'exercise'; title: string; items: ExerciseItem[] }
  | { kind: 'checklist'; title: string; items: string[] }
