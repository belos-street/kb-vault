/**
 * 00 · 手写缩放点积注意力
 *
 * 只实现两个纯函数。不要引入任何库，也不要把逻辑写进测试里。
 * 规格与验收标准见同目录 README.md。
 */

/**
 * 把一组分数变成概率分布。
 *
 * 约定：
 * - 空数组、NaN、Infinity → 抛 RangeError
 * - 返回数组长度与输入一致，元素之和为 1
 * - 必须数值稳定（大数不能溢出成 NaN）
 */
export function softmax(_values: number[]): number[] {
  throw new Error('TODO: 实现 softmax')
}

/**
 * 单头、单查询的缩放点积注意力。
 *
 * @param query 形状 [d]
 * @param keys 形状 [n][d]
 * @param values 形状 [n][d]
 * @returns 加权求和后的向量，形状 [d]
 *
 * 约定：
 * - keys 为空、query 与 key 维度不一致、keys 与 values 数量不一致 → 抛 RangeError
 * - 缩放因子是 sqrt(d)，不是 d
 */
export function scaledDotProductAttention(
  _query: number[],
  _keys: number[][],
  _values: number[][]
): number[] {
  throw new Error('TODO: 实现 scaledDotProductAttention')
}
