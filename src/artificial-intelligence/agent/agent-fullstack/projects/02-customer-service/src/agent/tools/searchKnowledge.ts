import { tool, type ToolRuntime } from 'langchain'
import { z } from 'zod'
import { searchKnowledge } from '@/services/knowledge.ts'

/**
 * FAQ 知识检索工具
 *
 * 通过关键词匹配在 FAQ 知识库中检索相关内容。
 * 命中时返回匹配的问答对；未命中时提示转接人工客服。
 */
export const searchKnowledgeTool = tool(
  async ({ query }, _runtime: ToolRuntime) => {
    const results = searchKnowledge(query)

    if (results.length === 0) {
      return `关于「${query}」我没有找到相关的 FAQ 信息。建议您转接人工客服，由专员为您解答。`
    }

    return results
      .map(
        (faq, i) =>
          `【${i + 1}】${faq.question}\n${faq.answer}`
      )
      .join('\n\n')
  },
  {
    name: 'searchKnowledge',
    description:
      '在客服 FAQ 知识库中搜索与用户问题相关的内容，涵盖退货政策、退款时效、物流说明、换货流程、售后时间等。',
    schema: z.object({
      query: z.string().describe('用户的问题或关键词，如「退货政策」「物流到哪了」')
    })
  }
)
