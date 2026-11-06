/**
 * 控制流：唯一允许出现 while / throw / 上限判断的地方。
 *
 * 作用
 * - 一次 turn 的主线：读状态 → 压缩 → 调模型 → 执行工具 → 回填 → 收口。
 * - 九个能力里，循环、调用上限、压缩触发、审批挂起都在这里汇合。
 *
 * 边界
 * - 本文件不认识 Order / Ticket，也不 import 任何 business/ 下的模块。
 * - 工具由调用方构造好后传进来，循环只按协议调用 run(args)。
 *
 * 分步实现
 * - 第 1 步：裸循环 + 工具回填 + 事件。
 * - 第 3 步：maxModelCalls 计数、模型重试、非幂等工具不重试。
 * - 第 4 步：结构化收口。
 * - 第 5 步：压缩触发。
 * - 第 6 步：审批挂起与并发策略（有审批的批次一律串行）。
 */
import type { AppConfig } from '../config'
import type { RunEvent } from './events'
import type { CallModelOptions } from './model'
import type { PendingApproval, ThreadState } from './store'
import type { AgentResult } from './structured'
import type { ToolDefinition } from './tool'

export interface RunTurnInput {
  threadId: string
  /** 用户这一轮输入 */
  input: string
  config: AppConfig
  /** 已构造好的工具；业务依赖由 business/tools.ts 闭包持有 */
  tools: ToolDefinition[]
  /** 当前会话状态；循环在它上面追加消息、更新相位和计数 */
  state: ThreadState
  /** 可选的外部事件数组；缺省时循环内部新建，最终随结果返回 */
  events?: RunEvent[]
  /** 测试注入的假客户端 */
  client?: CallModelOptions['client']
}

export type TurnOutcome =
  | {
      kind: 'final'
      answer: string
      result: AgentResult
      state: ThreadState
      events: RunEvent[]
    }
  | {
      kind: 'suspended'
      pending: PendingApproval
      state: ThreadState
      events: RunEvent[]
    }

/**
 * 跑完一次 turn。
 *
 * 骨架（按这个顺序写）：
 * 1. push turn-start；把用户输入追加进 state.messages。
 * 2. 超过 token 阈值就 compact（第 5 步）。
 * 3. while (state.modelCalls < config.maxModelCalls)：
 *    a. phase = 'model'，saveThread，callModel（第 3 步带重试）
 *    b. 无 tool_calls → 结构化收口（第 4 步）→ turn-end(final) → 返回
 *    c. 有 tool_calls → 先 append assistant，phase = 'tools'
 *    d. 逐个工具：需要审批就写 pending 并返回 suspended（第 6 步）；
 *       否则执行、push observation 事件、append tool 消息
 * 4. 撞上限 → turn-end(limit) → 返回已有结论。
 */
export async function runTurn(_input: RunTurnInput): Promise<TurnOutcome> {
  throw new Error(
    'TODO 第 1 步：实现 ReAct 循环（后续步骤再补上限 / 压缩 / 收口 / 审批）'
  )
}
