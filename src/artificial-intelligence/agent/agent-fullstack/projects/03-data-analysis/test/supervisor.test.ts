/**
 * Supervisor 装配 smoke（fakeModel）：handoff → sql_expert → responseFormat 收口
 */
import { describe, expect, it } from 'bun:test'
import { AIMessage, HumanMessage } from '@langchain/core/messages'
import { fakeModel } from 'langchain'
import { createChartAgent } from '@/agents/chart-agent.ts'
import { createSqlAgent } from '@/agents/sql-agent.ts'
import { createAnalysisSupervisor } from '@/agents/supervisor.ts'

describe('analysis supervisor', () => {
  it('派活给 sql_expert 后能用 responseFormat 收口', async () => {
    const sqlModel = fakeModel().respond(new AIMessage('华南区示例数据'))
    const chartModel = fakeModel().respond(new AIMessage('图表已生成'))
    const supervisorModel = fakeModel()
      .respondWithTools([{ name: 'transfer_to_sql_expert', args: {} }])
      .respond(new AIMessage('sql_expert 已返回结果'))
      .structuredResponse({
        summary: '华南区示例摘要',
        markdown: '# 华南区示例报告\n\n示例正文。'
      })

    const supervisor = createAnalysisSupervisor({
      model: supervisorModel,
      sqlAgent: createSqlAgent(sqlModel, []),
      chartAgent: createChartAgent(chartModel)
    })

    const out = (await supervisor.invoke({
      messages: [new HumanMessage('上个月华南区销售额')]
    })) as unknown as {
      structuredResponse?: { summary: string; markdown: string }
    }

    expect(out.structuredResponse?.markdown).toContain('华南区示例报告')
  })
})
