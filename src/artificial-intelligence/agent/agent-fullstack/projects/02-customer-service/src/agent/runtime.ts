// 运行时上下文辅助：工具通过 runtime.context 访问调用方身份
// contextSchema 定义在 Agent 层（todo 2.3），工具文件内无法静态推导，故在此收口一次边界断言
import type { ToolRuntime } from 'langchain'

/** 从工具运行时上下文读取 userId（createAgent 的 contextSchema 保证注入 userId） */
export function getUserId(runtime: ToolRuntime): string {
  return (runtime.context as { userId: string }).userId
}
