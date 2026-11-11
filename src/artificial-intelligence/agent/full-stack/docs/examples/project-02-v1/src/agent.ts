import type { BaseChatModel } from '@langchain/core/language_models/chat_models'
import { BaseCheckpointSaver, MemorySaver } from '@langchain/langgraph'
import {
  createAgent,
  humanInTheLoopMiddleware,
  modelFallbackMiddleware,
  modelRetryMiddleware,
  toolErrorMiddleware
} from 'langchain'
import { z } from 'zod'
import { faqTool, refundTool } from './tools.ts'

export const CustomerContext = z.object({
  userId: z.string(),
  role: z.enum(['agent', 'admin']),
  tenantId: z.string()
})

export function createCustomerAgent(input: {
  model: BaseChatModel
  checkpointer?: BaseCheckpointSaver
}) {
  return createAgent({
    model: input.model,
    tools: [faqTool, refundTool],
    systemPrompt:
      '你是客服助手。先查 FAQ，再决定是否调用退款；退款必须人工审批。',
    contextSchema: CustomerContext,
    middleware: [
      modelRetryMiddleware({ maxRetries: 2, onFailure: 'error' }),
      modelFallbackMiddleware(
        process.env.FALLBACK_MODEL ?? 'openai:gpt-4o-mini'
      ),
      humanInTheLoopMiddleware({
        interruptOn: {
          refund: {
            allowedDecisions: ['approve', 'edit', 'reject'],
            description: '退款需要人工审批'
          }
        }
      }),
      toolErrorMiddleware({
        onError: (error) => {
          // 权限拒绝 fail closed：让异常冒泡到 route，返回 403
          if (
            error instanceof Error &&
            error.message.includes('permission_denied')
          ) {
            return undefined
          }
          return '工具执行失败，请换个方式或转人工。'
        }
      })
    ],
    checkpointer: input.checkpointer ?? new MemorySaver()
  })
}
