# 07 — Node/TS 接入：驱动、连接池与事务封装

> 从 SQL 世界回到工程。这一章把前面所有知识装进 Bun + TypeScript：选驱动、配连接池、防注入、封装事务、最小权限建角色，最后写一个**带事务的下单扣库存 API**。**目标：你写的后端连库，既快又稳又安全。**

---

## 📌 元信息

| 项目 | 内容 |
|------|------|
| **模块** | 工程层 · 第 8 篇（主线） |
| **预计时间** | 60 ~ 75 分钟 |
| **面试可答** | 为什么必须连接池；参数化查询怎么防注入；事务怎么在应用层正确封装 |

---

## 1. 驱动选型：三个候选，一个答案

| 驱动 | 特点 | 结论 |
|------|------|------|
| **`pg`（node-postgres）** | 最老牌、生态最稳、文档全 | **主力**（本章示例用它） |
| `postgres.js` | 现代、Promise 原生、更轻 | 想要更"顺手"时的备选 |
| Bun 内置 `bun:sql` | Zero-dep | 只连 SQLite 用；PG 用上面两个 |

```bash
bun init -y && bun add pg && bun add -d @types/pg
```

> ⚠️ 兼容提示：Bun 对 node-postgres 的 `node:net` 实现支持良好；万一遇到怪问题，切 `postgres.js` 一行配置即可（本章代码只依赖"连接串 + 参数化"，两驱动通用）。

---

## 2. 连接池：为什么必须建池

回到第 0 章的知识点：**PG 一连接一进程，连接廉价不了**（默认最多 100 个）。每次请求新建连接 = 高频 fork 进程开销 + 随时打满 100。**连接池 = 复用若干条长连接**，让"建连"只发生池启动时。

```ts
// db/pool.ts —— 全项目共享这一个池
import pg from 'pg'
const { Pool } = pg

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,   // 从环境变量读，别写死在代码里
  max: 10,                                      // 池内最多 10 条连接
  connectionTimeoutMillis: 5_000,               // 拿不到连接 5 秒就报错，别无限等
  idleTimeoutMillis: 60_000,                    // 空闲超过 60s 的连接被回收
  statement_timeout: 10_000,                    // 单条 SQL 超时 10s（防慢查询拖死池）
})

// 进程退出前优雅关闭
process.on('SIGINT', async () => { await pool.end(); process.exit(0) })
```

**关键参数就 4 个**：`max` / `connectionTimeoutMillis` / `idleTimeoutMillis` / `statement_timeout`。别追求多：`max` 开太大反而互相挤占 CPU 和内存，**一般 10~30 够一个服务**（云数据库还有个位数连接上限的实例更要省）。

---

## 3. 参数化查询：SQL 注入的防线

永远用 `$1, $2` 占位符传参，**禁止字符串拼接**——这是本章唯一一条"必须背"的红线：

```ts
// ❌ 注入现场：用户输入直接拼进 SQL
const email = req.body.email  // 恶意输入: "a' OR '1'='1"
await pool.query(`SELECT * FROM users WHERE email = '${email}'`)  // 被撤库

// ✅ 参数化：值永远不会被当作 SQL 执行
const r = await pool.query('SELECT * FROM users WHERE email = $1', [email])

// ✅ 批量操作也用参数化（生成 $1..$n 占位符）
const rows = items.map((item, i) => `($1, $${i + 2})`).join(', ')
await pool.query('INSERT INTO order_items (order_id, product_id) VALUES ' + rows, [orderId, ...items])
```

> 💡 原理一句话：参数化让**数据与语句分离**——`$1` 的位置只允许被当作"值"解析，入参再"毒"也成不了语法。

---

## 4. 事务封装：单连接 + 显式 BEGIN/COMMIT

事务必须在**同一条连接**上跑（`BEGIN...COMMIT` 是会话级状态）。用池发三条 query 很可能分散到三条连接 → 白开事务。正确姿势：从池里**借一条连接**，全部语句走它：

```ts
// db/withTransaction.ts —— 通用事务包装器
import { pool } from './pool'

export async function withTransaction<T>(
  fn: (client: pg.PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect()          // 借连接
  try {
    await client.query('BEGIN')
    const result = await fn(client)            // 业务代码在这里执行
    await client.query('COMMIT')
    return result
  } catch (err) {
    await client.query('ROLLBACK')             // 任何一步出错，全盘回滚
    throw err
  } finally {
    client.release()                           // 还连接（不是断开！）
  }
}
```

> ⚠️ 两大致命操作：**忘 `release()` = 连接泄漏**（池被借光 → 全线超时）；**在事务里发 HTTP 等外部调用 = 长事务**（第 6 章：拖累 MVCC 清理 + 可能造成死锁等待窗口）。事务要短，外部调用放事务外。

---

## 5. 下单 + 扣库存：把第 6 章转成代码

```ts
// services/orderService.ts
import { withTransaction } from '../db/withTransaction'

export async function createOrder(userId: number, orderId: string) {
  return withTransaction(async (client) => {
    // 1. 扣库存（原子条件更新，第 6 章路线一）
    const deducted = await client.query(
      `UPDATE inventory SET stock = stock - 1
        WHERE product_id = $1 AND stock >= 1`,   // stock >= 1 防超卖
      [1],
    )
    if (deducted.rowCount === 0) throw new Error('库存不足')

    // 2. 建订单 + 明细（同事务，失败一起回滚）
    await client.query(
      `INSERT INTO orders (id, user_id, status) VALUES ($1, $2, 'paid')`,
      [orderId, userId],
    )
    await client.query(
      `INSERT INTO order_items (order_id, product_id, product_name, unit_price, quantity)
       VALUES ($1, $2, $3, $4, $5)`,
      [orderId, 1, '限量跑鞋', 199.00, 1],
    )
    // 3. 触发 COMMIT；任何一步抛错都会 ROLLBACK
  })
}
```

核心就一句话：**所有变更塞进 `withTransaction` 的回调里，扣库存用原子 UPDATE，失败自然回滚**——这就是"防超卖"的生产实现。

---

## 6. 最小权限：应用账号不要当超级用户

生产环境别让应用用 `postgres` 连库（第 0 章那个就是学习用）。两条角色分开：

```sql
-- 迁移角色：能改表结构（第 8 章用它跑迁移）
CREATE ROLE shop_migrator LOGIN PASSWORD 'xxx';
GRANT ALL ON SCHEMA public TO shop_migrator;

-- 应用角色：只给 DML，不给 DDL（不能让应用 drop 表）
CREATE ROLE shop_app LOGIN PASSWORD 'xxx';
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO shop_app;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO shop_app;
```

> ⚠️ 凭据管理：`DATABASE_URL` 只从环境变量/密钥管理读，**不进 git**。第 8 章还会说：改了 schema 之后要给应用角色**重新 GRANT**（新表默认没授权）。

---

## 🎯 练习

**要求**：搭一个最小 Bun + TS 项目（`bun init -y` + `pg`），实现 `GET /orders/recent`（最近 10 单，参数化查询）+ `POST /orders`（调 §5 的 `createOrder`）。用第 4 章的库验证：正常下单成功、库存为 0 时报 409。

**提示**：HTTP 用 `Bun.serve` 即可，不需要框架；路由里读 `new URL(req.url)`；错误统一返回 JSON `{ error }`。

**预期效果**：`bun run dev` 后，`curl` 两次 `POST /orders` 在库存=1 时第二次返回库存不足；`psql` 里确认没有坏数据（事务回滚生效）。

---

## 🎤 面试问答

> **问：为什么 Node 连 PG 必须用连接池？**
> **答：** PG 每连接一个进程、默认上限 100。如果每次请求新建连接，高频下进程频繁 fork、连接数秒满，服务直接打挂。池化后复用长连接，`max` 可控、闲置回收、超时有兜底——**连接资源是稀缺资源，必须池化**。
>
> **问：怎么防 SQL 注入？**
> **答：** 唯一正解是**参数化查询**（`$1` 占位 + 数组传参），让数据与语句分离；配合最小权限（应用账号只授 DML）把拖库后的损失也封住。
>
> **问：应用层事务为什么容易写错？**
> **答：** 两个高频错：**跨连接**（`BEGIN` 在连接 A、`COMMIT` 在连接 B → 根本没开事务）和**连接泄漏**（忘了 `release`）。正确姿势是"从池借单连接 + try/COMMIT、catch/ROLLBACK、finally/release"三件套。
>
> **追问：事务里能调外部 API 吗？**
> **答：** 不能。长事务拖死 MVCC 清理和并发（第 6 章），外部 API 慢一点就爆等待时间。做法：**先落库提交，再异步调外部**。

---

## 🔁 对比板块：原生 SQL vs Query Builder vs ORM

| 维度 | 原生 SQL（本章） | kysely（Query Builder） | Prisma / Drizzle（ORM） |
|------|-----------------|------------------------|-------------------------|
| 类型安全 | 手写 Row 类型 | 查询即类型推导 | 模型级全链路类型 |
| 复杂查询 | ✅ 全能力 | 接近全能力 | 弱（往往回退 raw） |
| 学习/调试成本 | 裸 SQL，最透明 | 中间 | 框架遮蔽 SQL，出事难查 |
| 迁移集成 | 手动（第 8 章有解法） | 弱 | 内置（Drizzle 强） |
| 适用 | **先练熟这个** | 中型项目想要类型又可控 | CRUD 密集 + 要迁移的生产项目 |

> 一句话：**前 6 章保证你能读懂/调优 SQL，从本章起用什么记住"框架只是生成 SQL 的工具，它不改变第 4-6 章的任何结论"**——建索引、控事务、扣库存，ORM 底下还是那套 SQL。

---

**下一篇：[08-schema-migration.md](08-schema-migration.md)** — 让 schema 演进可版本化：迁移与零停机改表。