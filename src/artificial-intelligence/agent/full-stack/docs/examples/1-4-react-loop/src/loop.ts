import { z } from 'zod'

export const WeatherArgs = z.object({
  city: z.string().min(1)
})

export type WeatherInput = z.infer<typeof WeatherArgs>

export type ToolCall = {
  id: string
  function: {
    name: string
    arguments: string
  }
}

export type Tool = {
  args: z.ZodType<WeatherInput>
  run: (args: WeatherInput) => Promise<unknown>
}

export type UserMessage = {
  role: 'user'
  content: string
}

export type AssistantMessage = {
  role: 'assistant'
  content: string
  tool_calls?: ToolCall[]
}

export type ToolMessage = {
  role: 'tool'
  tool_call_id: string
  content: string
}

export type ChatMessage = UserMessage | AssistantMessage | ToolMessage

export type ChatFn = (messages: ChatMessage[]) => Promise<AssistantMessage>

type ToolOutcome =
  | { invalid: true; message: ToolMessage }
  | { invalid: false; message: ToolMessage }

const tools: Record<string, Tool> = {
  weather: {
    args: WeatherArgs,
    run: async (args) => ({
      city: args.city,
      tomorrow: '中雨',
      tempC: 22
    })
  }
}

function parseArgs(
  raw: string
): { ok: true; value: unknown } | { ok: false; message: string } {
  try {
    return { ok: true, value: JSON.parse(raw) }
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : 'invalid JSON'
    }
  }
}

function toolMessage(id: string, error: string, detail: string): ToolMessage {
  return {
    role: 'tool',
    tool_call_id: id,
    content: JSON.stringify({ error, detail })
  }
}

export async function runTool(
  call: ToolCall,
  registry: Record<string, Tool> = tools
): Promise<ToolOutcome> {
  const tool = registry[call.function.name]
  if (!tool) {
    return {
      invalid: true,
      message: toolMessage(call.id, 'unknown_tool', call.function.name)
    }
  }

  const json = parseArgs(call.function.arguments)
  if (!json.ok) {
    return {
      invalid: true,
      message: toolMessage(call.id, 'invalid_arguments', json.message)
    }
  }

  const args = tool.args.safeParse(json.value)
  if (!args.success) {
    return {
      invalid: true,
      message: toolMessage(
        call.id,
        'invalid_arguments',
        args.error.issues
          .map((issue) => issue.path.join('.') + ' ' + issue.message)
          .join('; ')
      )
    }
  }

  return {
    invalid: false,
    message: {
      role: 'tool',
      tool_call_id: call.id,
      content: JSON.stringify(await tool.run(args.data))
    }
  }
}

export async function runAgent(input: {
  question: string
  chat: ChatFn
  maxSteps?: number
  registry?: Record<string, Tool>
}): Promise<string> {
  const maxSteps = input.maxSteps ?? 6
  const registry = input.registry ?? tools
  const messages: ChatMessage[] = [{ role: 'user', content: input.question }]
  let invalidStreak = 0
  const seen = new Set<string>()

  for (let step = 0; step < maxSteps; step += 1) {
    // oxlint-disable-next-line no-await-in-loop -- 每一轮都依赖上一轮的 messages
    const message = await input.chat(messages)
    messages.push(message)

    const calls = message.tool_calls ?? []
    if (calls.length === 0) return message.content

    for (const call of calls) {
      const signature = call.function.name + ':' + call.function.arguments
      if (seen.has(signature)) throw new Error('repeated_tool_call')
      seen.add(signature)
    }

    // oxlint-disable-next-line no-await-in-loop -- 等本批工具结果再更新失败计数
    const results = await Promise.all(
      calls.map((call) => runTool(call, registry))
    )
    messages.push(...results.map((item) => item.message))

    invalidStreak = results.some((item) => item.invalid) ? invalidStreak + 1 : 0
    if (invalidStreak >= 2) throw new Error('too_many_invalid_arguments')
  }

  throw new Error('max_steps_exceeded')
}
