/**
 * 第 2 课 · 条件边：让图自己决定走哪条路
 *
 * 第 1 课是「一条直线」，所有工单都走同一条路。
 * 但真实的业务流程几乎都有分支：退款走 A，报错走 B，其它走 C。
 *
 * 这一课学 addConditionalEdges()：
 *
 *   普通边 addEdge(A, B)  —— A 跑完，一定去 B
 *   条件边 addConditionalEdges(A, 路由函数, 路径表)
 *                        —— A 跑完，调用「路由函数」看 state，返回值决定下一个是谁
 *
 * 图长这样：
 *
 *                       ┌─→ handleBilling ─┐
 *   START → classify ───┼─→ handleTech ────┼─→ END
 *                       └─→ handleOther ───┘
 *
 * 运行：bun run 02
 */
import * as z from 'zod'
import {
  END,
  ReducedValue,
  START,
  StateGraph,
  StateSchema
} from '@langchain/langgraph'
import { banner, cyan, dim, kv, section, sleep, step } from './ui'

banner('第 2 课', '条件边：让图自己决定走哪条路')

/* ---------------------------- State ---------------------------- */
const TicketState = new StateSchema({
  ticket: z.string(),
  category: z.string().optional(),
  reply: z.string().optional(),
  trace: new ReducedValue(
    z.array(z.string()).default(() => []),
    {
      inputSchema: z.string(),
      reducer: (current, next) => [...current, next]
    }
  )
})
type TicketStateType = typeof TicketState.State
type TicketUpdateType = typeof TicketState.Update

/* ---------------------------- 节点 ---------------------------- */
async function classify(state: TicketStateType): Promise<TicketUpdateType> {
  await sleep(80)
  const text = state.ticket
  const category =
    text.includes('退款') || text.includes('发票')
      ? 'billing'
      : text.includes('报错') || text.includes('登录') || text.includes('闪退')
        ? 'technical'
        : 'other'
  step('classify', `"${text}" → ${category}`)
  return { category, trace: 'classify' }
}

async function handleBilling(): Promise<TicketUpdateType> {
  await sleep(80)
  step('billing', '走退款流程')
  return {
    reply: '已为你登记退款，1-3 个工作日原路退回。',
    trace: 'handleBilling'
  }
}

async function handleTech(): Promise<TicketUpdateType> {
  await sleep(80)
  step('technical', '走技术支持流程')
  return {
    reply: '请把报错截图发给我们，工程师会尽快跟进。',
    trace: 'handleTech'
  }
}

async function handleOther(): Promise<TicketUpdateType> {
  await sleep(80)
  step('other', '走人工兜底流程')
  return {
    reply: '已收到你的问题，稍后由人工客服回复。',
    trace: 'handleOther'
  }
}

/* ------------------------------------------------------------------ *
 * 路由函数：普通函数而已
 *
 * 输入 state，输出「下一个节点的名字」。
 * 它不修改 state，只做决定 —— 相当于 if/else，但是图的一部分。
 *
 * 另一种写法是让节点返回 Command({ update, goto })，
 * 把「改状态」和「决定去哪」合在同一个节点里（教程 3.1 §5.2）。
 * ------------------------------------------------------------------ */
function routeByCategory(
  state: TicketStateType
): 'handleBilling' | 'handleTech' | 'handleOther' {
  // 想提前结束也可以直接 return END
  switch (state.category) {
    case 'billing':
      return 'handleBilling'
    case 'technical':
      return 'handleTech'
    default:
      return 'handleOther'
  }
}

/* ---------------------------- 拼图 ---------------------------- */
const graph = new StateGraph(TicketState)
  .addNode('classify', classify)
  .addNode('handleBilling', handleBilling)
  .addNode('handleTech', handleTech)
  .addNode('handleOther', handleOther)
  .addEdge(START, 'classify')
  // 关键的一行：classify 之后不再写死，而是交给 routeByCategory 决定
  .addConditionalEdges('classify', routeByCategory, {
    // 路径表：路由函数的返回值 → 真实节点名
    // 有这张表，图才能把三条分支画出来（不写也能跑，但图里看不到分支）
    handleBilling: 'handleBilling',
    handleTech: 'handleTech',
    handleOther: 'handleOther'
  })
  .addEdge('handleBilling', END)
  .addEdge('handleTech', END)
  .addEdge('handleOther', END)
  .compile()

/* ---------------------------- 跑三单 ---------------------------- */
const tickets = [
  '我上周买的东西想退款，怎么操作？',
  'App 一打开就闪退，登录不了',
  '你们几点下班？'
]

async function main() {
  section('这张图的结构：一个节点扇出三条路')
  console.log(
    graph
      .getGraph()
      .drawMermaid()
      .split('\n')
      .map((line) => '  ' + line)
      .join('\n')
  )

  for (const ticket of tickets) {
    section(`执行：${ticket}`)
    // 故意串行跑：三单并行会让输出交错，不方便观察每一步
    // eslint-disable-next-line no-await-in-loop
    const result = await graph.invoke({ ticket })
    kv('category', result.category)
    kv('reply', result.reply)
    kv('trace', result.trace.join(' → '))
  }

  console.log(
    '\n' +
      cyan('关键点：') +
      '\n  · 分支不是 if/else 藏在代码里，而是图里真实存在的边，\n' +
      '    所以能画出来、能被可视化、能单独测试；\n' +
      '  · 同一张图，输入不同就走不同路径 —— 这是 LangGraph 的「动态」之处；\n' +
      '  · 下一课最刺激：让边往回指，形成循环' +
      dim('（LangGraph 的真正杀手锏）') +
      '。\n'
  )
}

await main()
