/**
 * MCP 桥接集成测试：拉起真实 stdio 子进程，验证 listTools + query_sales
 */
import { afterAll, describe, expect, it } from 'bun:test'
import { Database } from 'bun:sqlite'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createSalesTools } from '@/services/mcp.ts'

const dir = await mkdtemp(join(tmpdir(), '03-mcp-'))
const dbPath = join(dir, 'analytics.db')
const db = new Database(dbPath)
db.run('CREATE TABLE orders (id INTEGER PRIMARY KEY, amount REAL)')
db.run('INSERT INTO orders (amount) VALUES (10), (20)')
db.close()

const childEnv = Object.fromEntries(
  Object.entries(process.env).filter(([, value]) => value !== undefined)
) as Record<string, string>
childEnv.ANALYTICS_DB_PATH = dbPath

afterAll(async () => {
  await rm(dir, { recursive: true, force: true })
})

describe('MCP query_sales', () => {
  it('listTools 可见 query_sales，且能取数', async () => {
    const handle = await createSalesTools({ env: childEnv })
    try {
      expect(handle.tools.map((tool) => tool.name)).toContain('query_sales')
      const tool = handle.tools[0]
      if (!tool) throw new Error('query_sales 未加载')
      const raw = await tool.invoke({
        sql: 'SELECT COUNT(*) AS cnt FROM orders'
      })
      const result = JSON.parse(String(raw)) as {
        rows: { cnt: number }[]
      }
      expect(result.rows[0]?.cnt).toBe(2)
    } finally {
      await handle.close()
    }
  })
})
