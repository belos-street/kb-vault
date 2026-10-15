import { describe, expect, test } from 'bun:test'
import {
  answerEquals,
  judgeBlank,
  judgeFill,
  normalizeAnswer
} from '../normalize.ts'
import type { Blank } from '../schema/lesson.ts'

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
  test('多可接受答案任一匹配由 judgeBlank 承担，单比对仍精确', () => {
    expect(answerEquals('the king', 'the king')).toBe(true)
    expect(answerEquals('the king', 'king')).toBe(false)
  })
})

describe('judgeBlank', () => {
  const plain: Blank = { accepts: ['the'], allowEmpty: false }
  const emptyOk: Blank = { accepts: [''], allowEmpty: true }

  test('普通空：命中可接受答案', () => {
    expect(judgeBlank('The', plain)).toBe(true)
    expect(judgeBlank('a', plain)).toBe(false)
  })
  test('多可接受答案任一匹配', () => {
    const multi: Blank = {
      accepts: ['leave you a carrot', 'leave a carrot for you'],
      allowEmpty: false
    }
    expect(judgeBlank('leave a carrot for you', multi)).toBe(true)
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
  const blanks: Blank[] = [
    { accepts: ['me'], allowEmpty: false },
    { accepts: [''], allowEmpty: true }
  ]
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
