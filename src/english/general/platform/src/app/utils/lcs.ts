export type DiffOpType = 'equal' | 'missing' | 'extra'

export interface DiffOp {
  type: DiffOpType
  /** equal/missing：期望句的 token；extra：用户多写的 token */
  token: string
}

/**
 * token 级 LCS diff（听写判分用，不引第三方库）。
 * expected = 参考句 tokens，actual = 用户输入 tokens（均应先归一化）。
 */
export function diffTokens(expected: string[], actual: string[]): DiffOp[] {
  const n = expected.length
  const m = actual.length
  const dp: number[][] = Array.from({ length: n + 1 }, () =>
    new Array<number>(m + 1).fill(0)
  )
  for (let i = n - 1; i >= 0; i--) {
    const row = dp[i]
    if (row === undefined) continue
    for (let j = m - 1; j >= 0; j--) {
      const ei = expected[i]
      const aj = actual[j]
      if (ei === undefined || aj === undefined) continue
      row[j] =
        ei === aj
          ? (dp[i + 1]?.[j + 1] ?? 0) + 1
          : Math.max(dp[i + 1]?.[j] ?? 0, dp[i]?.[j + 1] ?? 0)
    }
  }
  const ops: DiffOp[] = []
  let i = 0
  let j = 0
  while (i < n && j < m) {
    const ei = expected[i]
    const aj = actual[j]
    if (ei === undefined || aj === undefined) break
    if (ei === aj) {
      ops.push({ type: 'equal', token: ei })
      i++
      j++
    } else if ((dp[i + 1]?.[j] ?? 0) >= (dp[i]?.[j + 1] ?? 0)) {
      ops.push({ type: 'missing', token: ei })
      i++
    } else {
      ops.push({ type: 'extra', token: aj })
      j++
    }
  }
  while (i < n) {
    const ei = expected[i]
    if (ei !== undefined) ops.push({ type: 'missing', token: ei })
    i++
  }
  while (j < m) {
    const aj = actual[j]
    if (aj !== undefined) ops.push({ type: 'extra', token: aj })
    j++
  }
  return ops
}

/** 全对判定 */
export function isExactDiff(ops: DiffOp[]): boolean {
  return ops.every((op) => op.type === 'equal')
}
