/**
 * 口径问答子图（fakeModel）：decide → retrieve → grade → answer / fallback
 */
import { describe, expect, it } from 'bun:test'
import { AIMessage, HumanMessage } from '@langchain/core/messages'
import { fakeModel } from 'langchain'
import { createMetricsGraph } from '@/graph/rag-subgraph.ts'

function metricsGraph(related: boolean) {
  const model = fakeModel()
    .respondWithTools([{ name: 'retrieve_metrics', args: { keyword: 'GMV' } }])
    .respond(new AIMessage('GMV 是下单总额；销售额只统计有效订单。'))
  const gradeModel = fakeModel().structuredResponse({
    related,
    reason: 'test'
  })
  return createMetricsGraph({ model, gradeModel })
}

describe('metrics 子图', () => {
  it('related：retrieve → grade → answer', async () => {
    const out = await metricsGraph(true).invoke({
      messages: [new HumanMessage('GMV 和销售额有什么区别')]
    })
    const types = out.messages.map((message) => message.getType())
    expect(types).toContain('tool')
    expect(String(out.messages.at(-1)?.text)).toContain('GMV')
  })

  it('not related：走 fallback，不编造口径', async () => {
    const out = await metricsGraph(false).invoke({
      messages: [new HumanMessage('GMV 和销售额有什么区别')]
    })
    expect(String(out.messages.at(-1)?.text)).toContain('口径库')
  })

  it('decide 无 tool_calls：直接 END，不检索', async () => {
    const model = fakeModel().respond(new AIMessage('GMV 是下单金额总额。'))
    const graph = createMetricsGraph({
      model,
      gradeModel: fakeModel().structuredResponse({
        related: true,
        reason: 'unused'
      })
    })
    const out = await graph.invoke({
      messages: [new HumanMessage('GMV 是什么')]
    })
    expect(out.messages.map((message) => message.getType())).not.toContain(
      'tool'
    )
    expect(String(out.messages.at(-1)?.text)).toContain('GMV')
  })
})
