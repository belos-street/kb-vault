/**
 * db:seed —— 幂等初始化订单 / 工单库（执行 db/schema.sql）
 *
 * schema.sql 内置 DROP TABLE IF EXISTS，重跑即全量重建；
 * 只动 orders / tickets 两张业务表，LangGraph checkpoint 表不受影响。
 *
 * 用法：bun run db:seed
 */
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Client } from 'pg'
import { config } from '../src/config.ts'

const here = dirname(fileURLToPath(import.meta.url))

const client = new Client({ connectionString: config.DATABASE_URL })
await client.connect()
try {
  await client.query(readFileSync(join(here, 'schema.sql'), 'utf8'))

  const counts = await client.query<{
    orders: string
    signed: string
    no_tracking: string
    contradiction: string
  }>(`
    SELECT
      count(*)::text AS orders,
      count(*) FILTER (WHERE status = '已签收')::text AS signed,
      count(*) FILTER (WHERE status = '已发货' AND tracking_number IS NULL)::text AS no_tracking,
      count(*) FILTER (WHERE status = '已签收' AND created_at > now() - INTERVAL '2 days')::text AS contradiction
    FROM orders
  `)
  const row = counts.rows[0]
  if (!row) throw new Error('[db:seed] 种子校验查询未返回行')
  console.log(
    `[db:seed] 完成：orders = ${row.orders}（预期 20）｜已签收 ${row.signed}｜坑 A 缺物流单号 ${row.no_tracking}（预期 1）｜坑 B 状态矛盾 ${row.contradiction}（预期 1）；tickets 已重建为空`
  )
} finally {
  await client.end()
}
