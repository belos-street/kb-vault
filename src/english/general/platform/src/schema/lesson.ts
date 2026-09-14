import { z } from 'zod'

// 行内加粗（**x**）保留在字符串内，由平台渲染层处理；schema 不做行内解析。

export const sentenceSchema = z.object({
  /** 英文原句 */
  en: z.string().min(1),
  /** 中文译文，逐句配对失败时为 null（整段译文兜底） */
  zh: z.string().nullable()
})

export const vocabItemSchema = z.object({
  word: z.string().min(1),
  phonetic: z.string(),
  meaning: z.string(),
  example: z.string(),
  collocations: z.string()
})

export const wordGroupItemSchema = z.object({
  word: z.string().min(1),
  sentence: z.string(),
  collocations: z.string()
})

export const keyPointSchema = z.object({
  sentence: z.string(),
  analysis: z.string()
})

const questionBase = {
  id: z.string().min(1),
  stem: z.string(),
  explanation: z.string()
}

export const questionSchema = z.discriminatedUnion('kind', [
  z.object({
    ...questionBase,
    kind: z.literal('pattern-choice'),
    /** 五大句型等固定选项，如 ['① 主谓', ...] */
    options: z.array(z.string()).min(2),
    /** options 的下标 */
    answer: z.number().int().min(0)
  }),
  z.object({
    ...questionBase,
    kind: z.literal('annotate'),
    /** 划分成分题：答案为标注文本，自检揭示 */
    answer: z.string()
  }),
  z.object({
    ...questionBase,
    kind: z.literal('fill'),
    /** stem 内嵌 ___；多个可接受答案 */
    answers: z.array(z.string()).min(1)
  }),
  z.object({
    ...questionBase,
    kind: z.literal('correction'),
    /** 改正后的完整句 */
    reference: z.string()
  }),
  z.object({
    ...questionBase,
    kind: z.literal('translation'),
    /** 多个可接受译句 */
    answers: z.array(z.string()).min(1)
  }),
  z.object({
    ...questionBase,
    kind: z.literal('judge'),
    isCorrect: z.boolean(),
    /** 错误时的改正句；原句正确为 null */
    correction: z.string().nullable()
  }),
  z.object({
    ...questionBase,
    kind: z.literal('subjective'),
    /** 主观题三件套自评项（要点覆盖 / 自检要点 / 达标线） */
    checklist: z.array(z.object({ label: z.string(), text: z.string() })).min(3)
  })
])

export const questionGroupSchema = z.object({
  id: z.number().int().min(1),
  title: z.string().min(1),
  layer: z.enum(['basic', 'advanced']),
  questions: z.array(questionSchema).min(1)
})

// ---------- 讲解块（lesson.md §3 语法点拆解）：通用块模型，容纳每讲不同的讲解形态 ----------

export const noteBlockSchema = z.discriminatedUnion('type', [
  /** 普通段落（保留 **加粗** 标记，渲染层处理） */
  z.object({ type: z.literal('p'), text: z.string().min(1) }),
  /** 表格 */
  z.object({
    type: z.literal('table'),
    headers: z.array(z.string()).min(1),
    rows: z.array(z.array(z.string()).min(1)).min(1)
  }),
  /** 提示框（md 中的 💡 引用块） */
  z.object({ type: z.literal('tip'), text: z.string().min(1) }),
  /** 有序步骤（如三步判型法） */
  z.object({ type: z.literal('steps'), items: z.array(z.string()).min(1) })
])

export const noteSectionSchema = z.object({
  heading: z.string().min(1),
  blocks: z.array(noteBlockSchema).min(1)
})

// ---------- 输出任务（lesson.md §4）：复述 / 仿写 / 自检 ----------

export const outputTaskSchema = z.object({
  kind: z.enum(['retell', 'writing', 'check']),
  prompt: z.string().min(1),
  /** 参考起点 / 提示线索（\n 分行，渲染层 pre-line） */
  reference: z.string().optional(),
  /** 参考范文（\n 分行）；默认折叠、点击揭示，主观题无唯一答案仅供参考 — 必填，保证输出可对照 */
  sample: z.string().min(1),
  checklist: z
    .array(z.object({ label: z.string(), text: z.string() }))
    .optional()
})

export const lessonSchema = z.object({
  /** 讲次编号，如 'L01' */
  id: z.string().regex(/^L\d{2}$/),
  /** 所属单元目录名，如 '01-句子工程' */
  unit: z.string().min(1),
  /** 所属册目录名，如 'book-01-foundation' */
  book: z.string().min(1),
  /** 讲标题，如 '第 1 讲：句子成分与五大句型' */
  title: z.string().min(1),
  reading: z.object({
    title: z.string().min(1),
    sentences: z.array(sentenceSchema).min(1),
    /** 自然段分组：每段为 sentences 的下标数组；对话体课文按「每轮发言一段」分组；缺省整篇一段 */
    paragraphs: z
      .array(z.array(z.number().int().min(0)).min(1))
      .nonempty()
      .optional(),
    /** 整段参考译文（zh=null 时的兜底） */
    translation: z.string().min(1),
    keyPoints: z.array(keyPointSchema)
  }),
  vocab: z.object({
    core: z.array(vocabItemSchema).min(1),
    wordGroups: z.array(wordGroupItemSchema)
  }),
  /** 语法讲解（lesson.md §3），生成侧必须产出（md↔json 同源） */
  notes: z.array(noteSectionSchema).min(1),
  /** 输出任务（lesson.md §4）：复述 / 仿写 / 自检，每项必须带 sample 参考范文 */
  output: z.array(outputTaskSchema).min(1),
  practice: z.array(questionGroupSchema).min(1)
})

export type Sentence = z.infer<typeof sentenceSchema>
export type VocabItem = z.infer<typeof vocabItemSchema>
export type WordGroupItem = z.infer<typeof wordGroupItemSchema>
export type KeyPoint = z.infer<typeof keyPointSchema>
export type Question = z.infer<typeof questionSchema>
export type QuestionGroup = z.infer<typeof questionGroupSchema>
export type NoteBlock = z.infer<typeof noteBlockSchema>
export type NoteSection = z.infer<typeof noteSectionSchema>
export type OutputTask = z.infer<typeof outputTaskSchema>
export type Lesson = z.infer<typeof lessonSchema>
