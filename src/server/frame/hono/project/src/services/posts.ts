import { prisma } from '../lib/db'
import { apiError } from '../lib/errors'
import {
  actionOrigin,
  transitions,
  type PostAction,
  type PostStatus,
} from '../domain/post-transitions'
import type { AuthUser } from '../types'

type PostRow = {
  id: number
  title: string
  content: string
  status: PostStatus
  version: number
  commentCount: number
  authorId: string
  createdAt: Date
  updatedAt: Date
}

export type PostDTO = {
  id: number
  title: string
  content: string
  status: PostStatus
  version: number
  commentCount: number
  authorId: string
  createdAt: string
  updatedAt: string
}

export const toPostDTO = (p: PostRow): PostDTO => ({
  id: p.id,
  title: p.title,
  content: p.content,
  status: p.status,
  version: p.version,
  commentCount: p.commentCount,
  authorId: p.authorId,
  createdAt: p.createdAt.toISOString(),
  updatedAt: p.updatedAt.toISOString(),
})

const isStaff = (user: AuthUser | undefined) =>
  user?.role === 'editor' || user?.role === 'admin'

/** 可见性矩阵（PRD §4.1.1）：匿名仅 PUBLISHED；登录看 PUBLISHED + 自己的；staff 全量 */
const visibilityWhere = (user: AuthUser | undefined) => {
  if (!user) return { status: 'PUBLISHED' as const }
  if (isStaff(user)) return {}
  return { OR: [{ status: 'PUBLISHED' as const }, { authorId: user.id }] }
}

export type ListPostsParams = {
  page: number
  limit: number
  status?: PostStatus
  authorId?: string
  order: 'asc' | 'desc'
}

export const listPosts = async (user: AuthUser | undefined, params: ListPostsParams) => {
  const where = {
    deletedAt: null,
    ...(params.status ? { status: params.status } : {}),
    ...(params.authorId ? { authorId: params.authorId } : {}),
    ...visibilityWhere(user),
  }
  const [items, total] = await prisma.$transaction([
    prisma.post.findMany({
      where,
      orderBy: { createdAt: params.order },
      take: params.limit,
      skip: (params.page - 1) * params.limit,
    }),
    prisma.post.count({ where }),
  ])
  return { items: items.map(toPostDTO), total, page: params.page, limit: params.limit }
}

export const getVisiblePost = async (user: AuthUser | undefined, id: number) => {
  const post = await prisma.post.findFirst({ where: { id, deletedAt: null } })
  if (!post) throw apiError.notFound()
  if (post.status !== 'PUBLISHED' && !isStaff(user) && user?.id !== post.authorId) {
    throw apiError.notFound() // 不可见一律 404，不泄露存在性
  }
  return toPostDTO(post)
}

export const createPost = async (user: AuthUser, input: { title: string; content: string }) => {
  const post = await prisma.post.create({
    data: { title: input.title, content: input.content, authorId: user.id },
  })
  return toPostDTO(post)
}

export const updatePost = async (
  user: AuthUser,
  id: number,
  input: { title?: string; content?: string; version: number },
) => {
  const post = await prisma.post.findFirst({ where: { id, deletedAt: null } })
  if (!post) throw apiError.notFound()
  if (!isStaff(user) && post.authorId !== user.id) throw apiError.forbidden()
  if (post.status === 'ARCHIVED') throw apiError.unprocessable('归档文章不可编辑')

  // 回查放同事务：updateMany 成功与回查之间若被并发软删，事务外的 findUnique 会 P2025 → 500
  const updated = await prisma.$transaction(async (tx) => {
    const res = await tx.post.updateMany({
      where: { id, version: input.version, deletedAt: null },
      data: {
        ...(input.title !== undefined ? { title: input.title } : {}),
        ...(input.content !== undefined ? { content: input.content } : {}),
        version: { increment: 1 },
      },
    })
    if (res.count === 0) throw apiError.conflict()
    return tx.post.findUniqueOrThrow({ where: { id } })
  })
  return toPostDTO(updated)
}

/** 流转：条件更新 + 0 行回查（已处目标态 → 幂等）+ 流转/审计同事务 */
export const transitionPost = async (
  user: AuthUser,
  id: number,
  action: PostAction,
  reason?: string,
) => {
  const post = await prisma.post.findFirst({ where: { id, deletedAt: null } })
  if (!post) throw apiError.notFound()

  const from = actionOrigin[action]
  const rule = transitions[from][action]
  if (!rule) throw apiError.unprocessable(`状态 ${from} 不支持操作 ${action}`) // 构造上不可达

  const roleOk = rule.roles.includes(user.role)
  const ownerOk = rule.ownerAllowed === true && post.authorId === user.id
  if (!roleOk && !ownerOk) {
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'POST_TRANSITION',
        resource: `post:${id}`,
        detail: `${action}（要求源状态 ${from}）`,
        result: 'DENIED',
      },
    })
    throw apiError.forbidden()
  }

  const to = rule.to
  const updated = await prisma.$transaction(async (tx) => {
    const res = await tx.post.updateMany({
      where: { id, status: from, deletedAt: null },
      data: { status: to },
    })
    if (res.count === 0) {
      const current = await tx.post.findFirst({ where: { id, deletedAt: null } })
      if (!current) throw apiError.notFound()
      if (current.status === to) return current // 重复请求：已处目标态 → 幂等成功
      throw apiError.unprocessable(`非法流转：当前状态 ${current.status} 不能执行 ${action}`)
    }
    await tx.auditLog.create({
      data: {
        userId: user.id,
        action: 'POST_TRANSITION',
        resource: `post:${id}`,
        detail: `${from} -> ${to}${reason ? ` | ${reason}` : ''}`,
        result: 'OK',
      },
    })
    return tx.post.findUniqueOrThrow({ where: { id } })
  })
  return toPostDTO(updated)
}

/** 软删 + 级联软删评论 + 审计（同事务） */
export const softDeletePost = async (user: AuthUser, id: number) => {
  const post = await prisma.post.findFirst({ where: { id, deletedAt: null } })
  if (!post) throw apiError.notFound()
  if (!isStaff(user) && post.authorId !== user.id) throw apiError.forbidden()

  const deleted = await prisma.$transaction(async (tx) => {
    const { count } = await tx.post.updateMany({
      where: { id, deletedAt: null },
      data: { deletedAt: new Date() },
    })
    if (count > 0) {
      await tx.comment.updateMany({
        where: { postId: id, deletedAt: null },
        data: { deletedAt: new Date() },
      })
      await tx.auditLog.create({
        data: { userId: user.id, action: 'DELETE_POST', resource: `post:${id}`, result: 'OK' },
      })
    }
    return count
  })
  if (deleted === 0) throw apiError.notFound()
  return { ok: true }
}
