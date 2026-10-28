/**
 * 销售数据 MCP Server（stdio transport，单工具）
 *
 * ⚠️ stdio 纪律：stdout 只跑 JSON-RPC，所有日志必须走 console.error。
 *
 * 用法（由 mcp-adapters 以子进程方式拉起，不手工运行）：
 *   bun mcp-server/index.ts
 */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z } from 'zod'
import { config } from '@/config.ts'
import { isReadOnlySql, querySales } from '@/services/db.ts'

const server = new McpServer({ name: 'sales-mcp', version: '0.1.0' })

server.registerTool(
  'query_sales',
  {
    description: `执行只读 SQL 并返回前 ${config.SQL_MAX_ROWS} 行；仅支持单条 SELECT`,
    inputSchema: {
      sql: z.string().describe('单条 SELECT 语句（表结构见 orders / products）')
    }
  },
  async ({ sql }) => {
    if (!isReadOnlySql(sql)) {
      return {
        content: [
          {
            type: 'text',
            text: '仅允许单条 SELECT 查询；请移除写操作或多语句后重试'
          }
        ],
        isError: true
      }
    }

    try {
      const { rows, rowCount, truncated } = querySales(sql)
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ rowCount, truncated, rows }, null, 2)
          }
        ]
      }
    } catch (error) {
      return {
        content: [
          { type: 'text', text: `SQL 执行失败：${(error as Error).message}` }
        ],
        isError: true
      }
    }
  }
)

await server.connect(new StdioServerTransport())
console.error('[mcp] sales-mcp 已通过 stdio 就绪')
