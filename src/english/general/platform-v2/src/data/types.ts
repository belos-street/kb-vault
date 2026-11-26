export const topics = [
  'daily-life',
  'travel-place',
  'society-culture',
  'science-nature',
  'tech-work'
] as const

export type Topic = (typeof topics)[number]

export const topicLabels: Record<Topic, string> = {
  'daily-life': '生活',
  'travel-place': '旅行 / 城市',
  'society-culture': '社会 / 文化',
  'science-nature': '科学 / 自然',
  'tech-work': '技术 / 工作'
}

export interface Sentence {
  en: string
  zh: string
}

export interface VocabItem {
  word: string
  phonetic: string
  meaning: string
  /** 课文中的原句 */
  example: string
  /** 高频搭配 */
  collocation: string
}

export interface Chunk {
  /** 课文中的原样片段 */
  text: string
  /** 可复用框架 */
  frame: string
  /** 一句话说明 */
  note: string
}

export type DrillMode = 'spelling' | 'dictation' | 'recall'

export interface DrillItem {
  id: string
  mode: DrillMode
  /** spelling / dictation：朗读文本；recall：中文提示句 */
  prompt: string
  /** 释义、中文译文或首词提示 */
  hint: string
  /** 标准答案 */
  answer: string
}

export interface GrammarCard {
  id: string
  title: string
  /** 一句话规则 */
  rule: string
  /** 课文锚句，至少 2 条 */
  anchors: string[]
  /** 中文/方言差异 */
  contrast: string
  commonErrors: string[]
}

export type OutputKind = 'retell' | 'writing' | 'check'

export interface OutputTask {
  kind: OutputKind
  prompt: string
  /** 参考范文，提交后揭示 */
  sample: string
  checklist: string[]
}

export type ExerciseKind = 'choice' | 'fill' | 'correction' | 'annotate'

export interface ExerciseItem {
  id: string
  kind: ExerciseKind
  level: '基础' | '强化'
  question: string
  /** choice 专用；answer 必须是其中一个选项 */
  options?: string[]
  /** 标准答案；correction / annotate 为参考文本 */
  answer: string
  solution: string
}

export type Block =
  | {
      kind: 'passage'
      title: string
      sentences: Sentence[]
      translation: string
    }
  | { kind: 'vocab'; items: VocabItem[] }
  | { kind: 'chunks'; items: Chunk[] }
  | { kind: 'drill'; items: DrillItem[] }
  | { kind: 'output'; task: OutputTask }
  | { kind: 'grammar'; card: GrammarCard }
  | { kind: 'exercise'; title: string; items: ExerciseItem[] }
  | { kind: 'p'; text: string }
  | { kind: 'h2'; text: string }
  | { kind: 'note'; title: string; text: string }
  | { kind: 'list'; items: string[] }

export interface LessonContent {
  id: string
  title: string
  topic: Topic
  minutes: number
  targetPatterns: string[]
  canDo: string[]
  /** 由 defineLesson 从 passage 计算，人工不填 */
  inputWords: number
  blocks: Block[]
}

export type LessonInput = Omit<LessonContent, 'inputWords'>

export interface LessonMeta {
  id: string
  number: string
  title: string
  tagline: string
  topic: Topic
  live: boolean
  targetPatterns: string[]
  canDo: string[]
}

export interface Unit {
  id: string
  title: string
  goal: string
  lessons: LessonMeta[]
}

export interface Book {
  id: string
  title: string
  units: Unit[]
}
