import { describe, expect, test } from 'bun:test'
import {
  assertToolCallComplete,
  normalizeFinishReason,
} from './model-finish'

describe('finishReason mapping', () => {
  test('stop with tool calls is normalized to tool-calls', () => {
    expect(normalizeFinishReason('stop', true)).toBe('tool-calls')
    expect(normalizeFinishReason('stop', false)).toBe('stop')
  })

  test('error finish is never a normal answer', () => {
    expect(() => normalizeFinishReason('error', false)).toThrow(
      'finishReason=error',
    )
  })

  test('partial tool call is rejected', () => {
    expect(() =>
      assertToolCallComplete('length', false),
    ).toThrow('truncated tool call')
    expect(() => assertToolCallComplete('length', true)).not.toThrow()
  })
})
