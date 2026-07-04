/**
 * 短期记忆 Checkpointer
 *
 * 让 Agent 在多轮对话中"记住"历史上下文，无需手动维护 message[]。
 *
 * 无 checkpointer 时，每次 invoke 都是独立的，你必须自己：
 *   1. 把历史 messages 拼回去传给 Agent
 *   2. 管理每个用户的 messages 数组（多用户隔离）
 *   3. 处理进程重启后数据丢失
 *
 * 有 checkpointer 后，LangGraph 框架自动：
 *   1. 每次执行完毕将完整 Agent State 持久化到 SQLite
 *   2. 同 thread_id 的下一次 invoke 自动恢复历史状态
 *   3. 不同 thread_id 天然隔离，无需手动管理
 *
 * 底层使用 SqliteSaver（@langchain/langgraph-checkpoint-sqlite），
 * 默认存储在 ./data/checkpoints.db，可通过 CHECKPOINTER_PATH 环境变量覆盖。
 */
import { SqliteSaver } from '@langchain/langgraph-checkpoint-sqlite'
import { existsSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

const rawPath = process.env.CHECKPOINTER_PATH ?? './data/checkpoints.db'

export const checkpointerPath =
  rawPath === ':memory:' ? ':memory:' : resolve(rawPath)

if (checkpointerPath !== ':memory:') {
  const dir = dirname(checkpointerPath)
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }
}

export const checkpointer = SqliteSaver.fromConnString(checkpointerPath)
