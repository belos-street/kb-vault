import { AppError } from './lib/errors.ts'
import { chat } from './services/chat.ts'

process.env.SERVICE_API_KEY = 'test-key'
process.env.OPENAI_API_KEY = 'test-key'

const { app } = await import('./server.ts')

interface Check {
  name: string
  pass: boolean
  detail: string
}

const checks: Check[] = []

function authHeaders(): Record<string, string> {
  return {
    authorization: 'Bearer test-key',
    'content-type': 'application/json'
  }
}

// 1) 非法入参 400
const invalid = await app.request('/api/chat', {
  method: 'POST',
  headers: authHeaders(),
  body: JSON.stringify({ message: '' })
})
const invalidBody = (await invalid.json()) as { code?: string }
checks.push({
  name: '非法入参返回 400 invalid_input',
  pass: invalid.status === 400 && invalidBody.code === 'invalid_input',
  detail: 'status=' + invalid.status + ' code=' + invalidBody.code
})

// 2) 无 Key 401
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

// 3) SSE 事件顺序
const stream = await app.request('/api/chat/stream', {
  method: 'POST',
  headers: authHeaders(),
  body: JSON.stringify({ threadId: 't1', message: '杭州天气' })
})
const streamText = await stream.text()
const events = [...streamText.matchAll(/event: ([a-z]+)/g)].map(
  (match) => match[1]
)
checks.push({
  name: 'SSE 按 meta → delta → done 输出',
  pass:
    stream.status === 200 &&
    events[0] === 'meta' &&
    events.includes('delta') &&
    events.at(-1) === 'done',
  detail: events.join(' → ')
})

// 4) 上游超时映射 504
const originalFetch = globalThis.fetch
globalThis.fetch = (async (
  _input: Parameters<typeof fetch>[0],
  init?: Parameters<typeof fetch>[1]
) =>
  new Promise<Response>((_resolve, reject) => {
    init?.signal?.addEventListener('abort', () => {
      const error = new Error('aborted')
      error.name = 'AbortError'
      reject(error)
    })
  })) as typeof fetch

let timeoutOk = false
let timeoutDetail = ''
try {
  await chat({ message: '慢请求', timeoutMs: 10 })
  timeoutDetail = '没有抛出超时'
} catch (error) {
  if (
    error instanceof AppError &&
    error.code === 'upstream_timeout' &&
    error.status === 504
  ) {
    timeoutOk = true
    timeoutDetail = 'code=upstream_timeout status=504'
  } else {
    timeoutDetail = String(error)
  }
} finally {
  globalThis.fetch = originalFetch
}
checks.push({
  name: '上游超时返回 504 upstream_timeout',
  pass: timeoutOk,
  detail: timeoutDetail
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
