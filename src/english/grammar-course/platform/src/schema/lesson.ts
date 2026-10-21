import { z } from 'zod'

// 数据契约（T2，requirements §5.2 + lessons/lesson-format.md）
// 单源管线：lesson.md 唯一手写源 → build-data 解析 → lesson.json 产物。
// 「output」是口径名非字段名：落位 = practice 中 kind:"produce" 题段。

// ── 课文句（§2 逐句中英对照，按自然段分组）──
export const sentenceSchema = z.object({
  en: z.string().min(1),
  zh: z.string().min(1),
  // {★ 注解} 高亮句：本课语法点所在句，3~5 处（validate 断言范围）
  highlight: z.boolean(),
  note: z.string().optional()
})
export type Sentence = z.infer<typeof sentenceSchema>

export const paragraphSchema = z.object({
  sentences: z.array(sentenceSchema).min(1)
})
export type Paragraph = z.infer<typeof paragraphSchema>

// ── 词汇（§3 七列表格）──
export const collocationSchema = z.object({
  phrase: z.string().min(1),
  // 中文释义（可选）：md 写「短语（中文释义） = 例句」时解析出
  gloss: z.string().min(1).optional(),
  // 搭配例句：日常口语句，展示该搭配真实用法
  example: z.string().min(1)
})
export type Collocation = z.infer<typeof collocationSchema>

export const vocabItemSchema = z.object({
  word: z.string().min(1),
  phonetic: z.string().min(1),
  pos: z.string().min(1),
  meaning: z.string().min(1),
  // [0] 课文原句（validate 全称断言 ∈ reading 句，平台点读）
  // [1] 课外日常口语句（validate 断言 ∉ reading 句）
  examples: z.array(z.string().min(1)).length(2),
  collocations: z.array(collocationSchema).min(2).max(3)
})
export type VocabItem = z.infer<typeof vocabItemSchema>

// ── 精讲（§4 薄讲，Lexio 继承字段 notes，必含 ≥1）──
export const noteSchema = z.object({
  // 规则段（中文，可多段）
  rule: z.string().min(1),
  // 例句（行内代码，可含 ✅/❌ 对照）
  examples: z.array(z.string()).min(1)
})
export type Note = z.infer<typeof noteSchema>

// ── 练习（§5 三段；「output」= produce 题段）──
export const practiceItemSchema = z.discriminatedUnion('kind', [
  // 理解：4 选项单选（B/S 层级）
  z.object({
    kind: z.literal('choice'),
    id: z.string().regex(/^[BS]\d+$/),
    stem: z.string().min(1),
    options: z.array(z.string()).length(4),
    // 参考答案 = 选项字母（A–D）
    answer: z.string().regex(/^[A-D]$/),
    explanation: z.string().min(1)
  }),
  // 操练：模板句 + 替换槽 + 提示词（P 系题号）
  z.object({
    kind: z.literal('drill'),
    id: z.string().regex(/^P\d+$/),
    // 模板句含 ______ 槽位；slots 与槽位按序一一对应
    template: z.string().min(1),
    // 提示词，与槽位数一致
    hints: z.array(z.string()).min(1),
    // 每槽可接受答案（任一匹配即槽对）
    slots: z.array(z.array(z.string()).min(1)).min(1),
    explanation: z.string().min(1)
  }),
  // 产出：造句/仿写（自判；sample = 参考样例，每项 ≥1 —— 「output」口径校验落位）
  z.object({
    kind: z.literal('produce'),
    id: z.string().regex(/^S\d+$/),
    prompt: z.string().min(1),
    // 参考答案样例（= sample，Lexio 继承字段）
    sample: z.array(z.string()).min(1),
    // 自判口径（如「句型对即可」）
    criteria: z.string().min(1)
  })
])
export type PracticeItem = z.infer<typeof practiceItemSchema>

// ── 小测（§6 Q 域，全机判：choice / fill，4~6 题）──
export const quizItemSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('choice'),
    id: z.string().regex(/^Q\d+$/),
    stem: z.string().min(1),
    options: z.array(z.string()).length(4),
    answer: z.string().regex(/^[A-D]$/),
    explanation: z.string().min(1)
  }),
  z.object({
    kind: z.literal('fill'),
    id: z.string().regex(/^Q\d+$/),
    // 题干含 ______ 空位；blanks 与空位按序对应（每空可接受答案任一匹配）
    stem: z.string().min(1),
    blanks: z.array(z.array(z.string()).min(1)).min(1),
    explanation: z.string().min(1)
  })
])
export type QuizItem = z.infer<typeof quizItemSchema>

// ── 深读（§7：每条 ref 自带标题定位与 hint）──
export const deepDiveItemSchema = z.object({
  // Gnn（G01–G29 = grammar 讲义原 L01–L29，锁两位）
  ref: z.string().regex(/^G\d{2}$/),
  // 「讲义标题 §小节」定位文案
  title: z.string().min(1),
  hint: z.string().min(1),
  // 跳转 URL（构建期解析 Gnn+§小节 → VitePress 讲义页锚点；validate 断言必有）
  url: z.string().min(1).optional()
})
export type DeepDiveItem = z.infer<typeof deepDiveItemSchema>

export const deepDiveSchema = z.object({
  refs: z.array(deepDiveItemSchema).min(1)
})
export type DeepDive = z.infer<typeof deepDiveSchema>

// ── 课（七件套 → lesson.json）──
export const lessonSchema = z.object({
  // 课号 UxxLnn 全局连续（锁两位）
  id: z.string().regex(/^U\d{2}L\d{2}$/),
  title: z.string().min(1),
  // ① 本课目标（「今天只学 1 个点」陈述）
  objective: z.string().min(1),
  // 引语 outcome（「学完本课你能：…」，与 syllabus.json 的 outcome 对齐，validate 断言）
  goal: z.string().min(1),
  // ② 课文（自然段分组）
  reading: z.object({
    paragraphs: z.array(paragraphSchema).min(1)
  }),
  // ③ 词汇表 8~12 词
  vocab: z.array(vocabItemSchema).min(8).max(12),
  // ④ 精讲（notes ≥1，必含——Lexio 继承）
  notes: z.array(noteSchema).min(1),
  // ⑤ 练习（produce 项 ≥1 且每项 sample ≥1 —— 「output」口径落位）
  practice: z
    .array(practiceItemSchema)
    .min(1)
    .refine((items) => items.some((p) => p.kind === 'produce'), {
      message: 'practice 必含至少 1 项 produce 题（「output」口径落位）'
    }),
  // ⑥ 小测（4~6 题，全机判）
  quiz: z.array(quizItemSchema).min(4).max(6),
  // ⑦ 深读
  deepDive: deepDiveSchema,
  // 构建期：题号集合 + 题干/答案内容指纹（grammar-play 同口径）
  dataVersion: z.string().min(1)
})
export type Lesson = z.infer<typeof lessonSchema>

export const lessonsSchema = z.array(lessonSchema)
