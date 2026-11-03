/**
 * 第 1 课 · 最小的图：一条直线
 *
 * 一个 LangGraph 程序只有 4 个概念，这一课全部用上：
 *
 *   State（状态）  —— 一个带「更新规则」的对象，在节点之间传递
 *   Node（节点）   —— 就是一个普通函数：读 state，返回「要改哪几个字段」
 *   Edge（边）     —— 规定「这个节点跑完，下一个跑谁」
 *   START / END    —— 图的入口和出口
 *
 * 本课的图长这样（一条直线，没有任何分支）：
 *
 *   START → receive（接单）→ triage（分类）→ respond（生成回复）→ END
 *
 * 运行：bun run 01
 */
import * as z from 'zod'
import {
  END,
  ReducedValue,
  START,
  StateGraph,
  StateSchema
} from '@langchain/langgraph'
import { banner, cyan, kv, section, sleep, step } from './ui'

banner('第 1 课', '最小的图：一条直线')

/* ------------------------------------------------------------------ *
 * ① 定义 State
 *
 * StateSchema 里每个字段就是 state 的一个 key，值是一个 Zod schema：
 *   z.string()                  —— 直接覆盖（后写的覆盖先写的）
 *   z.string().optional()       —— 可以缺省
 *   z.number().default(0)       —— 缺省时自动填 0
 *   ReducedValue(...)           —— 用 reducer 合并
 *
 * reducer 是 LangGraph 最核心的设计之一：
 * 节点只返回「增量」，由 reducer 决定怎么并进旧值。
 * ------------------------------------------------------------------ */
const TicketState = new StateSchema({
  // 原始工单内容
  ticket: z.string(),

  // 分类结果：billing / technical / other
  category: z.string().optional(),

  // 最终回复
  reply: z.string().optional(),

  // 执行痕迹：每经过一个节点就追加一条（演示 reducer 的合并）
  // inputSchema 决定「节点这次能写什么」：这里写一个 string，
  // reducer 负责把它追加到已有数组后面。
  trace: new ReducedValue(
    z.array(z.string()).default(() => []),
    {
      inputSchema: z.string(),
      reducer: (current, next) => [...current, next]
    }
  )
})

// 从 State 定义里取出 TypeScript 类型，节点函数就能自动补全
type TicketStateType = typeof TicketState.State
type TicketUpdateType = typeof TicketState.Update

/* ------------------------------------------------------------------ *
 * ② 定义节点
 *
 * 注意两个细节：
 *   - 参数是整个 state 的快照（只读，别直接改）
 *   - 返回值只需要写「你想改的字段」，没写的字段保持不变
 * ------------------------------------------------------------------ */
async function receive(state: TicketStateType): Promise<TicketUpdateType> {
  step('receive', '接单：把用户的一句话原样放进 state')
  // 模拟一点点 IO（查数据库、调接口……）
  await sleep(100)
  return {
    ticket: state.ticket.trim(),
    trace: 'receive'
  }
}

async function triage(state: TicketStateType): Promise<TicketUpdateType> {
  await sleep(100)
  // 真实项目里这里会调用大模型，本课用关键词匹配，保证不联网也能跑
  const text = state.ticket
  const category = text.includes('退款')
    ? 'billing'
    : text.includes('报错') || text.includes('登录')
      ? 'technical'
      : 'other'
  step('triage', `判断工单类型 → ${category}`)
  return { category, trace: 'triage' }
}

const TEMPLATES = new Map<string, string>([
  ['billing', '已为你登记退款，1-3 个工作日原路退回。'],
  ['technical', '请把报错截图发给我们，工程师会尽快跟进。'],
  ['other', '已收到你的问题，客服会人工回复你。']
])

async function respond(state: TicketStateType): Promise<TicketUpdateType> {
  await sleep(100)
  const reply = TEMPLATES.get(state.category ?? 'other') ?? '已收到你的问题。'
  step('respond', '根据分类挑选回复模板')
  return { reply, trace: 'respond' }
}

/* ------------------------------------------------------------------ *
 * ③ 把节点和边拼成图
 *
 * 注意：new StateGraph(...) 返回的是「草稿」，还不能跑，
 *       必须 .compile() 之后才是可以 invoke 的图。
 * ------------------------------------------------------------------ */
const graph = new StateGraph(TicketState)
  .addNode('receive', receive)
  .addNode('triage', triage)
  .addNode('respond', respond)
  .addEdge(START, 'receive') // 入口 → receive
  .addEdge('receive', 'triage') // 直线，一条接一条
  .addEdge('triage', 'respond')
  .addEdge('respond', END) // reply 跑完就结束
  .compile()

/* ------------------------------------------------------------------ *
 * ④ 跑起来
 * ------------------------------------------------------------------ */
async function main() {
  section('这张图的结构')
  // drawMermaid() 会把图渲染成 Mermaid 文本，粘到 mermaid.live 就能看图
  console.log(
    graph
      .getGraph()
      .drawMermaid()
      .split('\n')
      .map((line) => '  ' + line)
      .join('\n')
  )

  section('invoke：一次性跑完整张图')
  // 只需要传「必填字段」；optional 和 default 字段可以省略
  const input = { ticket: '  我上周买的东西想退款，怎么操作？  ' }
  console.log(`  输入 ${cyan('ticket')} = "${input.ticket}"`)
  console.log('  开始执行 ↓')

  const result = await graph.invoke(input)

  console.log('  执行结束 ↑')
  section('输出：invoke 返回的是「跑完后的完整 state」')
  kv('ticket', result.ticket)
  kv('category', result.category)
  kv('reply', result.reply)
  kv('trace', result.trace)

  console.log(
    '\n' +
      cyan('记住这三点：') +
      '\n  1. 节点只返回「增量」，LangGraph 帮你合并；\n' +
      '  2. trace 被 reducer 追加了 3 次；\n' +
      '  3. 一条直线的图没什么用 —— 下一课加「分支」。\n'
  )
}

await main()
