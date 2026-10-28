/**
 * db:seed —— 幂等生成销售数据集（data/analytics.db）
 *
 * 两张表：orders（约 1200 行）+ products（15 个 SKU）
 * 刻意留两种坑：负金额、NULL region —— SQL Agent 必须学会防御性过滤
 *
 * 用法：bun run db:seed
 */
import { Database } from 'bun:sqlite'
import { mkdirSync, rmSync } from 'node:fs'
import { dirname } from 'node:path'
import { config } from '@/config.ts'

const REGIONS = ['华南', '华东', '华北', '西南'] as const
const CATEGORIES = ['数码', '家电', '服饰', '食品', '美妆'] as const

/** 每个品类的 3 个 SKU（名称 + 单价） */
export const PRODUCTS: { name: string; category: string; unitPrice: number }[] =
  [
    { name: '无线耳机', category: '数码', unitPrice: 499 },
    { name: '机械键盘', category: '数码', unitPrice: 399 },
    { name: '移动电源', category: '数码', unitPrice: 129 },
    { name: '空气炸锅', category: '家电', unitPrice: 599 },
    { name: '扫地机器人', category: '家电', unitPrice: 2199 },
    { name: '电风扇', category: '家电', unitPrice: 199 },
    { name: '纯棉T恤', category: '服饰', unitPrice: 89 },
    { name: '运动外套', category: '服饰', unitPrice: 329 },
    { name: '牛仔裤', category: '服饰', unitPrice: 259 },
    { name: '坚果礼盒', category: '食品', unitPrice: 129 },
    { name: '咖啡豆', category: '食品', unitPrice: 99 },
    { name: '冷冻牛排', category: '食品', unitPrice: 159 },
    { name: '精华液', category: '美妆', unitPrice: 299 },
    { name: '口红', category: '美妆', unitPrice: 179 },
    { name: '面膜', category: '美妆', unitPrice: 69 }
  ]

/** 确定性伪随机（重跑产物一致，聚合结果可断言） */
let rngState = 20260101
function rand(): number {
  rngState = (rngState * 1103515245 + 12345) % 2147483648
  return rngState / 2147483648
}

function pick<T>(list: readonly T[]): T {
  const item = list[Math.floor(rand() * list.length)]
  if (item === undefined) throw new Error('[db:seed] 随机取样越界')
  return item
}

/** 近 12 个完整月的月初日期（YYYY-MM-01），最后一月 = 上个月 */
function lastTwelveMonths(): string[] {
  const now = new Date()
  const months: string[] = []
  for (let back = 12; back >= 1; back--) {
    const d = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - back, 1)
    )
    months.push(d.toISOString().slice(0, 10))
  }
  return months
}

const dbPath = config.ANALYTICS_DB_PATH
mkdirSync(dirname(dbPath), { recursive: true })
rmSync(dbPath, { force: true }) // 幂等：每次全量重建

const db = new Database(dbPath)
db.exec('PRAGMA journal_mode = WAL')

db.exec(`
  CREATE TABLE products (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    unit_price REAL NOT NULL
  );
  CREATE TABLE orders (
    id INTEGER PRIMARY KEY,
    order_date TEXT NOT NULL,
    region TEXT,
    category TEXT NOT NULL,
    product_name TEXT NOT NULL,
    amount REAL NOT NULL
  );
  CREATE INDEX idx_orders_date ON orders(order_date);
  CREATE INDEX idx_orders_region ON orders(region);
`)

const insertProduct = db.prepare(
  'INSERT INTO products (name, category, unit_price) VALUES (?, ?, ?)'
)
const insertOrder = db.prepare(
  'INSERT INTO orders (order_date, region, category, product_name, amount) VALUES (?, ?, ?, ?, ?)'
)

db.transaction(() => {
  for (const p of PRODUCTS) insertProduct.run(p.name, p.category, p.unitPrice)

  const months = lastTwelveMonths()
  for (const month of months) {
    for (const region of REGIONS) {
      for (const category of CATEGORIES) {
        const skus = PRODUCTS.filter((p) => p.category === category)
        // 每月 × 大区 × 品类 5 单 → 12 × 4 × 5 × 5 = 1200 行
        for (let i = 0; i < 5; i++) {
          const sku = pick(skus)
          const quantity = 1 + Math.floor(rand() * 5)
          const day = 1 + Math.floor(rand() * 28)
          const orderDate = `${month.slice(0, 8)}${String(day).padStart(2, '0')}`
          insertOrder.run(
            orderDate,
            region,
            category,
            sku.name,
            Math.round(sku.unitPrice * quantity * 100) / 100
          )
        }
      }
    }
  }

  // 坑 1：负金额（退款录错方向）
  const dirtyMonth = months[months.length - 1] as string
  insertOrder.run(
    `${dirtyMonth.slice(0, 8)}05`,
    '华南',
    '数码',
    '无线耳机',
    -499
  )
  insertOrder.run(
    `${dirtyMonth.slice(0, 8)}12`,
    '华东',
    '家电',
    '空气炸锅',
    -1198
  )
  insertOrder.run(`${dirtyMonth.slice(0, 8)}20`, '华北', '美妆', '精华液', -299)

  // 坑 2：NULL region（渠道同步缺失）
  insertOrder.run(`${dirtyMonth.slice(0, 8)}08`, null, '食品', '坚果礼盒', 258)
  insertOrder.run(`${dirtyMonth.slice(0, 8)}18`, null, '服饰', '牛仔裤', 518)
})()

const stats = db
  .prepare(
    `SELECT
       count(*) AS total,
       sum(CASE WHEN amount < 0 THEN 1 ELSE 0 END) AS negative,
       sum(CASE WHEN region IS NULL THEN 1 ELSE 0 END) AS nullRegion,
       sum(CASE WHEN amount > 0 AND region IS NOT NULL THEN amount ELSE 0 END) AS cleanAmount
     FROM orders`
  )
  .get() as {
  total: number
  negative: number
  nullRegion: number
  cleanAmount: number
}

db.close()

console.log(
  `[db:seed] 完成：orders = ${stats.total}（预期 1205）｜负金额 ${stats.negative}（预期 3）｜NULL region ${stats.nullRegion}（预期 2）｜干净口径销售额 ${stats.cleanAmount.toFixed(2)}`
)
console.log(`[db:seed] 数据文件：${dbPath}`)
