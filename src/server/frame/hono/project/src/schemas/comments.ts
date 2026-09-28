import { z } from '@hono/zod-openapi'

export const commentSchema = z.object({
  id: z.number().int(),
  postId: z.number().int(),
  content: z.string(),
  authorId: z.string(),
  createdAt: z.string()
})

export const createCommentSchema = z.object({
  content: z.string().min(1).max(2000)
})

export const listCommentQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  order: z.enum(['asc', 'desc']).default('asc')
})

export const listCommentResultSchema = z.object({
  items: z.array(commentSchema),
  total: z.number().int(),
  page: z.number().int(),
  limit: z.number().int()
})
