/**
 * Agent 配置
 *
 * 使用 createAgent 组装完整 Agent：模型、系统 Prompt、工具、记忆、中间件。
 * 这是整个客服系统的核心入口。
 */
import { createAgent } from 'langchain'
import {
  summarizationMiddleware,
  piiMiddleware,
  humanInTheLoopMiddleware
} from 'langchain'
import { z } from 'zod'
import { systemPrompt } from '@/prompts/system.ts'
import { checkpointer } from '@/memory/checkpointer.ts'
import { store } from '@/memory/store.ts'
import {
  queryOrder,
  createRefund,
  searchKnowledge,
  createTicket
} from '@/agent/tools/index.ts'

const DEFAULT_MODEL = process.env.DEFAULT_MODEL ?? 'openai:gpt-5.4'
const SUMMARY_MODEL = process.env.SUMMARY_MODEL ?? 'openai:gpt-5.4-mini'

export const agent = createAgent({
  /** LLM 模型，由 DEFAULT_MODEL 环境变量配置，默认 openai:gpt-5.4 */
  model: DEFAULT_MODEL,

  /** 系统 Prompt：角色定义、工具说明、边界策略、情绪管理、Few-shot 示例 */
  systemPrompt,

  /** 注册 4 个业务工具：查订单、申请退款、FAQ 检索、创建工单 */
  tools: [queryOrder, createRefund, searchKnowledge, createTicket],

  /** 上下文 Schema：每次 invoke 必须传入 userId + userName，运行时通过 runtime.context 获取 */
  contextSchema: z.object({
    userId: z.string(),
    userName: z.string()
  }),

  /** 短期记忆 Checkpointer：SqliteSaver 持久化对话历史，同 thread_id 互换恢复上下文 */
  checkpointer,

  /** 长期记忆 Store：跨对话保存用户偏好（InMemoryStore MVP，生产可换 PostgresStore） */
  store,

  /** 中间件栈，按数组顺序执行 */
  middleware: [
    // ① 摘要压缩：消息 token 超 4000 时触发，旧消息被 LLM 摘要替代，保留最近 20 条
    summarizationMiddleware({
      model: SUMMARY_MODEL,
      trigger: { tokens: 4000 },
      keep: { messages: 20 }
    }),

    // ② PII 脱敏：检测邮件地址并进行脱敏处理（替换为 ***@***.com）
    piiMiddleware('email', { strategy: 'redact' }),

    // ③ 人工审批：退款申请和创建工单需要用户确认后才能执行
    humanInTheLoopMiddleware({
      interruptOn: {
        createRefund: { allowedDecisions: ['approve', 'reject'] },
        createTicket: { allowedDecisions: ['approve', 'edit'] }
      }
    })
  ]
})
