/**
 * 第 5 课 · 流式观察：看见图是怎么一步步跑的
 *
 * invoke() 要等整张图跑完才给你结果。用户等 10 秒看不到任何反应，体验很差。
 * stream() 每跑完一个节点就吐一块出来，你可以立刻推给前端 / 打印进度。
 *
 * 两个最常用的 streamMode：
 *   "updates" —— 每个节点「刚刚返回的那部分增量」（最适合做进度条）
 *   "values"  —— 每步结束后的「完整 state」（最适合做调试）
 *
 * 运行：bun run 05
 */
import * as z from 'zod'
import {
  END,
  ReducedValue,
  START,
  StateGraph,
  StateSchema
} from '@langchain/langgraph'
import { banner, cyan, dim, kv, section, sleep, step, yellow } from './ui'

banner('第 5 课', '流式观察：看见图是怎么一步步跑的')

/* ---------------------------- State ---------------------------- */
const SearchState = new StateSchema({
  question: z.string(),
  // 节点一次可以返回一批检索词，reducer 负责把它们拼进旧数组
  queries: new ReducedValue(
    z.array(z.string()).default(() => []),
    {
      inputSchema: z.array(z.string()),
      reducer: (current, next) => [...current, ...next]
    }
  ),
  docs: new ReducedValue(
    z.array(z.string()).default(() => []),
    {
      inputSchema: z.array(z.string()),
      reducer: (current, next) => [...current, ...next]
    }
  ),
  answer: z.string().optional()
})
type SearchStateType = typeof SearchState.State
type SearchUpdateType = typeof SearchState.Update

/* ---------------------------- 节点 ---------------------------- */
// 一个「先拆问题、再分别检索、最后汇总」的小流程
async function plan(state: SearchStateType): Promise<SearchUpdateType> {
  await sleep(200)
  step('plan', `拆解问题：${state.question}`)
  return {
    queries: ['langgraph 是什么', 'langgraph 和 langchain 的区别']
  }
}

async function search(state: SearchStateType): Promise<SearchUpdateType> {
  await sleep(400)
  const docs = state.queries.map((query) => `《关于「${query}」的文档片段》`)
  step('search', `按 ${state.queries.length} 个检索词查资料`)
  return { docs }
}

async function summarize(state: SearchStateType): Promise<SearchUpdateType> {
  await sleep(250)
  step('summarize', '把资料汇总成一句话')
  return {
    answer: `根据 ${state.docs.length} 篇资料：LangGraph 是 LangChain 团队做的「有状态、可循环」的编排框架。`
  }
}

/* ---------------------------- 拼图 ---------------------------- */
const graph = new StateGraph(SearchState)
  .addNode('plan', plan)
  .addNode('search', search)
  .addNode('summarize', summarize)
  .addEdge(START, 'plan')
  .addEdge('plan', 'search')
  .addEdge('search', 'summarize')
  .addEdge('summarize', END)
  .compile()

const input = { question: 'LangGraph 是什么？' }

async function main() {
  section('streamMode: "updates" —— 每个节点完成时就吐一块')
  console.log(dim('  （注意时间戳：结果是边跑边出来的，不是最后一次性给你）'))
  const startedAt = Date.now()
  // stream() 返回一个异步迭代器，for await 一块一块地拿到
  for await (const chunk of await graph.stream(input, {
    streamMode: 'updates'
  })) {
    for (const [nodeName, delta] of Object.entries(chunk)) {
      const ms = String(Date.now() - startedAt).padStart(4)
      console.log(
        `  ${dim(`+${ms}ms`)} ${cyan(
          nodeName.padEnd(10)
        )} ${JSON.stringify(delta)}`
      )
    }
  }

  section('streamMode: "values" —— 每步之后的完整 state')
  const watchedKeys = ['queries', 'docs', 'answer'] as const
  let previous: SearchStateType | undefined
  for await (const state of await graph.stream(input, {
    streamMode: 'values'
  })) {
    const last = previous
    const changed =
      last === undefined
        ? []
        : watchedKeys.filter(
            (key) => JSON.stringify(state[key]) !== JSON.stringify(last[key])
          )
    console.log(
      `  ${yellow('state')} 变化字段: ${changed.join(', ') || '（初始输入）'}`
    )
    previous = state
  }
  kv('最终 answer', previous?.answer)

  section('可视化：把图导出成 Mermaid，粘到 mermaid.live 就能看图')
  console.log(
    graph
      .getGraph()
      .drawMermaid()
      .split('\n')
      .map((line) => '  ' + line)
      .join('\n')
  )

  console.log(
    '\n' +
      cyan('关键点：') +
      '\n  · stream() 和 invoke() 用的是同一张图、同一份 state，只是「交付方式」不同；\n' +
      '  · 前端做打字机效果 / 进度条，用 streamMode: "updates" 最合适；\n' +
      '  · 调试「第几步 state 变成什么样了」，用 streamMode: "values"；\n' +
      '  · 最后一课：把前四课的东西拼起来，做一个真正的 Agent。\n'
  )
}

await main()
