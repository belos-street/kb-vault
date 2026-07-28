import { describe, it, expect } from 'bun:test';
import { longestConsecutive } from './LC128-longest-consecutive-sequence';

describe('LC128 Longest Consecutive Sequence', () => {
  it('normal case', () => {
    expect(longestConsecutive([100, 4, 200, 1, 3, 2])).toBe(4); // 1,2,3,4
  });

  it('longer sequence', () => {
    expect(longestConsecutive([0, 3, 7, 2, 5, 8, 4, 6, 0, 1])).toBe(9); // 0-8
  });

  it('empty array', () => {
    expect(longestConsecutive([])).toBe(0);
  });

  it('single element', () => {
    expect(longestConsecutive([1])).toBe(1);
  });

  it('duplicates', () => {
    expect(longestConsecutive([1, 2, 2, 3, 3, 3])).toBe(3); // 1,2,3
  });

  it('negative numbers', () => {
    expect(longestConsecutive([-3, -2, -1, 0, 5])).toBe(4); // -3,-2,-1,0
  });

  it('no consecutive', () => {
    expect(longestConsecutive([10, 20, 30])).toBe(1);
  });
});
