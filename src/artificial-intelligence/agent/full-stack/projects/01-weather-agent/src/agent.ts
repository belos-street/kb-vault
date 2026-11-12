import { z } from 'zod'
import type { ChatMessage, Llm, ToolCall, ToolSpec } from './llm.ts'

const WeatherArgs = z.object({
  city: z.string().min(1)
})

type WeatherInput = z.infer<typeof WeatherArgs>

type Tool = {
  args: z.ZodType<WeatherInput>
  run: (args: WeatherInput) => Promise<unknown>
}

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

const toolSpecs: ToolSpec[] = [
  {
    name: 'weather',
    description: '查询城市天气',
    parameters: {
      type: 'object',
      required: ['city'],
      properties: { city: { type: 'string' } }
    }
  }
]

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

function toolMessage(id: string, error: string, detail: string): ChatMessage {
  return {
    role: 'tool',
    toolCallId: id,
    content: JSON.stringify({ error, detail })
  }
}

async function runTool(call: ToolCall) {
  const tool = tools[call.name]
  if (!tool) {
    return {
      invalid: true,
      message: toolMessage(call.id, 'unknown_tool', call.name)
    }
  }

  const json = parseArgs(call.arguments)
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
      role: 'tool' as const,
      toolCallId: call.id,
      content: JSON.stringify(await tool.run(args.data))
    }
  }
}

export function createAgent(llm: Llm) {
  return {
    async run(question: string, maxSteps = 6): Promise<string> {
      const messages: ChatMessage[] = [
        { role: 'user', content: question }
      ]

      for (let step = 0; step < maxSteps; step += 1) {
        const reply = await llm.chat(messages, toolSpecs)

        messages.push({
          role: 'assistant',
          content: reply.content,
          toolCalls: reply.toolCalls
        })

        if (reply.toolCalls.length === 0) {
          return reply.content ?? ''
        }

        for (const call of reply.toolCalls) {
          messages.push((await runTool(call)).message)
        }
      }

      throw new Error('max_steps_exceeded: 工具循环次数超限')
    }
  }
}
