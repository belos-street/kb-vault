// 长期记忆 Store：跨对话保存用户偏好
// 开发用 InMemoryStore（进程内，重启即失）；生产可换 PostgresStore
// （@langchain/langgraph-checkpoint-postgres/store），需先 setup() 建表
import { InMemoryStore } from '@langchain/langgraph'

/** 长期记忆 Store：读写必须通过工具内 runtime.store，不能闭包引用 */
export const store = new InMemoryStore()
