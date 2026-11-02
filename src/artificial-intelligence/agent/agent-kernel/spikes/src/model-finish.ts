export type NormalizedFinishReason =
  | 'stop'
  | 'tool-calls'
  | 'length'
  | 'content-filter'

export function normalizeFinishReason(
  raw: string,
  hasToolCalls: boolean,
): NormalizedFinishReason {
  if (raw === 'error') {
    throw new Error('ProviderError: finishReason=error')
  }
  if (raw === 'tool_calls') return 'tool-calls'
  if (raw === 'length') return 'length'
  if (raw === 'content_filter') return 'content-filter'
  if (raw === 'stop') return hasToolCalls ? 'tool-calls' : 'stop'
  throw new Error(`unknown finish reason: ${raw}`)
}

export function assertToolCallComplete(
  reason: NormalizedFinishReason,
  complete: boolean,
): void {
  if (reason === 'length' && !complete) {
    throw new Error('ProviderError: truncated tool call')
  }
}
