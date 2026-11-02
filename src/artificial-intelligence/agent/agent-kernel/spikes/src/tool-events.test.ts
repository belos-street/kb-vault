import { describe, expect, test } from 'bun:test'

import { okResult, type ToolCall } from './checkpoint-resume'
import {
  assertToolEventPairing,
  cancelledEvent,
  runToolWithOutput,
  type ToolEvent,
} from './tool-events'

const call: ToolCall = {
  id: 'call-1',
  name: 'bash',
  input: { cmd: 'echo hi' },
}

const call2: ToolCall = {
  id: 'call-2',
  name: 'bash',
  input: { cmd: 'echo bye' },
}

async function collect(
  stream: AsyncGenerator<ToolEvent, unknown>,
): Promise<ToolEvent[]> {
  const events: ToolEvent[] = []
  for await (const event of stream) {
    events.push(event)
  }
  return events
}

describe('runToolWithOutput', () => {
  test('emits started, output deltas, completed in order', async () => {
    const events = await collect(
      runToolWithOutput(call, async (_input, ctx) => {
        ctx.emitOutput({ stream: 'stdout', delta: 'he' })
        ctx.emitOutput({ stream: 'stdout', delta: 'llo' })
        return okResult('hi')
      }, 'attempt-1'),
    )

    expect(events.map((event) => event.type)).toEqual([
      'tool-call-started',
      'tool-output-delta',
      'tool-output-delta',
      'tool-call-completed',
    ])
    expect(events[0]).toMatchObject({
      type: 'tool-call-started',
      toolCallId: 'call-1',
      attemptId: 'attempt-1',
    })
    expect(events[1]).toMatchObject({
      type: 'tool-output-delta',
      toolCallId: 'call-1',
      delta: 'he',
    })
    assertToolEventPairing(events)
  })

  test('ignores output emitted after execution settles', async () => {
    const events = await collect(
      runToolWithOutput(call, async (_input, ctx) => {
        setTimeout(() => {
          ctx.emitOutput({ stream: 'stdout', delta: 'late' })
        }, 0)
        return okResult('done')
      }),
    )

    expect(events.map((event) => event.type)).toEqual([
      'tool-call-started',
      'tool-call-completed',
    ])
    assertToolEventPairing(events)
  })

  test('business failure is normalized to a completed failResult', async () => {
    const events = await collect(
      runToolWithOutput(call, async () => {
        throw new Error('boom')
      }),
    )

    expect(events.map((event) => event.type)).toEqual([
      'tool-call-started',
      'tool-call-completed',
    ])
    const completed = events[1]
    expect(completed?.type).toBe('tool-call-completed')
    if (completed?.type === 'tool-call-completed') {
      expect(completed.result.ok).toBe(false)
      expect(completed.result.error?.code).toBe('TOOL_EXECUTION_ERROR')
    }
    assertToolEventPairing(events)
  })
})

describe('parallel tools', () => {
  test('keeps per-tool started/completed pairing when executed concurrently', async () => {
    const [first, second] = await Promise.all([
      collect(
        runToolWithOutput(call, async (_input, ctx) => {
          ctx.emitOutput({ stream: 'stdout', delta: 'hi' })
          return okResult('hi')
        }),
      ),
      collect(
        runToolWithOutput(call2, async (_input, ctx) => {
          ctx.emitOutput({ stream: 'stdout', delta: 'bye' })
          return okResult('bye')
        }),
      ),
    ])

    assertToolEventPairing([...first, ...second])
    expect(first.map((event) => event.type)).toEqual([
      'tool-call-started',
      'tool-output-delta',
      'tool-call-completed',
    ])
    expect(second.map((event) => event.type)).toEqual([
      'tool-call-started',
      'tool-output-delta',
      'tool-call-completed',
    ])
  })
})

describe('cancelled events', () => {
  test('denied approval has no started/completed pair', () => {
    const events: ToolEvent[] = [cancelledEvent(call, 'denied')]
    assertToolEventPairing(events)
    expect(events[0]).toMatchObject({
      type: 'tool-call-cancelled',
      toolCallId: 'call-1',
      reason: 'denied',
    })
  })

  test('started + aborted is a valid terminal pair', () => {
    const events: ToolEvent[] = [
      { type: 'tool-call-started', toolCallId: 'call-1', name: 'bash' },
      cancelledEvent(call, 'aborted'),
    ]
    assertToolEventPairing(events)
    expect(events[1]).toMatchObject({
      type: 'tool-call-cancelled',
      reason: 'aborted',
    })
  })

  test('started + cancelled is a valid terminal pair', () => {
    const events: ToolEvent[] = [
      { type: 'tool-call-started', toolCallId: 'call-1', name: 'bash' },
      cancelledEvent(call, 'denied'),
    ]
    assertToolEventPairing(events)
  })
})
