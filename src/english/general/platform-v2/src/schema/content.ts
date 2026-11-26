import { z } from 'zod'
import { topics } from '../data/types.ts'

const sentenceSchema = z.object({
  en: z.string().min(1),
  zh: z.string().min(1)
})

const vocabItemSchema = z.object({
  word: z.string().min(1),
  phonetic: z.string().min(1),
  meaning: z.string().min(1),
  example: z.string().min(1),
  collocation: z.string().min(1)
})

const chunkSchema = z.object({
  text: z.string().min(1),
  frame: z.string().min(1),
  note: z.string().min(1)
})

const drillItemSchema = z.object({
  id: z.string().min(1),
  mode: z.enum(['spelling', 'dictation', 'recall']),
  prompt: z.string().min(1),
  hint: z.string().min(1),
  answer: z.string().min(1)
})

const grammarCardSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  rule: z.string().min(1),
  anchors: z.array(z.string().min(1)).min(2),
  contrast: z.string().min(1),
  commonErrors: z.array(z.string().min(1)).min(1)
})

const outputTaskSchema = z.object({
  kind: z.enum(['retell', 'writing', 'check']),
  prompt: z.string().min(1),
  sample: z.string().min(1),
  checklist: z.array(z.string().min(1)).min(1)
})

const exerciseItemSchema = z
  .object({
    id: z.string().min(1),
    kind: z.enum(['choice', 'fill', 'correction', 'annotate']),
    level: z.enum(['基础', '强化']),
    question: z.string().min(1),
    options: z.array(z.string().min(1)).min(2).optional(),
    answer: z.string().min(1),
    solution: z.string().min(1)
  })
  .superRefine((item, ctx) => {
    if (item.kind !== 'choice') return
    if (!item.options) {
      ctx.addIssue({
        code: 'custom',
        message: 'choice 题必须提供 options'
      })
      return
    }
    if (!item.options.includes(item.answer)) {
      ctx.addIssue({
        code: 'custom',
        message: 'choice 题的 answer 必须是 options 之一'
      })
    }
  })

export const blockSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('passage'),
    title: z.string().min(1),
    sentences: z.array(sentenceSchema).min(3),
    translation: z.string().min(1)
  }),
  z.object({
    kind: z.literal('vocab'),
    items: z.array(vocabItemSchema).min(1)
  }),
  z.object({
    kind: z.literal('chunks'),
    items: z.array(chunkSchema).min(1)
  }),
  z.object({
    kind: z.literal('drill'),
    items: z.array(drillItemSchema).min(1)
  }),
  z.object({
    kind: z.literal('output'),
    task: outputTaskSchema
  }),
  z.object({
    kind: z.literal('grammar'),
    card: grammarCardSchema
  }),
  z.object({
    kind: z.literal('exercise'),
    title: z.string().min(1),
    items: z.array(exerciseItemSchema).min(1)
  }),
  z.object({ kind: z.literal('p'), text: z.string().min(1) }),
  z.object({ kind: z.literal('h2'), text: z.string().min(1) }),
  z.object({
    kind: z.literal('note'),
    title: z.string().min(1),
    text: z.string().min(1)
  }),
  z.object({
    kind: z.literal('list'),
    items: z.array(z.string().min(1)).min(1)
  })
])

export const lessonContentSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  topic: z.enum(topics),
  minutes: z.number().int().min(5).max(120),
  targetPatterns: z.array(z.string().min(1)).min(1),
  canDo: z.array(z.string().min(1)).min(2),
  inputWords: z.number().int().positive(),
  blocks: z.array(blockSchema).min(1)
})
