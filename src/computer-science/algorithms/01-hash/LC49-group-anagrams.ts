/**
 * LC49 - Group Anagrams
 * 分类：哈希 | 难度：中等
 * 复杂度：时间 O(n·k)，空间 O(n·k)，k 为字符串最大长度
 */
function groupAnagrams(strs: string[]): string[][] {
  const map = new Map<string, string[]>()

  for (const s of strs) {
    const count = new Array(26).fill(0)
    for (const ch of s) {
      count[ch.charCodeAt(0) - 97]++
    }
    const key = count.join(',')
    const group = map.get(key)
    if (group) {
      group.push(s)
    } else {
      map.set(key, [s])
    }
  }

  return [...map.values()]
}

export { groupAnagrams }
