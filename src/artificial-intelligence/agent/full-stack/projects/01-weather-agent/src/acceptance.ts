// 1.2 验收脚本：不启动端口、不调用真实 LLM。
// 用注入的 fake LlmClient 验证「core 与 HTTP 共用同一逻辑」以及边界行为。
import { createServerApp } from './server.ts'
import { createChatService } from './services/chat.ts'
import { loadConfig, type AppConfig } from './config.ts'
import { AppError } from './lib/errors.ts'
import type { LlmClient } from './llm/types.ts'

interface Check {
  name: string
  pass: boolean
  detail: string
}

const checks: Check[] = []

const config: AppConfig = {
  openaiApiKey: 'test-key',
  openaiBaseUrl: 'https://example.test/v1',
  model: 'test-model',
  serviceApiKey: 'test-key',
  port: 8787,
  llmTimeoutMs: 1000
}

const fakeLlm: LlmClient = {
  async complete() {
    return { content: '答案', toolCalls: [] }
  }
}

const authHeaders = {
  authorization: 'Bearer test-key',
  'content-type': 'application/json'
}

// 1) core 与 HTTP 返回同一个结果
const { ask } = createChatService({ llm: fakeLlm })
const direct = await ask('杭州天气')
const app = createServerApp(config, fakeLlm)
const response = await app.request('/api/chat', {
  method: 'POST',
  headers: authHeaders,
  body: JSON.stringify({ threadId: 't1', message: '杭州天气' })
})
const body = (await response.json()) as { reply?: string }
checks.push({
  name: 'CLI/core 与 /api/chat 共用同一个 core',
  pass: direct === '答案' && body.reply === '答案',
  detail: 'core=' + direct + ' http=' + body.reply
})

// 2) 非法入参 400
const invalid = await app.request('/api/chat', {
  method: 'POST',
  headers: authHeaders,
  body: JSON.stringify({ threadId: 't1', message: '' })
})
const invalidBody = (await invalid.json()) as { code?: string }
checks.push({
  name: '非法入参返回 400 invalid_input',
  pass: invalid.status === 400 && invalidBody.code === 'invalid_input',
  detail: 'status=' + invalid.status + ' code=' + invalidBody.code
})

// 3) 无 Key 401
const unauthorized = await app.request('/api/chat', {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ threadId: 't1', message: '杭州天气' })
})
checks.push({
  name: '无 API Key 返回 401',
  pass: unauthorized.status === 401,
  detail: 'status=' + unauthorized.status
})

// 4) AppError 映射为 HTTP 状态码
const timeoutApp = createServerApp(config, {
  async complete() {
    throw new AppError('upstream_timeout', 504, '模型超时')
  }
})
const timeout = await timeoutApp.request('/api/chat', {
  method: 'POST',
  headers: authHeaders,
  body: JSON.stringify({ threadId: 't1', message: '慢请求' })
})
const timeoutBody = (await timeout.json()) as { code?: string }
checks.push({
  name: 'AppError 映射为 504 upstream_timeout',
  pass: timeout.status === 504 && timeoutBody.code === 'upstream_timeout',
  detail: 'status=' + timeout.status + ' code=' + timeoutBody.code
})

// 5) 配置缺失时启动即失败
let configFailed = false
try {
  loadConfig({})
} catch (error) {
  configFailed =
    error instanceof Error && error.message.startsWith('invalid_env:')
}
checks.push({
  name: '缺少必填环境变量时启动即失败',
  pass: configFailed,
  detail: configFailed ? 'invalid_env' : '没有抛出配置错误'
})

for (const check of checks) {
  console.log(
    (check.pass ? 'PASS' : 'FAIL') + '  ' + check.name + '  ' + check.detail
  )
}

if (checks.some((check) => !check.pass)) {
  process.exit(1)
}

console.log('all 1.2 acceptance checks passed')
