import { tool, type ToolRuntime } from 'langchain'
import { z } from 'zod'
import { createTicket as createTicketService } from '@/services/ticket.ts'

/**
 * 创建工单工具
 *
 * 为复杂问题或投诉创建人工客服工单。
 * priority 参数可选，会附加到摘要中供客服参考。
 */
export const createTicketTool = tool(
  async ({ summary, priority }, runtime: ToolRuntime) => {
    const userId = (runtime.context as { userId: string }).userId

    const fullSummary = priority
      ? `[${priority === 'high' ? '紧急' : priority === 'medium' ? '普通' : '低优先级'}] ${summary}`
      : summary

    const ticketId = createTicketService({ userId, summary: fullSummary })

    const priorityMsg = priority
      ? `已标记为「${priority === 'high' ? '紧急' : priority === 'medium' ? '普通' : '低优先级'}」优先级。`
      : ''

    return `工单已创建！${priorityMsg}工单号为 ${ticketId}，专属客服将在 10 分钟内联系您处理。`
  },
  {
    name: 'createTicket',
    description:
      '为用户创建人工客服工单，用于需要人工介入的复杂问题或投诉。可指定优先级。',
    schema: z.object({
      summary: z.string().describe('问题摘要，描述用户需要人工处理的详细情况'),
      priority: z
        .enum(['high', 'medium', 'low'])
        .optional()
        .describe('优先级，高优先级的工单会更早被处理')
    })
  }
)
