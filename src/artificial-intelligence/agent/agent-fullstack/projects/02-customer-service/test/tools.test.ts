/**
 * 四工具单测（todo §3.6）：Zod 拒绝非法入参 / 跨用户被拒 / returnDirect 生效 /
 * 不可退订单返回原因（不抛异常路径）
 *
 * 依赖本地 PostgreSQL（bun run db:up && bun run db:seed）。
 * 退款成功路径会改库：beforeAll 把 SO-2026-0812 的签收时间钉在 6 天前
 * （防 seed 相对时间戳跨天漂移出 7 天窗口），afterAll 复原全部改动并收连接池。
 */
import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import { Client } from 'pg'
import { config } from '../src/config.ts'
import { closePool, getOrderById } from '../src/services/db.ts'
import { checkRefundable } from '../src/services/order-service.ts'
import {
  createTicket,
  processRefund,
  queryOrder,
  searchPolicy
} from '../src/agent/tools/index.ts'

const U001 = { context: { userId: 'u_001' } }
const U002 = { context: { userId: 'u_002' } }

const DEMO_ORDER = 'SO-2026-0812'
let originalDeliveredAt: Date | null = null

async function withClient(
  run: (
    sql: (text: string, values?: unknown[]) => Promise<unknown>
  ) => Promise<void>
): Promise<void> {
  const client = new Client({ connectionString: config.DATABASE_URL })
  await client.connect()
  try {
    await run((text, values) => client.query(text, values))
  } finally {
    await client.end()
  }
}

beforeAll(async () => {
  // 前置检查：库不在或没 seed 时给出可执行提示，而不是让断言莫名失败
  const demo = await getOrderById(DEMO_ORDER)
  if (!demo) {
    throw new Error('种子数据缺失：请先 bun run db:up && bun run db:seed')
  }
  originalDeliveredAt = demo.delivered_at
  // 防时间漂移：seed 的 delivered_at 是 now()-6days 相对时间戳，跨天后
  // 会滑出 7 天无理由窗口导致退款用例失败——用例自钉签收时间为 6 天前
  await withClient(async (sql) => {
    await sql(
      `UPDATE orders SET delivered_at = now() - INTERVAL '6 days'
       WHERE order_id = $1`,
      [DEMO_ORDER]
    )
  })
})

afterAll(async () => {
  // 复原退款成功用例的全部改动（状态/原因/签收时间）并清理测试工单
  await withClient(async (sql) => {
    await sql(
      `UPDATE orders SET status = '已签收', refund_reason = NULL, delivered_at = $2
       WHERE order_id = $1`,
      [DEMO_ORDER, originalDeliveredAt]
    )
    await sql(`DELETE FROM tickets WHERE summary = '工具单测工单'`)
  })
  // 收 db.ts 模块级连接池（Spike A 纪律：否则 pg 连接挂住测试进程）
  await closePool()
})

describe('Zod 入参校验', () => {
  it('order_id 传数字被拒（工具层抛出解析错误）', async () => {
    await expect(
      queryOrder.invoke({ order_id: 123 as never })
    ).rejects.toThrow()
  })

  it('process_refund 缺 reason 被拒', async () => {
    await expect(
      processRefund.invoke({ order_id: 'SO-2026-0812' } as never)
    ).rejects.toThrow()
  })

  it('create_ticket 的 type 只接受枚举值', async () => {
    await expect(
      createTicket.invoke({ type: 'hacker', summary: 'x' } as never)
    ).rejects.toThrow()
  })
})

describe('权限约束（runtime.context.userId）', () => {
  it('查他人订单被拒', async () => {
    // SO-2026-0760 属于 u_002，u_001 查询 → 拒绝且不泄露订单内容
    const out = await queryOrder.invoke({ order_id: 'SO-2026-0760' }, U001)
    expect(out).toContain('无权')
    expect(out).not.toContain('运动水壶')
  })

  it('本人订单可查（正向对照，防误伤）', async () => {
    const out = await queryOrder.invoke({ order_id: 'SO-2026-0760' }, U002)
    expect(out).toContain('运动水壶')
  })

  it('退他人订单被拒', async () => {
    const out = await processRefund.invoke(
      { order_id: 'SO-2026-0702', reason: '单测' },
      U001
    )
    expect(out).toContain('无权')
  })

  it('create_ticket 只能给自己建单（入参无 user_id，结构上隔离）', async () => {
    const out = await createTicket.invoke(
      { type: 'complaint', summary: '工具单测工单' },
      U001
    )
    expect(out).toContain('TK-')
    // 落库归属校验：工单 user_id 必须来自 context 而非模型编造
    const { listTickets } = await import('../src/services/db.ts')
    const tickets = await listTickets()
    const mine = tickets.find((t) => t.summary === '工具单测工单')
    expect(mine?.user_id).toBe('u_001')
  })

  it('缺 context 时工具不执行', async () => {
    const out = await queryOrder.invoke({ order_id: 'SO-2026-0812' })
    expect(out).toContain('缺少用户身份')
  })
})

describe('returnDirect', () => {
  it('仅 query_order 开启（确定性结果直传用户）', () => {
    expect(queryOrder.returnDirect).toBe(true)
    expect(searchPolicy.returnDirect).toBe(false)
    expect(processRefund.returnDirect).toBe(false)
    expect(createTicket.returnDirect).toBe(false)
  })
})

describe('错误处理：返回原因不抛异常', () => {
  it('订单不存在 → 「未找到」', async () => {
    const out = await queryOrder.invoke({ order_id: 'SO-9999-9999' }, U001)
    expect(out).toContain('未找到')
  })

  it('已发货订单不可退 → 返回原因且状态不变', async () => {
    const before = await getOrderById('SO-2026-0755')
    expect(before?.status).toBe('已发货')

    const out = await processRefund.invoke(
      { order_id: 'SO-2026-0755', reason: '单测' },
      U001
    )
    expect(out).toContain('不可退款')
    expect(out).toContain('在途')

    const after = await getOrderById('SO-2026-0755')
    expect(after?.status).toBe('已发货')
  })

  it('退款中订单不可重复退', async () => {
    const out = await processRefund.invoke(
      { order_id: 'SO-2026-0833', reason: '单测' },
      U001
    )
    expect(out).toContain('已有退款在处理')
  })
})

describe('退款成功路径（数据落库）', () => {
  it('签收 6 天的 SO-2026-0812 可退 → 状态变「退款中」', async () => {
    const out = await processRefund.invoke(
      { order_id: 'SO-2026-0812', reason: '七天无理由' },
      U001
    )
    expect(out).toContain('退款中')

    const order = await getOrderById('SO-2026-0812')
    expect(order?.status).toBe('退款中')
    expect(order?.refund_reason).toBe('七天无理由')
  })
})

describe('order-service：checkRefundable 纯代码判定', () => {
  it('now 可注入：签收 8 天前判超期（不依赖真实时钟）', () => {
    const order = {
      status: '已签收',
      delivered_at: new Date('2026-09-01T00:00:00Z')
    } as unknown as Parameters<typeof checkRefundable>[0]

    const late = checkRefundable(order, new Date('2026-09-10T00:00:00Z'))
    expect(late.ok).toBe(false)
    expect(late.reason).toContain('7 天')

    const fresh = checkRefundable(order, new Date('2026-09-05T00:00:00Z'))
    expect(fresh.ok).toBe(true)
  })
})
