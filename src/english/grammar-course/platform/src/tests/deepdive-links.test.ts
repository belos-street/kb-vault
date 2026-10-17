import { describe, expect, test } from 'bun:test'
import { resolveDeepDiveUrl, slugify } from '../scripts/deepdive-links.ts'

// 深读跳转锚点口径（T11）：slugify 必须与 VitePress 线上产物逐字一致——
// 下面取自 2026-10-16 线上讲义页 heading id 实测值，改 slugify 必须同步线上比对。
describe('slugify（VitePress 锚点复刻）', () => {
  test('线上实测 heading id 对齐', () => {
    expect(slugify('2.1 核心推导链：五步走')).toBe('_2-1-核心推导链-五步走')
    expect(
      slugify('2.2 维度①③联手：从动词分类推出五大句型（全合集招牌推导）')
    ).toBe('_2-2-维度13联手-从动词分类推出五大句型-全合集招牌推导')
    expect(slugify('2.3 铁律：系动词后接形容词，不接副词')).toBe(
      '_2-3-铁律-系动词后接形容词-不接副词'
    )
    expect(slugify('1. 为什么需要这个概念')).toBe('_1-为什么需要这个概念')
  })
})

describe('resolveDeepDiveUrl', () => {
  test('Gnn + §小节 → 讲义页锚点链接', () => {
    const url = resolveDeepDiveUrl(
      'G03',
      '动词分类 §2.2 维度①③联手：从动词分类推出五大句型（全合集招牌推导）'
    )
    expect(url).toBe(
      '/kb-vault/english/grammar/02-动词体系/L03-动词分类.html#_2-2-维度13联手-从动词分类推出五大句型-全合集招牌推导'
    )
  })
  test('无法解析 → undefined（调用方硬错）', () => {
    expect(resolveDeepDiveUrl('G99', '不存在 §2.2')).toBeUndefined()
    expect(resolveDeepDiveUrl('G03', '动词分类（无小节号）')).toBeUndefined()
    expect(
      resolveDeepDiveUrl('G03', '动词分类 §9.9 不存在的小节')
    ).toBeUndefined()
  })
})
