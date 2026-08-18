// 主 Agent 配置：createAgent 组装完整智能客服 Agent
// 中间件栈顺序（洋葱模型，README「主 Agent 配置」蓝本）：
// pii → modelFallback → toolCallLimit → summarization → humanInTheLoop
import {
  createAgent,
  summarizationMiddleware,
  humanInTheLoopMiddleware,
  piiMiddleware,
  modelFallbackMiddleware,
  toolCallLimitMiddleware
} from 'langchain'
import * as z from 'zod'
import { systemPrompt } from '@/prompts/system.ts'
import { checkpointer } from '@/memory/checkpointer.ts'
import { store } from '@/memory/store.ts'
import {
  queryOrderTool,
  createRefundTool,
  searchKnowledgeTool,
  createTicketTool,
  savePreferenceTool,
  getPreferencesTool
} from '@/agent/tools/index.ts'

const DEFAULT_MODEL = process.env.DEFAULT_MODEL ?? 'openai:gpt-5.4'
const SUMMARY_MODEL = process.env.SUMMARY_MODEL ?? 'openai:gpt-5.4-mini'
const FALLBACK_MODELS = [
  process.env.FALLBACK_MODEL_1 ?? 'openai:gpt-5.4-mini',
  process.env.FALLBACK_MODEL_2 ?? 'anthropic:claude-sonnet-4-6'
]

type CreateAgentParams = Parameters<typeof createAgent>[0]

/** 依赖注入：默认走环境变量 + 模块级单例；测试可覆盖（fakeModel / 临时 Checkpointer / 独立 Store） */
interface AgentOverrides {
  model?: CreateAgentParams['model']
  checkpointer?: CreateAgentParams['checkpointer']
  store?: CreateAgentParams['store']
}

/**
 * 组装主 Agent。默认 model 取 DEFAULT_MODEL（createAgent 字符串简写必须带 provider 前缀），
 * 记忆层取模块级单例 checkpointer / store；测试时传 overrides 注入 fakeModel 等。
 */
export function createCustomerSupportAgent(overrides: AgentOverrides = {}) {
  return createAgent({
    /** Agent 标识：LangSmith Trace 中用于区分主 Agent 与分类器的调用链 */
    name: 'customer_support_agent',
    /** 主模型，由 DEFAULT_MODEL 环境变量配置 */
    model: overrides.model ?? DEFAULT_MODEL,
    /** 系统 Prompt：客服角色定义 + 工具说明 + 边界策略 + 情绪管理 */
    systemPrompt,
    /** 业务工具（snake_case 命名，与文档规范一致） */
    tools: [
      queryOrderTool,
      createRefundTool,
      searchKnowledgeTool,
      createTicketTool,
      savePreferenceTool,
      getPreferencesTool
    ],
    /** 运行时上下文 Schema：每次 invoke 传入 userId + userName，工具内通过 runtime.context 访问 */
    contextSchema: z.object({
      userId: z.string(),
      userName: z.string()
    }),
    /** 短期记忆 Checkpointer：SqliteSaver 持久化对话历史，同 thread_id 恢复上下文 */
    checkpointer: overrides.checkpointer ?? checkpointer,
    /** 长期记忆 Store：跨对话保存用户偏好（工具通过 runtime.store 读写） */
    store: overrides.store ?? store,
    /** 中间件栈，按数组顺序执行（beforeModel 正序 / afterModel 逆序，洋葱模型） */
    middleware: [
      // PII 脱敏：必须放最外层，确保所有模型（主模型 / 摘要模型 / 备选模型）都只收到脱敏后的输入
      // （当前 langchain 版本 piiRedactionMiddleware 已废弃，改用 piiMiddleware 逐类型声明）
      piiMiddleware('email', { strategy: 'redact', applyToInput: true }),
      piiMiddleware('phone', {
        strategy: 'mask',
        applyToInput: true,
        detector: '1[3-9]\\d{9}'
      }),
      // 模型容错：主模型失败时依次降级
      modelFallbackMiddleware(...FALLBACK_MODELS),
      // 工具限流：单次运行最多 10 次工具调用，防止死循环
      toolCallLimitMiddleware({ runLimit: 10, exitBehavior: 'end' }),
      // 上下文压缩：token 超阈值时用 SUMMARY_MODEL 摘要旧消息，保留最近 20 条
      summarizationMiddleware({
        model: SUMMARY_MODEL,
        trigger: { tokens: 4000 },
        keep: { messages: 20 }
      }),
      // 人工审批：退款申请 / 工单创建 暂停等待人工决策
      humanInTheLoopMiddleware({
        interruptOn: {
          create_refund: { allowedDecisions: ['approve', 'reject'] },
          // MVP 只支持 approve/reject；如需"编辑工单内容后重提"，可扩展为 ["approve", "edit", "reject"]（高级功能）
          create_ticket: { allowedDecisions: ['approve', 'reject'] }
        }
      })
    ]
  })
}

/** 主 Agent 单例：CLI / 端到端使用；测试用 createCustomerSupportAgent 注入 fakeModel */
export const agent = createCustomerSupportAgent()
