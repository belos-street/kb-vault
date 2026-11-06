import { test } from 'bun:test'

/**
 * 第 3 步验收：调用上限与重试。
 */
test.todo('maxModelCalls = 2 时第三次调用不发生')
test.todo('模型 429 重试后成功')
test.todo('非幂等工具抛错时不重试，错误转成 observation')
