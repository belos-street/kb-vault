/**
 * search_policy —— 政策 FAQ 检索工具（「检索即工具」形态）
 *
 * 后端是 03-1 的关键词检索（纯函数，无向量库）；第四章整体替换为
 * 向量检索时，本文件只有 import 路径可能变化，接口零改动。
 * 未命中如实返回 FAQ_MISS，并提示模型可建单转人工（不编造政策）。
 */
import { tool } from 'langchain'
import { z } from 'zod'
import { FAQ_MISS, searchPolicyFaq } from '../../services/faq-search.ts'

export const searchPolicy = tool(
  ({ query }) => {
    const hit = searchPolicyFaq(query)
    if (!hit) {
      return `${FAQ_MISS}。若用户的问题无法自助解决，可建议其创建工单转人工处理。`
    }
    return `依据【${hit.source}】：\n${hit.answer}`
  },
  {
    name: 'search_policy',
    description:
      '检索平台政策与规则的唯一入口，覆盖：退款政策、物流时效、会员权益、账号安全、发票规则。仅限政策/规则类问题，不要用于查订单状态或执行退款等操作。',
    schema: z.object({
      query: z
        .string()
        .min(1)
        .describe('政策问题的关键词条或短句，如「七天无理由」「退款多久到账」')
    })
  }
)
