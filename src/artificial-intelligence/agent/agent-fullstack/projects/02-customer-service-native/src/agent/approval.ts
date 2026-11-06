/**
 * 人工审批与恢复（第 6 步）。
 *
 * 作用
 * - 敏感工具执行前写 pending 并落盘，返回 suspended，进程可以安全退出。
 * - resume 读回 pending，按 approve / reject 继续；保证工具只执行一次。
 *
 * 不负责
 * - 渲染审批界面（cli.ts）。
 * - 判断哪些工具需要审批（business/tools.ts 里的 requiresApproval）。
 *
 * 为什么不能只写 await prompt()
 * - 进程内等待不落盘，关掉窗口状态就丢；恢复时也无法判断工具是否已经执行过。
 */
import type { ThreadState } from './store'

export type ApprovalDecision = 'approve' | 'reject'

export interface ResumeResult {
  threadId: string
  decision: ApprovalDecision
  tool: string
  /** approve 时工具是否已经执行；reject 时恒为 false */
  executed: boolean
  state: ThreadState
}

export async function resume(
  _threadId: string,
  _decision: ApprovalDecision
): Promise<ResumeResult> {
  throw new Error('TODO 第 6 步：读回 pending → 幂等执行或拒绝 → 交回循环')
}
