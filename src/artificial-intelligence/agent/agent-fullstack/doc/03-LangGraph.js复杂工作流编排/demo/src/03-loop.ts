/**
 * 第 3 课 · 循环：图可以往回走
 *
 * 前两课的边都是「往前走」。但只要允许边指回去，你就得到了一个循环，
 * 而循环 = 重试、反思、自我修正、以及 Agent 的「思考-行动-再思考」。
 *
 * 这一课做个文案机器人：
 *
 *   START → writer（写一版）→ critic（审稿）
 *                ↑               │
 *                └── 不合格 ──────┤
 *                                └── 合格 ──→ END
 *
 * 顺带学两个工程上必须知道的东西：
 *   · recursionLimit：循环必须有刹车，否则无限跑
 *   · GraphRecursionError：踩到刹车时 LangGraph 抛的错
 *
 * 运行：bun run 03
 */
import * as z from 'zod'
import {
  END,
  GraphRecursionError,
  ReducedValue,
  START,
  StateGraph,
  StateSchema
} from '@langchain/langgraph'
import { banner, cyan, dim, green, kv, red, section, sleep, step } from './ui'

banner('第 3 课', '循环：图可以往回走')

/* ---------------------------- State ---------------------------- */
const CopyState = new StateSchema({
  product: z.string(),
  draft: z.string().optional(),
  feedback: z.string().optional(),
  pass: z.boolean().default(false),
  round: z.number().default(0),
  trace: new ReducedValue(
    z.array(z.string()).default(() => []),
    {
      inputSchema: z.string(),
      reducer: (current, next) => [...current, next]
    }
  )
})
type CopyStateType = typeof CopyState.State
type CopyUpdateType = typeof CopyState.Update

/* ------------------------------------------------------------------ *
 * writer：根据第几轮，写出一版（一版比一版好）
 * 真实项目里这一步就是「调用大模型，把 feedback 塞进 prompt 再写一次」
 * ------------------------------------------------------------------ */
const DRAFTS = [
  '好喝到停不下来', // 第 1 轮：忘了卖点
  '0糖也好喝，好喝到根本停不下来', // 第 2 轮：卖点有了，但太啰嗦
  '0糖也好喝' // 第 3 轮：通过
] as const

async function writer(state: CopyStateType): Promise<CopyUpdateType> {
  await sleep(150)
  const round = state.round + 1
  const index = Math.min(round - 1, DRAFTS.length - 1)
  const draft = DRAFTS[index] ?? ''
  step('writer', `第 ${round} 稿：「${draft}」`)
  return { draft, round, pass: false, trace: `writer#${round}` }
}

/* ------------------------------------------------------------------ *
 * critic：审稿，决定 pass/fail
 * ------------------------------------------------------------------ */
async function critic(state: CopyStateType): Promise<CopyUpdateType> {
  await sleep(150)
  const problems: string[] = []
  const draft = state.draft ?? ''
  if (!draft.includes('0糖')) problems.push('必须提到「0糖」')
  if (draft.length > 10) {
    problems.push(`太长（${draft.length} 个字，上限 10）`)
  }

  const pass = problems.length === 0
  const feedback = pass ? '通过' : problems.join('；')
  console.log(
    `  ${green('▸')} ${'critic'.padEnd(10)} ${
      pass ? green('✓ 通过') : red('✗ ' + feedback)
    }`
  )
  return { pass, feedback, trace: 'critic' }
}

/* ------------------------------------------------------------------ *
 * 拼图：注意 addConditionalEdges 可以把边连回前面的节点
 * ------------------------------------------------------------------ */
const graph = new StateGraph(CopyState)
  .addNode('writer', writer)
  .addNode('critic', critic)
  .addEdge(START, 'writer')
  .addEdge('writer', 'critic')
  .addConditionalEdges('critic', (state: CopyStateType) => {
    // 路由函数返回 END 就是「就地结束」，返回节点名就是「回去再来一轮」
    return state.pass ? END : 'writer'
  })
  .compile() // compile() 时会检查：允许有环，但必须有出路（这里是 pass → END）

async function main() {
  section('这张图的结构：出现了一个环')
  console.log(
    graph
      .getGraph()
      .drawMermaid()
      .split('\n')
      .map((line) => '  ' + line)
      .join('\n')
  )

  section('情况 A：改到合格为止（递归上限 20）')
  const ok = await graph.invoke(
    { product: '0 糖气泡水' },
    { recursionLimit: 20 }
  )
  kv('draft', ok.draft)
  kv('round', ok.round)
  kv('trace', ok.trace.join(' → '))

  section('情况 B：永远不合格 —— 看看「刹车」长什么样')
  // 一个永远只会写第 1 稿的 writer，保证 critic 永远判 fail
  const neverPass = new StateGraph(CopyState)
    .addNode(
      'writer',
      async (state: CopyStateType): Promise<CopyUpdateType> => {
        await sleep(60)
        const round = state.round + 1
        return {
          draft: '好喝到停不下来',
          round,
          pass: false,
          trace: `writer#${round}`
        }
      }
    )
    .addNode('critic', critic)
    .addEdge(START, 'writer')
    .addEdge('writer', 'critic')
    .addConditionalEdges('critic', (state: CopyStateType) =>
      state.pass ? END : 'writer'
    )
    .compile()

  try {
    await neverPass.invoke({ product: '无糖咖啡' }, { recursionLimit: 6 })
  } catch (error) {
    if (error instanceof GraphRecursionError) {
      console.log(
        `\n  ${red('✗ 触发 GraphRecursionError')} ${dim(
          '（这是预期行为，不是 bug）'
        )}`
      )
      kv('错误信息', String(error.message).split('\n')[0])
      kv('recursionLimit', 6)
      console.log(
        dim(
          '\n  一次「writer + critic」算 2 步，上限 6 步 = 最多 3 轮；\n' +
            '  真实项目里除了这个兜底，还会在 state 里自己记轮次上限，做更友好的降级。'
        )
      )
    } else {
      throw error
    }
  }

  console.log(
    '\n' +
      cyan('关键点：') +
      '\n  · 边可以往回指 —— 这就是 Agent 的实现方式；\n' +
      '  · 循环一定配刹车（recursionLimit + 自己的轮次上限）；\n' +
      '  · 下一课：让图「记得」上一轮说过的话。\n'
  )
}

await main()
