/**
 * create_ticket —— 创建工单转人工（敏感工具，将被 HITL 拦截审批）
 *
 * 只能给自己建单（userId 取自 runtime.context，入参里没有 user_id——
 * 结构上就不存在「替别人建单」的可能，权限最小化的最彻底形态）。
 * transcript 会话摘要由后续 Agent 组装层补充，工具层不负责生成。
 */
import type { ToolRuntime } from '@langchain/core/tools'
import { tool } from 'langchain'
import { z } from 'zod'
import { createTicket as saveTicket } from '../../services/db.ts'
import type { AgentContext } from '../context.ts'

export const createTicket = tool(
  async ({ type, summary }, runtime: ToolRuntime<unknown, AgentContext>) => {
    const userId = runtime.context?.userId
    if (!userId) return '系统异常：缺少用户身份，无法创建工单'

    const ticket = await saveTicket({
      userId,
      type,
      summary,
      transcript: null
    })
    return `工单已创建：TK-${String(ticket.id).padStart(4, '0')}（类型：${type}，状态：${ticket.status}）。人工客服会尽快跟进，请用户保持通讯畅通。`
  },
  {
    name: 'create_ticket',
    description:
      '为当前用户创建工单转人工客服（敏感操作，执行前需人工审批）。适用于知识库未覆盖、用户不满或明确要求人工的场景。',
    schema: z.object({
      type: z
        .enum(['refund', 'logistics', 'account', 'complaint', 'other'])
        .describe('工单类型'),
      summary: z.string().min(1).describe('问题摘要，基于当前对话内容概括')
    })
  }
)
