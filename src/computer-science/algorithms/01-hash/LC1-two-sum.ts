/**
 * LC1 - Two Sum
 * 分类：哈希 | 难度：简单
 * 复杂度：时间 O(n)，空间 O(n)
 */
function twoSum(nums: number[], target: number): number[] {
  const seen = new Map<number, number>()
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i]
    if (seen.has(complement)) {
      return [seen.get(complement)!, i]
    }
    seen.set(nums[i], i)
  }
  return []
}

export { twoSum }
