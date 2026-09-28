import { prisma } from '../lib/db'
import { cacheDel } from '../lib/cache'
import { apiError } from '../lib/errors'
import type { AuthUser } from '../types'
import { isStaff, postDetailKey } from './posts'

type CommentRow = {
  id: number
  postId: number
  content: string
  authorId: string
  createdAt: Date
}

export type CommentDTO = {
  id: number
  postId: number
  content: string
  authorId: string
  createdAt: string
}

export const toCommentDTO = (c: CommentRow): CommentDTO => ({
  id: c.id,
  postId: c.postId,
  content: c.content,
  authorId: c.authorId,
  createdAt: c.createdAt.toISOString()
})

export type ListCommentsParams = {
  page: number
  limit: number
  order: 'asc' | 'desc'
}

export const listComments = async (
  postId: number,
  params: ListCommentsParams
) => {
  const where = { postId, deletedAt: null }
  // createdAt 同毫秒会并列（并发测试可复现），补 id 做稳定排序
  const orderBy: [{ createdAt: 'asc' | 'desc' }, { id: 'asc' | 'desc' }] = [
    { createdAt: params.order },
    { id: params.order }
  ]
  const [items, total] = await prisma.$transaction([
    prisma.comment.findMany({
      where,
      orderBy,
      take: params.limit,
      skip: (params.page - 1) * params.limit
    }),
    prisma.comment.count({ where })
  ])
  return {
    items: items.map(toCommentDTO),
    total,
    page: params.page,
    limit: params.limit
  }
}

/** 仅 PUBLISHED 可评（FR-14）：不可见 → 404 不泄露存在性；可见但非 PUBLISHED → 422 */
export const createComment = async (
  user: AuthUser,
  postId: number,
  content: string
) => {
  const post = await prisma.post.findFirst({
    where: { id: postId, deletedAt: null }
  })
  if (!post) throw apiError.notFound()
  if (
    post.status !== 'PUBLISHED' &&
    !isStaff(user) &&
    user.id !== post.authorId
  ) {
    throw apiError.notFound()
  }
  if (post.status !== 'PUBLISHED')
    throw apiError.unprocessable('仅已发布文章可评论')

  // 计数与评论写入同事务（FR-14）：两边要么都发生要么都不发生
  const comment = await prisma.$transaction(async (tx) => {
    const created = await tx.comment.create({
      data: { postId, authorId: user.id, content }
    })
    await tx.post.update({
      where: { id: postId },
      data: { commentCount: { increment: 1 } }
    })
    return created
  })
  await cacheDel(postDetailKey(postId)) // commentCount 进了详情 DTO，评论增删须失效缓存（FR-7）
  return toCommentDTO(comment)
}

/** 删评论（软删）= 作者本人或 editor/admin（FR-14）；commentCount 同事务回减 */
export const softDeleteComment = async (
  user: AuthUser,
  postId: number,
  commentId: number
) => {
  const comment = await prisma.comment.findFirst({
    where: { id: commentId, postId, deletedAt: null }
  })
  if (!comment) throw apiError.notFound()
  if (comment.authorId !== user.id && !isStaff(user)) throw apiError.forbidden()

  await prisma.$transaction(async (tx) => {
    const res = await tx.comment.updateMany({
      where: { id: commentId, postId, deletedAt: null },
      data: { deletedAt: new Date() }
    })
    if (res.count === 0) throw apiError.notFound() // 并发双删：第二个请求 404
    await tx.post.update({
      where: { id: postId },
      data: { commentCount: { decrement: 1 } }
    })
  })
  await cacheDel(postDetailKey(postId)) // FR-7 失效
  return { ok: true }
}
