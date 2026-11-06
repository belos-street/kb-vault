import { test } from 'bun:test'

/**
 * 第 1 步验收：事件流。
 * 事件是循环的观察面，顺序必须可断言。
 */
test.todo(
  'events 顺序与实际执行一致：model-call → tool-call → observation → turn-end'
)
test.todo('即使中途失败，turn-end 仍然会被写入')
test.todo('每个相位切换后都能在 events 与落盘状态里看到')
