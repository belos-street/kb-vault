// 评估入口（todo 4.2）：bun run evaluate
// 使用真实 LLM（.env 的 DEFAULT_MODEL / CLASSIFIER_MODEL）跑本地数据集评估；
// 换模型或改 Prompt 后重跑，对比通过率即为「回归测试」。
import { join } from 'node:path'
import { agent } from '@/agent/agent'
import { intentClassifier } from '@/agent/classifier'
import { formatReport, runEvaluation, type EvalCase } from './evaluator'

const data = (await Bun.file(
  join(import.meta.dir, 'test-data.json')
).json()) as EvalCase[]

console.log(`开始评估：${data.length} 条用例...\n`)
const report = await runEvaluation(intentClassifier, agent, data, {
  userId: 'U1001',
  userName: '李华'
})
console.log(formatReport(report))
