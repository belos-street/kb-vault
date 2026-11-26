import type { ErrorTag } from './tags.ts'

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

export interface GrammarAnchor {
  /** 锚句出自哪一讲 */
  lessonId: string
  text: string
}

export interface GrammarCard {
  id: string
  title: string
  /** 一句话规则 */
  rule: string
  /** 课文锚句，至少 2 条，可跨同单元已学课文 */
  anchors: GrammarAnchor[]
  /** 中文/方言差异 */
  contrast: string
  commonErrors: string[]
}

export type OutputKind = 'retell' | 'writing' | 'check'

export interface OutputTask {
  id: string
  kind: OutputKind
  prompt: string
  /** 参考范文，提交后揭示；retell / check 的目标文本也放这里 */
  sample: string
  checklist: string[]
}

export type ExerciseKind = 'choice' | 'fill' | 'correction' | 'annotate'

/** comprehension：意义层；form：形式层 */
export type ExerciseFocus = 'comprehension' | 'form'

export interface ExerciseItem {
  id: string
  kind: ExerciseKind
  focus: ExerciseFocus
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
    }
  | { kind: 'vocab'; items: VocabItem[] }
  | { kind: 'chunks'; items: Chunk[] }
  | { kind: 'drill'; items: DrillItem[] }
  | { kind: 'output'; task: OutputTask }
  | { kind: 'grammar'; cardId: string }
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
  /** 一讲分几次学，配合每日 10 分钟精读预算 */
  sessions: number
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

/** 泛读记录：只存元数据与自评，不存全文 */
export interface ReadingEntry {
  id: string
  /** YYYY-MM-DD（本地时区） */
  date: string
  title: string
  url: string
  words: number
  minutes: number
  topic: Topic
  /** 第一段 100 词里不认识的词数；泛读健康区间 1~2，>3 换文 */
  newWordsPer100: number
  /** 一句话英文概括，作为理解检查 */
  summary: string
}

export type ReadingDraft = Omit<ReadingEntry, 'id' | 'date'>

/** 错误台账：一条 = 一个句对的差异 */
export interface LedgerEntry {
  id: string
  /** ISO 时间，用于按天统计 */
  createdAt: string
  lessonId: string
  mySentence: string
  targetSentence: string
  tag: ErrorTag
  /** 结构键，复现率的判定单位 */
  patternKey: string
  tagSource: 'prefill' | 'manual'
  /** 0~4，4 为毕业 */
  stage: number
  /** YYYY-MM-DD；毕业为空串 */
  nextReviewAt: string
}
