import { z } from 'zod'

// ── 阅读内容块（第 1–6 节正文元素，requirements §6）──
export const blockSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('p'), text: z.string() }),
  // 小节标题（讲义正文内 `### 2.1 …` 式子标题）
  z.object({ type: z.literal('subhead'), text: z.string() }),
  z.object({
    type: z.literal('table'),
    head: z.array(z.string()),
    rows: z.array(z.array(z.string()))
  }),
  // 例句块：行内代码英文句（可多条）+ 中文解说（label = 「主 + 动」式加粗前缀，可为空串）
  z.object({
    type: z.literal('example'),
    label: z.string(),
    en: z.array(z.string()),
    zh: z.string()
  }),
  // 列表项（`- ` / `1. ` 形态，剥掉行标）
  z.object({
    type: z.literal('list'),
    ordered: z.boolean(),
    items: z.array(z.string())
  }),
  // 常见坑条目（⚠️ 属内容 emoji，渲染时原样带出）
  z.object({ type: z.literal('pitfall'), text: z.string() }),
  // 引语（一句话总结 / 核心论断）
  z.object({ type: z.literal('quote'), text: z.string() })
])

export type Block = z.infer<typeof blockSchema>

// ── 题（requirements §6 题表 + F3 题型口径）──
// 题型家族：choice / fill = 机判；correction / translation / parse / analyze = 自判
export const questionKindSchema = z.enum([
  'choice',
  'fill',
  'correction',
  'translation',
  'parse',
  'analyze'
])
export type QuestionKind = z.infer<typeof questionKindSchema>

export const MACHINE_KINDS: readonly QuestionKind[] = ['choice', 'fill']

export const blankSchema = z.object({
  // 可接受答案（已归一化约定见 normalize.ts；「不填」合法空 = accepts 含 ''）
  accepts: z.array(z.string()).min(1),
  // 是否为「不填」合法空（UI 渲染 ∅ 按钮，空串可提交）
  allowEmpty: z.boolean()
})
export type Blank = z.infer<typeof blankSchema>

export const questionSchema = z.object({
  // 讲内唯一：B1 / S2 …
  id: z.string().regex(/^[BST]\d+$/),
  tier: z.enum(['B', 'S', 'T']),
  kind: questionKindSchema,
  stem: z.array(blockSchema),
  // 仅 choice
  options: z.array(z.string()).optional(),
  // fill 家族必有（含「对比填空」）；一空一条，与题干空位一一对应
  blanks: z.array(blankSchema).optional(),
  // 文末第 7 节提取的参考答案原文（best-effort；多变体在「（或 …）」里）
  answer: z.string(),
  // 解析全文
  explanation: z.string(),
  // 答案提取失败 → 降级自判题并告警（requirements §6 提取口径 4）
  degraded: z.boolean()
})
export type Question = z.infer<typeof questionSchema>

// ── 讲（requirements §6 讲表）──
export const lessonSchema = z.object({
  // 复合键：板块标识 + 讲号（禁止仅用讲号）
  key: z.string().regex(/^.+-L\d+$/),
  // 目录序号（L01–L29，跨板块连续）
  index: z.number().int().positive(),
  number: z.string().regex(/^L\d+$/),
  title: z.string().min(1),
  // 一句话学习目标
  goal: z.string().min(1),
  board: z.string().min(1),
  // 第 1–6 节（第 6 节题干在 questions.stem，阅读视图只出题干）
  sections: z.object({
    why: z.array(blockSchema),
    concepts: z.array(blockSchema),
    examples: z.array(blockSchema),
    pitfalls: z.array(blockSchema),
    summary: z.string().min(1)
  }),
  questions: z.array(questionSchema).min(1),
  // 讲义内容指纹（构建期 hash），F4 dataVersion 失配整讲判定失效
  dataVersion: z.string().min(1)
})
export type Lesson = z.infer<typeof lessonSchema>

export const lessonsSchema = z.array(lessonSchema)
