/**
 * 外层工作流测试（todo §4/§6）
 *
 * 注入 fake 模型与 stub 子图，验证：路由三分支、interrupt 拒绝/恢复、
 * report.md 与 structuredResponse.markdown 一致。全程不调真实 LLM。
 */
import { afterAll, describe, expect, it } from 'bun:test'
import { rm, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { AIMessage, HumanMessage } from '@langchain/core/messages'
import {
  Command,
  END,
  MemorySaver,
  START,
  StateGraph
} from '@langchain/langgraph'
import { fakeModel } from 'langchain'
import { config } from '@/config.ts'
import { WorkflowState } from '@/graph/state.ts'
import { createWorkflow } from '@/graph/workflow.ts'

const REPORT_MARKDOWN = '# 华南区上月销售分析\n\n销售额 36.28 万，环比 +12%。'
const REPORT_SUMMARY = '华南区上月销售额 36.28 万，环比 +12%'

/** invoke 返回值在类型上不含 __interrupt__，用本地类型收窄 */
interface WorkflowResult {
  messages: { text?: string }[]
  structuredResponse?: { summary: string; markdown: string }
  status?: string
  reportPath?: string
  __interrupt__?: unknown[]
}

const threadIds: string[] = []

function nextThread(label: string): string {
  const id = `test-${label}-${Date.now()}-${threadIds.length}`
  threadIds.push(id)
  return id
}

function stubAnalysis() {
  return new StateGraph(WorkflowState)
    .addNode('supervisor_stub', async () => ({
      structuredResponse: { summary: REPORT_SUMMARY, markdown: REPORT_MARKDOWN }
    }))
    .addEdge(START, 'supervisor_stub')
    .addEdge('supervisor_stub', END)
    .compile()
}

function stubMetrics() {
  return new StateGraph(WorkflowState)
    .addNode('metrics_stub', async () => ({
      messages: [new AIMessage('GMV = 下单总额，含未支付与退款订单。')]
    }))
    .addEdge(START, 'metrics_stub')
    .addEdge('metrics_stub', END)
    .compile()
}

function makeWorkflow(route: { intent: string; reply?: string }) {
  const routeModel = fakeModel().structuredResponse(route)
  return createWorkflow({
    analysisGraph: stubAnalysis(),
    metricsGraph: stubMetrics(),
    routeModel,
    checkpointer: new MemorySaver()
  })
}

afterAll(async () => {
  for (const id of threadIds) {
    await rm(join(config.REPORTS_DIR, id), { recursive: true, force: true })
  }
})

describe('routeIntent 三分支', () => {
  it('chat：直接回复，不进子图', async () => {
    const graph = makeWorkflow({
      intent: 'chat',
      reply: '你好，我是销售数据分析助手。'
    })
    const out = await graph.invoke(
      { messages: [new HumanMessage('你好')] },
      { configurable: { thread_id: nextThread('chat') } }
    )
    expect(String(out.messages.at(-1)?.text)).toContain('你好')
    expect(out.structuredResponse).toBeUndefined()
  })

  it('metrics：走口径子图', async () => {
    const graph = makeWorkflow({ intent: 'metrics' })
    const out = await graph.invoke(
      { messages: [new HumanMessage('GMV 和销售额有什么区别')] },
      { configurable: { thread_id: nextThread('metrics') } }
    )
    expect(String(out.messages.at(-1)?.text)).toContain('GMV')
  })

  it('analysis：进 Supervisor 子图并留下 structuredResponse', async () => {
    const graph = makeWorkflow({ intent: 'analysis' })
    const threadId = nextThread('analysis')
    const out = (await graph.invoke(
      { messages: [new HumanMessage('上个月华南区销售额趋势')] },
      { configurable: { thread_id: threadId } }
    )) as unknown as WorkflowResult
    expect(out.structuredResponse?.summary).toBe(REPORT_SUMMARY)
    expect(out.__interrupt__).toBeDefined()
    expect(out.status).toBeUndefined() // 审批前不落盘
  })
})

describe('interrupt 审批', () => {
  it('reject：不写文件', async () => {
    const graph = makeWorkflow({ intent: 'analysis' })
    const threadId = nextThread('reject')
    const cfg = { configurable: { thread_id: threadId } }

    await graph.invoke(
      { messages: [new HumanMessage('上个月华南区销售额趋势')] },
      cfg
    )
    const resumed = await graph.invoke(
      new Command({ resume: { approved: false } }),
      cfg
    )

    expect(resumed.status).toBe('rejected')
    expect(resumed.reportPath).toBeUndefined()
    await expect(
      readFile(join(config.REPORTS_DIR, threadId, 'report.md'))
    ).rejects.toThrow()
  })

  it('approve：写入 report.md 且内容与 markdown 一致', async () => {
    const graph = makeWorkflow({ intent: 'analysis' })
    const threadId = nextThread('approve')
    const cfg = { configurable: { thread_id: threadId } }

    await graph.invoke(
      { messages: [new HumanMessage('上个月华南区销售额趋势')] },
      cfg
    )
    const resumed = await graph.invoke(
      new Command({ resume: { approved: true } }),
      cfg
    )

    expect(resumed.status).toBe('exported')
    const file = await readFile(
      join(config.REPORTS_DIR, threadId, 'report.md'),
      'utf8'
    )
    expect(file).toBe(REPORT_MARKDOWN)
  })
})
