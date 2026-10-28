/**
 * MCP 工具桥接（3.5 要验证的就是这一层）
 *
 * 子进程以当前 Bun 可执行文件拉起，cwd 固定为项目根，
 * 保证 mcp-server 里的相对路径（./data/analytics.db）与 CLI 一致。
 */
import type { DynamicStructuredTool } from '@langchain/core/tools'
import { MultiServerMCPClient } from '@langchain/mcp-adapters'
import { fileURLToPath } from 'node:url'

export interface SalesToolsHandle {
  tools: DynamicStructuredTool[]
  close: () => Promise<void>
}

export interface SalesToolsOptions {
  /** 测试注入子进程环境（如临时 ANALYTICS_DB_PATH）；生产走 .env */
  env?: Record<string, string>
}

export async function createSalesTools(
  options: SalesToolsOptions = {}
): Promise<SalesToolsHandle> {
  const client = new MultiServerMCPClient({
    // v2 默认给工具名加 server 前缀（analytics_query_sales），prompt 里用原名更直观
    prefixToolNameWithServerName: false,
    servers: {
      analytics: {
        command: process.execPath,
        args: [
          fileURLToPath(new URL('../../mcp-server/index.ts', import.meta.url))
        ],
        cwd: fileURLToPath(new URL('../..', import.meta.url)),
        transport: 'stdio',
        ...(options.env ? { env: options.env } : {})
      }
    }
  })

  try {
    const tools = await client.listTools()
    return { tools, close: () => client.close() }
  } catch (error) {
    await client.close() // listTools 失败时同样要回收子进程
    throw error
  }
}
