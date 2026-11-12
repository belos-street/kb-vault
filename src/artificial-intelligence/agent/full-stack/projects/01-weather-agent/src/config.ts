import { z } from 'zod'

const envSchema = z.object({
  OPENAI_API_KEY: z.string().min(1),
  OPENAI_BASE_URL: z.url().default('https://api.openai.com/v1'),
  DEFAULT_MODEL: z.string().min(1).default('gpt-4o-mini'),
  SERVICE_API_KEY: z.string().min(1),
  PORT: z.coerce.number().int().min(1).max(65535).default(8787),
  LLM_TIMEOUT_MS: z.coerce.number().int().positive().default(30_000)
})

export type AppConfig = {
  openaiApiKey: string
  openaiBaseUrl: string
  model: string
  serviceApiKey: string
  port: number
  llmTimeoutMs: number
}

export function loadConfig(
  env: Record<string, string | undefined> = process.env
): AppConfig {
  const parsed = envSchema.safeParse(env)
  if (!parsed.success) {
    const detail = parsed.error.issues
      .map((issue) => issue.path.join('.') + ': ' + issue.message)
      .join('; ')
    throw new Error('invalid_env: ' + detail)
  }

  return {
    openaiApiKey: parsed.data.OPENAI_API_KEY,
    openaiBaseUrl: parsed.data.OPENAI_BASE_URL,
    model: parsed.data.DEFAULT_MODEL,
    serviceApiKey: parsed.data.SERVICE_API_KEY,
    port: parsed.data.PORT,
    llmTimeoutMs: parsed.data.LLM_TIMEOUT_MS
  }
}
