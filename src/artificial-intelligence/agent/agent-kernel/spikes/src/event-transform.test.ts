import { describe, expect, test } from 'bun:test'
import { applyEventTransform, EventTransformError } from './event-transform'

type TestEvent =
  | { type: 'text-delta'; text: string }
  | { type: 'run-finished'; output: string }

describe('transformEvent', () => {
  test('allows same-type payload rewrite', () => {
    const event: TestEvent = { type: 'text-delta', text: 'a' }
    const next = applyEventTransform(event, (value) => ({
      ...value,
      text: 'b',
    }))
    expect(next).toEqual({ type: 'text-delta', text: 'b' })
  })

  test('allows dropping non-terminal events', () => {
    const event: TestEvent = { type: 'text-delta', text: 'a' }
    expect(applyEventTransform(event, () => null)).toBeNull()
  })

  test('rejects dropping terminal events', () => {
    const event: TestEvent = { type: 'run-finished', output: 'done' }
    expect(() => applyEventTransform(event, () => null)).toThrow(
      EventTransformError,
    )
  })

  test('rejects changing the event type', () => {
    const event: TestEvent = { type: 'text-delta', text: 'a' }
    expect(() =>
      applyEventTransform(event, () => ({
        type: 'run-finished',
        output: 'fake',
      } as TestEvent)),
    ).toThrow(EventTransformError)
  })
})
