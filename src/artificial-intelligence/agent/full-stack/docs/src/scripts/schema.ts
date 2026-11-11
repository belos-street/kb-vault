import { z } from 'zod'
import { demoIds, depths, exerciseLevels, tones } from '../data/types.ts'

export const depthSchema = z.enum(depths)

export const lessonSchema = z.object({
  id: z.string().regex(/^s\d+-\d+$/),
  number: z.string().regex(/^\d+\.\d+$/),
  title: z.string().min(2),
  tagline: z.string().min(4),
  minutes: z.number().int().min(5).max(180),
  depth: depthSchema,
  points: z.array(z.string().min(2)).min(3),
  live: z.boolean(),
  variable: z.string().min(2),
  unchanged: z.string().min(2),
  artifact: z.string().min(2),
  assertions: z.array(z.string().min(2)),
  interview: z.array(z.string().min(2))
})

export const chapterSchema = z.object({
  id: z.string().regex(/^s\d+$/),
  label: z.string().regex(/^阶段[一二三四五六七八九十]+$/),
  title: z.string().min(2),
  goal: z.string().min(6),
  lessons: z.array(lessonSchema).min(1)
})

const toneSchema = z.enum(tones)
const demoIdSchema = z.enum(demoIds)
const exerciseLevelSchema = z.enum(exerciseLevels)
const textSchema = z.string().min(1)

export const exerciseItemSchema = z.object({
  id: z.string().regex(/^s\d+-\d+-e\d+$/),
  level: exerciseLevelSchema,
  question: textSchema,
  hint: textSchema,
  answer: textSchema,
  solution: textSchema
})

export const blockSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('p'), text: textSchema }),
  z.object({ kind: z.literal('h2'), text: textSchema }),
  z.object({ kind: z.literal('h3'), text: textSchema }),
  z.object({
    kind: z.literal('list'),
    items: z.array(textSchema).min(1),
    ordered: z.boolean().optional()
  }),
  z.object({
    kind: z.literal('note'),
    tone: toneSchema,
    title: textSchema,
    text: textSchema
  }),
  z.object({
    kind: z.literal('table'),
    head: z.array(textSchema).min(1),
    rows: z.array(z.array(textSchema).min(1)).min(1)
  }),
  z.object({
    kind: z.literal('code'),
    title: textSchema.optional(),
    lang: textSchema,
    code: textSchema,
    caption: textSchema.optional()
  }),
  z.object({ kind: z.literal('demo'), id: demoIdSchema }),
  z.object({
    kind: z.literal('links'),
    title: textSchema,
    items: z
      .array(
        z.object({
          label: textSchema,
          href: z.url(),
          note: textSchema.optional()
        })
      )
      .min(1)
  }),
  z.object({
    kind: z.literal('example'),
    title: textSchema,
    problem: textSchema,
    steps: z.array(textSchema).min(1),
    answer: textSchema.optional()
  }),
  z.object({
    kind: z.literal('exercise'),
    title: textSchema,
    items: z.array(exerciseItemSchema).min(1)
  }),
  z.object({
    kind: z.literal('checklist'),
    title: textSchema,
    items: z.array(textSchema).min(1)
  })
])

export const contentSchema = z.record(z.string(), z.array(blockSchema))
