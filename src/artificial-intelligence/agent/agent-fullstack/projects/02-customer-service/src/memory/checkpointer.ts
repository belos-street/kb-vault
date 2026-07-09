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
 * 默认使用 SqliteSaver（@langchain/langgraph-checkpoint-sqlite），
 * 支持持久化到文件。如果 better-sqlite3 原生模块不可用（如 Bun
 * ABI 不兼容），自动降级到 MemorySaver（内存级，进程重启后丢失）。
 */
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

/** 尝试加载 SqliteSaver，失败时降级为 MemorySaver */
async function createCheckpointer(): Promise<any> {
  try {
    const { SqliteSaver } = await import(
      '@langchain/langgraph-checkpoint-sqlite'
    )
    return SqliteSaver.fromConnString(checkpointerPath)
  } catch {
    console.warn(
      '[checkpointer] better-sqlite3 不可用，降级到 MemorySaver（内存级）。' +
        ' 设置 CHECKPOINTER_PATH=:memory: 可消除此警告。'
    )
    const { MemorySaver } = await import('@langchain/langgraph')
    return new MemorySaver()
  }
}

export const checkpointer = await createCheckpointer()
