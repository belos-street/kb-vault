// 工具：search_knowledge —— 检索 FAQ 知识库
// 未命中时返回引导话术（对应 system.ts 行为规则 4：提示转人工，不擅自建单）
import { tool, type ToolRuntime } from 'langchain'
import { z } from 'zod'
import { searchKnowledge } from '@/services/knowledge'

export const searchKnowledgeTool = tool(
  async ({ query }, _runtime: ToolRuntime) => {
    const results = searchKnowledge(query)
    if (results.length === 0) {
      return '知识库未检索到相关内容。请如实告知用户："这个问题我暂时无法解答，帮您转接人工客服。"如用户明确要求人工介入，再调用 create_ticket。'
    }
    return results
      .map((entry) => `Q：${entry.question}\nA：${entry.answer}`)
      .join('\n\n')
  },
  {
    name: 'search_knowledge',
    description:
      '检索平台 FAQ 知识库（退换货政策、退款时效、物流规则、售后说明等）。用户咨询政策类问题时优先调用，基于返回内容作答，严禁编造。',
    schema: z.object({
      query: z.string().describe('要检索的关键词或问题描述')
    })
  }
)
