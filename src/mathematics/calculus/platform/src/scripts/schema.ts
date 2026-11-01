import { z } from 'zod'
import { demoIds, exerciseLevels, tones } from '../data/types.ts'

export const prioritySchema = z.number().int().min(1).max(5)

export const lessonSchema = z.object({
  id: z.string().regex(/^ch\d+-\d+$/),
  number: z.string().regex(/^\d+\.\d+$/),
  title: z.string().min(2),
  tagline: z.string().min(4),
  minutes: z.number().int().min(5).max(180),
  points: z.array(z.string().min(2)).min(3),
  live: z.boolean(),
  priority: prioritySchema
})

export const chapterSchema = z.object({
  id: z.string().regex(/^ch\d+$/),
  label: z.string().regex(/^第[一二三四五六七八九十]+章$/),
  title: z.string().min(2),
  goal: z.string().min(6),
  lessons: z.array(lessonSchema).min(1)
})

const toneSchema = z.enum(tones)

const demoIdSchema = z.enum(demoIds)

const textSchema = z.string().min(1)

const exerciseLevelSchema = z.enum(exerciseLevels)

const exerciseItemSchema = z.object({
  id: z.string().regex(/^ch\d+-\d+-e\d+$/),
  level: exerciseLevelSchema,
  question: textSchema,
  answer: textSchema,
  solution: textSchema
})

export const blockSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('p'), text: textSchema }),
  z.object({ kind: z.literal('h2'), text: textSchema }),
  z.object({ kind: z.literal('h3'), text: textSchema }),
  z.object({
    kind: z.literal('formula'),
    tex: textSchema,
    caption: textSchema.optional()
  }),
  z.object({
    kind: z.literal('list'),
    items: z.array(textSchema).min(1),
    ordered: z.boolean().optional()
  }),
  z.object({
    kind: z.literal('note'),
    tone: toneSchema,
    title: textSchema,
    text: textSchema,
    tex: textSchema.optional()
  }),
  z.object({
    kind: z.literal('example'),
    title: textSchema,
    problem: textSchema,
    steps: z.array(textSchema).min(1),
    answer: textSchema.optional()
  }),
  z.object({
    kind: z.literal('table'),
    head: z.array(textSchema).min(1),
    rows: z.array(z.array(textSchema).min(1)).min(1)
  }),
  z.object({
    kind: z.literal('graph'),
    demo: demoIdSchema,
    title: textSchema,
    hint: textSchema.optional()
  }),
  z.object({
    kind: z.literal('exercise'),
    title: textSchema,
    items: z.array(exerciseItemSchema).min(1)
  })
])

export const contentSchema = z.record(z.string(), z.array(blockSchema))
