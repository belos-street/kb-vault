// 工具：create_ticket —— 创建人工工单
// priority 随工单一起落入工单模型（services/ticket.ts），默认 normal
import { tool, type ToolRuntime } from 'langchain'
import { getUserId } from '@/agent/runtime'
import { z } from 'zod'
import { createTicket, TICKET_PRIORITIES } from '@/services/ticket'

export const createTicketTool = tool(
  async ({ summary, priority }, runtime: ToolRuntime) => {
    const userId = getUserId(runtime)
    const ticket = createTicket({ user_id: userId, summary, priority })
    const suffix =
      ticket.priority !== 'normal' ? `（优先级：${ticket.priority}）` : ''
    return `已创建工单 ${ticket.ticket_id}${suffix}，工作人员会尽快处理并与您联系。`
  },
  {
    name: 'create_ticket',
    description:
      '创建人工客服工单，将当前问题转交给工作人员处理时调用（注意：创建工单需要人工审批）。',
    schema: z.object({
      summary: z
        .string()
        .describe('问题摘要（用户诉求的核心描述，供人工客服快速了解）'),
      priority: z
        .enum(TICKET_PRIORITIES)
        .optional()
        .describe('工单优先级，默认 normal')
    })
  }
)
