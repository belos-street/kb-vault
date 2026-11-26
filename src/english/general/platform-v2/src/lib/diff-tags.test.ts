import { describe, expect, test } from 'bun:test'
import { suggestTag } from './diff-tags.ts'

describe('suggestTag', () => {
  test('两句一致时不入账', () => {
    expect(
      suggestTag('The shop opens at six.', 'The shop opens at six.')
    ).toBeNull()
  })

  test('第三人称 -s 判为主谓一致', () => {
    const result = suggestTag(
      'She open the shop at six.',
      'She opens the shop at six.'
    )
    expect(result?.patternKey).toBe('third-person-s')
    expect(result?.tag).toBe('agreement')
    expect(result?.comparable).toBe(true)
  })

  test('名词复数判为单复数', () => {
    const result = suggestTag('I bought two book.', 'I bought two books.')
    expect(result?.patternKey).toBe('plural-s')
    expect(result?.tag).toBe('noun-number')
  })

  test('冠词互换', () => {
    const result = suggestTag('He is a engineer.', 'He is an engineer.')
    expect(result?.patternKey).toBe('a-vs-the')
    expect(result?.tag).toBe('article')
  })

  test('介词不同', () => {
    const result = suggestTag(
      'The shop opens in six.',
      'The shop opens at six.'
    )
    expect(result?.patternKey).toBe('prep-usage')
    expect(result?.tag).toBe('preposition')
  })

  test('词相同、顺序不同判为语序', () => {
    const result = suggestTag(
      'I order always the same bowl.',
      'I always order the same bowl.'
    )
    expect(result?.patternKey).toBe('word-order')
  })

  test('多余的 have 判为完成体混用', () => {
    const result = suggestTag(
      'I finished it yesterday.',
      'I have finished it yesterday.'
    )
    expect(result?.patternKey).toBe('present-perfect-vs-past')
    expect(result?.tag).toBe('tense')
  })

  test('缺 be 动词判为 be 动词缺失', () => {
    const result = suggestTag('There a table.', 'There is a table.')
    expect(result?.patternKey).toBe('be-verb')
  })

  test('there be 与 have 混用', () => {
    const result = suggestTag(
      'There have a small table by the door.',
      'There is a small table by the door.'
    )
    expect(result?.patternKey).toBe('there-be-agreement')
    expect(result?.tag).toBe('agreement')
  })

  test('只差 oclock 这类词时不入账', () => {
    const result = suggestTag('It is eleven oclock.', 'It is eleven.')
    expect(result?.comparable).toBe(false)
  })

  test('拼写接近', () => {
    const result = suggestTag('bakary', 'bakery')
    expect(result?.patternKey).toBe('spelling')
  })

  test('一个实词换另一个实词落到搭配', () => {
    const result = suggestTag('do a decision', 'make a decision')
    expect(result?.patternKey).toBe('collocation')
  })

  test('规则判断不了时进未分类', () => {
    const result = suggestTag('I very like it.', 'I like it very much.')
    expect(result?.patternKey).toBe('unknown')
    expect(result?.tag).toBe('unsorted')
  })

  test('句子与参考几乎无关时不可入账', () => {
    const result = suggestTag(
      'I go to a small coffee shop near my home every morning.',
      'The noodle shop opens at eleven.'
    )
    expect(result?.comparable).toBe(false)
  })
})
