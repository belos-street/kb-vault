export type ToolSpec = {
  name: string
  description: string
  parameters: Record<string, unknown>
}

export type ToolCall = {
  id: string
  name: string
  arguments: string
}

export type ChatMessage =
  | { role: 'system' | 'user'; content: string }
  | { role: 'assistant'; content: string | null; toolCalls?: ToolCall[] }
  | { role: 'tool'; toolCallId: string; content: string }

export type LlmReply = {
  content: string | null
  toolCalls: ToolCall[]
}

export interface LlmClient {
  complete(input: {
    messages: ChatMessage[]
    tools?: ToolSpec[]
    signal?: AbortSignal
  }): Promise<LlmReply>
}
