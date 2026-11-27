import { expect, test } from 'bun:test'
import { checkAnchorUnit } from './grammar-rules.ts'

const unitOf = (id: string) => {
  if (id === 'p01' || id === 'p02') return { unit: { id: 'pilot' } }
  if (id === 'p03') return { unit: { id: 'other' } }
  return undefined
}

test('同单元锚句通过', () => {
  expect(checkAnchorUnit('p01', 'p02', unitOf)).toBeNull()
})

test('跨单元锚句必须失败', () => {
  expect(checkAnchorUnit('p01', 'p03', unitOf)).toContain('跨单元')
})

test('引用不存在的讲必须失败', () => {
  expect(checkAnchorUnit('p01', 'p99', unitOf)).toContain('不存在')
})
