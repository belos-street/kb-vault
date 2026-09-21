/**
 * faq-search 三路径单测（todo §3.2）：命中 / 阈值边界 / 未命中
 *
 * 纯函数测试，不依赖数据库与模型。阈值边界用真实词表构造：
 * faq-refund-7day 词表 4 词（七天无理由/退货/退款/政策）——
 *   「退货」1/4 = 0.25 < 0.35 未命中；「退货退款」2/4 = 0.50 命中
 */
import { describe, expect, it } from 'bun:test'
import {
  FAQ_MISS,
  extractKeywords,
  searchPolicyFaq
} from '../src/services/faq-search.ts'

describe('extractKeywords：分段 + 滑动窗口', () => {
  it('产出 2-4 字窗口碎片并去重', () => {
    const kws = extractKeywords('退款政策')
    expect(kws).toContain('退款')
    expect(kws).toContain('政策')
    expect(kws).toContain('退款政策')
    // 单字不进窗口
    for (const kw of kws) expect(kw.length).toBeGreaterThanOrEqual(2)
  })

  it('非中文字符被丢弃', () => {
    // USB-C 扩展坞 → 只保留中文段
    const kws = extractKeywords('USB-C 扩展坞')
    expect(kws.length).toBeGreaterThan(0)
    expect(kws.every((kw) => /^[\u4e00-\u9fff]+$/.test(kw))).toBe(true)
  })

  it('停用词被过滤（纯停用词输入产出为空）', () => {
    expect(extractKeywords('什么')).toEqual([])
    expect(extractKeywords('需要')).toEqual([])
  })
})

describe('searchPolicyFaq：命中路径', () => {
  it('验收主路径：退款政策是什么 → 7 天无理由条目', () => {
    const hit = searchPolicyFaq('退款政策是什么')
    expect(hit?.id).toBe('faq-refund-7day')
    expect(hit?.score).toBeGreaterThanOrEqual(0.35)
    expect(hit?.answer).toContain('7 天')
    expect(hit?.source).toContain('售后服务政策')
  })

  it('五类政策各抽一例均命中', () => {
    const cases: Array<[string, string]> = [
      ['退款多久到账', 'faq-refund-timeline'],
      ['查不到物流单号', 'faq-logistics-tracking'],
      ['会员积分怎么算', 'faq-member-points'],
      ['怎么换绑手机号', 'faq-account-phone'],
      ['怎么开发票', 'faq-invoice-issue']
    ]
    for (const [query, id] of cases) {
      expect(searchPolicyFaq(query)?.id).toBe(id)
    }
  })
})

describe('searchPolicyFaq：阈值边界', () => {
  it('同一条目 1/4 词命中（0.25）不过阈值，2/4（0.50）通过', () => {
    // 「退货」只打中 faq-refund-7day 的 1 个词 → 0.25，且其它条目也不足阈
    expect(searchPolicyFaq('退货')).toBeNull()
    // 「退货退款」打中 2 个词 → 0.50
    const hit = searchPolicyFaq('退货退款')
    expect(hit?.id).toBe('faq-refund-7day')
    expect(hit?.score).toBe(0.5)
  })
})

describe('searchPolicyFaq：未命中路径', () => {
  it('闲聊不命中（停用词/无政策词表重叠）', () => {
    expect(searchPolicyFaq('你好呀')).toBeNull()
    expect(searchPolicyFaq('今天天气不错')).toBeNull()
  })

  it('空输入与纯英文不命中', () => {
    expect(searchPolicyFaq('')).toBeNull()
    expect(searchPolicyFaq('hello world')).toBeNull()
  })

  it('未命中口径常量由工具层转译', () => {
    expect(FAQ_MISS).toBe('知识库未覆盖')
  })
})
