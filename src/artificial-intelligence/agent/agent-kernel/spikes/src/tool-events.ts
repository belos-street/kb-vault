// Spike：验证工具实时输出队列与 tool-call 事件配对。
// 事件模型：tool-call-started -> tool-output-delta* -> tool-call-completed。
// 审批挂起的工具不启动，因此不发 started；拒绝 / 超时发 cancelled。

import { AsyncQueue } from './async-queue'
import {
  failResult,
  ToolSuspended,
  type ToolCall,
  type ToolResult,
} from './checkpoint-resume'

export type ToolOutputDelta = {
  type: 'tool-output-delta'
  toolCallId: string
  stream: 'stdout' | 'stderr'
  delta: string
}

export type ToolEvent =
  | {
      type: 'tool-call-started'
      toolCallId: string
      name: string
      attemptId?: string
    }
  | ToolOutputDelta
  | {
      type: 'tool-call-completed'
      call: ToolCall
      result: ToolResult
      attemptId?: string
    }
  | {
      type: 'tool-call-retrying'
      toolCallId: string
      fromAttemptId?: string
      reason: 'idempotent-recovery'
    }
  | {
      type: 'tool-call-cancelled'
      toolCallId: string
      reason: 'denied' | 'expired' | 'aborted'
    }

export interface ToolEmitContext {
  emitOutput(chunk: { stream: 'stdout' | 'stderr'; delta: string }): void
  signal?: AbortSignal
}

export type ToolExecute = (
  input: unknown,
  ctx: ToolEmitContext,
) => Promise<ToolResult>

export async function* runToolWithOutput(
  call: ToolCall,
  execute: ToolExecute,
  attemptId?: string,
  signal?: AbortSignal,
): AsyncGenerator<ToolEvent, ToolResult> {
  yield {
    type: 'tool-call-started',
    toolCallId: call.id,
    name: call.name,
    attemptId,
  }

  const queue = new AsyncQueue<ToolEvent>()
  let result: ToolResult | undefined
  let failure: unknown

  const execution = execute(call.input, {
    emitOutput: (chunk) => {
      queue.push({
        type: 'tool-output-delta',
        toolCallId: call.id,
        ...chunk,
      })
    },
    signal,
  })

  execution
    .then((value) => {
      result = value
    })
    .catch((error: unknown) => {
      failure = error
    })
    .finally(() => {
      queue.close()
    })

  for await (const event of queue) {
    yield event
  }

  if (
    failure instanceof ToolSuspended ||
    (failure instanceof Error &&
      (failure.name === 'Crash' || failure.name === 'AbortError'))
  ) {
    // 审批暂停 / 模拟崩溃必须原样穿透，不能被归一成业务失败。
    throw failure
  }

  if (failure !== undefined) {
    // 业务失败已经由外层归一；这里只兜底，避免工具异常打断事件配对。
    result = failResult(
      'TOOL_EXECUTION_ERROR',
      failure instanceof Error ? failure.message : String(failure),
    )
  }

  if (result === undefined) {
    throw new Error(`tool returned no result: ${call.name}`)
  }

  yield {
    type: 'tool-call-completed',
    call,
    result,
    attemptId,
  }
  return result
}

export function cancelledEvent(
  call: ToolCall,
  reason: 'denied' | 'expired' | 'aborted',
): ToolEvent {
  return { type: 'tool-call-cancelled', toolCallId: call.id, reason }
}

export function assertToolEventPairing(events: ToolEvent[]): void {
  const started = new Map<string, number>()
  const completed = new Map<string, number>()
  const retrying = new Map<string, number>()
  const cancelled = new Map<string, number>()

  for (const event of events) {
    if (event.type === 'tool-call-started') {
      started.set(event.toolCallId, (started.get(event.toolCallId) ?? 0) + 1)
    } else if (event.type === 'tool-call-completed') {
      completed.set(
        event.call.id,
        (completed.get(event.call.id) ?? 0) + 1,
      )
    } else if (event.type === 'tool-call-retrying') {
      retrying.set(event.toolCallId, (retrying.get(event.toolCallId) ?? 0) + 1)
    } else if (event.type === 'tool-call-cancelled') {
      cancelled.set(event.toolCallId, (cancelled.get(event.toolCallId) ?? 0) + 1)
    }
  }

  for (const [toolCallId, count] of started) {
    const terminals =
      (completed.get(toolCallId) ?? 0) +
      (retrying.get(toolCallId) ?? 0) +
      (cancelled.get(toolCallId) ?? 0)
    if (terminals !== count) {
      throw new Error(
        `tool-call-started without matching terminal: ${toolCallId}`,
      )
    }
  }

  for (const [toolCallId] of completed) {
    if (!started.has(toolCallId)) {
      throw new Error(`tool-call-completed without started: ${toolCallId}`)
    }
  }
}
