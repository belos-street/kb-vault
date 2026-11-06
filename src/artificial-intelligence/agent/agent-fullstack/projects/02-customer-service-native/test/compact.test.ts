import { test } from 'bun:test'

/**
 * 第 5 步验收：上下文压缩。
 */
test.todo('未超过阈值时原样返回，droppedMessages = 0')
test.todo('触发压缩后 assistant(tool_calls) 与 tool 消息同进同出')
test.todo('摘要保留订单号等关键事实')
test.todo('压缩只影响请求视图，不改写 ThreadState.messages')
