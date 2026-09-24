import { describe, expect, it } from 'bun:test'
import { actionOrigin, canTransition, transitions, type PostAction } from '../domain/post-transitions'

describe('状态机元数据（表驱动）', () => {
  const author = { id: 'a1', role: 'reader' as const }
  const otherReader = { id: 'b1', role: 'reader' as const }
  const editor = { id: 'e1', role: 'editor' as const }
  const admin = { id: 'ad1', role: 'admin' as const }

  it('submit：仅作者本人可提交自己的 DRAFT', () => {
    expect(
      canTransition(author, { status: 'DRAFT', authorId: author.id }, 'submit').allowed,
    ).toBe(true)
    expect(
      canTransition(otherReader, { status: 'DRAFT', authorId: author.id }, 'submit').allowed,
    ).toBe(false)
  })

  it('approve：editor/admin 可，作者本人（reader）不可', () => {
    expect(
      canTransition(editor, { status: 'PENDING_REVIEW', authorId: author.id }, 'approve')
        .allowed,
    ).toBe(true)
    expect(
      canTransition(admin, { status: 'PENDING_REVIEW', authorId: author.id }, 'approve').allowed,
    ).toBe(true)
    expect(
      canTransition(author, { status: 'PENDING_REVIEW', authorId: author.id }, 'approve')
        .allowed,
    ).toBe(false)
  })

  it('reject：editor/admin 可', () => {
    expect(
      canTransition(editor, { status: 'PENDING_REVIEW', authorId: author.id }, 'reject').allowed,
    ).toBe(true)
    expect(
      canTransition(otherReader, { status: 'PENDING_REVIEW', authorId: author.id }, 'reject')
        .allowed,
    ).toBe(false)
  })

  it('archive：editor/admin 或作者本人', () => {
    expect(
      canTransition(author, { status: 'PUBLISHED', authorId: author.id }, 'archive').allowed,
    ).toBe(true)
    expect(
      canTransition(editor, { status: 'PUBLISHED', authorId: author.id }, 'archive').allowed,
    ).toBe(true)
    expect(
      canTransition(otherReader, { status: 'PUBLISHED', authorId: author.id }, 'archive')
        .allowed,
    ).toBe(false)
  })

  it('ARCHIVED 无出边（终态）', () => {
    expect(
      canTransition(admin, { status: 'ARCHIVED', authorId: author.id }, 'submit').allowed,
    ).toBe(false)
    expect(
      canTransition(admin, { status: 'ARCHIVED', authorId: author.id }, 'approve').allowed,
    ).toBe(false)
  })

  it('actionOrigin 的每条边都在元数据表中有规则', () => {
    for (const [action, from] of Object.entries(actionOrigin)) {
      expect(transitions[from][action as PostAction]).toBeDefined()
    }
  })
})
