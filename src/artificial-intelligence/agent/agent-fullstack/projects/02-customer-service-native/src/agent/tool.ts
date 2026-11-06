/**
 * 工具协议：只描述"一个工具长什么样"，不包含任何业务。
 *
 * 作用
 * - 定义 ToolDefinition 与请求体映射，循环层只依赖这个协议。
 * - 具体工具在 business/tools.ts 里构造；它们通过闭包持有订单、用户等依赖，
 *   所以这里的 run 只接收 args，agent 层完全不认识业务数据。
 *
 * 边界
 * - 这个文件里不出现 Order / Ticket / 订单号等业务词。
 */
export interface ToolDefinition {
  name: string
  description: string
  /** 给模型看的 JSON Schema，只随请求下发，不参与本地调用 */
  parameters: Record<string, unknown>
  /** 重试策略用：写操作不能重试 */
  idempotent: boolean
  /** 第 6 步用：写操作执行前必须挂起审批 */
  requiresApproval: boolean
  run(args: Record<string, unknown>): Promise<unknown>
}

export interface OpenAiTool {
  type: 'function'
  function: {
    name: string
    description: string
    parameters: Record<string, unknown>
  }
}

/** 第 1 步：把 ToolDefinition[] 转成请求体里的 tools 数组。 */
export function toOpenAiTools(_list: ToolDefinition[]): OpenAiTool[] {
  throw new Error('TODO 第 1 步：映射成 { type: "function", function: {...} }')
}
