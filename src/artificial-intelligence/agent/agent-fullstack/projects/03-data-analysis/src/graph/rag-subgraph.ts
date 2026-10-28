/**
 * 口径问答子图（简化版 Agentic RAG，3.3）
 *
 * decide → retrieve → grade → answer / fallback
 * 与文档里的五节点版差异：去掉 rewrite 环与 retryCount（留给 3.3 独立练习）。
 *
 * 与外层共享 messages（MessagesValue），编译后直接 addNode 挂载。
 */
import type { BaseChatModel } from '@langchain/core/language_models/chat_models'
import {
  AIMessage,
  HumanMessage,
  SystemMessage
} from '@langchain/core/messages'
import {
  END,
  MessagesValue,
  START,
  StateGraph,
  StateSchema
} from '@langchain/langgraph'
import { ToolNode } from '@langchain/langgraph/prebuilt'
import { tool } from 'langchain'
import * as z from 'zod'
import { searchMetrics } from '@/services/metrics-kb.ts'

const RagState = new StateSchema({
  messages: MessagesValue,
  related: z.boolean().optional()
})

const GradeSchema = z.object({
  related: z.boolean(),
  reason: z.string()
})

const DECIDE_PROMPT = `你是指标口径助手。判断用户问题是否需要查指标口径库：
- 问指标定义/口径/计算方式 → 调用 retrieve_metrics
- 其他问题 → 直接回答，不要调用工具`

const GRADE_PROMPT = `判断「检索结果」是否足以回答「问题」。
只有检索结果确实定义了问题所问的指标口径时 related 才为 true；否则 related=false。`

const ANSWER_PROMPT = `根据检索到的指标口径如实回答，引用条目里的定义；不得编造未检索到的口径。`

export function createMetricsGraph(params: {
  model: BaseChatModel
  gradeModel?: BaseChatModel
}) {
  const { model, gradeModel = model } = params

  const retrieveMetrics = tool(
    async ({ keyword }) => {
      const hits = searchMetrics(keyword)
      return JSON.stringify({ hits })
    },
    {
      name: 'retrieve_metrics',
      description:
        '按关键词检索指标口径库（GMV / 销售额 / 退款率 / 客单价 / 环比）',
      schema: z.object({ keyword: z.string().describe('指标关键词') })
    }
  )

  const decide = async (state: typeof RagState.State) => {
    const bound = model.bindTools?.([retrieveMetrics]) ?? model
    const response = await bound.invoke([
      new SystemMessage(DECIDE_PROMPT),
      ...state.messages
    ])
    return { messages: [response] }
  }

  const grade = async (state: typeof RagState.State) => {
    const toolMessage = [...state.messages]
      .reverse()
      .find((message) => message.getType() === 'tool')
    const question = [...state.messages]
      .reverse()
      .find((message) => message.getType() === 'human')
    const verdict = await gradeModel
      .withStructuredOutput(GradeSchema)
      .invoke([
        new SystemMessage(GRADE_PROMPT),
        new HumanMessage(
          `问题：${question?.text ?? ''}\n检索结果：${toolMessage?.text ?? ''}`
        )
      ])
    return { related: verdict.related }
  }

  const answer = async (state: typeof RagState.State) => {
    const response = await model.invoke([
      new SystemMessage(ANSWER_PROMPT),
      ...state.messages
    ])
    return { messages: [response] }
  }

  const fallback = async () => ({
    messages: [
      new AIMessage(
        '口径库里没有覆盖你问的这个指标，建议换个说法或直接问销售额/退款率等口径。'
      )
    ]
  })

  return new StateGraph(RagState)
    .addNode('decide', decide)
    .addNode('retrieve', new ToolNode([retrieveMetrics]))
    .addNode('grade', grade)
    .addNode('answer', answer)
    .addNode('fallback', fallback)
    .addEdge(START, 'decide')
    .addConditionalEdges('decide', (state) => {
      const last = state.messages.at(-1)
      const toolCalls = (last as AIMessage | undefined)?.tool_calls ?? []
      return toolCalls.length > 0 ? 'retrieve' : END
    })
    .addEdge('retrieve', 'grade')
    .addConditionalEdges('grade', (state) =>
      state.related ? 'answer' : 'fallback'
    )
    .addEdge('answer', END)
    .addEdge('fallback', END)
    .compile({ name: 'metrics_qa' })
}
