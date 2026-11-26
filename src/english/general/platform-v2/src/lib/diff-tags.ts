import { diffTokens } from './lcs.ts'
import { tokenize } from './text.ts'
import type { ErrorTag } from '../data/tags.ts'

export interface TagSuggestion {
  tag: ErrorTag
  patternKey: string
  reason: string
  /** 两句是否可比；差异过大时只做对照，不入账 */
  comparable: boolean
}

const articles = new Set(['a', 'an', 'the'])
const prepositions = new Set([
  'by',
  'in',
  'on',
  'at',
  'to',
  'of',
  'for',
  'with',
  'from',
  'as',
  'about',
  'into',
  'over',
  'under',
  'between'
])
const beForms = new Set([
  'is',
  'are',
  'am',
  'was',
  'were',
  'be',
  'been',
  'being'
])
const haveForms = new Set(['have', 'has', 'had'])
const pluralHints = new Set(['many', 'two', 'three', 'four', 'five', 'several'])
/** 只差这些词不算错误，避免把它们塞进未分类 */
const noiseWords = new Set([
  'oclock',
  'am',
  'pm',
  'oh',
  'well',
  'really',
  'just',
  'very',
  'quite'
])

function sameMultiset(left: string[], right: string[]): boolean {
  if (left.length !== right.length) return false
  return [...left].sort().join(' ') === [...right].sort().join(' ')
}

function allIn(tokens: string[], set: Set<string>): boolean {
  return tokens.length > 0 && tokens.every((token) => set.has(token))
}

function pairsOf(missing: string[], extra: string[]): Array<[string, string]> {
  const count = Math.min(missing.length, extra.length)
  const pairs: Array<[string, string]> = []
  for (let index = 0; index < count; index += 1) {
    const left = missing[index]
    const right = extra[index]
    if (left !== undefined && right !== undefined) pairs.push([left, right])
  }
  return pairs
}

function suffixChange(left: string, right: string): string | null {
  for (const suffix of ['es', 's', 'ing', 'ed', 'd']) {
    if (left + suffix === right) return suffix
    if (right + suffix === left) return suffix
  }
  return null
}

function editDistance(left: string, right: string): number {
  const rows = left.length + 1
  const cols = right.length + 1
  const dp = Array.from({ length: rows }, () => new Array<number>(cols).fill(0))
  for (let i = 0; i < rows; i += 1) {
    const row = dp[i]
    if (row) row[0] = i
  }
  const first = dp[0]
  if (first) {
    for (let j = 0; j < cols; j += 1) first[j] = j
  }
  for (let i = 1; i < rows; i += 1) {
    for (let j = 1; j < cols; j += 1) {
      const cost = left[i - 1] === right[j - 1] ? 0 : 1
      const row = dp[i]
      const previous = dp[i - 1]
      if (!row || !previous) continue
      row[j] = Math.min(
        (previous[j] ?? 0) + 1,
        (row[j - 1] ?? 0) + 1,
        (previous[j - 1] ?? 0) + cost
      )
    }
  }
  return dp[left.length]?.[right.length] ?? Math.max(left.length, right.length)
}

/**
 * 从一对句子推一个候选标签。只是预填，用户确认或改判。
 * 返回 null 表示两句一致，不需要入账。
 */
export function suggestTag(mine: string, target: string): TagSuggestion | null {
  const rawExpected = tokenize(target)
  const rawActual = tokenize(mine)
  if (rawExpected.join(' ') === rawActual.join(' ')) return null

  const expected = rawExpected.filter((token) => !noiseWords.has(token))
  const actual = rawActual.filter((token) => !noiseWords.has(token))
  if (expected.join(' ') === actual.join(' ')) {
    return {
      tag: 'unsorted',
      patternKey: 'unknown',
      reason: '只差可忽略的词，不入账',
      comparable: false
    }
  }

  if (sameMultiset(expected, actual)) {
    return {
      tag: 'word-order',
      patternKey: 'word-order',
      reason: '词相同，顺序不同',
      comparable: true
    }
  }

  const ops = diffTokens(expected, actual)
  const missing = ops
    .filter((op) => op.type === 'missing')
    .map((op) => op.token)
  const extra = ops.filter((op) => op.type === 'extra').map((op) => op.token)
  const changed = [...missing, ...extra]

  const common = Math.max(0, expected.length - missing.length)
  const overlap = common / Math.max(expected.length, actual.length, 1)
  if (overlap < 0.4 && Math.min(expected.length, actual.length) > 3) {
    return {
      tag: 'unsorted',
      patternKey: 'unknown',
      reason: '与参考差异过大，只对照不入账',
      comparable: false
    }
  }

  if (
    missing.length > 0 &&
    missing.every((token) => beForms.has(token)) &&
    extra.length > 0 &&
    extra.every((token) => haveForms.has(token))
  ) {
    return {
      tag: 'agreement',
      patternKey: 'there-be-agreement',
      reason: 'there be 与 have 混用',
      comparable: true
    }
  }

  if (allIn(changed, articles)) {
    return {
      tag: 'article',
      patternKey:
        missing.length > 0 && extra.length > 0
          ? 'a-vs-the'
          : 'article-omission',
      reason: '只差冠词',
      comparable: true
    }
  }

  if (allIn(changed, prepositions)) {
    return {
      tag: 'preposition',
      patternKey: 'prep-usage',
      reason: '只差介词',
      comparable: true
    }
  }

  if (missing.some((token) => haveForms.has(token)) && extra.length === 0) {
    return {
      tag: 'tense',
      patternKey: 'present-perfect-vs-past',
      reason: '多了 have / has / had',
      comparable: true
    }
  }

  if (allIn(changed, beForms)) {
    return {
      tag: 'agreement',
      patternKey: 'be-verb',
      reason: '只差 be 动词',
      comparable: true
    }
  }

  if (missing.length === extra.length && missing.length > 0) {
    const pairs = pairsOf(missing, extra)
    const suffixes = pairs.map(([left, right]) => suffixChange(left, right))
    const isSuffixChange = suffixes.every(
      (suffix) => suffix === 's' || suffix === 'es'
    )
    if (isSuffixChange && pairs.length > 0) {
      const firstMissing = missing[0] ?? ''
      const index = expected.indexOf(firstMissing)
      const previous = index > 0 ? expected[index - 1] : undefined
      if (
        previous !== undefined &&
        (articles.has(previous) ||
          pluralHints.has(previous) ||
          /^\d+$/.test(previous))
      ) {
        return {
          tag: 'noun-number',
          patternKey: 'plural-s',
          reason: '名词单复数',
          comparable: true
        }
      }
      return {
        tag: 'agreement',
        patternKey: 'third-person-s',
        reason: '动词第三人称 -s',
        comparable: true
      }
    }
    const isTenseChange = suffixes.every(
      (suffix) => suffix === 'ed' || suffix === 'd' || suffix === 'ing'
    )
    if (isTenseChange) {
      return {
        tag: 'tense',
        patternKey: 'verb-form',
        reason: '动词形式变化',
        comparable: true
      }
    }
  }

  if (missing.length === 1 && extra.length === 1) {
    const left = missing[0]
    const right = extra[0]
    if (
      left !== undefined &&
      right !== undefined &&
      left[0] === right[0] &&
      left.length > 2 &&
      right.length > 2 &&
      editDistance(left, right) <= 2
    ) {
      return {
        tag: 'spelling',
        patternKey: 'spelling',
        reason: '拼写接近',
        comparable: true
      }
    }
    return {
      tag: 'collocation',
      patternKey: 'collocation',
      reason: '一个词换成了另一个词',
      comparable: true
    }
  }

  return {
    tag: 'unsorted',
    patternKey: 'unknown',
    reason: '规则判断不了',
    comparable: true
  }
}
