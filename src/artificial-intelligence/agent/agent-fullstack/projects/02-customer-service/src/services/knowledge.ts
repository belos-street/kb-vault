/**
 * FAQ 条目领域模型
 */
export interface FAQ {
  /** 唯一标识 */
  id: string
  /** 问题标题 */
  question: string
  /** 标准答案 */
  answer: string
  /** 用于关键词匹配的标签 */
  keywords: string[]
}

/** 内置 FAQ 知识库，覆盖退货、退款、物流、换货、售后等场景 */
const FAQS: FAQ[] = [
  {
    id: 'faq-001',
    question: '退货政策是什么？',
    answer:
      '自签收之日起 7 天内，商品未使用且包装完好，可申请无理由退货；特殊商品（如生鲜、定制类）不支持退货。',
    keywords: ['退货', '退货政策', '无理由退货', '退']
  },
  {
    id: 'faq-002',
    question: '退款多久到账？',
    answer:
      '退款审核通过后，原支付方式一般 1-3 个工作日到账，具体以银行或第三方支付平台为准。',
    keywords: ['退款', '多久', '到账', '时效']
  },
  {
    id: 'faq-003',
    question: '怎么查看物流信息？',
    answer:
      '您可以在订单详情页点击「查看物流」，或提供订单号给我，我帮您查询最新物流状态。',
    keywords: ['物流', '快递', '查看物流', '到哪了', '发货']
  },
  {
    id: 'faq-004',
    question: '换货流程是怎样的？',
    answer:
      '签收 15 天内，商品存在质量问题可申请换货。请提供订单号和问题描述，审核通过后会安排上门取件并寄出新商品。',
    keywords: ['换货', '换', '质量问题', '换新']
  },
  {
    id: 'faq-005',
    question: '售后服务时间是什么？',
    answer:
      '人工客服在线时间为工作日 9:00-21:00，节假日 10:00-18:00；智能机器人 7×24 小时在线。',
    keywords: ['售后', '服务时间', '客服时间', '在线时间', '人工']
  },
  {
    id: 'faq-006',
    question: '运费谁承担？',
    answer:
      '因商品质量或发错货导致的退货运费由商家承担；无理由退货需用户承担寄回运费。',
    keywords: ['运费', '谁承担', '退货运费', '邮费']
  },
  {
    id: 'faq-007',
    question: '拒收后多久退款？',
    answer: '拒收商品退回仓库并验收无误后，退款将在 1-3 个工作日内原路退回。',
    keywords: ['拒收', '拒签', '退回', '退款']
  },
  {
    id: 'faq-008',
    question: '发票怎么开？',
    answer:
      '您可以在订单详情页申请开具电子发票，支持增值税普通发票，一般 24 小时内发送至您的邮箱。',
    keywords: ['发票', '开票', '电子发票']
  },
  {
    id: 'faq-009',
    question: '商品有质量问题怎么办？',
    answer:
      '如商品存在质量问题，请在签收 15 天内联系客服，提供照片或视频凭证，我们将安排退换货或补偿。',
    keywords: ['质量问题', '破损', '瑕疵', '坏', ' defective']
  },
  {
    id: 'faq-010',
    question: '可以修改收货地址吗？',
    answer:
      '订单未发货前可在订单详情页修改地址；已发货订单需联系物流公司协商转寄，可能产生额外费用。',
    keywords: ['修改地址', '改地址', '收货地址', '地址']
  },
  {
    id: 'faq-011',
    question: '下单后多久发货？',
    answer:
      '一般情况下，付款后 24 小时内发货；预售或定制商品以页面标注时间为准。',
    keywords: ['多久发货', '发货时间', '什么时候发货']
  },
  {
    id: 'faq-012',
    question: '如何联系人工客服？',
    answer:
      '您可以输入「转人工」或「人工客服」，我将为您创建工单并由专属客服在 10 分钟内回电。',
    keywords: ['人工', '人工客服', '转人工', '客服电话']
  },
  {
    id: 'faq-013',
    question: '会员有什么权益？',
    answer:
      '会员可享受积分抵扣、生日礼券、专属折扣、优先客服等权益，具体以会员中心公示为准。',
    keywords: ['会员', '权益', '积分', 'vip']
  },
  {
    id: 'faq-014',
    question: '优惠券怎么用？',
    answer:
      '在结算页选择可用优惠券即可抵扣；部分特殊商品、秒杀商品不可用券，详见券面说明。',
    keywords: ['优惠券', '代金券', '怎么用', '用券']
  },
  {
    id: 'faq-015',
    question: '订单取消了还能恢复吗？',
    answer:
      '订单一旦取消无法直接恢复，您可以重新下单；如已支付，款项将原路退回。',
    keywords: ['取消', '恢复', '撤销', '取消订单']
  },
  {
    id: 'faq-016',
    question: '签收后发现少了配件怎么办？',
    answer:
      '请在签收 48 小时内联系客服并提供开箱视频或照片，我们会尽快补发缺失配件。',
    keywords: ['配件', '少', '缺失', '漏发']
  },
  {
    id: 'faq-017',
    question: '支持货到付款吗？',
    answer: '目前仅部分城市支持货到付款，具体以结算页可选支付方式为准。',
    keywords: ['货到付款', '到付', '现金']
  },
  {
    id: 'faq-018',
    question: '退款被拒绝了怎么办？',
    answer:
      '退款被拒绝通常是因为超过退款有效期或商品不符合退货条件。您可以补充材料重新申请，或转人工客服复核。',
    keywords: ['拒绝', '驳回', '退款失败']
  },
  {
    id: 'faq-019',
    question: '物流显示已签收但我没收到？',
    answer:
      '请先确认是否由家人、同事或快递柜代收；如确实未收到，请联系我并提供订单号，我们会协助核实。',
    keywords: ['已签收', '没收到', '丢失', '派送']
  },
  {
    id: 'faq-020',
    question: '海外可以配送吗？',
    answer:
      '目前仅支持中国大陆地区配送（不含港澳台），海外配送服务正在规划中。',
    keywords: ['海外', '港澳台', '配送范围', '国际']
  },
  {
    id: 'faq-021',
    question: '如何投诉？',
    answer:
      '如您对服务不满意，可以输入「投诉」或「我要投诉」，我会记录您的问题并提交给专员处理。',
    keywords: ['投诉', '不满', '举报']
  },
  {
    id: 'faq-022',
    question: '价格保护怎么申请？',
    answer:
      '下单后 7 天内，如商品发生降价，您可在订单详情页申请价保，差价将原路退回。',
    keywords: ['价保', '价格保护', '降价', '退差价']
  }
]

/**
 * 根据关键词匹配检索 FAQ
 * @param query 用户 query
 * @param topK 最多返回条数，默认 3
 * @returns 命中的 FAQ 列表；未命中返回空数组
 */
export function searchKnowledge(query: string, topK = 3): FAQ[] {
  const normalizedQuery = query.toLowerCase().trim()
  if (!normalizedQuery) return []

  const scored = FAQS.map((faq) => {
    const score = faq.keywords.reduce((acc, keyword) => {
      return normalizedQuery.includes(keyword.toLowerCase()) ? acc + 1 : acc
    }, 0)
    return { faq, score }
  })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)

  return scored.map((item) => item.faq)
}
