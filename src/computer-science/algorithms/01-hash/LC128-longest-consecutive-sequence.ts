/**
 * LC128 - Longest Consecutive Sequence
 * 分类：哈希 | 难度：中等
 * 复杂度：时间 O(n)，空间 O(n)
 */
function longestConsecutive(nums: number[]): number {
  const set = new Set(nums);
  let longest = 0;

  for (const num of set) {
    // 只从序列起点开始计数（num-1 不存在说明是起点）
    if (!set.has(num - 1)) {
      let current = num;
      let length = 1;
      while (set.has(current + 1)) {
        current++;
        length++;
      }
      longest = Math.max(longest, length);
    }
  }

  return longest;
}

export { longestConsecutive };
