import type { BaseMessage } from '@langchain/core/messages'
import { ChatOpenAI } from '@langchain/openai'
import { Command } from '@langchain/langgraph'
import { Hono } from 'hono'
import { z } from 'zod'
import { createCustomerAgent } from './agent.ts'
import { apiKeyAuth, type AppVariables } from './auth.ts'

const ChatInput = z.object({
  threadId: z.string().min(1),
  message: z.string().min(1),
  // 示例只暴露 approve / reject；edit 需要参数编辑 UI，见 2.5 的 HITL 配置
  decision: z.enum(['approve', 'reject']).optional()
})

const statusByCode: Record<
  string,
  400 | 401 | 403 | 422 | 429 | 500 | 502 | 504
> = {
  invalid_input: 400,
  unauthorized: 401,
  permission_denied: 403,
  max_steps_exceeded: 422,
  repeated_tool_call: 422,
  too_many_invalid_arguments: 422,
  schema_unrecoverable: 422,
  upstream_rate_limited: 429,
  upstream_timeout: 504,
  upstream_error: 502
}

const INPUT_PRICE_PER_1K = 0.00015
const OUTPUT_PRICE_PER_1K = 0.0006

type ErrorStatus = 400 | 401 | 403 | 422 | 429 | 500 | 502 | 504

function classifyError(error: unknown): {
  code: string
  status: ErrorStatus
  message: string
} {
  if (error instanceof Error && error.name === 'AbortError') {
    return { code: 'upstream_timeout', status: 504, message: '模型超时' }
  }

  const detail = error instanceof Error ? error.message : ''

  if (detail.includes('permission_denied')) {
    return {
      code: 'permission_denied',
      status: 403,
      message: '无权限执行该工具'
    }
  }
  if (detail.includes('429') || detail.toLowerCase().includes('rate limit')) {
    return {
      code: 'upstream_rate_limited',
      status: 429,
      message: '稍后重试'
    }
  }
  if (
    detail.includes('Incorrect API key') ||
    detail.includes('MODEL_AUTHENTICATION')
  ) {
    return {
      code: 'server_misconfigured',
      status: 500,
      message: '服务配置错误'
    }
  }
  if (detail.includes('max_steps_exceeded')) {
    return { code: 'max_steps_exceeded', status: 422, message: '循环次数超限' }
  }
  if (detail.includes('schema_unrecoverable')) {
    return {
      code: 'schema_unrecoverable',
      status: 422,
      message: '结构化输出失败'
    }
  }
  if (
    detail.includes('upstream_error') ||
    detail.includes('fetch failed') ||
    detail.includes('ECONN')
  ) {
    return { code: 'upstream_error', status: 502, message: '上游错误' }
  }

  const head = detail.split(':')[0] ?? ''
  const status = statusByCode[head]
  if (/^[a-z_]+$/.test(head) && status) {
    return { code: head, status, message: '请求失败' }
  }
  return { code: 'internal_error', status: 500, message: '服务内部错误' }
}

function estimateUsage(messages: BaseMessage[]) {
  let inputTokens = 0
  let outputTokens = 0

  for (const message of messages) {
    const usage = (
      message as {
        usage_metadata?: {
          input_tokens?: number
          output_tokens?: number
        }
      }
    ).usage_metadata
    inputTokens += usage?.input_tokens ?? 0
    outputTokens += usage?.output_tokens ?? 0
  }

  const costUsd =
    (inputTokens / 1000) * INPUT_PRICE_PER_1K +
    (outputTokens / 1000) * OUTPUT_PRICE_PER_1K

  return {
    inputTokens,
    outputTokens,
    costUsd: Number(costUsd.toFixed(6))
  }
}

const agent = createCustomerAgent({
  model: new ChatOpenAI({ model: process.env.PRIMARY_MODEL ?? 'gpt-4o-mini' })
})

const app = new Hono<{ Variables: AppVariables }>()
app.use('/api/*', apiKeyAuth())

app.post('/api/chat', async (c) => {
  const traceId = c.req.header('x-trace-id') ?? crypto.randomUUID()
  c.header('x-trace-id', traceId)

  const body = await c.req.json().catch(() => null)
  const parsed = ChatInput.safeParse(body)
  if (!parsed.success) {
    return c.json(
      { code: 'invalid_input', message: '参数不合法', traceId },
      400
    )
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 30_000)
  const startedAt = Date.now()

  const config = {
    configurable: { thread_id: parsed.data.threadId },
    context: {
      userId: c.get('userId'),
      role: c.get('role'),
      tenantId: c.get('tenantId')
    },
    signal: controller.signal
  }

  try {
    const result = parsed.data.decision
      ? await agent.invoke(
          new Command({
            resume: { decisions: [{ type: parsed.data.decision }] }
          }),
          config
        )
      : await agent.invoke(
          { messages: [{ role: 'user', content: parsed.data.message }] },
          config
        )

    const interrupts = (result as Record<string, unknown>)['__interrupt__']
    if (Array.isArray(interrupts) && interrupts.length > 0) {
      return c.json({ status: 'pending_approval', traceId, interrupts }, 202)
    }

    const usage = estimateUsage(result.messages)
    const latencyMs = Date.now() - startedAt
    console.log(
      JSON.stringify({
        traceId,
        threadId: parsed.data.threadId,
        event: 'chat.done',
        latencyMs,
        ...usage
      })
    )

    return c.json({
      status: 'done',
      traceId,
      reply: result.messages.at(-1)?.content,
      usage
    })
  } catch (error) {
    const classified = classifyError(error)
    console.log(
      JSON.stringify({
        traceId,
        event: 'chat.error',
        code: classified.code,
        detail: error instanceof Error ? error.message : String(error)
      })
    )
    return c.json(
      { code: classified.code, message: classified.message, traceId },
      classified.status
    )
  } finally {
    clearTimeout(timer)
  }
})

if (import.meta.main) {
  const port = Number(process.env.PORT ?? '8787')
  Bun.serve({ port, fetch: app.fetch })
  console.log('listening on http://127.0.0.1:' + port)
}
