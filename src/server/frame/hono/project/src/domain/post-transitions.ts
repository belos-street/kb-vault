import type { Role } from '../types'

export type PostStatus = 'DRAFT' | 'PENDING_REVIEW' | 'PUBLISHED' | 'ARCHIVED'
export type PostAction = 'submit' | 'approve' | 'reject' | 'archive'

export type TransitionRule = {
  to: PostStatus
  /** 允许的角色，与 ownerAllowed 取并集 */
  roles: Role[]
  /** 资源作者本人是否放行 */
  ownerAllowed?: boolean
}

/** 每个动作的源状态（条件更新 where.status 用） */
export const actionOrigin: Record<PostAction, PostStatus> = {
  submit: 'DRAFT',
  approve: 'PENDING_REVIEW',
  reject: 'PENDING_REVIEW',
  archive: 'PUBLISHED',
}

/** 状态机元数据表：角色 × 状态 × 操作 三维判定 */
export const transitions: Record<PostStatus, Partial<Record<PostAction, TransitionRule>>> = {
  DRAFT: { submit: { to: 'PENDING_REVIEW', roles: [], ownerAllowed: true } },
  PENDING_REVIEW: {
    approve: { to: 'PUBLISHED', roles: ['editor', 'admin'] },
    reject: { to: 'DRAFT', roles: ['editor', 'admin'] },
  },
  PUBLISHED: { archive: { to: 'ARCHIVED', roles: ['editor', 'admin'], ownerAllowed: true } },
  ARCHIVED: {},
}

export type Actor = { id: string; role: Role }

export type TransitionDecision =
  | { allowed: true }
  | { allowed: false; reason: 'NO_RULE' | 'FORBIDDEN' }

/** 纯函数：不碰 DB，可独立单测 */
export const canTransition = (
  actor: Actor,
  post: { authorId: string; status: PostStatus },
  action: PostAction,
): TransitionDecision => {
  const rule = transitions[post.status][action]
  if (!rule) return { allowed: false, reason: 'NO_RULE' }
  if (
    rule.roles.includes(actor.role) ||
    (rule.ownerAllowed === true && actor.id === post.authorId)
  ) {
    return { allowed: true }
  }
  return { allowed: false, reason: 'FORBIDDEN' }
}
