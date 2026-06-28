/**
 * 简易 FAQ 检索（关键词匹配）
 *
 * 基于关键词重叠度匹配，适合少量 FAQ 条目。
 * 无需向量化，零外部依赖。
 */

import faqData from './faq-data.json'
import { CITY_ALIASES } from '../../services/const'

interface FaqItem {
  id: string
  question: string
  answer: string
}

const faqList = faqData as FaqItem[]

/**
 * 从中文问题中提取关键词
 * 过滤掉常见的停用词和短字符
 */
const STOP_WORDS = new Set([
  '的',
  '了',
  '在',
  '是',
  '我',
  '有',
  '和',
  '就',
  '不',
  '人',
  '都',
  '一',
  '个',
  '上',
  '也',
  '很',
  '到',
  '说',
  '要',
  '去',
  '你',
  '会',
  '着',
  '没有',
  '看',
  '好',
  '自己',
  '这',
  '他',
  '她',
  '它',
  '们',
  '那',
  '什么',
  '怎么',
  '如何',
  '需要',
  '可以',
  '应该',
  '吗',
  '呢',
  '吧',
  '啊',
  '呀',
  '哦',
  '嘛',
  '嗯',
  '哈'
])

function extractKeywords(text: string): string[] {
  // 按非中文字符拆分，保留中文片段
  const segments = text.split(/[^\u4e00-\u9fff]+/).filter(Boolean)

  const keywords: string[] = []
  for (const seg of segments) {
    // 对每个中文片段，提取 2-4 字的子串作为关键词
    for (let i = 0; i < seg.length; i++) {
      for (let j = i + 2; j <= Math.min(i + 4, seg.length); j++) {
        const word = seg.slice(i, j)
        if (!STOP_WORDS.has(word)) {
          keywords.push(word)
        }
      }
    }
  }

  return [...new Set(keywords)]
}

/** 预计算 FAQ 关键词索引 */
const faqIndex = faqList.map((item) => ({
  ...item,
  keywords: extractKeywords(item.question)
}))

/** 用户问题中提到的所有城市名（含别名） */
const allCityNames = new Set(Object.keys(CITY_ALIASES))

/**
 * 判断用户问题是否是查天气的（包含城市名），是则跳过 FAQ
 */
function isWeatherQuery(query: string): boolean {
  for (const name of allCityNames) {
    if (query.includes(name)) return true
  }
  return false
}

/**
 * 匹配阈值：命中关键词占比超过此值视为匹配
 */
const MATCH_THRESHOLD = 0.35

/**
 * 检索 FAQ，返回匹配的问答对。
 * 如果问题包含城市名（查天气），自动跳过。
 */
export function retrieveFaq(query: string): FaqItem | null {
  // 查天气的问题不走 FAQ
  if (isWeatherQuery(query)) return null

  const queryKeywords = extractKeywords(query)
  if (queryKeywords.length === 0) return null

  let bestMatch: FaqItem | null = null
  let bestScore = 0

  for (const entry of faqIndex) {
    // 计算关键词重叠占比
    const hits = entry.keywords.filter((kw) =>
      queryKeywords.some((qk) => qk.includes(kw) || kw.includes(qk))
    ).length

    const score = hits / entry.keywords.length

    if (score > bestScore) {
      bestScore = score
      bestMatch = entry
    }
  }

  return bestScore >= MATCH_THRESHOLD ? bestMatch : null
}
