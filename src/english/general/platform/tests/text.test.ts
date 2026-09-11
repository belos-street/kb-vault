import { describe, expect, test } from 'bun:test'
import { normalizeText, stem, usesAnyWord } from '../src/app/utils/text.ts'
import { initialHint } from '../src/app/utils/select.ts'

describe('normalizeText', () => {
  test('小写、去标点、压缩空白', () => {
    expect(normalizeText('Hello,  World! It is fine.')).toBe(
      'hello world it is fine'
    )
  })
  test('非 ASCII 字符被剔除', () => {
    expect(normalizeText('现在 × 完成')).toBe('现在 完成')
  })
})

describe('stem', () => {
  test('规则动词 -s / -es', () => {
    expect(stem('checks')).toBe('check')
    expect(stem('keeps')).toBe('keep')
    expect(stem('watches')).toBe('watch')
  })
  test('规则动词 -ed / -ing', () => {
    expect(stem('restarted')).toBe('restart')
    expect(stem('running')).toBe('run')
    expect(stem('checking')).toBe('check')
  })
  test('名词复数', () => {
    expect(stem('tasks')).toBe('task')
    expect(stem('tickets')).toBe('ticket')
    expect(stem('stories')).toBe('story')
  })
  test('已知缺陷边界：-e 结尾动词 -ed/-ing 需配合 usesAnyWord 双形式兜底', () => {
    // stem 本体不还原 e（T2 修在 usesAnyWord）
    expect(stem('automated')).toBe('automat')
    expect(stem('having')).toBe('hav')
  })
})

describe('usesAnyWord', () => {
  const words = new Set(['automate', 'have', 'check', 'run', 'task'])
  test('原形命中', () => {
    expect(usesAnyWord('I check the logs.', words)).toBe(true)
  })
  test('规则变形命中', () => {
    expect(usesAnyWord('He runs the tests.', words)).toBe(true)
    expect(usesAnyWord('Two tasks pending.', words)).toBe(true)
  })
  test('-e 结尾动词双形式兜底（T2）', () => {
    expect(usesAnyWord('Status tasks get automated.', words)).toBe(true)
    expect(usesAnyWord('Having fun.', words)).toBe(true)
  })
  test('不含词表词 → false', () => {
    expect(usesAnyWord('Nothing matches here.', words)).toBe(false)
  })
})

describe('initialHint', () => {
  test('保留大小写与标点，非首字母替换为下划线（T7）', () => {
    expect(initialHint('Friday, 5 p.m.')).toBe('F_____, 5 p._.')
  })
  test('普通句子', () => {
    expect(initialHint('My butler helps too.')).toBe('M_ b_____ h____ t__.')
  })
})
