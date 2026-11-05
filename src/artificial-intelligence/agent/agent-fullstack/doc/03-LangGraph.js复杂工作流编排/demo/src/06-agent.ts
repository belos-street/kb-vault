/**
 * 第 6 课 · 综合：手写一个 ReAct Agent
 *
 * 前五课的所有零件，在这里拼成一个「会思考、会调工具」的 Agent：
 *
 *                  ┌─────────────────────────┐
 *                  │                         │
 *   START → agent ─┼─ 要调工具 → tools ──────┘
 *                  └─ 想清楚了 → END
 *
 * 这就是所有 Agent 框架的核心结构，区别只在于「agent 节点里是什么」：
 *   · 默认用确定性的假模型（不用 API key，跑得飞快，行为可预测）
 *   · `bun run 06:real` 换成 .env 里的真模型 —— 图的形状一模一样
 *
 * 运行：
 *   bun run 06       假模型（默认，零 Key）
 *   bun run 06:real  真模型（读取 .env）
 */
import {
  AIMessage,
  HumanMessage,
  SystemMessage,
  ToolMessage,
  type BaseMessage
} from '@langchain/core/messages'
import { tool } from '@langchain/core/tools'
import * as z from 'zod'
import {
  END,
  MessagesValue,
  START,
  StateGraph,
  StateSchema
} from '@langchain/langgraph'
import { createRealModel } from './real-model'
import {
  banner,
  cyan,
  dim,
  kv,
  magenta,
  section,
  sleep,
  step,
  yellow
} from './ui'

banner('第 6 课', '综合：手写一个 ReAct Agent')

/* ---------------------------- 运行模式 ---------------------------- */
// 默认假模型（确定性、零 Key）；`bun run 06:real` 会设置 REAL_MODEL=1
const useRealModel = process.env.REAL_MODEL === '1'

if (useRealModel && !process.env.OPENAI_API_KEY) {
  console.error(
    '缺少 OPENAI_API_KEY：先 cp .env.example .env 并填入 Key，' +
      '或直接 bun run 06 走假模型。'
  )
  process.exit(1)
}

/* ---------------------------- State ---------------------------- */
const ToolCallSchema = z.object({
  id: z.string(),
  name: z.string(),
  args: z.record(z.string(), z.unknown())
})
type ToolCall = z.infer<typeof ToolCallSchema>

const AgentState = new StateSchema({
  messages: MessagesValue,
  // agent 决定要调哪个工具；null 表示「想清楚了，可以给最终答案」
  pendingTool: ToolCallSchema.nullable().default(null),
  steps: z.number().default(0),
  answer: z.string().optional()
})
type AgentStateType = typeof AgentState.State
type AgentUpdateType = typeof AgentState.Update

/* ---------------------------- 工具 ---------------------------- */
const OrderSchema = z.object({
  orderId: z.string(),
  item: z.string(),
  amount: z.number(),
  status: z.string()
})
type Order = z.infer<typeof OrderSchema>

const ORDERS: Record<string, Order> = {
  A1001: {
    orderId: 'A1001',
    item: '机械键盘',
    amount: 399,
    status: '已签收'
  },
  A1002: {
    orderId: 'A1002',
    item: '显示器',
    amount: 1299,
    status: '运输中'
  }
}

const OrderArgsSchema = z.object({
  orderId: z.string().describe('订单号，例如 A1001')
})

const getOrderTool = tool(
  async ({ orderId }) => {
    const order = ORDERS[orderId]
    return order ? JSON.stringify(order) : `订单 ${orderId} 不存在`
  },
  {
    name: 'get_order',
    description: '查询订单的商品、金额和物流状态',
    schema: OrderArgsSchema
  }
)

const refundTool = tool(
  async ({ orderId }) => {
    const order = ORDERS[orderId]
    if (!order) return `订单 ${orderId} 不存在，退款失败`
    if (order.status !== '已签收') {
      return `订单 ${orderId} 当前是「${order.status}」，不能退款`
    }
    return `退款 ¥${order.amount} 已提交，1-3 个工作日到账`
  },
  {
    name: 'refund',
    description: '对已签收订单提交退款',
    schema: OrderArgsSchema
  }
)

// bindTools 需要 LangChain 的工具定义；toolsNode 执行时也复用这两份定义
const TOOL_DEFS = [getOrderTool, refundTool]

function textOf(message: BaseMessage | undefined): string {
  return message?.text ?? ''
}

function parseOrder(message: BaseMessage): Order | null {
  try {
    const parsed = OrderSchema.safeParse(JSON.parse(message.text))
    return parsed.success ? parsed.data : null
  } catch {
    return null
  }
}

function makeToolCall(
  steps: number,
  name: string,
  args: Record<string, unknown>
): AgentUpdateType {
  const toolCall: ToolCall = { id: `call-${steps}`, name, args }
  return {
    // 真实模型也会返回一条带 tool_calls 的 AIMessage
    messages: [new AIMessage({ content: '', tool_calls: [toolCall] })],
    pendingTool: toolCall,
    steps
  }
}

/* ------------------------------------------------------------------ *
 * agent 节点 = 「模型」的位置
 *
 * 真实项目在这里写：
 *   const res = await model.bindTools(toolDefs).invoke(state.messages);
 *   return { messages: [res], pendingTool: res.tool_calls?.[0] ?? null };
 *
 * 下面这套 if/else 就是一个「确定性假模型」，方便你现在就跑起来。
 * ------------------------------------------------------------------ */
async function fakeAgentNode(state: AgentStateType): Promise<AgentUpdateType> {
  await sleep(200)
  const observations = state.messages.filter(
    (message) => message.type === 'tool'
  )
  const question = state.messages.find((message) => message.type === 'human')
  const text = textOf(question)
  const orderId = text.match(/A\d{4}/)?.[0] ?? 'A1001'
  const steps = state.steps + 1

  // 第一轮：还不知道订单情况 → 先查
  if (observations.length === 0) {
    console.log(`  ${magenta('Thought')} 先查一下订单 ${orderId} 的状态和金额`)
    console.log(
      `  ${yellow('Action')}  get_order(${JSON.stringify({
        orderId
      })})\n`
    )
    return makeToolCall(steps, 'get_order', { orderId })
  }

  const orderInfo = observations
    .map(parseOrder)
    .find((order): order is Order => order !== null)

  // 第二轮：订单已签收 → 发起退款
  if (observations.length === 1 && orderInfo?.status === '已签收') {
    console.log(
      `  ${magenta('Thought')} 订单已签收，符合退款条件，直接提交退款`
    )
    console.log(
      `  ${yellow('Action')}  refund(${JSON.stringify({
        orderId
      })})\n`
    )
    return makeToolCall(steps, 'refund', { orderId })
  }

  // 第三轮：信息够了 → 给最终答案（最后一条工具结果就是要汇报的结论）
  const lastResult = textOf(observations.at(-1))
  let answer: string
  if (!orderInfo) {
    answer = `订单 ${orderId} 查询失败：${lastResult}`
  } else if (orderInfo.status === '已签收') {
    answer = `订单 ${orderId}（${orderInfo.item} ¥${orderInfo.amount}）：${lastResult}`
  } else {
    answer = `订单 ${orderId}（${orderInfo.item}）当前「${orderInfo.status}」，还没签收，不支持退款；建议拒收，包裹会自动退回并退款。`
  }
  console.log(`  ${magenta('Thought')} 信息够了，给用户最终答复`)
  return {
    messages: [new AIMessage(answer)],
    pendingTool: null,
    answer,
    steps
  }
}

/* ------------------------------------------------------------------ *
 * 真模型版 agent：只替换这一个节点的函数体
 *
 * 图、State、条件边、tools 节点全部复用；这就是「模型可替换」的含义。
 * ------------------------------------------------------------------ */
const SYSTEM_PROMPT =
  '你是一个电商售后助手。查询订单状态和金额用 get_order；' +
  '确认订单已签收且用户要求退款时用 refund。' +
  '一次只调用一个工具，拿到结果后用中文简洁回答；不要编造订单信息。'

const realModel = useRealModel ? createRealModel() : null
const boundModel = realModel?.bindTools(TOOL_DEFS)

async function realAgentNode(state: AgentStateType): Promise<AgentUpdateType> {
  if (!boundModel) throw new Error('真模型未初始化')
  const response = await boundModel.invoke(state.messages)
  const toolCall = response.tool_calls?.[0]

  if (toolCall) {
    console.log(
      `  ${magenta('Model')} 调用 ${toolCall.name}(${JSON.stringify(
        toolCall.args
      )})`
    )
  } else {
    console.log(`  ${magenta('Model')} 给出最终回答`)
  }

  return {
    messages: [response],
    pendingTool: toolCall
      ? {
          id: toolCall.id ?? '',
          name: toolCall.name,
          args: toolCall.args
        }
      : null,
    answer: toolCall ? undefined : textOf(response),
    steps: state.steps + 1
    // 本课一次只处理一个工具调用；多工具并行留作练习
  }
}

const agentNode = useRealModel ? realAgentNode : fakeAgentNode

/* ---------------------------- 工具节点 ---------------------------- */
async function toolsNode(state: AgentStateType): Promise<AgentUpdateType> {
  await sleep(useRealModel ? 0 : 250)
  const call = state.pendingTool
  if (!call) return {}

  const selected = TOOL_DEFS.find((item) => item.name === call.name)
  let result: string
  try {
    result = selected
      ? String(await selected.invoke(call.args as { orderId: string }))
      : `未知工具：${call.name}`
  } catch (error) {
    // 工具参数校验失败时把错误回传给模型，让它自己纠错
    result = `工具调用失败：${
      error instanceof Error ? error.message : String(error)
    }`
  }

  step('tools', `${call.name} → ${result}`)
  return {
    // 把工具结果塞回消息历史，agent 下一轮就能「看到」了
    messages: [
      new ToolMessage({
        content: result,
        tool_call_id: call.id,
        name: call.name
      })
    ],
    pendingTool: null
  }
}

/* ---------------------------- 拼图 ---------------------------- */
const graph = new StateGraph(AgentState)
  .addNode('agent', agentNode)
  .addNode('tools', toolsNode)
  .addEdge(START, 'agent')
  // 条件边：有工具要调就去 tools，否则结束
  .addConditionalEdges('agent', (state: AgentStateType) =>
    state.pendingTool ? 'tools' : END
  )
  .addEdge('tools', 'agent') // 工具跑完回到 agent —— 一个环
  .compile()

async function run(question: string) {
  section(`用户：${question}`)
  const result = await graph.invoke(
    {
      messages: [new SystemMessage(SYSTEM_PROMPT), new HumanMessage(question)]
    },
    { recursionLimit: 20 }
  )
  kv('最终答案', result.answer)
  kv('总步数', result.steps)
}

async function main() {
  kv('模型', useRealModel ? '真模型（.env）' : '确定性假模型（零 Key）')

  section('Agent 的图结构')
  console.log(
    graph
      .getGraph()
      .drawMermaid()
      .split('\n')
      .map((line) => '  ' + line)
      .join('\n')
  )

  await run('订单 A1001 的键盘坏了，能退款吗？')
  await run('订单 A1002 我不想要了，退款吧')

  console.log(
    '\n' +
      cyan('这就是 Agent：') +
      '\n  Agent = 模型 + 工具 + 循环 + 状态。\n\n' +
      cyan(useRealModel ? '当前是真模型模式。' : '想用真模型？') +
      (useRealModel
        ? ' 同一张图，只是 agent 节点换了实现。\n'
        : ` 运行 ${dim('bun run 06:real')}，读取 .env 后跑同一张图。\n`)
  )
}

await main()
