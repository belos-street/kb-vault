/**
 * Turn 编排（README §总体流程的宿主层 if/else 路由）：
 *   分类 → chit_chat 短路 / 注入槽位提示 → Agent 主循环
 *
 * 与 03 的对照（教学点）：这里的路由是宿主代码 if/else，不是 LangGraph 条件边；
 * HITL 中断也不在此处处理——runTurn 只负责把中断原样带回（state.interrupts），
 * 审批 UI 与 Command resume 归 CLI / 测试驱动方。
 */
import type { BaseMessage } from '@langchain/core/messages'
import type { StreamEvent } from '@langchain/core/tracers/log_stream'
import type { HITLRequest } from 'langchain'
import type { AgentResponse, CustomerServiceAgent } from '@/agent/agent.ts'
import type { Classifier, Route } from '@/intent/classifier.ts'

export interface AgentTurnState {
  messages: BaseMessage[]
  structuredResponse?: AgentResponse
  /** HITL 中断（有值说明有敏感工具在等人审批） */
  interrupts: Array<{ id: string; value: HITLRequest }>
}

export type TurnResult =
  | { kind: 'chit_chat'; route: Route; reply: string }
  | { kind: 'agent'; route: Route; state: AgentTurnState }

export interface TurnRequest {
  input: string
  threadId: string
  userId: string
}

export interface RunTurnOptions {
  /** 流式模式：事件回调（CLI --stream 渲染进度；缺省走 invoke 一把返回） */
  onEvent?: (event: StreamEvent) => void
  /** 分类完成回调（CLI 提前展示 [意图] 行） */
  onRoute?: (route: Route) => void
}

/** 槽位缺失时注入的追问提示（槽位填充的多轮实现，README §RouteSchema） */
export const SLOT_HINT_ORDER_ID =
  '[槽位填充] 用户未提供订单号：请先向用户追问订单号（格式如 SO-2026-0812），' +
  '拿到后再继续办理；严禁臆造订单号。'

/**
 * 图递归预算（langgraph recursionLimit，单位 super-step）
 *
 * ⚠️ 坑记录：默认 25 对本项目远远不够——中间件栈里每个 hook 都是独立图节点
 * （before/after_model 链），一次「模型→工具」往返就吃掉约 10 步，3 轮工具调用
 * 即打爆预算报 GraphRecursionError（看着像死循环，其实是节点开销）。
 * 防循环的语义上限是 modelCallLimit 的 threadLimit，这里只留够图管道的机械开销。
 */
export const RECURSION_LIMIT = 100

/** invoke 统一的运行配置：会话隔离 + 用户身份 + 图递归预算 */
export function turnConfig(threadId: string, userId: string) {
  return {
    configurable: { thread_id: threadId },
    context: { userId },
    recursionLimit: RECURSION_LIMIT
  }
}

export function needsOrderId(route: Route): boolean {
  if (route.slots.order_id) return false
  return route.intent === 'order_ops' || route.slots.category === 'refund'
}

export async function runTurn(
  deps: { classify: Classifier; agent: CustomerServiceAgent },
  turn: TurnRequest,
  options: RunTurnOptions = {}
): Promise<TurnResult> {
  const route = await deps.classify(turn.input)
  options.onRoute?.(route)

  // chit_chat 短路：不进 Agent 循环（省 Token，trace 可见分类器 1 次调用）
  if (route.intent === 'chit_chat') {
    return {
      kind: 'chit_chat',
      route,
      reply: route.reply ?? '您好，我是智能客服助手，有什么可以帮您？'
    }
  }

  const messages: Array<{ role: 'user' | 'system'; content: string }> = [
    { role: 'user', content: turn.input }
  ]
  if (needsOrderId(route)) {
    messages.push({ role: 'system', content: SLOT_HINT_ORDER_ID })
  }

  const config = turnConfig(turn.threadId, turn.userId)

  const output = options.onEvent
    ? await streamTurn(deps.agent, { messages }, config, options.onEvent)
    : await deps.agent.invoke({ messages }, config)

  return { kind: 'agent', route, state: toAgentState(output) }
}

/**
 * streamEvents 流式消费：事件转给 onEvent 渲染进度；
 * 根链路的 on_chain_end 是最后一个事件，其 output 即 invoke 同款结果
 */
async function streamTurn(
  agent: CustomerServiceAgent,
  input: { messages: Array<{ role: 'user' | 'system'; content: string }> },
  config: Parameters<CustomerServiceAgent['invoke']>[1],
  onEvent: (event: StreamEvent) => void
): Promise<unknown> {
  let final: unknown = null
  const stream = agent.streamEvents(input, config)
  for await (const event of stream) {
    onEvent(event)
    if (event.event === 'on_chain_end') final = event.data?.output
  }
  return final
}

/** invoke / streamEvents 的结果 → 统一的 Turn 状态（CLI resume 后也复用） */
export function toAgentState(output: unknown): AgentTurnState {
  const r = (output ?? {}) as Record<string, unknown>
  const messages = Array.isArray(r.messages)
    ? (r.messages as BaseMessage[])
    : []
  const raw = Array.isArray(r['__interrupt__']) ? r['__interrupt__'] : []
  const interrupts = raw as Array<{ id: string; value: HITLRequest }>
  return {
    messages,
    structuredResponse: r.structuredResponse as AgentResponse | undefined,
    interrupts
  }
}
