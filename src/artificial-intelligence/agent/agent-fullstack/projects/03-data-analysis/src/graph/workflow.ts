/**
 * 外层工作流（3.1 / 3.2 主场）
 *
 * routeIntent 条件边 → analysis（Supervisor 子图）/ metricsQa（口径子图）/ directReply
 * analysis 结束后 exportReport：manual 走 interrupt 审批，auto 直接落盘。
 *
 * 出口只有一个：state.structuredResponse（Supervisor 的 responseFormat）。
 */
import type { BaseChatModel } from '@langchain/core/language_models/chat_models'
import type { CompiledStateGraph } from '@langchain/langgraph'
import {
  AIMessage,
  HumanMessage,
  SystemMessage
} from '@langchain/core/messages'
import {
  Command,
  END,
  interrupt,
  MemorySaver,
  START,
  StateGraph
} from '@langchain/langgraph'
import { initChatModel } from 'langchain'
import * as z from 'zod'
import { createChartAgent } from '@/agents/chart-agent.ts'
import { createSqlAgent } from '@/agents/sql-agent.ts'
import { createAnalysisSupervisor } from '@/agents/supervisor.ts'
import { config } from '@/config.ts'
import { createMetricsGraph } from '@/graph/rag-subgraph.ts'
import { WorkflowState } from '@/graph/state.ts'
import { ROUTE_PROMPT } from '@/prompts/route.ts'
import { writeReport } from '@/services/export.ts'
import { createSalesTools } from '@/services/mcp.ts'

const RouteSchema = z.object({
  intent: z.enum(['analysis', 'metrics', 'chat']),
  reply: z.string().optional() // chat 分支直接可用
})

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyCompiledGraph = CompiledStateGraph<any, any, any, any, any>

export interface WorkflowDeps {
  /** Supervisor 编译图（共享 messages / structuredResponse 同名 channel） */
  analysisGraph: AnyCompiledGraph
  /** 口径问答子图 */
  metricsGraph: AnyCompiledGraph
  /** 路由分类模型（mini 即可） */
  routeModel: BaseChatModel
  /** 缺省 MemorySaver；测试可注入独立实例 */
  checkpointer?: MemorySaver
}

export function createWorkflow(deps: WorkflowDeps) {
  const routeIntent = async (state: typeof WorkflowState.State) => {
    const question = state.messages.at(-1)?.text ?? ''
    const out = await deps.routeModel
      .withStructuredOutput(RouteSchema)
      .invoke([new SystemMessage(ROUTE_PROMPT), new HumanMessage(question)])
    return { intent: out.intent, reply: out.reply }
  }

  const directReply = async (state: typeof WorkflowState.State) => ({
    messages: [new AIMessage(state.reply ?? '你好，我是销售数据分析助手。')]
  })

  const exportReport = async (
    state: typeof WorkflowState.State,
    runConfig?: { configurable?: Record<string, unknown> }
  ) => {
    const report = state.structuredResponse
    if (!report) return { status: 'skipped' }

    const threadId = String(runConfig?.configurable?.thread_id ?? 'adhoc')
    const dir = `${config.REPORTS_DIR}/${threadId}`

    // interrupt 之前只做纯计算（恢复时本节点会从头重跑）
    const decision = interrupt({
      action: 'export_report',
      summary: report.summary,
      targetPath: `${dir}/report.md`
    }) as { approved: boolean }

    if (!decision.approved) return { status: 'rejected' }

    const path = await writeReport(dir, report.markdown) // 副作用在 interrupt 之后
    return { status: 'exported', reportPath: path }
  }

  return new StateGraph(WorkflowState)
    .addNode('routeIntent', routeIntent)
    .addNode('analysis', deps.analysisGraph)
    .addNode('metricsQa', deps.metricsGraph)
    .addNode('directReply', directReply)
    .addNode('exportReport', exportReport)
    .addEdge(START, 'routeIntent')
    .addConditionalEdges('routeIntent', (state) =>
      state.intent === 'analysis'
        ? 'analysis'
        : state.intent === 'metrics'
          ? 'metricsQa'
          : 'directReply'
    )
    .addEdge('analysis', 'exportReport')
    .addEdge('exportReport', END)
    .addEdge('metricsQa', END)
    .addEdge('directReply', END)
    .compile({ checkpointer: deps.checkpointer ?? new MemorySaver() })
}

/** 生产装配：MCP 工具 → 两个专家 → Supervisor → 口径子图 → 外层工作流 */
export async function buildDefaultWorkflow(
  options: { checkpointer?: MemorySaver } = {}
) {
  const mainModel = await initChatModel(config.mainModel)
  const chartModel = await initChatModel(config.chartModel)
  const sales = await createSalesTools()

  const analysisGraph = createAnalysisSupervisor({
    model: mainModel,
    sqlAgent: createSqlAgent(mainModel, sales.tools),
    chartAgent: createChartAgent(chartModel)
  })
  const metricsGraph = createMetricsGraph({ model: chartModel })

  const graph = createWorkflow({
    analysisGraph,
    metricsGraph,
    routeModel: chartModel,
    checkpointer: options.checkpointer
  })

  return { graph, close: sales.close }
}

/** CLI 侧恢复审批（同 thread_id） */
export function resumeWithDecision(approved: boolean) {
  return new Command({ resume: { approved } })
}
