# 13 — 综合实战：订单后端交付

> 收官篇。把全系列组装成一个**能跑、有性能保障、可交付**的订单后端：schema（04）→ 索引（05）→ 事务扣库存（06/07）→ 迁移（08）→ 游标分页（03）→ 备份脚本（10）→ 语义搜索（12）。**目标是跑通端到端，并用压测验证"不超卖、列表不深翻页、语义搜得到"。**

---

## 📌 元信息

| 项目 | 内容 |
|------|------|
| **模块** | 实战层 · 第 14 篇（主线收官） |
| **预计时间** | 90 ~ 120 分钟（分两次也可） |
| **面试可答** | 把一个后端从零交付的工程骨架；关键设计（幂等/事务/索引/分页）为什么这么定 |

---

## 1. 项目骨架（Bun + strict TS，按仓库规范）

```text
order-backend/
├── bun.lock / package.json / tsconfig.json    # strict: true
├── .oxlintrc.json / .oxfmtrc.jsonc           # 仓库 lint/format 基准
├── migrations/                                # drizzle-kit 生成，只增不改
├── scripts/
│   ├── backup.sh                              # pg_dump 每日备份（第 10 章）
│   └── migrate.sh                             # 迁移 + 应用角色授权（第 8 章）
└── src/
    ├── index.ts          # Bun.serve 入口 + 路由
    ├── db/
    │   ├── pool.ts       # 连接池（07）
    │   └── withTransaction.ts  # 事务封装（07）
    ├── repos/            # 仓储层：orders / products / search（13）
    └── services/         # 业务：createOrder（幂等）+ 扣库存（06）
```

```bash
bun init -y
bun add pg openai pgvector/pg drizzle-orm
bun add -d typescript drizzle-kit oxlint oxfmt
bun run migrate.sh && bun run dev
```

---

## 2. 核心交付清单（对号入座前面章节）

### 2.1 下单接口：事务 + 原子扣库存 + 幂等

直接复用 `07` 的 `withTransaction` 与 `06` 的原子 UPDATE，**只补一块：幂等**。

```ts
// services/orderService.ts —— 第 7 章事务封装 + 幂等键
export async function createOrder(userId: number, orderId: string, items: CartItem[]) {
  return withTransaction(async (client) => {
    // 幂等：同一 orderId 重复提交直接返回已存在（防止客户端重试产生两笔）
    const dup = await client.query('SELECT 1 FROM orders WHERE id = $1', [orderId])
    if (dup.rowCount) return { id: orderId, duplicate: true }

    // 扣库存：逐件原子扣，任一失败即回滚（不可部分成功）
    for (const it of items) {
      const r = await client.query(
        `UPDATE inventory SET stock = stock - $2
          WHERE product_id = $1 AND stock >= $2`, [it.productId, it.quantity],
      )
      if (!r.rowCount) throw new Error('库存不足: ' + it.productId)
    }
    // 建单 + 明细（快照名/价，第 4 章）
    const total = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0)
    await client.query(
      `INSERT INTO orders (id, user_id, status, total_amount)
       VALUES ($1, $2, 'paid', $3)`, [orderId, userId, total])
    for (const it of items) {
      await client.query(
        `INSERT INTO order_items (order_id, product_id, product_name, unit_price, quantity)
         VALUES ($1, $2, $3, $4, $5)`,
        [orderId, it.productId, it.name, it.unitPrice, it.quantity])
    }
    return { id: orderId }
  })
}
```

**为什么这么定**：幂等键（orderId 由客户端/API 网关生成）挡重复提交；`stock >= quantity` 原子拦截超卖；失败整单回滚——三件事各自对上了第 4/6/7 章。

### 2.2 列表接口：游标分页（第 3 章结论）

```ts
// repos/orders.ts
export async function listOrders(cursor: { t: string; id: string }, limit = 20) {
  const { rows } = await pool.query(
    `SELECT id, user_id, status, total_amount, created_at
       FROM orders
      WHERE (created_at, id) < ($1::timestamptz, $2::uuid)   -- keyset
      ORDER BY created_at DESC, id DESC
      LIMIT $3`,
    [cursor.t, cursor.id, limit])
  return { rows, next: rows.at(-1) }   // next 即下一页游标
}
```

### 2.3 语义搜索接口（第 12 章）

```ts
// repos/search.ts —— 输入一句话 → Top 5 相似商品
// 依赖：pgvector/pg 的 toSql（见第 12 章 §5）
export async function searchProducts(q: string, limit = 5) {
  const vec = await embed(q)                                 // 文本 → 1536 维向量
  const { rows } = await pool.query(
    `SELECT name, price, 1 - (embedding <=> $1) AS similarity
       FROM products WHERE is_on_sale = true
      ORDER BY embedding <=> $1 LIMIT $2`,
    [pgvector.toSql(vec), limit])
  return rows
}
```

### 2.4 备份 + 迁移脚本（第 8/10 章产物）

```bash
# scripts/backup.sh —— 每日逻辑备份（开发/自建场景）
pg_dump -h "$PGHOST" -U shop_app -d shop -Fc -f "backup/shop-$(date +%F).dump"
# 生产建议：云托管自动备份 + PITR 开箱（第 10 章）

# scripts/migrate.sh —— 迁移 + 顺手补授权（新表默认无权限的坑，第 8 章）
bunx drizzle-kit migrate
psql "$DATABASE_URL" <<'SQL'
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO shop_app;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO shop_app;
SQL
```

---

## 3. 收尾验证：压测把"结论"变成"数据"

```ts
// scripts/stress.ts —— 30 并发各下一单，验证库存不透支
const totalStock = Number((await pool.query('SELECT stock FROM inventory WHERE product_id = 1')).rows[0].stock)
const hits = await Promise.all(Array.from({ length: 30 }, (_, i) =>
  fetch('http://localhost:3000/orders', {
    method: 'POST', body: JSON.stringify({ orderId: crypto.randomUUID(), items: [{ productId: 1, quantity: 1 }] }),
  }).then(r => r.status)))
const paid = hits.filter(s => s === 201).length
const left = Number((await pool.query('SELECT stock FROM inventory WHERE product_id = 1')).rows[0].stock)
console.log({ 预期成功: totalStock, 实际成功: paid, 剩余库存: left })  // 三者对得上 = 不超卖
```

**验收清单**（对着大纲完成标准逐条勾）：

- [ ] 迁移可管理：`migrations/` 全是 SQL、能上能下（08）
- [ ] 并发不超卖：压测下单数与库存减量一致（06+07）
- [ ] 列表不深翻页：游标分页，页深 cost 恒定（03）
- [ ] 语义可搜索：一句话返回 Top 5 相似商品（12）
- [ ] 慢查询有闭环：`EXPLAIN` 验证索引落地（05+09）
- [ ] 备份能恢复：`backup.sh` + 恢复演练记录（10）

---

## 🎯 练习（本系列最终练习）

**要求**：按 §1 搭出项目骨架，把 §2 的四个交付清单全部实现；跑通「下单 → 查列表 → 语义搜索」三个接口；用 ×3 的 §3 压测脚本跑 3 组数据。

**提示**：先 `schema.sql` + 迁移把库铺好，再写 repo 层做纯 SQL 调通，最后接路由；语义搜索先用手工向量验证管道，再接真 Embedding。

**预期效果**：`bun run dev` 一个命令起服务；压测 3 组均"成功数 + 剩余库存 = 初始库存"；找一个"跑步鞋"相关的句子，Top 5 里出现了跑鞋而非沙发——**本系列到这里的全部技能，你已经闭环交付过一次了**。

---

## 🎤 面试问答

> **问：下单接口的幂等键为什么放在客户端/网关生成，而不是服务端生成？**
> **答：** 幂等键要能区分"同一次请求的重试"和"两次独立的下单"。服务端生成的话，第一次请求超时时客户端根本不知道订单号，重试又会生成新号 → 产生两笔。客户端生成 orderId，重传同一个 id，服务端 `SELECT 1 FROM orders WHERE id=$1` 命中即直接返回，把"重复提交"消化在数据库一层。
>
> **问：怎么用压测证明"没有超卖"这件事？**
> **答：** 关键是对账三数：**预期成功数（初始库存）、实际成功数（2xx 响应数）、剩余库存**，三者满足"预期成功 = 实际成功 = 初始 - 剩余"才成立。这也是把第 6 章"原子扣库存"和第 7 章"事务封装"落到可验证的验收标准上——比"看起来没报错"严格得多。
>
> **追问：为什么幂等检查要在同一个事务里做？**
> **答：** 若幂等检查在事务外，两个并发请求可能同时通过"查无此单"，然后各自进事务下两笔单——幂等形同虚设。检查与插入同事务 + 唯一主键约束双保险，并发下才会互斥。

---

## 🔁 对比板块：裸 Bun + SQL vs 引入框架/ORM

| 维度 | 本方案（Bun + 原生 SQL） | 上框架（NestJS/Fastify） | 上 ORM（Prisma/Drizzle） |
|------|------------------------|--------------------------|--------------------------|
| 心智负担 | 全是 SQL，唯一真相源 | 框架规范 + 中间件 | 类型安全 + 隐藏 SQL |
| 组合复杂度 | 最低（几十行起） | 中 | 中 |
| 何时升级 | 本项目标配 | 项目大了要路由/DI/校验 | CRUD 密集要类型后 |
| 迁移/事务 | 原生可控 | 同 | Drizzle 顺手 |

> 一句话：**先用"裸 SQL + 分层"把数据库能力练到能自己兜底，再引入框架/ORM 提升效率**——框架是工具，不是真相源（07 结尾已立此论）。本项目就是"先控住底层"的样板。

---

## 🎓 收官复盘：把 12 章连成一张地图

| 你遇到的需求 | 回看章节 | 一句话解 |
|-------------|---------|---------|
| 数据怎么落库、存得对 | 01 | 建表 + 类型 + 约束 |
| 查询怎么写不炸 | 02 → 03 | 执行顺序 + JOIN/聚合 → 窗口/游标 |
| 表怎么设计 | 04 | 实体关系 + 快照 + 通用列 |
| 越来越慢了 | 05 → 09 | 索引 + EXPLAIN → 排障流程 |
| 并发写会错吗 | 06 → 07 | 隔离级别/MVCC → 原子扣库存 + 事务封装 |
| 改表怕出事故 | 08 | 迁移文件 + 零停机套路 |
| 数据丢了 | 10 | 备份分层 + 演练 |
| 异构/搜索/向量 | 11 → 12 | JSONB/GIN → 语义检索 + 边界 |

> 最后一句：**数据库不是"数据库工程师"的专属，它是后端的第一技术债**。这套 schema 继续演进时，回看对应章节即可——大纲即目录，本系列到此收官。

---

**系列入口**：[database-learning-outline.md](../database-learning-outline.md)