import { describe, it, expect } from 'bun:test'
import { twoSum } from './LC1-two-sum'

describe('LC1 Two Sum', () => {
  it('normal case', () => {
    expect(twoSum([2, 7, 11, 15], 9)).toEqual([0, 1])
  })

  it('answer not first two elements', () => {
    expect(twoSum([3, 2, 4], 6)).toEqual([1, 2])
  })

  it('duplicate elements', () => {
    expect(twoSum([3, 3], 6)).toEqual([0, 1])
  })

  it('negative numbers', () => {
    expect(twoSum([-1, -2, -3, -4, -5], -8)).toEqual([2, 4])
  })

  it('zero in array', () => {
    expect(twoSum([0, 4, 3, 0], 0)).toEqual([0, 3])
  })
})
