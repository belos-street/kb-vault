# Algorithms — LeetCode 热题 100（面试向）

> 基于 [LeetCode 热题 HOT 100](https://leetcode.cn/studyplan/top-100-liked/) 官方题单，按分类刷题，TypeScript 实现，面向技术面试。

---

## 环境

使用 [Bun](https://bun.sh) 运行代码和单元测试（内置 test runner，无需额外安装 vitest/jest）。

```bash
# 初始化（已完成）
cd src/computer-science/algorithms
bun init

# 运行单个测试
bun test 01-hash/LC1-two-sum.test.ts

# 运行全部测试
bun test
```

---

## 刷题策略

1. **按分类刷**：每个分类集中突破，掌握该题型的通用模板
2. **先想后写**：每题先写思路（3 句话），再写代码
3. **复盘优先**：做完标记 ✅，二刷只刷 ❌ 和 ⚠️
4. **面试表达**：每题准备 1 分钟口述版（思路 + 复杂度 + 为什么选这个方案）

---

## 目录结构

```text
src/computer-science/algorithms/
├── readme.md                        # 本文件（题单总览 + 进度）
├── 01-hash/                         # 哈希
├── 02-two-pointers/                 # 双指针
├── 03-sliding-window/               # 滑动窗口
├── 04-substring/                    # 子串
├── 05-array/                        # 普通数组
├── 06-matrix/                       # 矩阵
├── 07-linked-list/                  # 链表
├── 08-binary-tree/                  # 二叉树
├── 09-graph/                        # 图论
├── 10-backtracking/                 # 回溯
├── 11-binary-search/                # 二分查找
├── 12-stack/                        # 栈
├── 13-heap/                         # 堆
├── 14-greedy/                       # 贪心算法
├── 15-dp/                           # 动态规划
├── 16-dp-multidim/                  # 多维动态规划
└── 17-techniques/                   # 技巧
```

---

## 题单与进度

> 状态：✅ 已掌握 | ⚠️ 需二刷 | ❌ 未做（已完成的题状态可点击跳转笔记）

### 01 哈希

| # | 题目 | 难度 | 状态 |
|---|------|:--:|:--:|
| 1 | [两数之和](https://leetcode.cn/problems/two-sum/) | 简单 | [✅](01-hash/LC1-two-sum.md) |
| 49 | [字母异位词分组](https://leetcode.cn/problems/group-anagrams/) | 中等 | [✅](01-hash/LC49-group-anagrams.md) |
| 128 | [最长连续序列](https://leetcode.cn/problems/longest-consecutive-sequence/) | 中等 | [✅](01-hash/LC128-longest-consecutive-sequence.md) |

### 02 双指针

| # | 题目 | 难度 | 状态 |
|---|------|:--:|:--:|
| 283 | [移动零](https://leetcode.cn/problems/move-zeroes/) | 简单 | ❌ |
| 11 | [盛最多水的容器](https://leetcode.cn/problems/container-with-most-water/) | 中等 | ❌ |
| 15 | [三数之和](https://leetcode.cn/problems/3sum/) | 中等 | ❌ |
| 42 | [接雨水](https://leetcode.cn/problems/trapping-rain-water/) | 困难 | ❌ |

### 03 滑动窗口

| # | 题目 | 难度 | 状态 |
|---|------|:--:|:--:|
| 3 | [无重复字符的最长子串](https://leetcode.cn/problems/longest-substring-without-repeating-characters/) | 中等 | ❌ |
| 438 | [找到字符串中所有字母异位词](https://leetcode.cn/problems/find-all-anagrams-in-a-string/) | 中等 | ❌ |

### 04 子串

| # | 题目 | 难度 | 状态 |
|---|------|:--:|:--:|
| 560 | [和为 K 的子数组](https://leetcode.cn/problems/subarray-sum-equals-k/) | 中等 | ❌ |
| 239 | [滑动窗口最大值](https://leetcode.cn/problems/sliding-window-maximum/) | 困难 | ❌ |
| 76 | [最小覆盖子串](https://leetcode.cn/problems/minimum-window-substring/) | 困难 | ❌ |

### 05 普通数组

| # | 题目 | 难度 | 状态 |
|---|------|:--:|:--:|
| 53 | [最大子数组和](https://leetcode.cn/problems/maximum-subarray/) | 中等 | ❌ |
| 56 | [合并区间](https://leetcode.cn/problems/merge-intervals/) | 中等 | ❌ |
| 189 | [轮转数组](https://leetcode.cn/problems/rotate-array/) | 中等 | ❌ |
| 238 | [除自身以外数组的乘积](https://leetcode.cn/problems/product-of-array-except-self/) | 中等 | ❌ |
| 41 | [缺失的第一个正数](https://leetcode.cn/problems/first-missing-positive/) | 困难 | ❌ |

### 06 矩阵

| # | 题目 | 难度 | 状态 |
|---|------|:--:|:--:|
| 73 | [矩阵置零](https://leetcode.cn/problems/set-matrix-zeroes/) | 中等 | ❌ |
| 54 | [螺旋矩阵](https://leetcode.cn/problems/spiral-matrix/) | 中等 | ❌ |
| 48 | [旋转图像](https://leetcode.cn/problems/rotate-image/) | 中等 | ❌ |
| 240 | [搜索二维矩阵 II](https://leetcode.cn/problems/search-a-2d-matrix-ii/) | 中等 | ❌ |

### 07 链表

| # | 题目 | 难度 | 状态 |
|---|------|:--:|:--:|
| 160 | [相交链表](https://leetcode.cn/problems/intersection-of-two-linked-lists/) | 简单 | ❌ |
| 206 | [反转链表](https://leetcode.cn/problems/reverse-linked-list/) | 简单 | ❌ |
| 234 | [回文链表](https://leetcode.cn/problems/palindrome-linked-list/) | 简单 | ❌ |
| 141 | [环形链表](https://leetcode.cn/problems/linked-list-cycle/) | 简单 | ❌ |
| 142 | [环形链表 II](https://leetcode.cn/problems/linked-list-cycle-ii/) | 中等 | ❌ |
| 21 | [合并两个有序链表](https://leetcode.cn/problems/merge-two-sorted-lists/) | 简单 | ❌ |
| 2 | [两数相加](https://leetcode.cn/problems/add-two-numbers/) | 中等 | ❌ |
| 19 | [删除链表的倒数第 N 个结点](https://leetcode.cn/problems/remove-nth-node-from-end-of-list/) | 中等 | ❌ |
| 24 | [两两交换链表中的节点](https://leetcode.cn/problems/swap-nodes-in-pairs/) | 中等 | ❌ |
| 25 | [K 个一组翻转链表](https://leetcode.cn/problems/reverse-nodes-in-k-group/) | 困难 | ❌ |
| 138 | [随机链表的复制](https://leetcode.cn/problems/copy-list-with-random-pointer/) | 中等 | ❌ |
| 148 | [排序链表](https://leetcode.cn/problems/sort-list/) | 中等 | ❌ |
| 23 | [合并 K 个升序链表](https://leetcode.cn/problems/merge-k-sorted-lists/) | 困难 | ❌ |
| 146 | [LRU 缓存](https://leetcode.cn/problems/lru-cache/) | 中等 | ❌ |

### 08 二叉树

| # | 题目 | 难度 | 状态 |
|---|------|:--:|:--:|
| 94 | [二叉树的中序遍历](https://leetcode.cn/problems/binary-tree-inorder-traversal/) | 简单 | ❌ |
| 104 | [二叉树的最大深度](https://leetcode.cn/problems/maximum-depth-of-binary-tree/) | 简单 | ❌ |
| 226 | [翻转二叉树](https://leetcode.cn/problems/invert-binary-tree/) | 简单 | ❌ |
| 101 | [对称二叉树](https://leetcode.cn/problems/symmetric-tree/) | 简单 | ❌ |
| 543 | [二叉树的直径](https://leetcode.cn/problems/diameter-of-binary-tree/) | 简单 | ❌ |
| 102 | [二叉树的层序遍历](https://leetcode.cn/problems/binary-tree-level-order-traversal/) | 中等 | ❌ |
| 108 | [将有序数组转换为二叉搜索树](https://leetcode.cn/problems/convert-sorted-array-to-binary-search-tree/) | 简单 | ❌ |
| 98 | [验证二叉搜索树](https://leetcode.cn/problems/validate-binary-search-tree/) | 中等 | ❌ |
| 230 | [二叉搜索树中第 K 小的元素](https://leetcode.cn/problems/kth-smallest-element-in-a-bst/) | 中等 | ❌ |
| 199 | [二叉树的右视图](https://leetcode.cn/problems/binary-tree-right-side-view/) | 中等 | ❌ |
| 114 | [二叉树展开为链表](https://leetcode.cn/problems/flatten-binary-tree-to-linked-list/) | 中等 | ❌ |
| 105 | [从前序与中序遍历序列构造二叉树](https://leetcode.cn/problems/construct-binary-tree-from-preorder-and-inorder-traversal/) | 中等 | ❌ |
| 437 | [路径总和 III](https://leetcode.cn/problems/path-sum-iii/) | 中等 | ❌ |
| 236 | [二叉树的最近公共祖先](https://leetcode.cn/problems/lowest-common-ancestor-of-a-binary-tree/) | 中等 | ❌ |
| 124 | [二叉树中的最大路径和](https://leetcode.cn/problems/binary-tree-maximum-path-sum/) | 困难 | ❌ |

### 09 图论

| # | 题目 | 难度 | 状态 |
|---|------|:--:|:--:|
| 200 | [岛屿数量](https://leetcode.cn/problems/number-of-islands/) | 中等 | ❌ |
| 994 | [腐烂的橘子](https://leetcode.cn/problems/rotting-oranges/) | 中等 | ❌ |
| 207 | [课程表](https://leetcode.cn/problems/course-schedule/) | 中等 | ❌ |
| 208 | [实现 Trie (前缀树)](https://leetcode.cn/problems/implement-trie-prefix-tree/) | 中等 | ❌ |

### 10 回溯

| # | 题目 | 难度 | 状态 |
|---|------|:--:|:--:|
| 46 | [全排列](https://leetcode.cn/problems/permutations/) | 中等 | ❌ |
| 78 | [子集](https://leetcode.cn/problems/subsets/) | 中等 | ❌ |
| 17 | [电话号码的字母组合](https://leetcode.cn/problems/letter-combinations-of-a-phone-number/) | 中等 | ❌ |
| 39 | [组合总和](https://leetcode.cn/problems/combination-sum/) | 中等 | ❌ |
| 22 | [括号生成](https://leetcode.cn/problems/generate-parentheses/) | 中等 | ❌ |
| 79 | [单词搜索](https://leetcode.cn/problems/word-search/) | 中等 | ❌ |
| 131 | [分割回文串](https://leetcode.cn/problems/palindrome-partitioning/) | 中等 | ❌ |
| 51 | [N 皇后](https://leetcode.cn/problems/n-queens/) | 困难 | ❌ |

### 11 二分查找

| # | 题目 | 难度 | 状态 |
|---|------|:--:|:--:|
| 35 | [搜索插入位置](https://leetcode.cn/problems/search-insert-position/) | 简单 | ❌ |
| 74 | [搜索二维矩阵](https://leetcode.cn/problems/search-a-2d-matrix/) | 中等 | ❌ |
| 34 | [在排序数组中查找元素的第一个和最后一个位置](https://leetcode.cn/problems/find-first-and-last-position-of-element-in-sorted-array/) | 中等 | ❌ |
| 33 | [搜索旋转排序数组](https://leetcode.cn/problems/search-in-rotated-sorted-array/) | 中等 | ❌ |
| 153 | [寻找旋转排序数组中的最小值](https://leetcode.cn/problems/find-minimum-in-rotated-sorted-array/) | 中等 | ❌ |
| 4 | [寻找两个正序数组的中位数](https://leetcode.cn/problems/median-of-two-sorted-arrays/) | 困难 | ❌ |

### 12 栈

| # | 题目 | 难度 | 状态 |
|---|------|:--:|:--:|
| 20 | [有效的括号](https://leetcode.cn/problems/valid-parentheses/) | 简单 | ❌ |
| 155 | [最小栈](https://leetcode.cn/problems/min-stack/) | 中等 | ❌ |
| 394 | [字符串解码](https://leetcode.cn/problems/decode-string/) | 中等 | ❌ |
| 739 | [每日温度](https://leetcode.cn/problems/daily-temperatures/) | 中等 | ❌ |
| 84 | [柱状图中最大的矩形](https://leetcode.cn/problems/largest-rectangle-in-histogram/) | 困难 | ❌ |

### 13 堆

| # | 题目 | 难度 | 状态 |
|---|------|:--:|:--:|
| 215 | [数组中的第 K 个最大元素](https://leetcode.cn/problems/kth-largest-element-in-an-array/) | 中等 | ❌ |
| 347 | [前 K 个高频元素](https://leetcode.cn/problems/top-k-frequent-elements/) | 中等 | ❌ |
| 295 | [数据流的中位数](https://leetcode.cn/problems/find-median-from-data-stream/) | 困难 | ❌ |

### 14 贪心算法

| # | 题目 | 难度 | 状态 |
|---|------|:--:|:--:|
| 121 | [买卖股票的最佳时机](https://leetcode.cn/problems/best-time-to-buy-and-sell-stock/) | 简单 | ❌ |
| 55 | [跳跃游戏](https://leetcode.cn/problems/jump-game/) | 中等 | ❌ |
| 45 | [跳跃游戏 II](https://leetcode.cn/problems/jump-game-ii/) | 中等 | ❌ |
| 763 | [划分字母区间](https://leetcode.cn/problems/partition-labels/) | 中等 | ❌ |

### 15 动态规划

| # | 题目 | 难度 | 状态 |
|---|------|:--:|:--:|
| 70 | [爬楼梯](https://leetcode.cn/problems/climbing-stairs/) | 简单 | ❌ |
| 118 | [杨辉三角](https://leetcode.cn/problems/pascals-triangle/) | 简单 | ❌ |
| 198 | [打家劫舍](https://leetcode.cn/problems/house-robber/) | 中等 | ❌ |
| 279 | [完全平方数](https://leetcode.cn/problems/perfect-squares/) | 中等 | ❌ |
| 322 | [零钱兑换](https://leetcode.cn/problems/coin-change/) | 中等 | ❌ |
| 139 | [单词拆分](https://leetcode.cn/problems/word-break/) | 中等 | ❌ |
| 300 | [最长递增子序列](https://leetcode.cn/problems/longest-increasing-subsequence/) | 中等 | ❌ |
| 152 | [乘积最大子数组](https://leetcode.cn/problems/maximum-product-subarray/) | 中等 | ❌ |
| 416 | [分割等和子集](https://leetcode.cn/problems/partition-equal-subset-sum/) | 中等 | ❌ |
| 32 | [最长有效括号](https://leetcode.cn/problems/longest-valid-parentheses/) | 困难 | ❌ |

### 16 多维动态规划

| # | 题目 | 难度 | 状态 |
|---|------|:--:|:--:|
| 62 | [不同路径](https://leetcode.cn/problems/unique-paths/) | 中等 | ❌ |
| 64 | [最小路径和](https://leetcode.cn/problems/minimum-path-sum/) | 中等 | ❌ |
| 5 | [最长回文子串](https://leetcode.cn/problems/longest-palindromic-substring/) | 中等 | ❌ |
| 1143 | [最长公共子序列](https://leetcode.cn/problems/longest-common-subsequence/) | 中等 | ❌ |
| 72 | [编辑距离](https://leetcode.cn/problems/edit-distance/) | 中等 | ❌ |

### 17 技巧

| # | 题目 | 难度 | 状态 |
|---|------|:--:|:--:|
| 136 | [只出现一次的数字](https://leetcode.cn/problems/single-number/) | 简单 | ❌ |
| 169 | [多数元素](https://leetcode.cn/problems/majority-element/) | 简单 | ❌ |
| 75 | [颜色分类](https://leetcode.cn/problems/sort-colors/) | 中等 | ❌ |
| 31 | [下一个排列](https://leetcode.cn/problems/next-permutation/) | 中等 | ❌ |
| 287 | [寻找重复数](https://leetcode.cn/problems/find-the-duplicate-number/) | 中等 | ❌ |

---

## 笔记格式

每道题三个文件，平铺在分类目录下，命名前缀 `LC{题号}-{英文短名}`：

```text
01-hash/
├── LC1-two-sum.md                    # 解题思路与技巧
├── LC1-two-sum.ts                    # TypeScript 实现
├── LC1-two-sum.test.ts               # 单元测试（vitest）
├── LC49-group-anagrams.md
├── LC49-group-anagrams.ts
├── LC49-group-anagrams.test.ts
└── ...
```

### `.md` — 解题思路（每题必写）

```markdown
# LC1 - Two Sum

## 题目

给定整数数组 nums 和目标值 target，找出和为 target 的两个数的下标。

## 思路演进

### 解法一：暴力双循环（直觉）

两层遍历，对每个元素检查后续是否有配对。

- 时间 O(n²)，空间 O(1)
- 问题：重复扫描，大量无效比较

### 解法二：哈希表（最优）

一次遍历，用 Map 存「值 → 下标」。对每个元素检查 `target - num` 是否已见过。

- 时间 O(n)，空间 O(n)
- 核心优化：用哈希表将"查找配对"从 O(n) 降为 O(1)

## 技巧

- 先查后存，避免同一元素匹配到自身
- Map 比 Object 更适合：键类型安全，`has` 语义清晰
- 通用模式：「遍历时用哈希表记录历史，当前元素查配对」

## 复杂度对比

| 方法 | 时间 | 空间 | 适用场景 |
|------|------|------|---------|
| 暴力双循环 | O(n²) | O(1) | 数据量小、快速验证 |
| **哈希表（采用）** | O(n) | O(n) | 面试首选 |

## 面试口述

> 暴力是 O(n²) 双循环。优化思路：把"在剩余元素中找配对"变成 O(1) 查找，
> 用哈希表存已遍历的值和下标，一次遍历即可完成。时间 O(n)，空间 O(n)。

## 易错点

- 必须先查再存，否则 `nums = [3, 3], target = 6` 会匹配到自身

## 关联

- 变体：LC15 三数之和（排序 + 双指针）、LC167 两数之和 II（有序数组）
```

### `.ts` — 代码实现

```typescript
/**
 * LC1 - Two Sum
 * 分类：哈希 | 难度：简单
 * 复杂度：时间 O(n)，空间 O(n)
 */
function twoSum(nums: number[], target: number): number[] {
  const seen = new Map<number, number>();
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (seen.has(complement)) return [seen.get(complement)!, i];
    seen.set(nums[i], i);
  }
  return [];
}

export { twoSum };
```

### `.test.ts` — 单元测试（bun:test）

```typescript
import { describe, it, expect } from 'bun:test';
import { twoSum } from './LC1-two-sum';

describe('LC1 Two Sum', () => {
  it('normal case', () => {
    expect(twoSum([2, 7, 11, 15], 9)).toEqual([0, 1]);
  });
  it('answer not first two', () => {
    expect(twoSum([3, 2, 4], 6)).toEqual([1, 2]);
  });
  it('duplicate elements', () => {
    expect(twoSum([3, 3], 6)).toEqual([0, 1]);
  });
});
```

---

## 面试高频 TOP 20（优先刷）

面试出现频率最高的 20 题，建议第一遍优先完成：

| 分类 | 题目 |
|------|------|
| 哈希 | 1 两数之和、128 最长连续序列 |
| 双指针 | 15 三数之和、42 接雨水 |
| 滑动窗口 | 3 无重复字符的最长子串 |
| 链表 | 206 反转链表、21 合并两个有序链表、146 LRU 缓存、25 K 个一组翻转链表 |
| 二叉树 | 102 层序遍历、236 最近公共祖先、124 最大路径和 |
| 二分查找 | 33 搜索旋转排序数组、4 寻找两个正序数组的中位数 |
| 栈 | 20 有效的括号、84 柱状图中最大的矩形 |
| 动态规划 | 300 最长递增子序列、72 编辑距离、322 零钱兑换 |
| 回溯 | 46 全排列 |
| 贪心 | 55 跳跃游戏 |

---

## 关联模块

- 理论基础：[data-structures/](../data-structures/) — 408 数据结构大纲（线性表、树、图、排序、查找）
