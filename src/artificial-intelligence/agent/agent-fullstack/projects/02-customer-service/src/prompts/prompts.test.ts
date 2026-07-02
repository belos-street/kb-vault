import { describe, expect, it } from 'bun:test'
import { systemPrompt } from './system.ts'

describe('system prompt', () => {
  it('包含角色定义', () => {
    expect(systemPrompt).toContain('礼貌')
    expect(systemPrompt).toContain('专业')
  })

  it('包含可用工具说明', () => {
    expect(systemPrompt).toContain('queryOrder')
    expect(systemPrompt).toContain('createRefund')
    expect(systemPrompt).toContain('searchKnowledge')
    expect(systemPrompt).toContain('createTicket')
  })

  it('包含拒绝非业务问题的策略', () => {
    expect(systemPrompt).toContain('非业务')
  })

  it('包含情绪管理策略', () => {
    expect(systemPrompt).toContain('情绪')
  })

  it('包含至少 5 组 Few-shot 示例', () => {
    const matches = systemPrompt.match(/示例 \d+/g) ?? []
    expect(matches.length).toBeGreaterThanOrEqual(5)
  })
})
