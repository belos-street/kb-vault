import { describe, expect, test } from 'bun:test'
import {
  answerEquals,
  judgeBlank,
  judgeFill,
  normalizeAnswer
} from '../normalize.ts'

describe('normalizeAnswer', () => {
  test('大小写不敏感', () => {
    expect(normalizeAnswer('The Wolf')).toBe('the wolf')
  })
  test('首尾空白不敏感、内部空白折叠', () => {
    expect(normalizeAnswer('  The   wolf  ')).toBe('the wolf')
  })
  test('标点不敏感（半角 + 全角 + 破折号）', () => {
    expect(normalizeAnswer('The wolf,')).toBe('the wolf')
    expect(normalizeAnswer('主 + 动！')).toBe('主 动')
    expect(normalizeAnswer('em dash（—）')).toBe('em dash')
  })
})

describe('answerEquals', () => {
  test('分词差容错：主+动+宾 ≍ 主 + 动 + 宾 ≍ 主 动 宾', () => {
    expect(answerEquals('主+动+宾', '主 + 动 + 宾')).toBe(true)
    expect(answerEquals('主+动+宾', '主 动 宾')).toBe(true)
  })
  test('无词干还原：snows ≠ snow', () => {
    expect(answerEquals('snows', 'snow')).toBe(false)
    expect(answerEquals('Wolves', 'wolves')).toBe(true)
  })
  test('单比对仍精确', () => {
    expect(answerEquals('the king', 'the king')).toBe(true)
    expect(answerEquals('the king', 'king')).toBe(false)
  })
})

describe('judgeBlank', () => {
  const plain = ['the']
  const emptyOk = ['']

  test('普通空：命中可接受答案', () => {
    expect(judgeBlank('The', plain)).toBe(true)
    expect(judgeBlank('a', plain)).toBe(false)
  })
  test('多可接受答案任一匹配', () => {
    expect(
      judgeBlank('leave a carrot for you', [
        'leave you a carrot',
        'leave a carrot for you'
      ])
    ).toBe(true)
  })
  test('「不填」合法空：空串 / ∅ / 「不填」字样都算对', () => {
    expect(judgeBlank('', emptyOk)).toBe(true)
    expect(judgeBlank('∅', emptyOk)).toBe(true)
    expect(judgeBlank('不填', emptyOk)).toBe(true)
    expect(judgeBlank('the', emptyOk)).toBe(false)
  })
  test('普通空不允许空串', () => {
    expect(judgeBlank('', plain)).toBe(false)
  })
})

describe('judgeFill', () => {
  const blanks = [['me'], ['']]
  test('题粒度：全对才 ok', () => {
    expect(judgeFill(['ME', ''], blanks)).toEqual({
      ok: true,
      perBlank: [true, true]
    })
    expect(judgeFill(['me', 'the'], blanks)).toEqual({
      ok: false,
      perBlank: [true, false]
    })
    expect(judgeFill(['you', ''], blanks).ok).toBe(false)
  })
})

// drill 判分口径（T9）：逐槽 judgeBlank + 题级全槽对才 ✓。
// 用真实 U01L03 P2 多槽题（sit→sits、think→thinks）锚定。
describe('drill 判分（practice.tsx 同口径）', () => {
  const judgeDrill = (inputs: string[], slots: string[][]): boolean =>
    slots.every((acc, i) => judgeBlank(inputs[i] ?? '', acc))

  test('多槽题：全槽对才 ok', () => {
    const slots = [['sits'], ['thinks']]
    expect(judgeDrill(['Sits', 'THINKS'], slots)).toBe(true)
    expect(judgeDrill(['sits', 'think'], slots)).toBe(false)
    expect(judgeDrill(['', 'thinks'], slots)).toBe(false)
  })
  test('多可接受答案槽：任一匹配即槽对', () => {
    const slots = [
      ['sit', 'sits'],
      ['think', 'thinks']
    ]
    expect(judgeDrill(['sit', 'thinks'], slots)).toBe(true)
    expect(judgeDrill(['sits', 'think'], slots)).toBe(true)
    expect(judgeDrill(['sat', 'thinks'], slots)).toBe(false)
  })
  test('无词干还原：第三人称单数不匹配原形', () => {
    expect(judgeBlank('watch', ['watches'])).toBe(false)
    expect(judgeBlank('Watches', ['watches'])).toBe(true)
  })
})
