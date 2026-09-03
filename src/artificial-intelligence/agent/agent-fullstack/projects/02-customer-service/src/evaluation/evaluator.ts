// 本地评估（todo 4.2）：LangSmith evaluate() 的本地动手版
// 流程对应文档 2.7 §4 评估工作流：数据集 → Agent 推理 → Evaluator 评分 → 通过率报告
//
// 与 LangSmith 的差异（实测记）：
// - 数据集是本地 JSON（src/evaluation/test-data.json），字段自定义，无需上传云端
// - Evaluator 是纯函数（意图 / 槽位 / 工具调用三个维度），签名 (case, run) → { key, score, comment }
// - 报告输出到控制台；改 .env 换模型/Prompt 后重跑即可对比版本通过率
//
// ⚠️ create_refund / create_ticket 受 HITL 审批控制（invoke 会中断等待人工决策，
//    工具不会真实执行），所以涉及这两个工具的用例不设 expected_tool，只评估意图与槽位。
import { classify } from '@/agent/classifier'
import type { IntentOutput } from '@/agent/schema'

/** 数据集用例（字段自定义，与 test-data.json 对应） */
export interface EvalCase {
  id: string
  input: string
  expected_intent: IntentOutput['intent']
  expected_slots?: Record<string, string | number>
  expected_tool?: string
}

/** 单条用例的执行结果（Agent 运行快照） */
export interface EvalRun {
  intent: IntentOutput
  /** 实际调用的工具名列表（从 ToolMessage.name 提取） */
  toolCalls: string[]
  reply: string
}

/** 单维度评分，形状对齐 LangSmith Evaluator 的 { key, score, comment } */
export interface ScoreResult {
  key: string
  score: number
  comment: string
}

export type CaseEvaluator = (testCase: EvalCase, run: EvalRun) => ScoreResult

/** 意图维度：分类器输出与期望意图一致 */
export const intentEvaluator: CaseEvaluator = (testCase, run) => ({
  key: 'intent',
  score: run.intent.intent === testCase.expected_intent ? 1 : 0,
  comment: `期望 ${testCase.expected_intent}，实际 ${run.intent.intent}`
})

/** 槽位维度：期望槽位全部被提取且值一致（String 化比较，兼容数字金额） */
export const slotEvaluator: CaseEvaluator = (testCase, run) => {
  const expected = testCase.expected_slots ?? {}
  const keys = Object.keys(expected)
  if (keys.length === 0) {
    return { key: 'slots', score: 1, comment: '无槽位期望' }
  }
  const slots = run.intent.slots as Record<string, unknown> | undefined
  const missing = keys.filter(
    (k) => slots?.[k] === undefined || String(slots[k]) !== String(expected[k])
  )
  return {
    key: 'slots',
    score: missing.length === 0 ? 1 : 0,
    comment:
      missing.length === 0
        ? `命中 ${keys.length} 个槽位`
        : `缺失或不符：${missing.map((k) => `${k}=${expected[k]}`).join('，')}`
  }
}

/** 工具维度：实际调用的工具包含期望工具 */
export const toolEvaluator: CaseEvaluator = (testCase, run) => {
  if (!testCase.expected_tool) {
    return {
      key: 'tool',
      score: 1,
      comment: '未设工具期望（HITL 类工具不自动评估）'
    }
  }
  return {
    key: 'tool',
    score: run.toolCalls.includes(testCase.expected_tool) ? 1 : 0,
    comment: `期望调用 ${testCase.expected_tool}，实际 ${run.toolCalls.join('，') || '无'}`
  }
}

export const defaultEvaluators: CaseEvaluator[] = [
  intentEvaluator,
  slotEvaluator,
  toolEvaluator
]

/** 被 Agent 的最小结构接口：编译图 / 测试替身都只需实现 invoke */
export interface EvalAgentLike {
  invoke(input: unknown, config: unknown): Promise<unknown>
}

interface RunMessage {
  getType: () => string
  name?: string
  content?: unknown
}

export interface CaseResult {
  id: string
  scores: ScoreResult[]
  passed: boolean
}

export interface EvalReport {
  total: number
  passed: number
  results: CaseResult[]
}

/** 评估一条用例：分类器 → 主 Agent → 从 messages 提取工具调用与回复 */
export async function evaluateCase(
  classifierAgent: Parameters<typeof classify>[0],
  mainAgent: EvalAgentLike,
  testCase: EvalCase,
  context: { userId: string; userName: string },
  evaluators: CaseEvaluator[] = defaultEvaluators
): Promise<CaseResult> {
  const intent = await classify(classifierAgent, testCase.input)

  // thread_id 每次评估加随机后缀：checkpointer 持久化下重复跑不会串上历史消息
  const suffix = crypto.randomUUID().slice(0, 8)
  const result = (await mainAgent.invoke(
    { messages: [{ role: 'user', content: testCase.input }] },
    { configurable: { thread_id: `eval-${testCase.id}-${suffix}` }, context }
  )) as { messages?: RunMessage[] }

  const messages = result.messages ?? []
  const toolCalls = messages
    .filter((m) => m.getType() === 'tool')
    .map((m) => m.name ?? 'unknown_tool')
  const last = messages.at(-1)
  const reply =
    typeof last?.content === 'string'
      ? last.content
      : JSON.stringify(last?.content)

  const run: EvalRun = { intent, toolCalls, reply }
  const scores = evaluators.map((evaluate) => evaluate(testCase, run))
  return { id: testCase.id, scores, passed: scores.every((s) => s.score === 1) }
}

/** 跑完整数据集；用例串行执行（Mock 服务有共享状态，并行会互相污染） */
export async function runEvaluation(
  classifierAgent: Parameters<typeof classify>[0],
  mainAgent: EvalAgentLike,
  cases: EvalCase[],
  context: { userId: string; userName: string },
  evaluators: CaseEvaluator[] = defaultEvaluators
): Promise<EvalReport> {
  const results: CaseResult[] = []
  for (const testCase of cases) {
    results.push(
      // eslint-disable-next-line no-await-in-loop -- 用例串行：共享 Mock 状态不可并行
      await evaluateCase(
        classifierAgent,
        mainAgent,
        testCase,
        context,
        evaluators
      )
    )
  }
  return {
    total: results.length,
    passed: results.filter((r) => r.passed).length,
    results
  }
}

/** 渲染可读报告：每条用例一行 + 汇总通过率 */
export function formatReport(report: EvalReport): string {
  const lines = report.results.map((r) => {
    const scoreText = r.scores
      .map((s) => `${s.key}=${s.score === 1 ? '✅' : `❌（${s.comment}）`}`)
      .join(' ')
    return `[${r.id}] ${r.passed ? 'PASS' : 'FAIL'}  ${scoreText}`
  })
  const rate =
    report.total === 0 ? 0 : Math.round((report.passed / report.total) * 100)
  lines.push('')
  lines.push(`通过率：${report.passed}/${report.total}（${rate}%）`)
  return lines.join('\n')
}
