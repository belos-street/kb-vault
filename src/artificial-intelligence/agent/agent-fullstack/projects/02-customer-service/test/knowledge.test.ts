import { describe, expect, test } from 'bun:test'
import { searchKnowledge } from '../src/services/knowledge'

describe('searchKnowledge', () => {
  test('「退货政策」能命中', () => {
    const results = searchKnowledge('你们的退货政策是什么？')
    expect(results.length).toBeGreaterThan(0)
    expect(results[0].question).toContain('退货')
  })

  test('「退款多久到账」命中退款时效条目', () => {
    const results = searchKnowledge('退款多久到账')
    expect(results.length).toBeGreaterThan(0)
    expect(results[0].answer).toContain('工作日')
  })

  test('「物流」类问题命中物流条目', () => {
    const results = searchKnowledge('我的快递到哪了')
    expect(results.length).toBeGreaterThan(0)
    expect(results.some((r) => r.question.includes('物流'))).toBe(true)
  })

  test('无关问题返回空数组', () => {
    expect(searchKnowledge('你们的 CEO 是谁')).toEqual([])
  })

  test('topK 生效', () => {
    const results = searchKnowledge('退货 退款 运费 快递', 2)
    expect(results.length).toBeLessThanOrEqual(2)
  })

  test('空查询返回空数组', () => {
    expect(searchKnowledge('')).toEqual([])
  })
})
