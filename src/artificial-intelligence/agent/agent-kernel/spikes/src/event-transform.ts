export const TERMINAL_EVENT_TYPES = new Set([
  'error',
  'run-finished',
  'run-aborted',
  'approval-requested',
])

export class EventTransformError extends Error {
  override readonly name = 'EventTransformError'
}

export function applyEventTransform<T extends { type: string }>(
  event: T,
  transform?: (event: T) => T | null,
): T | null {
  if (transform === undefined) return event

  const next = transform(event)
  if (next === null) {
    if (TERMINAL_EVENT_TYPES.has(event.type)) {
      throw new EventTransformError(
        `terminal event cannot be dropped: ${event.type}`,
      )
    }
    return null
  }

  if (next.type !== event.type) {
    throw new EventTransformError(
      `event type cannot change: ${event.type} -> ${next.type}`,
    )
  }

  return next
}
