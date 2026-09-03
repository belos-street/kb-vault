// 本地评估回归测试（todo 4.2）：
// fakeModel 驱动分类器与主 Agent，断言三个 Evaluator 维度打分正确、报告可读
import { describe, expect, test } from 'bun:test'
import { fakeModel } from '@langchain/core/testing'
import { AIMessage } from '@langchain/core/messages'
import { InMemoryStore } from '@langchain/langgraph'
import { createIntentClassifier } from '../src/agent/classifier'
import { createCustomerSupportAgent } from '../src/agent/agent'
import { createCheckpointer } from '../src/memory/checkpointer'
import {
  formatReport,
  runEvaluation,
  type EvalCase
} from '../src/evaluation/evaluator'

const context = { userId: 'U1001', userName: '李华' }

describe('本地评估（runEvaluation）', () => {
  test('三个维度打分正确，报告通过率可读', async () => {
    // 分类器替身：按用例顺序返回两段 JSON
    const classifier = createIntentClassifier({
      model: fakeModel()
        .respond(
          new AIMessage(
            '{"intent":"order_query","slots":{"order_id":"ORD-2601"}}'
          )
        )
        .respond(new AIMessage('{"intent":"faq_query","slots":{}}'))
    })

    // 主 Agent 替身：两条用例都真实调用 query_order工具
    const model = fakeModel()
      .respondWithTools([
        { name: 'query_order', args: { order_id: 'ORD-2601' } }
      ])
      .respond(new AIMessage('您的订单 ORD-2601 已发货。'))
      .respondWithTools([
        { name: 'query_order', args: { order_id: 'ORD-2601' } }
      ])
      .respond(new AIMessage('退款时效为 3-5 个工作日。'))
    const mainAgent = createCustomerSupportAgent({
      model,
      checkpointer: createCheckpointer(':memory:'),
      store: new InMemoryStore()
    })

    const cases: EvalCase[] = [
      {
        id: 'c1_full_match',
        input: '帮我查一下订单 ORD-2601 到哪了',
        expected_intent: 'order_query',
        expected_slots: { order_id: 'ORD-2601' },
        expected_tool: 'query_order'
      },
      {
        id: 'c2_tool_mismatch',
        input: '退款多久能到账？',
        expected_intent: 'faq_query',
        expected_tool: 'search_knowledge'
      }
    ]

    const report = await runEvaluation(classifier, mainAgent, cases, context)

    expect(report.total).toBe(2)
    expect(report.passed).toBe(1)

    // c1：三个维度全过
    const c1 = report.results[0]
    expect(c1.passed).toBe(true)
    expect(c1.scores.every((s) => s.score === 1)).toBe(true)

    // c2：意图过、槽位无期望过、工具维度失败
    const c2 = report.results[1]
    expect(c2.passed).toBe(false)
    const toolScore = c2.scores.find((s) => s.key === 'tool')
    expect(toolScore?.score).toBe(0)
    expect(toolScore?.comment).toContain('search_knowledge')
    expect(toolScore?.comment).toContain('query_order')

    // 报告可读：包含通过率与失败维度详情
    const text = formatReport(report)
    expect(text).toContain('通过率：1/2（50%）')
    expect(text).toContain('[c1_full_match] PASS')
    expect(text).toContain('[c2_tool_mismatch] FAIL')
  })
})
