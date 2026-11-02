// Spike：验证 RunState.phase + 五保存点 × resume 矩阵。
// 目标：崩溃后不重复 callModel、不重复 assistant、不跳过工具回填。

import {
  assertInvariants,
  beginToolBatch,
  completeTool,
  createState,
  failResult,
  finalize,
  type Checkpointer,
  type PendingApproval,
  type PendingCall,
  type RunState,
  recoverRunningTool,
  resumeApproval,
  startTool,
  suspendForApproval,
  ToolSuspended,
  type ToolCall,
  type ToolResult,
} from './checkpoint-resume'
import {
  type ToolEvent,
  type ToolEmitContext,
  type ToolExecute,
  runToolWithOutput,
  cancelledEvent,
} from './tool-events'

export type SavePoint =
  | 'turn-start'
  | 'turn-end'              // ②a：回填 ToolMessage 后、turn-finished 前
  | 'turn-end-committed'    // ②b：计数 + phase=model 后
  | 'tool-dispatch'
  | 'approval-decision'
  | 'tool-start'
  | 'tool-complete'
  | 'terminal'

export interface ModelTurn {
  text: string
  toolCalls: ToolCall[]
}

export type ModelFn = (state: RunState) => Promise<ModelTurn>

export interface ToolPermissions {
  can(toolName: string, input: unknown): boolean
  requiresApproval(toolName: string, input: unknown): boolean
}

export interface ToolContext {
  readonly permissions: ToolPermissions
  readonly principal?: Record<string, unknown>
}

export interface ToolCallContext {
  readonly state: Readonly<RunState>
  readonly call: ToolCall
  readonly pendingCall: Readonly<PendingCall>
  readonly approval?: Readonly<PendingApproval>
  // 与 01 §11 / 05 §3 一致：权限与身份在 toolContext 内，不在 callCtx 顶层
  readonly toolContext: ToolContext
}

export const allowAllPermissions: ToolPermissions = {
  can: () => true,
  requiresApproval: () => false,
}

export interface ToolRuntime {
  requiresApproval(call: ToolCall): boolean
  sideEffect(call: ToolCall): 'idempotent' | 'non-idempotent'
  permissions?(call: ToolCall, state: Readonly<RunState>): ToolPermissions
  // 前置闸门：在 tool-call-started 之前执行；抛 ToolSuspended 时不得发 started
  wrapToolCall?(callCtx: ToolCallContext): Promise<'allow' | 'deny'>
  execute(call: ToolCall, ctx: ToolEmitContext): Promise<ToolResult>
}

export interface RunOptions {
  model: ModelFn
  tools: ToolRuntime
  checkpointer: Checkpointer
  signal?: AbortSignal
  approvalTimeoutMs?: number
  now?: () => number
  maxTurns?: number
  onCheckpoint?: (point: SavePoint, state: RunState) => void | Promise<void>
  onRunStart?: (state: RunState) => void | Promise<void>
  onRunResume?: (state: RunState) => void | Promise<void>
  onRunSuspended?: (state: RunState) => void | Promise<void>
  onRunEnd?: (state: RunState) => void | Promise<void>
}

interface RunEventBase {
  runId: string
  seq: number
  timestamp: number
}

type RunEventPayload =
  | { type: 'run-started'; threadId: string }
  | { type: 'run-resumed'; threadId: string; phase: RunState['phase'] }
  | { type: 'turn-started'; runStep: number }
  | {
      type: 'approval-requested'
      approvalId: string
      call: ToolCall
      options: Array<'allow' | 'deny'>
      expiresAt?: number
    }
  | { type: 'turn-finished'; runStep: number }
  | { type: 'run-finished'; output: string }
  | { type: 'run-aborted'; reason?: string }
  | ToolEvent

export type RunEvent = RunEventBase & RunEventPayload

export class ThreadNotResumableError extends Error {
  override readonly name = 'ThreadNotResumableError'
}

export class ToolPipelineError extends Error {
  override readonly name = 'ToolPipelineError'
}

export interface ResumeRequest {
  threadId: string
  approvalId?: string
  decision?: 'allow' | 'deny'
}

async function checkpoint(
  state: RunState,
  point: SavePoint,
  options: RunOptions,
): Promise<void> {
  await options.checkpointer.save(state)
  await options.onCheckpoint?.(point, state)
}

function now(options: RunOptions): number {
  return options.now?.() ?? Date.now()
}

function isTerminal(status: RunState['status']): boolean {
  return status === 'done' || status === 'error' || status === 'aborted'
}

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === 'AbortError'
}

function withEnvelope(
  state: RunState,
  event: RunEventPayload,
  timestamp: number,
): RunEvent {
  state.seq += 1
  return {
    runId: state.runId,
    seq: state.seq,
    timestamp,
    ...event,
  }
}

async function* envelope(
  state: RunState,
  source: AsyncGenerator<RunEventPayload>,
  options: RunOptions,
): AsyncGenerator<RunEvent> {
  for await (const event of source) {
    yield withEnvelope(state, event, now(options))
  }
}

function findApproval(
  state: RunState,
  callId: string,
): PendingApproval | undefined {
  return state.pendingApprovals.find((item) => item.toolCallId === callId)
}

function isExpired(
  approval: PendingApproval,
  current: number,
): boolean {
  return approval.expiresAt !== undefined && current > approval.expiresAt
}

function createApproval(
  call: ToolCall,
  options: RunOptions,
): PendingApproval {
  const requestedAt = now(options)
  return {
    approvalId: `approval-${call.id}`,
    toolCallId: call.id,
    call,
    requestedAt,
    options: ['allow', 'deny'],
    expiresAt:
      options.approvalTimeoutMs === undefined
        ? undefined
        : requestedAt + options.approvalTimeoutMs,
  }
}

function appendToolMessages(state: RunState): void {
  const messages = state.pendingToolCalls.map((pending) => ({
    role: 'tool' as const,
    toolCallId: pending.call.id,
    result:
      pending.result ??
      failResult('RUN_ENDED', 'tool result missing before回填'),
  }))
  state.messages.push(...messages)
  state.pendingToolCalls = []
}

async function* executePendingTools(
  state: RunState,
  options: RunOptions,
): AsyncGenerator<RunEventPayload, 'suspended' | 'done'> {
  for (const pending of state.pendingToolCalls) {
    if (pending.status === 'completed') continue

    const call = pending.call

    if (pending.status === 'running') {
      const previousAttemptId = pending.attemptId
      const policy = recoverRunningTool(
        state,
        call.id,
        options.tools.sideEffect(call),
        crypto.randomUUID(),
      )
      await checkpoint(state, 'tool-complete', options)

      if (policy === 'failed') {
        const completed = state.pendingToolCalls.find(
          (item) => item.call.id === call.id,
        )
        if (completed?.result !== undefined) {
          yield {
            type: 'tool-call-completed',
            call,
            result: completed.result,
            attemptId: completed.attemptId,
          }
        }
        continue
      }

      // 幂等重试：旧 attempt 用 retrying 收口，新的 started/completed 代表第二次尝试
      yield {
        type: 'tool-call-retrying',
        toolCallId: call.id,
        fromAttemptId: previousAttemptId,
        reason: 'idempotent-recovery',
      }
    }

    const existing = findApproval(state, call.id)
    if (existing !== undefined) {
      // 过期优先于任何已存 decision，避免 late allow 覆盖超时策略
      if (isExpired(existing, now(options))) {
        completeTool(
          state,
          call.id,
          failResult('APPROVAL_EXPIRED', 'approval expired'),
        )
        await checkpoint(state, 'tool-complete', options)
        yield cancelledEvent(call, 'expired')
        continue
      }

      if (existing.decision === 'deny') {
        completeTool(
          state,
          call.id,
          failResult('APPROVAL_DENIED', 'approval denied'),
        )
        await checkpoint(state, 'tool-complete', options)
        yield cancelledEvent(call, 'denied')
        continue
      }

      if (existing.decision === undefined) {
        suspendForApproval(state, existing)
        await checkpoint(state, 'tool-dispatch', options)
        await options.onRunSuspended?.(state)
        yield {
          type: 'approval-requested',
          approvalId: existing.approvalId,
          call,
          options: existing.options,
          expiresAt: existing.expiresAt,
        }
        return 'suspended'
      }
    } else if (options.tools.requiresApproval(call)) {
      const approval = createApproval(call, options)
      suspendForApproval(state, approval)
      await checkpoint(state, 'tool-dispatch', options)
      await options.onRunSuspended?.(state)
      yield {
        type: 'approval-requested',
        approvalId: approval.approvalId,
        call,
        options: approval.options,
        expiresAt: approval.expiresAt,
      }
      return 'suspended'
    }

    const callCtx: ToolCallContext = {
      state,
      call,
      pendingCall: pending,
      approval: existing,
      toolContext: {
        permissions:
          options.tools.permissions?.(call, state) ?? allowAllPermissions,
        principal: state.principal,
      },
    }

    if (options.tools.wrapToolCall !== undefined) {
      try {
        const decision = await options.tools.wrapToolCall(callCtx)
        if (decision === 'deny') {
          completeTool(
            state,
            call.id,
            failResult('APPROVAL_DENIED', 'approval denied by wrapper'),
          )
          await checkpoint(state, 'tool-complete', options)
          yield cancelledEvent(call, 'denied')
          continue
        }
      } catch (error) {
        if (error instanceof ToolSuspended) {
          suspendForApproval(state, error.approval)
          await checkpoint(state, 'tool-dispatch', options)
          await options.onRunSuspended?.(state)
          yield {
            type: 'approval-requested',
            approvalId: error.approval.approvalId,
            call: error.approval.call,
            options: error.approval.options,
            expiresAt: error.approval.expiresAt,
          }
          return 'suspended'
        }
        throw error
      }
    }

    const attemptId = crypto.randomUUID()
    startTool(state, call.id, attemptId)
    await checkpoint(state, 'tool-start', options)

    for await (const event of runToolWithOutput(
      call,
      (input, ctx) => options.tools.execute(call, ctx),
      attemptId,
      options.signal,
    )) {
      yield event
      if (event.type === 'tool-call-completed') {
        completeTool(state, call.id, event.result)
        await checkpoint(state, 'tool-complete', options)
      }
    }
  }

  appendToolMessages(state)
  state.phase = 'turn-end'
  await checkpoint(state, 'turn-end', options)
  return 'done'
}

async function* runLoop(
  state: RunState,
  options: RunOptions,
  isResume: boolean,
): AsyncGenerator<RunEventPayload> {
  const maxIterations = options.maxTurns ?? 10
  let failed = false

  try {
    if (!isResume) {
      await options.onRunStart?.(state)
    }

    yield isResume
      ? { type: 'run-resumed', threadId: state.threadId, phase: state.phase }
      : { type: 'run-started', threadId: state.threadId }

    while (state.runStep < maxIterations) {
    if (state.status === 'awaiting-approval') return
    if (state.status === 'done') {
      yield { type: 'run-finished', output: '' }
      return
    }
    if (state.status === 'error' || state.status === 'aborted') {
      return
    }

    if (state.phase === 'model') {
      await checkpoint(state, 'turn-start', options)
      yield { type: 'turn-started', runStep: state.runStep }

      const turn = await options.model(state)
      if (turn.toolCalls.length === 0) {
        state.messages.push({
          role: 'assistant',
          text: turn.text,
          toolCalls: [],
        })
        finalize(state, 'done')
        await checkpoint(state, 'terminal', options)
        await options.onRunEnd?.(state)
        yield { type: 'run-finished', output: turn.text }
        return
      }

      beginToolBatch(state, turn.toolCalls)
      await checkpoint(state, 'tool-dispatch', options)
      continue
    }

    if (state.phase === 'tools') {
      const outcome = yield* executePendingTools(state, options)
      if (outcome === 'suspended') return
      continue
    }

    if (state.phase === 'turn-end') {
      yield { type: 'turn-finished', runStep: state.runStep }
      state.runStep += 1
      state.totalSteps += 1
      state.phase = 'model'
      await checkpoint(state, 'turn-end-committed', options)
      continue
    }

      throw new Error(`unknown phase: ${state.phase}`)
    }

    finalize(state, 'error')
    await checkpoint(state, 'terminal', options)
    await options.onRunEnd?.(state)
    throw new Error('max turns exceeded')
  } catch (error) {
    failed = true

    if (isAbortError(error)) {
      for (const pending of state.pendingToolCalls) {
        if (pending.status === 'running' || pending.status === 'pending') {
          yield cancelledEvent(pending.call, 'aborted')
        }
      }
      finalize(state, 'aborted')
      await checkpoint(state, 'terminal', options)
      await options.onRunEnd?.(state)
      yield { type: 'run-aborted', reason: 'aborted' }
      throw error
    }

    // execute 内部抛 ToolSuspended 属于工具契约错误；审批必须发生在 next 之前
    const fatal =
      error instanceof ToolSuspended
        ? new ToolPipelineError(
            'ToolSuspended leaked from execute; approval must run before next',
          )
        : error
    if (
      !isTerminal(state.status) &&
      !(fatal instanceof Error && fatal.name === 'Crash')
    ) {
      finalize(state, 'error')
      await checkpoint(state, 'terminal', options)
      await options.onRunEnd?.(state)
    }
    throw fatal
  } finally {
    // 消费者 break / generator.return()：不能再 yield，但必须落盘终态
    // 异常路径（含模拟 crash）不在这里收口，保留断点状态供 resume
    if (
      !failed &&
      !isTerminal(state.status) &&
      state.status !== 'awaiting-approval'
    ) {
      finalize(state, 'aborted')
      await checkpoint(state, 'terminal', options)
      await options.onRunEnd?.(state)
    }
  }
}

export async function* streamRun(
  state: RunState,
  options: RunOptions,
): AsyncGenerator<RunEvent> {
  if (
    state.status === 'done' ||
    state.status === 'error' ||
    state.status === 'aborted'
  ) {
    // 终态 thread 开新 run：新 runId，重置 run 级状态，保留 thread 级 totalSteps / messages
    state.status = 'running'
    state.runId = crypto.randomUUID()
    state.phase = 'model'
    state.seq = 0
    state.runStep = 0
    state.pendingToolCalls = []
    state.pendingApprovals = []
  } else if (
    state.messages.length > 0 &&
    (state.status === 'awaiting-approval' || state.status === 'running')
  ) {
    throw new ThreadNotResumableError(
      `thread requires resume: ${state.threadId}`,
    )
  }

  yield* envelope(state, runLoop(state, options, false), options)
}

export async function* resumeRun(
  state: RunState,
  request: ResumeRequest,
  options: RunOptions,
): AsyncGenerator<RunEvent> {
  if (
    state.status === 'done' ||
    state.status === 'error' ||
    state.status === 'aborted'
  ) {
    throw new ThreadNotResumableError(
      `thread is terminal: ${state.threadId}`,
    )
  }

  await options.onRunResume?.(state)

  if (state.status === 'awaiting-approval') {
    const approval =
      request.approvalId === undefined
        ? state.pendingApprovals.find((item) => item.decision === undefined)
        : state.pendingApprovals.find(
            (item) => item.approvalId === request.approvalId,
          )

    if (approval === undefined) {
      throw new Error('no pending approval to resume')
    }

    if (isExpired(approval, now(options))) {
      // 过期优先于任何 late decision：强制走 APPROVAL_EXPIRED，不接受晚到 allow
      state.status = 'running'
      await checkpoint(state, 'approval-decision', options)
    } else if (request.decision !== undefined) {
      resumeApproval(state, approval.approvalId, request.decision, now(options))
      await checkpoint(state, 'approval-decision', options)
    } else if (approval.decision === undefined) {
      yield withEnvelope(
        state,
        {
          type: 'run-resumed',
          threadId: state.threadId,
          phase: state.phase,
        },
        now(options),
      )
      yield withEnvelope(
        state,
        {
          type: 'approval-requested',
          approvalId: approval.approvalId,
          call: approval.call,
          options: approval.options,
          expiresAt: approval.expiresAt,
        },
        now(options),
      )
      return
    }
  }

  yield* envelope(state, runLoop(state, options, true), options)
}

export function createRunState(threadId: string): RunState {
  return createState(threadId)
}

export function assertRunInvariants(state: RunState): void {
  assertInvariants(state)
}
