import { ToolPermissionError, parseTicket, runRefund } from './contract.ts'

interface Check {
  name: string
  pass: boolean
  detail: string
}

const checks: Check[] = []

const invalid = runRefund(
  { orderId: '1024', reason: 'late' },
  { userId: 'u_1', role: 'admin', tenantId: 't_acme' }
)
checks.push({
  name: '非法入参被 Zod 拒绝',
  pass: !invalid.ok && invalid.code === 'invalid_input',
  detail: invalid.message
})

let deniedMessage = ''
let deniedPass = false
try {
  runRefund(
    { orderId: 'ORD-1024', reason: 'late' },
    { userId: 'u_1', role: 'agent', tenantId: 't_acme' }
  )
} catch (error) {
  deniedPass = error instanceof ToolPermissionError
  deniedMessage = error instanceof Error ? error.message : String(error)
}
checks.push({
  name: 'agent 角色被权限上下文拒绝',
  pass: deniedPass,
  detail: deniedMessage
})

const accepted = runRefund(
  { orderId: 'ORD-1024', reason: 'late' },
  { userId: 'u_1', role: 'admin', tenantId: 't_acme' }
)
checks.push({
  name: 'admin 角色通过并返回结构化结果',
  pass: accepted.ok,
  detail: accepted.message
})

const parsed = parseTicket(
  '{"intent":"refund_status","orderId":"ORD-1024","reply":"3-5 个工作日到账"}'
)
checks.push({
  name: 'responseFormat 输出可被 Schema 解析',
  pass: parsed.ok,
  detail: parsed.ok ? parsed.data.reply : parsed.message
})

for (const check of checks) {
  console.log(
    (check.pass ? 'PASS' : 'FAIL') + '  ' + check.name + '  ' + check.detail
  )
}

if (checks.some((check) => !check.pass)) {
  process.exit(1)
}

console.log('all contract checks passed')
