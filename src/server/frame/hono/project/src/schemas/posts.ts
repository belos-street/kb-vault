import { z } from '@hono/zod-openapi'

export const postSchema = z.object({
  id: z.number().int(),
  title: z.string(),
  content: z.string(),
  status: z.enum(['DRAFT', 'PENDING_REVIEW', 'PUBLISHED', 'ARCHIVED']),
  version: z.number().int(),
  commentCount: z.number().int(),
  authorId: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export const createPostSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().max(50_000).default(''),
})

export const updatePostSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  content: z.string().max(50_000).optional(),
  version: z.number().int().positive(), // 乐观锁：必传客户端当前读到的 version
})

export const transitionPostSchema = z.object({
  action: z.enum(['submit', 'approve', 'reject', 'archive']),
  reason: z.string().max(500).optional(), // reject 的驳回原因，入审计
})

export const listPostQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  status: z.enum(['DRAFT', 'PENDING_REVIEW', 'PUBLISHED', 'ARCHIVED']).optional(),
  authorId: z.string().optional(),
  order: z.enum(['asc', 'desc']).default('desc'),
})

export const listPostResultSchema = z.object({
  items: z.array(postSchema),
  total: z.number().int(),
  page: z.number().int(),
  limit: z.number().int(),
})
