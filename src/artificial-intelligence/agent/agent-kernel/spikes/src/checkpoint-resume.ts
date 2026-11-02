// Spike：验证 checkpoint ③ 配对、工具执行态与审批恢复语义。
// 该文件是设计验证代码，不是最终 core 实现。

export type ToolCall = {
  id: string
  name: string
  input: unknown
}

export type ToolResult = {
  ok: boolean
  content: Array<{ type: 'text'; text: string }>
  error?: { code: string; message: string }
}

export type AssistantMessage = {
  role: 'assistant'
  text?: string
  toolCalls: ToolCall[]
}

export type ToolMessage = {
  role: 'tool'
  toolCallId: string
  result: ToolResult
}

export type Message = AssistantMessage | ToolMessage

export type PendingCall = {
  call: ToolCall
  status: 'pending' | 'running' | 'completed'
  attemptId?: string
  result?: ToolResult
}

export type PendingApproval = {
  approvalId: string
  toolCallId: string
  call: ToolCall
  requestedAt: number
  options: Array<'allow' | 'deny'>
  decision?: 'allow' | 'deny'
  decidedAt?: number
  expiresAt?: number
}

export type RunStatus = 'running' | 'awaiting-approval' | 'done' | 'error' | 'aborted'
export type RunPhase = 'model' | 'tools' | 'turn-end'

export interface Usage {
  inputTokens: number
  outputTokens: number
}

export interface RunState {
  version: 1
  threadId: string
  runId: string
  status: RunStatus
  phase: RunPhase
  runStep: number
  totalSteps: number
  seq: number
  messages: Message[]
  pendingToolCalls: PendingCall[]
  pendingApprovals: PendingApproval[]
  usage: Usage
  principal?: Record<string, unknown>
}

export class ToolSuspended extends Error {
  override readonly name = 'ToolSuspended'

  constructor(public readonly approval: PendingApproval) {
    super('tool suspended for approval')
  }
}

export interface Checkpointer {
  save(state: RunState): Promise<void>
  load(threadId: string): Promise<RunState | null>
}

export class MemoryCheckpointer implements Checkpointer {
  private readonly states = new Map<string, string>()

  async save(state: RunState): Promise<void> {
    this.states.set(state.threadId, JSON.stringify(state))
  }

  async load(threadId: string): Promise<RunState | null> {
    const raw = this.states.get(threadId)
    return raw === undefined ? null : (JSON.parse(raw) as RunState)
  }
}

export function createState(
  threadId: string,
  runId = 'run-1',
  principal?: Record<string, unknown>,
): RunState {
  return {
    version: 1,
    threadId,
    runId,
    status: 'running',
    phase: 'model',
    runStep: 0,
    totalSteps: 0,
    seq: 0,
    messages: [],
    pendingToolCalls: [],
    pendingApprovals: [],
    usage: { inputTokens: 0, outputTokens: 0 },
    principal,
  }
}

export function beginToolBatch(state: RunState, calls: ToolCall[]): void {
  state.messages.push({ role: 'assistant', toolCalls: calls })
  state.pendingToolCalls = calls.map((call) => ({ call, status: 'pending' }))
  state.phase = 'tools'
}

export function startTool(state: RunState, callId: string, attemptId: string): void {
  const pending = requirePending(state, callId)
  pending.status = 'running'
  pending.attemptId = attemptId
  state.phase = 'tools'
}

export function completeTool(
  state: RunState,
  callId: string,
  result: ToolResult,
): void {
  const pending = requirePending(state, callId)
  pending.status = 'completed'
  pending.result = result
  state.phase = 'tools'
}

export function suspendForApproval(
  state: RunState,
  approval: PendingApproval,
): void {
  const existing = state.pendingApprovals.find(
    (item) => item.approvalId === approval.approvalId,
  )
  if (existing === undefined) {
    state.pendingApprovals.push(approval)
  }
  state.status = 'awaiting-approval'
  state.phase = 'tools'
}

export function resumeApproval(
  state: RunState,
  approvalId: string,
  decision: 'allow' | 'deny',
  now = Date.now(),
): PendingApproval {
  const approval = state.pendingApprovals.find(
    (item) => item.approvalId === approvalId,
  )
  if (approval === undefined) {
    throw new Error(`approval not found: ${approvalId}`)
  }
  approval.decision = decision
  approval.decidedAt = now
  state.status = 'running'
  state.phase = 'tools'
  return approval
}

export type ReplayPolicy = 'retry' | 'failed'

export function recoverRunningTool(
  state: RunState,
  callId: string,
  sideEffect: 'idempotent' | 'non-idempotent',
  attemptId: string,
): ReplayPolicy {
  const pending = requirePending(state, callId)
  if (pending.status !== 'running') {
    throw new Error(`tool is not running: ${callId}`)
  }

  if (sideEffect === 'idempotent') {
    pending.attemptId = attemptId
    return 'retry'
  }

  completeTool(
    state,
    callId,
    failResult(
      'TOOL_ATTEMPT_LOST',
      'non-idempotent tool crashed while running; not replayed',
    ),
  )
  return 'failed'
}

export function finalize(
  state: RunState,
  outcome: 'done' | 'error' | 'aborted',
): void {
  const toolMessages: ToolMessage[] = state.pendingToolCalls.map((pending) => ({
    role: 'tool',
    toolCallId: pending.call.id,
    result:
      pending.result ??
      failResult(
        'RUN_ENDED',
        pending.status === 'running'
          ? `run ${outcome} while tool may have executed; do not retry without checking side effects`
          : `run ${outcome} before tool started`,
      ),
  }))

  state.messages.push(...toolMessages)
  state.pendingToolCalls = []
  state.pendingApprovals = []
  state.status = outcome
}

export function assertInvariants(state: RunState): void {
  const toolUseIds = new Set<string>()
  for (const message of state.messages) {
    if (message.role === 'assistant') {
      for (const call of message.toolCalls) {
        if (toolUseIds.has(call.id)) {
          throw new Error(`duplicate tool_use: ${call.id}`)
        }
        toolUseIds.add(call.id)
      }
    }
  }

  const toolResultIds = state.messages
    .filter((message): message is ToolMessage => message.role === 'tool')
    .map((message) => message.toolCallId)

  if (toolResultIds.length !== new Set(toolResultIds).size) {
    throw new Error('duplicate tool_result')
  }

  for (const id of toolResultIds) {
    if (!toolUseIds.has(id)) {
      throw new Error(`orphan tool_result: ${id}`)
    }
  }

  if (state.pendingToolCalls.length === 0) {
    for (const id of toolUseIds) {
      if (!toolResultIds.includes(id)) {
        throw new Error(`missing tool_result: ${id}`)
      }
    }
  }

  if (state.status !== 'running' && state.status !== 'awaiting-approval') {
    if (state.pendingToolCalls.length > 0) {
      throw new Error('pendingToolCalls not empty at terminal state')
    }
    if (state.pendingApprovals.length > 0) {
      throw new Error('pendingApprovals not empty at terminal state')
    }
  }
}

export function okResult(text: string): ToolResult {
  return {
    ok: true,
    content: [{ type: 'text', text }],
  }
}

export function failResult(code: string, message: string): ToolResult {
  return {
    ok: false,
    content: [{ type: 'text', text: message }],
    error: { code, message },
  }
}

function requirePending(state: RunState, callId: string): PendingCall {
  const pending = state.pendingToolCalls.find(
    (item) => item.call.id === callId,
  )
  if (pending === undefined) {
    throw new Error(`pending tool call not found: ${callId}`)
  }
  return pending
}
