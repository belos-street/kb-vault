/**
 * 状态与持久化（第 2 步）。
 *
 * 作用
 * - 定义一次会话的完整状态 ThreadState：消息、相位、用量、待审批。
 * - loadThread / saveThread 负责跨进程恢复；一个 thread 一个 JSON 文件。
 *
 * 相位与保存点
 * - phase = 'model'              调用模型前写入
 * - phase = 'tools'              append assistant 后写入
 * - phase = 'awaiting-approval'  写 pending 后写入
 * - phase = 'done'               收口完成后写入
 * 每次相位切换都要立刻 saveThread，崩溃后才知道该从哪一步继续。
 */
import type { ChatMessage } from './model'

export type Phase = 'model' | 'tools' | 'awaiting-approval' | 'done'

export interface PendingApproval {
  callId: string
  tool: string
  args: Record<string, unknown>
  /** 给用户看的审批摘要，例如"即将退款 SO-2026-0812 / ￥299 / 质量问题" */
  summary: string
  createdAt: string
}

export interface ThreadState {
  threadId: string
  messages: ChatMessage[]
  phase: Phase
  modelCalls: number
  totalTokens: number
  pending?: PendingApproval
  updatedAt: string
}

export function newThread(threadId: string): ThreadState {
  return {
    threadId,
    messages: [],
    phase: 'model',
    modelCalls: 0,
    totalTokens: 0,
    updatedAt: new Date().toISOString()
  }
}

/** 从 data/threads/<threadId>.json 读取；不存在返回 null。 */
export async function loadThread(
  _threadId: string
): Promise<ThreadState | null> {
  throw new Error('TODO 第 2 步：读取 thread 文件并校验 JSON 结构')
}

/** 原子写入 data/threads/<threadId>.json（先写临时文件再 rename）。 */
export async function saveThread(_state: ThreadState): Promise<void> {
  throw new Error('TODO 第 2 步：原子写入 thread 文件')
}
