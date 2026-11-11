import { TICKET_PROMPT, classify } from './prompt.ts'

interface Check {
  name: string
  pass: boolean
  detail: string
}

function fake(responses: string[]) {
  let index = 0
  return async () => responses[Math.min(index++, responses.length - 1)] ?? ''
}

const good =
  '{"intent":"invoice","orderId":null,"urgency":"normal","reply":"可以重开。"}'

const checks: Check[] = []

const rendered = TICKET_PROMPT.render({
  message: '抬头写错了能重开吗',
  history: ['用户：上周开过一张发票']
})
const system = rendered[0]?.content ?? ''
const user = rendered[1]?.content ?? ''
checks.push({
  name: '渲染结果带模板版本与注入边界',
  pass:
    system.includes('ticket-classify@3') &&
    user.startsWith('<user_input>') &&
    user.includes('【历史】') &&
    user.includes('【当前消息】'),
  detail: 'system 带 ticket-classify@3；history 与 message 都在 <user_input> 内'
})

const first = await classify({
  message: '抬头写错了能重开吗',
  history: [],
  callModel: fake([good])
})
checks.push({
  name: '首次合法 JSON 直接通过',
  pass: first.intent === 'invoice',
  detail: 'intent=' + first.intent
})

const retried = await classify({
  message: '抬头写错了能重开吗',
  history: [],
  callModel: fake(['不是 JSON', good])
})
checks.push({
  name: '非 JSON 能回填重试一次',
  pass: retried.intent === 'invoice',
  detail: '第二次输出被采用'
})

let failure = ''
try {
  await classify({
    message: '抬头写错了能重开吗',
    history: [],
    callModel: fake(['不是 JSON'])
  })
} catch (error) {
  failure = error instanceof Error ? error.message : String(error)
}
checks.push({
  name: '两次都失败抛 schema_unrecoverable',
  pass: failure.startsWith('schema_unrecoverable'),
  detail: failure
})

for (const check of checks) {
  console.log(
    (check.pass ? 'PASS' : 'FAIL') + '  ' + check.name + '  ' + check.detail
  )
}

if (checks.some((check) => !check.pass)) {
  process.exit(1)
}

console.log('all prompt contract checks passed')
