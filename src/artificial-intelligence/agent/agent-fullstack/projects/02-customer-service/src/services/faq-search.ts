/**
 * 政策 FAQ 关键词检索（「检索即工具」的服务层，search_policy 工具的后端）
 *
 * 复用 01 项目手法（01-weather-agent/src/agent/rag/faq.ts），零新增学习成本：
 *   中文分段 → 2-4 字滑动窗口提取关键词 → 与 FAQ 条目词表做双向包含匹配
 *   → 重叠比 = 命中词数 / 条目词表长度 → ≥ 0.35 视为命中，取最高分条目。
 *
 * 与 01 的唯一结构差异：01 的关键词从 question 自动抽取，本项目的词表
 * 手工维护在 kb/policy-faq.json（政策条目的命中词必须可控，与 Few-shot、
 * 评估用例共用同一套事实）。
 *
 * 纯函数、无 LLM、无外部依赖——第四章把本文件整体替换为向量检索时，
 * 上层工具接口零改动。
 */
import faqData from '../../kb/policy-faq.json'

export interface PolicyFaq {
  id: string
  keywords: string[]
  answer: string
  source: string
}

/** search_policy 工具的直接返回体（带 score 便于 trace / eval 调试） */
export interface FaqHit {
  id: string
  answer: string
  source: string
  /** 重叠比 0~1，命中阈值 0.35 */
  score: number
}

/** 未命中的统一口径：由工具层原样返回给模型（模型可据此建议建单转人工） */
export const FAQ_MISS = '知识库未覆盖'

const faqList = faqData as PolicyFaq[]

/** 重叠比阈值：命中词占条目词表的比例达到即视为命中（01 同款） */
const MATCH_THRESHOLD = 0.35

/** 停用词：窗口碎片里高频但无检索价值的字词（01 同款清单） */
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

/**
 * 从中文文本提取关键词：按非中文字符切段，每段做 2-4 字滑动窗口
 * （如「退款政策」→ 退款 / 款政 / 政策 / 退款政 / 款政策），去重后返回
 */
export function extractKeywords(text: string): string[] {
  const segments = text.split(/[^\u4e00-\u9fff]+/).filter(Boolean)

  const keywords: string[] = []
  for (const seg of segments) {
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

/**
 * 检索政策 FAQ：返回得分最高的命中条目；未命中返回 null
 * （工具层把 null 转成 FAQ_MISS 文案，服务层不掺话术）
 */
export function searchPolicyFaq(query: string): FaqHit | null {
  const queryKeywords = extractKeywords(query)
  if (queryKeywords.length === 0) return null

  let best: { entry: PolicyFaq; score: number } | null = null
  for (const entry of faqList) {
    // 双向包含：窗口碎片可被整词包含（kw='没发货' ⊇ qk='发货'），反之亦然
    const hits = entry.keywords.filter((kw) =>
      queryKeywords.some((qk) => qk.includes(kw) || kw.includes(qk))
    ).length

    // 分母 = 条目词表长度（01 同款）：词表越长越难命中，调灵敏度就是调词表
    const score = hits / entry.keywords.length

    if (!best || score > best.score) {
      best = { entry, score }
    }
  }

  if (!best || best.score < MATCH_THRESHOLD) return null
  return {
    id: best.entry.id,
    answer: best.entry.answer,
    source: best.entry.source,
    score: best.score
  }
}
