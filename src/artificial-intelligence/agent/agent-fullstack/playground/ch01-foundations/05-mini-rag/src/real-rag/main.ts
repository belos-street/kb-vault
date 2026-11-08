/**
 * 演示入口：真实模型版 RAG。
 *
 * 运行：bun run ch01-foundations/05-mini-rag/src/real-rag/main.ts
 * 需要 playground/.env 里的 OPENAI_API_KEY；
 * 想用真实语义向量再配 EMBEDDING_API_KEY，否则走本地哈希向量。
 */
import { evaluate } from './eval'
import { answerWithCitations } from './rag'
import type { Doc, EvalCase } from './types'

const docs: Doc[] = [
  {
    id: 'leave',
    text: '员工每年享有 10 天年假，需要提前三天在系统里提交申请。'
  },
  {
    id: 'expense',
    text: '差旅报销须在出差结束后 7 天内提交发票，逾期需要主管审批。'
  },
  {
    id: 'remote',
    text: '远程办公每周最多两天，需要提前一天获得主管批准。'
  }
]

const cases: EvalCase[] = [
  { query: '年假怎么申请', expectedDocId: 'leave' },
  { query: '报销发票什么时候交', expectedDocId: 'expense' },
  { query: '远程办公每周几天', expectedDocId: 'remote' }
]

async function main(): Promise<void> {
  const question = '年假怎么申请'
  const result = await answerWithCitations(question, docs)

  console.log('问题：', question)
  console.log('回答：', result.answer)
  console.log('引用：', result.citations)
  console.log('用量：', result.usage)

  const summary = await evaluate(cases, docs)
  console.log('---')
  console.log(`命中率：${summary.hits}/${summary.total}`, summary.hitRate)
  if (summary.misses.length > 0) {
    console.log('未命中：', summary.misses)
  }
}

if (import.meta.main) {
  await main()
}
