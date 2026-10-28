/**
 * Spike C —— stdio MCP Server + mcp-adapters 桥接（todo.md §1）
 *
 * 验证点：子进程拉起 / listTools 可见 query_sales / callTool 能取数 / 拦截写操作
 * 用法：bun scripts/spike-c-mcp.ts
 */
import { fileURLToPath } from 'node:url'
import { MultiServerMCPClient } from '@langchain/mcp-adapters'

const projectRoot = fileURLToPath(new URL('..', import.meta.url))
const serverEntry = fileURLToPath(
  new URL('../mcp-server/index.ts', import.meta.url)
)

const client = new MultiServerMCPClient({
  // v2 默认给工具名加 server 前缀（analytics_query_sales）；本项目用原名对接 prompt
  prefixToolNameWithServerName: false,
  servers: {
    analytics: {
      // 跨平台：直接复用当前 Bun 可执行文件拉起子进程（等价于命令 bun）
      command: process.execPath,
      args: [serverEntry],
      cwd: projectRoot,
      transport: 'stdio'
    }
  }
})

try {
  const tools = await client.listTools()
  console.log(
    `[spike-c] listTools = ${tools.map((t) => t.name).join(', ')}（预期含 query_sales）`
  )

  const querySales = tools.find((t) => t.name === 'query_sales')
  if (!querySales) throw new Error('[spike-c] 未找到 query_sales 工具')

  const result = await querySales.invoke({
    sql: 'SELECT region, COUNT(*) AS orders, ROUND(SUM(amount), 2) AS sales FROM orders WHERE amount > 0 AND region IS NOT NULL GROUP BY region ORDER BY region'
  })
  console.log('[spike-c] callTool 成功：')
  console.log(result)

  try {
    await querySales.invoke({ sql: 'DELETE FROM orders' })
    console.log('[spike-c] ✗ 写操作未被拦截')
  } catch (error) {
    // adapters 把 isError 结果转成 ToolException，Agent 侧会收到错误 ToolMessage
    console.log('[spike-c] 写操作被拦截 ✓：', (error as Error).message)
  }
} finally {
  await client.close()
}
