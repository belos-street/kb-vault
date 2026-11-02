import { describe, expect, test } from 'bun:test'

import {
  assertRunInvariants,
  type ModelFn,
  type ModelTurn,
  resumeRun,
  type RunEvent,
  type RunOptions,
  streamRun,
  ThreadNotResumableError,
  ToolPipelineError,
  type ToolCallContext,
  type ToolPermissions,
  type ToolRuntime,
} from './run-phase'
import {
  createState,
  MemoryCheckpointer,
  okResult,
  ToolSuspended,
  type PendingApproval,
  type RunState,
  type ToolCall,
  type ToolResult,
} from './checkpoint-resume'
import {
  assertToolEventPairing,
  type ToolEmitContext,
  type ToolEvent,
} from './tool-events'

class Crash extends Error {
  override readonly name = 'Crash'
}

const bashCall: ToolCall = {
  id: 'call-1',
  name: 'bash',
  input: { cmd: 'echo hi' },
}

const bashCall2: ToolCall = {
  id: 'call-2',
  name: 'bash',
  input: { cmd: 'echo bye' },
}

function scriptedModel(turns: ModelTurn[]): {
  model: ModelFn
  calls: () => number
} {
  let index = 0
  let calls = 0

  const model: ModelFn = async () => {
    calls += 1
    const turn = turns[index]
    if (turn === undefined) {
      throw new Error('no scripted turn left')
    }
    index += 1
    return turn
  }

  return { model, calls: () => calls }
}

function makeTools(options: {
  requiresApproval?: (call: ToolCall) => boolean
  sideEffect?: (call: ToolCall) => 'idempotent' | 'non-idempotent'
  permissions?: (call: ToolCall, state: RunState) => ToolPermissions
  wrapToolCall?: (callCtx: ToolCallContext) => Promise<'allow' | 'deny'>
  execute?: (call: ToolCall, ctx: ToolEmitContext) => Promise<ToolResult>
} = {}): ToolRuntime {
  return {
    requiresApproval: options.requiresApproval ?? (() => false),
    sideEffect: options.sideEffect ?? (() => 'non-idempotent'),
    permissions: options.permissions,
    wrapToolCall: options.wrapToolCall,
    execute: options.execute ?? (async () => okResult('ok')),
  }
}

async function collect(
  stream: AsyncGenerator<RunEvent>,
): Promise<RunEvent[]> {
  const events: RunEvent[] = []
  for await (const event of stream) {
    events.push(event)
  }
  return events
}

function createRun(threadId: string): RunState {
  return createState(threadId)
}

function approvalFor(call: ToolCall): PendingApproval {
  return {
    approvalId: `approval-${call.id}`,
    toolCallId: call.id,
    call,
    requestedAt: 0,
    options: ['allow', 'deny'],
  }
}

describe('run phase × resume matrix', () => {
  test('crash at checkpoint ③ resumes tools without re-calling the first turn', async () => {
    const script = scriptedModel([
      { text: '', toolCalls: [bashCall] },
      { text: 'final', toolCalls: [] },
    ])
    const tools = makeTools()
    const state = createRun('t1')
    const checkpointer = new MemoryCheckpointer()
    let crash = true

    const options: RunOptions = {
      model: script.model,
      tools,
      checkpointer,
      onCheckpoint: (point) => {
        if (crash && point === 'tool-dispatch') {
          crash = false
          throw new Crash(point)
        }
      },
    }

    await expect(collect(streamRun(state, options))).rejects.toThrow(Crash)
    expect(script.calls()).toBe(1)
    expect(state.phase).toBe('tools')
    expect(state.pendingToolCalls).toHaveLength(1)

    const events = await collect(resumeRun(state, { threadId: 't1' }, options))
    expect(script.calls()).toBe(2)
    expect(state.status).toBe('done')
    expect(events.some((event) => event.type === 'run-finished')).toBe(true)
    assertRunInvariants(state)
  })

  test('crash at checkpoint ④b resumes回填 without duplicate assistant', async () => {
    const script = scriptedModel([
      { text: '', toolCalls: [bashCall] },
      { text: 'final', toolCalls: [] },
    ])
    const tools = makeTools()
    const state = createRun('t1')
    const checkpointer = new MemoryCheckpointer()
    let crash = true

    const options: RunOptions = {
      model: script.model,
      tools,
      checkpointer,
      onCheckpoint: (point) => {
        if (crash && point === 'tool-complete') {
          crash = false
          throw new Crash(point)
        }
      },
    }

    await expect(collect(streamRun(state, options))).rejects.toThrow(Crash)
    expect(script.calls()).toBe(1)
    expect(state.phase).toBe('tools')
    expect(state.messages).toHaveLength(1)
    expect(state.pendingToolCalls[0]?.status).toBe('completed')

    await collect(resumeRun(state, { threadId: 't1' }, options))
    expect(script.calls()).toBe(2)
    expect(state.status).toBe('done')
    expect(state.messages).toHaveLength(3)
    assertRunInvariants(state)
  })

  test('crash at checkpoint ②b resumes next turn without duplicate messages', async () => {
    const script = scriptedModel([
      { text: '', toolCalls: [bashCall] },
      { text: 'final', toolCalls: [] },
    ])
    const tools = makeTools()
    const state = createRun('t1')
    const checkpointer = new MemoryCheckpointer()
    let crash = true

    const options: RunOptions = {
      model: script.model,
      tools,
      checkpointer,
      onCheckpoint: (point) => {
        if (crash && point === 'turn-end-committed') {
          crash = false
          throw new Crash(point)
        }
      },
    }

    await expect(collect(streamRun(state, options))).rejects.toThrow(Crash)
    expect(script.calls()).toBe(1)
    expect(state.phase).toBe('model')
    expect(state.runStep).toBe(1)
    expect(state.messages).toHaveLength(2)

    await collect(resumeRun(state, { threadId: 't1' }, options))
    expect(script.calls()).toBe(2)
    expect(state.status).toBe('done')
    expect(state.messages).toHaveLength(3)
    assertRunInvariants(state)
  })

  test('crash at checkpoint ②a resumes turn-end without duplicate ToolMessage', async () => {
    const script = scriptedModel([
      { text: '', toolCalls: [bashCall] },
      { text: 'final', toolCalls: [] },
    ])
    const tools = makeTools()
    const state = createRun('t1')
    const checkpointer = new MemoryCheckpointer()
    let crash = true

    const options: RunOptions = {
      model: script.model,
      tools,
      checkpointer,
      onCheckpoint: (point) => {
        if (crash && point === 'turn-end') {
          crash = false
          throw new Crash(point)
        }
      },
    }

    await expect(collect(streamRun(state, options))).rejects.toThrow(Crash)
    expect(script.calls()).toBe(1)
    expect(state.phase).toBe('turn-end')
    expect(state.messages).toHaveLength(2)

    await collect(resumeRun(state, { threadId: 't1' }, options))
    expect(script.calls()).toBe(2)
    expect(state.status).toBe('done')
    expect(state.messages).toHaveLength(3)
    assertRunInvariants(state)
  })
})

describe('approval decision matrix', () => {
  test('allow + crash after decision does not ask again', async () => {
    const script = scriptedModel([
      { text: '', toolCalls: [bashCall] },
      { text: 'final', toolCalls: [] },
    ])
    let wrapperSawAllow = false
    const tools = makeTools({
      requiresApproval: () => true,
      permissions: (_call, state) => ({
        can: () => state.principal?.id === 'u1',
        requiresApproval: () => true,
      }),
      wrapToolCall: async (callCtx) => {
        wrapperSawAllow = callCtx.approval?.decision === 'allow'
        expect(
          callCtx.toolContext.permissions.can(bashCall.name, bashCall.input),
        ).toBe(true)
        return 'allow'
      },
      execute: async () => okResult('approved'),
    })
    const state = createRun('t1')
    state.principal = { id: 'u1' }
    const checkpointer = new MemoryCheckpointer()
    let crash = true

    const options: RunOptions = {
      model: script.model,
      tools,
      checkpointer,
      onCheckpoint: (point) => {
        if (crash && point === 'approval-decision') {
          crash = false
          throw new Crash(point)
        }
      },
    }

    await collect(streamRun(state, options))
    expect(state.status).toBe('awaiting-approval')
    expect(state.pendingApprovals).toHaveLength(1)

    await expect(
      collect(
        resumeRun(
          state,
          { threadId: 't1', approvalId: 'approval-call-1', decision: 'allow' },
          options,
        ),
      ),
    ).rejects.toThrow(Crash)

    expect(state.status).toBe('running')
    expect(state.pendingApprovals[0]?.decision).toBe('allow')

    const events = await collect(
      resumeRun(state, { threadId: 't1' }, options),
    )
    expect(events.some((event) => event.type === 'approval-requested')).toBe(false)
    expect(wrapperSawAllow).toBe(true)
    expect(script.calls()).toBe(2)
    expect(state.status).toBe('done')
    assertRunInvariants(state)
  })

  test('deny completes with APPROVAL_DENIED and cancelled event', async () => {
    const script = scriptedModel([
      { text: '', toolCalls: [bashCall] },
      { text: 'final', toolCalls: [] },
    ])
    const tools = makeTools({ requiresApproval: () => true })
    const state = createRun('t1')
    const checkpointer = new MemoryCheckpointer()
    const options: RunOptions = { model: script.model, tools, checkpointer }

    const first = await collect(streamRun(state, options))
    expect(first.some((event) => event.type === 'approval-requested')).toBe(true)
    expect(first.some((event) => event.type === 'tool-call-started')).toBe(false)

    const second = await collect(
      resumeRun(
        state,
        { threadId: 't1', approvalId: 'approval-call-1', decision: 'deny' },
        options,
      ),
    )
    expect(second.some((event) => event.type === 'tool-call-cancelled')).toBe(true)
    expect(state.status).toBe('done')
    expect(state.messages[1]?.role).toBe('tool')
    if (state.messages[1]?.role === 'tool') {
      expect(state.messages[1].result.error?.code).toBe('APPROVAL_DENIED')
    }
    assertRunInvariants(state)
  })

  test('expired approval becomes APPROVAL_EXPIRED', async () => {
    let clock = 0
    const script = scriptedModel([
      { text: '', toolCalls: [bashCall] },
      { text: 'final', toolCalls: [] },
    ])
    const tools = makeTools({ requiresApproval: () => true })
    const state = createRun('t1')
    const checkpointer = new MemoryCheckpointer()
    const options: RunOptions = {
      model: script.model,
      tools,
      checkpointer,
      approvalTimeoutMs: 10,
      now: () => clock,
    }

    await collect(streamRun(state, options))
    expect(state.status).toBe('awaiting-approval')

    clock = 20
    const events = await collect(resumeRun(state, { threadId: 't1' }, options))
    expect(events.some((event) => event.type === 'tool-call-cancelled')).toBe(true)
    expect(state.status).toBe('done')
    assertRunInvariants(state)
  })

  test('two approval calls are queued, not overwritten', async () => {
    const script = scriptedModel([
      { text: '', toolCalls: [bashCall, bashCall2] },
      { text: 'final', toolCalls: [] },
    ])
    const tools = makeTools({ requiresApproval: () => true })
    const state = createRun('t1')
    const checkpointer = new MemoryCheckpointer()
    const options: RunOptions = { model: script.model, tools, checkpointer }

    await collect(streamRun(state, options))
    expect(state.pendingApprovals).toHaveLength(1)

    await collect(
      resumeRun(
        state,
        { threadId: 't1', approvalId: 'approval-call-1', decision: 'allow' },
        options,
      ),
    )
    expect(state.status).toBe('awaiting-approval')
    expect(state.pendingApprovals).toHaveLength(2)

    await collect(
      resumeRun(
        state,
        { threadId: 't1', approvalId: 'approval-call-2', decision: 'allow' },
        options,
      ),
    )
    expect(state.status).toBe('done')
    expect(state.messages[0]?.role).toBe('assistant')
    expect(state.messages).toHaveLength(4)
    assertRunInvariants(state)
  })
})

describe('suspension and stream guard', () => {
  test('stream on a suspended thread throws ThreadNotResumableError', async () => {
    const script = scriptedModel([{ text: '', toolCalls: [bashCall] }])
    const tools = makeTools({ requiresApproval: () => true })
    const state = createRun('t1')
    const checkpointer = new MemoryCheckpointer()
    const options: RunOptions = { model: script.model, tools, checkpointer }

    await collect(streamRun(state, options))
    expect(state.status).toBe('awaiting-approval')

    await expect(collect(streamRun(state, options))).rejects.toThrow(
      ThreadNotResumableError,
    )
  })

  test('ToolSuspended from execute is converted to ToolPipelineError', async () => {
    const script = scriptedModel([{ text: '', toolCalls: [bashCall] }])
    const tools = makeTools({
      execute: async () => {
        throw new ToolSuspended(approvalFor(bashCall))
      },
    })
    const state = createRun('t1')
    const checkpointer = new MemoryCheckpointer()
    const options: RunOptions = { model: script.model, tools, checkpointer }

    await expect(collect(streamRun(state, options))).rejects.toThrow(
      ToolPipelineError,
    )
    expect(state.status).toBe('error')
  })

  test('ToolSuspended is thrown before started and not normalized', async () => {
    let attempts = 0
    const call = bashCall
    const approval = approvalFor(call)
    const script = scriptedModel([
      { text: '', toolCalls: [call] },
      { text: 'final', toolCalls: [] },
    ])
    const tools: ToolRuntime = {
      requiresApproval: () => false,
      sideEffect: () => 'idempotent',
      wrapToolCall: async (callCtx) => {
        attempts += 1
        expect(
          callCtx.toolContext.permissions.can(call.name, call.input),
        ).toBe(true)
        if (attempts === 1) {
          throw new ToolSuspended(approval)
        }
        return 'allow'
      },
      execute: async () => okResult('after-approval'),
    }
    const state = createRun('t1')
    const checkpointer = new MemoryCheckpointer()
    const options: RunOptions = { model: script.model, tools, checkpointer }

    const first = await collect(streamRun(state, options))
    expect(first.some((event) => event.type === 'approval-requested')).toBe(true)
    expect(first.some((event) => event.type === 'tool-call-started')).toBe(false)
    expect(state.status).toBe('awaiting-approval')
    expect(state.pendingToolCalls[0]?.result).toBeUndefined()

    await collect(
      resumeRun(
        state,
        { threadId: 't1', approvalId: 'approval-call-1', decision: 'allow' },
        options,
      ),
    )
    expect(state.status).toBe('done')
    expect(state.messages[1]?.role).toBe('tool')
    if (state.messages[1]?.role === 'tool') {
      expect(state.messages[1].result.ok).toBe(true)
    }
    assertRunInvariants(state)
  })
})

describe('event envelope', () => {
  test('events carry runId, monotonic seq and timestamp', async () => {
    const script = scriptedModel([{ text: 'hello', toolCalls: [] }])
    const tools = makeTools()
    const state = createRun('t1')
    const checkpointer = new MemoryCheckpointer()
    const options: RunOptions = {
      model: script.model,
      tools,
      checkpointer,
      now: () => 100,
    }

    const events = await collect(streamRun(state, options))
    expect(events.map((event) => event.seq)).toEqual([1, 2, 3])
    expect(new Set(events.map((event) => event.runId))).toEqual(new Set(['run-1']))
    expect(events.every((event) => event.timestamp === 100)).toBe(true)
  })
})

describe('lifecycle hooks', () => {
  test('suspended / resume / end hooks are called', async () => {
    const script = scriptedModel([
      { text: '', toolCalls: [bashCall] },
      { text: 'final', toolCalls: [] },
    ])
    const tools = makeTools({ requiresApproval: () => true })
    const state = createRun('t1')
    const checkpointer = new MemoryCheckpointer()
    let started = 0
    let suspended = 0
    let resumed = 0
    let ended = 0
    const options: RunOptions = {
      model: script.model,
      tools,
      checkpointer,
      onRunStart: () => {
        started += 1
      },
      onRunSuspended: () => {
        suspended += 1
      },
      onRunResume: () => {
        resumed += 1
      },
      onRunEnd: () => {
        ended += 1
      },
    }

    await collect(streamRun(state, options))
    expect(started).toBe(1)
    expect(suspended).toBe(1)
    expect(ended).toBe(0)

    await collect(
      resumeRun(
        state,
        { threadId: 't1', approvalId: 'approval-call-1', decision: 'allow' },
        options,
      ),
    )
    expect(resumed).toBe(1)
    expect(ended).toBe(1)
  })
})

describe('cancel and crash integration', () => {
  test('consumer break on the first run-started event finalizes aborted', async () => {
    const script = scriptedModel([{ text: 'unused', toolCalls: [] }])
    const state = createRun('t1')
    const checkpointer = new MemoryCheckpointer()
    const points: string[] = []
    const options: RunOptions = {
      model: script.model,
      tools: makeTools(),
      checkpointer,
      onCheckpoint: (point) => {
        points.push(point)
      },
    }

    const stream = streamRun(state, options)
    const first = await stream.next()
    expect(first.value.type).toBe('run-started')
    await stream.return(undefined)

    expect(script.calls()).toBe(0)
    expect(state.status).toBe('aborted')
    expect(points).toContain('terminal')
    assertRunInvariants(state)
  })

  test('consumer break finalizes aborted and clears pending', async () => {
    const script = scriptedModel([
      { text: '', toolCalls: [bashCall] },
      { text: 'final', toolCalls: [] },
    ])
    const tools = makeTools()
    const state = createRun('t1')
    const checkpointer = new MemoryCheckpointer()
    let ended = 0
    const options: RunOptions = {
      model: script.model,
      tools,
      checkpointer,
      onRunEnd: () => {
        ended += 1
      },
    }

    for await (const event of streamRun(state, options)) {
      if (event.type === 'tool-call-started') break
    }

    expect(state.status).toBe('aborted')
    expect(state.pendingToolCalls).toEqual([])
    expect(ended).toBe(1)
    assertRunInvariants(state)
  })

  test('abort during tool execution emits cancelled + run-aborted', async () => {
    const script = scriptedModel([
      { text: '', toolCalls: [bashCall] },
      { text: 'unused', toolCalls: [] },
    ])
    const controller = new AbortController()
    const tools = makeTools({
      execute: (_call, ctx) =>
        new Promise<ToolResult>((_resolve, reject) => {
          const abort = () => {
            reject(new DOMException('aborted', 'AbortError'))
          }
          if (ctx.signal?.aborted) {
            abort()
            return
          }
          ctx.signal?.addEventListener('abort', abort)
        }),
    })
    const state = createRun('t1')
    const checkpointer = new MemoryCheckpointer()
    const options: RunOptions = {
      model: script.model,
      tools,
      checkpointer,
      signal: controller.signal,
    }

    const events: RunEvent[] = []
    try {
      for await (const event of streamRun(state, options)) {
        events.push(event)
        if (event.type === 'tool-call-started') {
          controller.abort()
        }
      }
    } catch (error) {
      expect((error as Error).name).toBe('AbortError')
    }

    expect(
      events.some(
        (event) =>
          event.type === 'tool-call-cancelled' &&
          event.reason === 'aborted',
      ),
    ).toBe(true)
    expect(events.at(-1)?.type).toBe('run-aborted')
    expect(state.status).toBe('aborted')
    assertRunInvariants(state)
  })

  test('④a idempotent retry emits retrying and keeps event pairing', async () => {
    let attempts = 0
    const script = scriptedModel([
      { text: '', toolCalls: [bashCall] },
      { text: 'final', toolCalls: [] },
    ])
    const tools = makeTools({
      sideEffect: () => 'idempotent',
      execute: async (_call, ctx) => {
        attempts += 1
        if (attempts === 1) {
          ctx.emitOutput({ stream: 'stdout', delta: 'partial' })
          throw new Crash('tool-execute')
        }
        return okResult('retry-ok')
      },
    })
    const state = createRun('t1')
    const checkpointer = new MemoryCheckpointer()
    const options: RunOptions = { model: script.model, tools, checkpointer }

    const first: RunEvent[] = []
    try {
      for await (const event of streamRun(state, options)) {
        first.push(event)
      }
    } catch (error) {
      expect((error as Error).name).toBe('Crash')
    }

    expect(state.pendingToolCalls[0]?.status).toBe('running')
    expect(attempts).toBe(1)

    const second = await collect(resumeRun(state, { threadId: 't1' }, options))
    expect(attempts).toBe(2)
    expect(state.status).toBe('done')

    const toolEvents = [...first, ...second].filter((event) =>
      event.type.startsWith('tool-'),
    ) as ToolEvent[]
    expect(toolEvents.some((event) => event.type === 'tool-call-retrying')).toBe(
      true,
    )
    assertToolEventPairing(toolEvents)
    assertRunInvariants(state)
  })

  test('crash at ④a non-idempotent does not replay the tool', async () => {
    const script = scriptedModel([
      { text: '', toolCalls: [bashCall] },
      { text: 'final', toolCalls: [] },
    ])
    let executed = 0
    const tools = makeTools({
      sideEffect: () => 'non-idempotent',
      execute: async () => {
        executed += 1
        return okResult('ok')
      },
    })
    const state = createRun('t1')
    const checkpointer = new MemoryCheckpointer()
    let crash = true
    const options: RunOptions = {
      model: script.model,
      tools,
      checkpointer,
      onCheckpoint: (point) => {
        if (crash && point === 'tool-start') {
          crash = false
          throw new Crash(point)
        }
      },
    }

    await expect(collect(streamRun(state, options))).rejects.toThrow(Crash)
    expect(state.pendingToolCalls[0]?.status).toBe('running')
    expect(executed).toBe(0)

    await collect(resumeRun(state, { threadId: 't1' }, options))
    expect(executed).toBe(0)
    expect(state.status).toBe('done')
    const toolMessage = state.messages.find((message) => message.role === 'tool')
    if (toolMessage?.role === 'tool') {
      expect(toolMessage.result.error?.code).toBe('TOOL_ATTEMPT_LOST')
    }
    assertRunInvariants(state)
  })
})

describe('expiry and terminal stream', () => {
  test('late allow after expiry is forced to APPROVAL_EXPIRED', async () => {
    let clock = 0
    let executed = 0
    const script = scriptedModel([
      { text: '', toolCalls: [bashCall] },
      { text: 'final', toolCalls: [] },
    ])
    const tools = makeTools({
      requiresApproval: () => true,
      execute: async () => {
        executed += 1
        return okResult('ok')
      },
    })
    const state = createRun('t1')
    const checkpointer = new MemoryCheckpointer()
    const options: RunOptions = {
      model: script.model,
      tools,
      checkpointer,
      approvalTimeoutMs: 10,
      now: () => clock,
    }

    await collect(streamRun(state, options))
    clock = 20

    const events = await collect(
      resumeRun(
        state,
        { threadId: 't1', approvalId: 'approval-call-1', decision: 'allow' },
        options,
      ),
    )
    expect(events.some((event) => event.type === 'tool-call-cancelled')).toBe(true)
    expect(executed).toBe(0)
    const toolMessage = state.messages.find((message) => message.role === 'tool')
    if (toolMessage?.role === 'tool') {
      expect(toolMessage.result.error?.code).toBe('APPROVAL_EXPIRED')
    }
    assertRunInvariants(state)
  })

  test('stream on a done thread starts a new run', async () => {
    const script = scriptedModel([
      { text: '', toolCalls: [bashCall] },
      { text: 'final', toolCalls: [] },
      { text: 'again', toolCalls: [] },
    ])
    const tools = makeTools()
    const state = createRun('t1')
    const checkpointer = new MemoryCheckpointer()
    const options: RunOptions = { model: script.model, tools, checkpointer }

    await collect(streamRun(state, options))
    expect(state.status).toBe('done')
    expect(script.calls()).toBe(2)
    const oldRunId = state.runId

    await collect(streamRun(state, options))
    expect(script.calls()).toBe(3)
    expect(state.status).toBe('done')
    expect(state.runStep).toBe(0)
    expect(state.runId).not.toBe(oldRunId)
  })
})
