import { describe, expect, test } from 'bun:test'

import {
  assertInvariants,
  beginToolBatch,
  completeTool,
  createState,
  type Checkpointer,
  failResult,
  finalize,
  MemoryCheckpointer,
  okResult,
  recoverRunningTool,
  resumeApproval,
  startTool,
  suspendForApproval,
  type RunState,
  type ToolCall,
} from './checkpoint-resume'

const bashCall: ToolCall = {
  id: 'call-1',
  name: 'bash',
  input: { cmd: 'echo hi' },
}

async function load(
  checkpointer: Checkpointer,
  threadId: string,
): Promise<RunState> {
  const state = await checkpointer.load(threadId)
  if (state === null) {
    throw new Error(`missing state: ${threadId}`)
  }
  return state
}

describe('checkpoint ③ pairing', () => {
  test('persists assistant tool_use before pending calls', async () => {
    const state = createState('t1')
    const checkpointer = new MemoryCheckpointer()

    beginToolBatch(state, [bashCall])
    await checkpointer.save(state)

    const loaded = await load(checkpointer, 't1')
    expect(loaded.messages).toEqual([
      { role: 'assistant', toolCalls: [bashCall] },
    ])
    expect(loaded.pendingToolCalls).toEqual([
      { call: bashCall, status: 'pending' },
    ])
    assertInvariants(loaded)
  })

  test('finalizes with paired ToolMessage in model order', async () => {
    const state = createState('t1')
    const checkpointer = new MemoryCheckpointer()

    beginToolBatch(state, [bashCall])
    await checkpointer.save(state)

    const loaded = await load(checkpointer, 't1')
    startTool(loaded, 'call-1', 'attempt-1')
    completeTool(loaded, 'call-1', okResult('hi'))
    finalize(loaded, 'done')

    assertInvariants(loaded)
    expect(loaded.messages).toEqual([
      { role: 'assistant', toolCalls: [bashCall] },
      { role: 'tool', toolCallId: 'call-1', result: okResult('hi') },
    ])
    expect(loaded.pendingToolCalls).toEqual([])
  })
})

describe('approval resume', () => {
  test('persists allow decision and continues the run', async () => {
    const state = createState('t1')
    const checkpointer = new MemoryCheckpointer()

    beginToolBatch(state, [bashCall])
    await checkpointer.save(state)

    suspendForApproval(state, {
      approvalId: 'approval-1',
      toolCallId: 'call-1',
      call: bashCall,
      requestedAt: 1,
      options: ['allow', 'deny'],
    })
    await checkpointer.save(state)

    const loaded = await load(checkpointer, 't1')
    expect(loaded.status).toBe('awaiting-approval')
    expect(loaded.pendingApprovals).toHaveLength(1)

    resumeApproval(loaded, 'approval-1', 'allow', 2)
    expect(loaded.status).toBe('running')
    expect(loaded.pendingApprovals[0]?.decision).toBe('allow')

    await checkpointer.save(loaded)
    const reloaded = await load(checkpointer, 't1')
    expect(reloaded.pendingApprovals[0]?.decision).toBe('allow')

    startTool(reloaded, 'call-1', 'attempt-1')
    completeTool(reloaded, 'call-1', okResult('approved'))
    finalize(reloaded, 'done')

    assertInvariants(reloaded)
    expect(reloaded.messages).toHaveLength(2)
    expect(reloaded.pendingApprovals).toEqual([])
  })

  test('deny becomes failResult, not an aborted run', async () => {
    const state = createState('t1')

    beginToolBatch(state, [bashCall])
    suspendForApproval(state, {
      approvalId: 'approval-1',
      toolCallId: 'call-1',
      call: bashCall,
      requestedAt: 1,
      options: ['allow', 'deny'],
    })

    resumeApproval(state, 'approval-1', 'deny', 2)
    completeTool(
      state,
      'call-1',
      failResult('APPROVAL_DENIED', 'user denied the command'),
    )
    finalize(state, 'done')

    assertInvariants(state)
    expect(state.status).toBe('done')
    expect(state.messages[1]).toEqual({
      role: 'tool',
      toolCallId: 'call-1',
      result: failResult('APPROVAL_DENIED', 'user denied the command'),
    })
  })
})

describe('crash recovery', () => {
  test('non-idempotent running tool is not replayed', async () => {
    const state = createState('t1')
    const checkpointer = new MemoryCheckpointer()

    beginToolBatch(state, [bashCall])
    startTool(state, 'call-1', 'attempt-1')
    await checkpointer.save(state) // 保存点 ④a 后崩溃

    const loaded = await load(checkpointer, 't1')
    expect(loaded.status).toBe('running')
    expect(loaded.pendingToolCalls[0]?.status).toBe('running')

    const result = recoverRunningTool(
      loaded,
      'call-1',
      'non-idempotent',
      'attempt-2',
    )
    expect(result).toBe('failed')
    expect(loaded.pendingToolCalls[0]?.status).toBe('completed')
    expect(loaded.pendingToolCalls[0]?.result?.ok).toBe(false)

    finalize(loaded, 'done')
    assertInvariants(loaded)
    expect(loaded.pendingToolCalls).toEqual([])
  })

  test('idempotent running tool can be retried', async () => {
    const state = createState('t1')
    const checkpointer = new MemoryCheckpointer()

    beginToolBatch(state, [bashCall])
    startTool(state, 'call-1', 'attempt-1')
    await checkpointer.save(state)

    const loaded = await load(checkpointer, 't1')
    const result = recoverRunningTool(
      loaded,
      'call-1',
      'idempotent',
      'attempt-2',
    )
    expect(result).toBe('retry')
    expect(loaded.pendingToolCalls[0]?.attemptId).toBe('attempt-2')

    completeTool(loaded, 'call-1', okResult('retried'))
    finalize(loaded, 'done')
    assertInvariants(loaded)
  })
})

describe('consumer abort', () => {
  test('fills missing ToolMessage and clears pending state', () => {
    const state = createState('t1')

    beginToolBatch(state, [bashCall])
    startTool(state, 'call-1', 'attempt-1')
    finalize(state, 'aborted')

    assertInvariants(state)
    expect(state.status).toBe('aborted')
    expect(state.pendingToolCalls).toEqual([])
    expect(state.pendingApprovals).toEqual([])
    expect(state.messages[1]).toEqual({
      role: 'tool',
      toolCallId: 'call-1',
      result: failResult(
        'RUN_ENDED',
        'run aborted while tool may have executed; do not retry without checking side effects',
      ),
    })
  })
})

describe('principal persistence', () => {
  test('principal and usage survive the checkpoint round-trip', async () => {
    const state = createState('t1', 'run-1', { id: 'u1' })
    state.usage.inputTokens = 12
    state.usage.outputTokens = 4
    const checkpointer = new MemoryCheckpointer()
    await checkpointer.save(state)

    const loaded = await load(checkpointer, 't1')
    expect(loaded.principal).toEqual({ id: 'u1' })
    expect(loaded.usage).toEqual({ inputTokens: 12, outputTokens: 4 })
  })
})
