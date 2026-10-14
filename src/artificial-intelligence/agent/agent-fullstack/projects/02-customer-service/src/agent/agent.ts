/**
 * Agent 组装（2.4 全配置项一次见全）+ 中间件栈（2.6 组合）
 *
 * - model 传初始化串（config.mainModel），框架内部走 initChatModel 解析；
 *   测试可注入 fakeModel（buildAgent 的 options.model）
 * - responseFormat：循环结束后结构化收口 → result.structuredResponse
 *   （实现为一个 extract-* 工具调用，schema 的 title 固定工具名便于测试脚本化）
 * - checkpointer：MemorySaver（开发）/ PostgresSaver（默认，Spike A 结论落地）
 * - contextSchema：userId 经 config.context 注入工具（权限最小化）
 *
 * 中间件栈六件（README §中间件栈，顺序即洋葱层序）：
 *   summarization → pii(卡号) → pii(手机号) → toolRetry → modelRetry →
 *   HITL → modelCallLimit
 */
import type { BaseChatModel } from '@langchain/core/language_models/chat_models'
import type { ModelProfile } from '@langchain/core/language_models/profile'
import {
  createAgent,
  humanInTheLoopMiddleware,
  initChatModel,
  modelCallLimitMiddleware,
  modelRetryMiddleware,
  piiMiddleware,
  summarizationMiddleware,
  toolRetryMiddleware
} from 'langchain'
import { z } from 'zod'
import { ContextSchema } from '@/agent/context.ts'
import { customerServicePrompt } from '@/agent/prompts/customer-service-prompt.ts'
import {
  createTicket,
  processRefund,
  queryOrder,
  searchPolicy
} from '@/agent/tools/index.ts'
import { config } from '@/config.ts'
import {
  createCheckpointer,
  type CheckpointerHandle
} from '@/memory/checkpointer.ts'

/**
 * 对话结束后的结构化收口：处理结论 + 是否需要跟进
 * title 固定为 extract-* 前缀：responseFormat 走「结构化输出工具」实现，
 * 工具名取 schema title（缺省是全局自增的 extract-N，测试脚本化不了）
 */
export const AgentResponseSchema = z
  .object({
    resolution: z.enum([
      'answered',
      'refund_initiated',
      'ticket_created',
      'escalated'
    ]),
    follow_up_needed: z.boolean()
  })
  .meta({ title: 'extract-agent-response' })

export type AgentResponse = z.infer<typeof AgentResponseSchema>

/** 结构化收口工具名（responseFormat 的 ToolStrategy 工具名 = schema title） */
export const EXTRACT_TOOL_NAME = 'extract-agent-response'

/** HITL 审批配置：敏感工具拦截，确定性工具放行（README §Human-in-the-Loop） */
export const hitl = humanInTheLoopMiddleware({
  interruptOn: {
    process_refund: { allowedDecisions: ['approve', 'edit', 'reject'] },
    create_ticket: { allowedDecisions: ['approve', 'reject'] },
    query_order: false,
    search_policy: false
  }
})

export function buildMiddlewareStack(summarizationModel: BaseChatModel) {
  return [
    // 长会话 Token 管理（2.5）：触发 0.8 / 保留 0.3（面试推荐档，可 env 调）
    summarizationMiddleware({
      model: summarizationModel,
      trigger: { fraction: config.SUMMARIZE_TRIGGER_FRACTION },
      keep: { fraction: config.SUMMARIZE_KEEP_FRACTION }
    }),
    piiMiddleware('credit_card'), // 内置类型：卡号打码
    piiMiddleware('phone', {
      // 自定义类型：手机号（内置不含，必须给 detector）
      detector: /1[3-9]\d{9}/,
      strategy: 'mask',
      applyToInput: true
    }),
    toolRetryMiddleware({ maxRetries: 2 }), // 瞬时工具错误重试
    modelRetryMiddleware(), // 模型调用重试
    hitl, // 敏感操作审批
    modelCallLimitMiddleware({
      threadLimit: config.MODEL_CALL_THREAD_LIMIT,
      exitBehavior: 'end' // 防循环熔断：体面收尾不抛错
    })
  ]
}

export interface BuildAgentOptions {
  /** 覆盖主力模型（测试注入 fakeModel；缺省 config.mainModel） */
  model?: string | BaseChatModel
  /** 覆盖 checkpointer（测试注入 MemorySaver；缺省按 CHECKPOINTER 环境变量） */
  checkpointer?: CheckpointerHandle['checkpointer']
}

/**
 * 摘要压缩的 fraction 档位（trigger 0.8 / keep 0.3）按模型上下文窗口折算——
 * deepseek 类自定义模型名查不到内置 ModelProfile，必须显式声明档案，
 * 否则 summarizationMiddleware 直接报错（改用绝对 token 数才免档案）
 */
function summarizationProfile(): ModelProfile {
  return {
    maxInputTokens: config.MODEL_CONTEXT_WINDOW,
    maxOutputTokens: config.MODEL_MAX_OUTPUT_TOKENS
  }
}

export async function buildAgent(options: BuildAgentOptions = {}) {
  const summarizationModel = await initChatModel(config.classifierModel, {
    profile: summarizationProfile()
  })
  return createAgent({
    model: options.model ?? config.mainModel,
    tools: [queryOrder, searchPolicy, processRefund, createTicket],
    systemPrompt: customerServicePrompt,
    responseFormat: AgentResponseSchema,
    middleware: buildMiddlewareStack(summarizationModel),
    checkpointer: options.checkpointer,
    contextSchema: ContextSchema
  })
}

export type CustomerServiceAgent = Awaited<ReturnType<typeof buildAgent>>

export interface AgentHandle {
  agent: CustomerServiceAgent
  /** 进程退出前收尾：PostgresSaver 档关连接池（Spike A 纪律） */
  close: () => Promise<void>
}

export async function createCustomerServiceAgent(
  options: BuildAgentOptions = {}
): Promise<AgentHandle> {
  const owned = options.checkpointer ? null : await createCheckpointer()
  const agent = await buildAgent({
    ...options,
    checkpointer: options.checkpointer ?? owned?.checkpointer
  })
  return {
    agent,
    close: () => (owned ? owned.close() : Promise.resolve())
  }
}
