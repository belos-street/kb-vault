/**
 * Checkpointer 切换（2.5）：MemorySaver（开发态）/ PostgresSaver（默认持久化）
 *
 * Spike A 结论落地：
 *   - fromConnString 直接返回实例（非 { pool, checkpointer } 包装）
 *   - 首次使用必须 await setup()（建 checkpoints 等 4 张表）
 *   - 实例自带 .end()，进程退出前必须调用，否则 pg 连接挂住进程
 *
 * 切换由环境变量 CHECKPOINTER 控制（config.ts，默认 postgres）。
 */
import { MemorySaver } from '@langchain/langgraph'
import { PostgresSaver } from '@langchain/langgraph-checkpoint-postgres'
import { config } from '../config.ts'

export interface CheckpointerHandle {
  checkpointer: MemorySaver | PostgresSaver
  /** 进程退出前收尾：Postgres 档关连接池，Memory 档为空操作 */
  close: () => Promise<void>
}

export async function createCheckpointer(): Promise<CheckpointerHandle> {
  if (config.CHECKPOINTER === 'memory') {
    return { checkpointer: new MemorySaver(), close: async () => {} }
  }

  const checkpointer = PostgresSaver.fromConnString(config.DATABASE_URL)
  await checkpointer.setup()
  return { checkpointer, close: () => checkpointer.end() }
}
