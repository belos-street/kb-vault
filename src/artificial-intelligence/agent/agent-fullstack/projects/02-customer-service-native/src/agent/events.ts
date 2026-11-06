/**
 * 事件协议：一次 turn 中所有可观察事件的形状。
 *
 * 作用
 * - 它是循环的"观察面"：CLI 渲染、trace 落盘、测试断言消费的是同一份数据。
 * - 第 1 步就引入；之后每加一个能力，先加它对应的事件，再加实现。
 *
 * 约束
 * - 只用普通数组 events.push(...)，不要 EventEmitter / 事件总线。
 * - turn-end / error 这类 terminal 事件不能被中途丢掉，否则消费者永远等不到结束。
 */
export type RunEvent =
  | { type: 'turn-start'; threadId: string }
  | { type: 'model-call'; attempt: number; status: 'ok' | 'retry' | 'error' }
  | { type: 'tool-call'; name: string; args: Record<string, unknown> }
  | { type: 'approval-requested'; tool: string; summary: string }
  | { type: 'observation'; name: string; ok: boolean; content: string }
  | { type: 'compacted'; droppedMessages: number }
  | { type: 'turn-end'; reason: 'final' | 'limit' | 'suspended' }
