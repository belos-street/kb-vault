import { test } from 'bun:test'

/**
 * 第 6 步验收：审批与挂起恢复。
 * 三个用例都必须跨进程语义，进程内 await 不算。
 */
test.todo('敏感工具执行前写 pending 并返回 suspended')
test.todo('approve 后工具只执行一次')
test.todo('reject 后工具不执行，模型拿到拒绝原因')
test.todo('重复 resume 不会重复执行')
