import { describe, expect, it } from 'bun:test'
import { scaledDotProductAttention, softmax } from './src/index'

function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0)
}

describe('softmax', () => {
  it('相同分数得到均分概率', () => {
    expect(softmax([0, 0])).toEqual([0.5, 0.5])
  })

  it('数值稳定：1000 与 1000 不产生 NaN', () => {
    const result = softmax([1000, 1000])
    expect(result.every((value) => Number.isFinite(value))).toBe(true)
    expect(result[0]).toBeCloseTo(0.5, 6)
    expect(result[1]).toBeCloseTo(0.5, 6)
  })

  it('输出是概率分布且保持单调', () => {
    const result = softmax([1, 2, 3])
    expect(sum(result)).toBeCloseTo(1, 6)
    expect(result[0] ?? 0).toBeLessThan(result[1] ?? 0)
    expect(result[1] ?? 0).toBeLessThan(result[2] ?? 0)
  })

  it('空数组抛 RangeError', () => {
    expect(() => softmax([])).toThrow(RangeError)
  })

  it('非有限值抛 RangeError', () => {
    expect(() => softmax([1, Number.NaN])).toThrow(RangeError)
    expect(() => softmax([1, Number.POSITIVE_INFINITY])).toThrow(RangeError)
    expect(() => softmax([1, Number.NEGATIVE_INFINITY])).toThrow(RangeError)
  })
})

describe('scaledDotProductAttention', () => {
  it('按缩放后的相似度加权求和', () => {
    const output = scaledDotProductAttention(
      [1, 0],
      [
        [1, 0],
        [0, 1]
      ],
      [
        [1, 0],
        [0, 1]
      ]
    )

    expect(output).toHaveLength(2)
    expect(output[0]).toBeCloseTo(0.6698, 3)
    expect(output[1]).toBeCloseTo(0.3302, 3)
  })

  it('缩放因子是 sqrt(d) 而不是 d', () => {
    const output = scaledDotProductAttention(
      [1, 1],
      [
        [1, 1],
        [0, 0]
      ],
      [
        [1, 0],
        [0, 1]
      ]
    )

    expect(output[0]).toBeCloseTo(0.8044, 3)
    expect(output[1]).toBeCloseTo(0.1956, 3)
  })

  it('只有一个 key 时直接返回对应的 value', () => {
    const output = scaledDotProductAttention([0, 1], [[0, 1]], [[2, 3]])
    expect(output).toEqual([2, 3])
  })

  it('维度不一致抛 RangeError', () => {
    expect(() =>
      scaledDotProductAttention([1, 0, 1], [[1, 0]], [[1, 0]])
    ).toThrow(RangeError)
  })

  it('keys 为空抛 RangeError', () => {
    expect(() => scaledDotProductAttention([1, 0], [], [])).toThrow(RangeError)
  })

  it('keys 与 values 数量不一致抛 RangeError', () => {
    expect(() =>
      scaledDotProductAttention(
        [1, 0],
        [
          [1, 0],
          [0, 1]
        ],
        [[1, 0]]
      )
    ).toThrow(RangeError)
  })
})
