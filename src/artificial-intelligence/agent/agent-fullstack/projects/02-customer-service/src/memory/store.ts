/**
 * 长期记忆 Store
 *
 * 跨对话保存用户偏好（如 preferredContact、addressTag 等），
 * 数据按 namespace + key 组织，通过工具中的 runtime.store 读写。
 *
 * 与 Checkpointer 的分工：
 * - Checkpointer：记住"刚才说了什么"（对话历史，按 thread_id 隔离）
 * - Store：        记住"用户是谁"（业务信息，跨 thread 共享）
 *
 * MVP 使用 InMemoryStore（进程内内存），重启后数据丢失。
 *
 * --- 生产环境替换方案 ---
 *
 * 1. 安装 PostgresStore：
 *    bun add @langchain/langgraph-checkpoint-postgres
 *
 * 2. 替换为：
 *    import { PostgresStore } from '@langchain/langgraph-checkpoint-postgres/store'
 *
 *    const store = PostgresStore.fromConnString('postgresql://user:pass@localhost:5432/mydb', {
 *      index: { embed, dims: 384 },  // 如需语义搜索（选填）
 *    })
 *    await store.setup()  // 建表
 *
 * 3. createAgent({ store }) 无需改动
 */
import { InMemoryStore } from '@langchain/langgraph'

export const store = new InMemoryStore()
