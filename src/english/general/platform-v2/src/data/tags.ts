export const errorTags = [
  'tense',
  'agreement',
  'article',
  'noun-number',
  'preposition',
  'word-order',
  'collocation',
  'spelling',
  'transfer',
  'unsorted'
] as const

export type ErrorTag = (typeof errorTags)[number]

export const errorTagLabels: Record<ErrorTag, string> = {
  tense: '时态',
  agreement: '主谓一致',
  article: '冠词',
  'noun-number': '单复数',
  preposition: '介词',
  'word-order': '语序',
  collocation: '搭配',
  spelling: '拼写',
  transfer: '母语迁移',
  unsorted: '未分类'
}

export interface PatternKeyDef {
  id: string
  label: string
  tag: ErrorTag
  /** 对应的语法卡；可以暂时没有，错误先于卡片存在 */
  cardId?: string
}

/**
 * 结构键注册表：复现率的判定单位。
 * 与语法卡 id 空间解耦——错误先于卡片被记录，卡片通过 covers 反向认领。
 */
export const patternKeys: PatternKeyDef[] = [
  {
    id: 'third-person-s',
    label: '第三人称 -s',
    tag: 'agreement'
  },
  {
    id: 'there-be-agreement',
    label: 'there be 与主谓一致',
    tag: 'agreement',
    cardId: 'there-be-agreement'
  },
  {
    id: 'be-verb',
    label: 'be 动词缺失或多余',
    tag: 'agreement'
  },
  {
    id: 'present-perfect-vs-past',
    label: '现在完成 vs 一般过去',
    tag: 'tense'
  },
  {
    id: 'verb-form',
    label: '动词形式',
    tag: 'tense'
  },
  {
    id: 'a-vs-the',
    label: 'a / the 混用',
    tag: 'article'
  },
  {
    id: 'article-omission',
    label: '冠词缺失或多余',
    tag: 'article'
  },
  {
    id: 'plural-s',
    label: '名词复数 -s',
    tag: 'noun-number'
  },
  {
    id: 'countable-uncountable',
    label: '可数性',
    tag: 'noun-number'
  },
  {
    id: 'prep-usage',
    label: '介词用法',
    tag: 'preposition'
  },
  {
    id: 'by-time',
    label: 'by + 时间点',
    tag: 'preposition'
  },
  {
    id: 'word-order',
    label: '语序',
    tag: 'word-order'
  },
  {
    id: 'collocation',
    label: '固定搭配',
    tag: 'collocation'
  },
  {
    id: 'spelling',
    label: '拼写',
    tag: 'spelling'
  },
  {
    id: 'literal-transfer',
    label: '中文直译',
    tag: 'transfer'
  },
  {
    id: 'unknown',
    label: '未分类',
    tag: 'unsorted'
  }
]

export function findPatternKey(id: string): PatternKeyDef | undefined {
  return patternKeys.find((pattern) => pattern.id === id)
}

const fallbackPatternByTag: Record<ErrorTag, string> = {
  tense: 'verb-form',
  agreement: 'third-person-s',
  article: 'article-omission',
  'noun-number': 'plural-s',
  preposition: 'prep-usage',
  'word-order': 'word-order',
  collocation: 'collocation',
  spelling: 'spelling',
  transfer: 'literal-transfer',
  unsorted: 'unknown'
}

/** 用户改判标签时，结构键回落到该标签的默认键，避免 tag 与 patternKey 打架 */
export function defaultPatternKeyForTag(tag: ErrorTag): string {
  return fallbackPatternByTag[tag]
}
