export type Tone =
  | 'tip'
  | 'warn'
  | 'info'
  | 'definition'
  | 'theorem'
  | 'method'

export type DemoId =
  | 'mapping'
  | 'function-lab'
  | 'inverse'
  | 'sequence'
  | 'limit'
  | 'infinitesimal'
  | 'continuity'
  | 'ivt'

export interface LessonMeta {
  id: string
  /** 章节内序号，如 1.1 */
  number: string
  title: string
  /** 一句话概括本讲目标 */
  tagline: string
  /** 视频时长（分钟） */
  minutes: number
  /** 本讲细分知识点 */
  points: string[]
  /** 是否已产出讲义内容 */
  live: boolean
}

export interface Chapter {
  id: string
  /** 第一章 / 第二章 */
  label: string
  title: string
  goal: string
  lessons: LessonMeta[]
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
  | { kind: 'graph'; demo: DemoId; title: string; hint?: string }
