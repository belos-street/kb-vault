export type DiffOpType = 'equal' | 'missing' | 'extra'

export interface DiffOp {
  type: DiffOpType
  token: string
}

/**
 * token 级 LCS diff，用于句子听写判分。
 * expected = 参考句 tokens，actual = 用户输入 tokens（都已归一化）。
 */
export function diffTokens(expected: string[], actual: string[]): DiffOp[] {
  const n = expected.length
  const m = actual.length
  const dp: number[][] = Array.from({ length: n + 1 }, () =>
    new Array<number>(m + 1).fill(0)
  )

  for (let i = n - 1; i >= 0; i -= 1) {
    const row = dp[i]
    if (!row) continue
    for (let j = m - 1; j >= 0; j -= 1) {
      const expectedToken = expected[i]
      const actualToken = actual[j]
      if (expectedToken === undefined || actualToken === undefined) continue
      row[j] =
        expectedToken === actualToken
          ? (dp[i + 1]?.[j + 1] ?? 0) + 1
          : Math.max(dp[i + 1]?.[j] ?? 0, dp[i]?.[j + 1] ?? 0)
    }
  }

  const ops: DiffOp[] = []
  let i = 0
  let j = 0

  while (i < n && j < m) {
    const expectedToken = expected[i]
    const actualToken = actual[j]
    if (expectedToken === undefined || actualToken === undefined) break
    if (expectedToken === actualToken) {
      ops.push({ type: 'equal', token: expectedToken })
      i += 1
      j += 1
    } else if ((dp[i + 1]?.[j] ?? 0) >= (dp[i]?.[j + 1] ?? 0)) {
      ops.push({ type: 'missing', token: expectedToken })
      i += 1
    } else {
      ops.push({ type: 'extra', token: actualToken })
      j += 1
    }
  }

  while (i < n) {
    const token = expected[i]
    if (token !== undefined) ops.push({ type: 'missing', token })
    i += 1
  }

  while (j < m) {
    const token = actual[j]
    if (token !== undefined) ops.push({ type: 'extra', token })
    j += 1
  }

  return ops
}

export function isExactDiff(ops: DiffOp[]): boolean {
  return ops.every((op) => op.type === 'equal')
}
