import { describe, expect, test } from 'bun:test'
import { diffTokens, isExactDiff } from '../src/app/utils/lcs.ts'

describe('diffTokens', () => {
  test('全等 → 全 equal', () => {
    const ops = diffTokens(['i', 'love', 'code'], ['i', 'love', 'code'])
    expect(ops.every((o) => o.type === 'equal')).toBe(true)
    expect(isExactDiff(ops)).toBe(true)
  })
  test('缺词 → missing（红：应写未写）', () => {
    const ops = diffTokens(['i', 'love', 'code'], ['i', 'code'])
    expect(ops).toEqual([
      { type: 'equal', token: 'i' },
      { type: 'missing', token: 'love' },
      { type: 'equal', token: 'code' }
    ])
  })
  test('多词 → extra（删除线）', () => {
    const ops = diffTokens(['i', 'code'], ['i', 'really', 'code'])
    expect(ops).toEqual([
      { type: 'equal', token: 'i' },
      { type: 'extra', token: 'really' },
      { type: 'equal', token: 'code' }
    ])
  })
  test('交错错位 → missing + extra 混合且不丢 token', () => {
    const ops = diffTokens(
      ['the', 'build', 'failed', 'twice'],
      ['the', 'pipeline', 'failed', 'twice']
    )
    const missing = ops.filter((o) => o.type === 'missing').map((o) => o.token)
    const extra = ops.filter((o) => o.type === 'extra').map((o) => o.token)
    expect(missing).toEqual(['build'])
    expect(extra).toEqual(['pipeline'])
  })
  test('空输入 → 全部 missing', () => {
    const ops = diffTokens(['a', 'b'], [])
    expect(ops).toEqual([
      { type: 'missing', token: 'a' },
      { type: 'missing', token: 'b' }
    ])
  })
})

describe('isExactDiff', () => {
  test('含 missing/extra 即不为全对', () => {
    expect(
      isExactDiff([
        { type: 'equal', token: 'a' },
        { type: 'missing', token: 'b' }
      ])
    ).toBe(false)
  })
})
