# 02 · 数据与 FAQ 底座：固定事实，评估才稳定

> 对应 [todo.md](../todo.md) §2。产出：订单/工单库 + pg 访问层 + Checkpointer 切换 + 政策 FAQ 语料。
> 前置：[01 · 本地基建与 Spike](./01-本地基建与-spike.md)。启下：[03 · FAQ 检索与四工具](./03-faq-检索与四工具.md)。

## 这一步做了什么

| 工作项 | 产出 | 一句话作用 |
| ------ | ---- | ---------- |
| 建表 + 种子 | `db/schema.sql` | orders 20 条 + 空 tickets 表，两个「数据坑」在 SQL 层落 |
| 幂等初始化 | `db/seed.ts` | 执行 DDL + 种子，可重复跑 |
| pg 访问层 | `src/services/db.ts` | orders / tickets 的参数化查询（工具层不写 SQL） |
| Checkpointer 切换 | `src/memory/checkpointer.ts` | MemorySaver（开发）/ PostgresSaver（默认） |
| 政策语料 | `kb/policy-faq.json` | 10+ 条 {关键词数组, 标准答案, 出处} |

## 承上：为什么数据先行

01 项目的 Mock 思想在这里延续：**数据固定，Few-shot 示例和评估用例的期望输出才能稳定**。
5 个固定用户 × 各 4 单，全部时间戳用 `now() - INTERVAL` 相对偏移——
「已签收 6 天」「7 天无理由窗口内」的语义不会随重跑时间漂移。

## 关键设计逐个看

### 1. 两个刻意的数据坑（考察 Agent 是否如实告知）

```sql
-- 坑 A：SO-2026-0702 已发货但 tracking_number 为 NULL（缺物流单号）
-- 坑 B：SO-2026-0950 created_at 昨天，状态却已是「已签收」（状态矛盾）
```

这不是数据错误，是**测试素材**：Agent 快照只如实呈现字段，矛盾由模型结合政策如实转告
（「单号还在录入中」），不编造圆场——评估用例会断言这一点。

### 2. checkpointer.ts：把 Spike A 结论封装掉

```typescript
export async function createCheckpointer(): Promise<CheckpointerHandle> {
  if (config.CHECKPOINTER === 'memory') {
    return { checkpointer: new MemorySaver(), close: async () => {} }
  }
  const checkpointer = PostgresSaver.fromConnString(config.DATABASE_URL)
  await checkpointer.setup() // Spike A 结论：首次必须建表
  return { checkpointer, close: () => checkpointer.end() } // Spike A 结论：退出前 end()
}
```

`CHECKPOINTER` 环境变量一键切换：开发调试用 memory（零依赖、重启即失），
默认 postgres（杀进程 `--resume` 能接住）。`close` 与 `checkpointer` 成对交付，
调用方不可能忘记收连接池。

### 3. policy-faq.json：与 Few-shot、评估共用同一套事实

每条 `{ id, keywords, answer, source }`——`source` 是《售后服务政策》v3.2 §1.1 这类
**可核对的出处**，客服回答带出处、评估用例按出处关键词断言，三方对齐同一套事实。

## 踩坑记录

**测试多文件共享 pg 连接池**：`db.ts` 的模块级单例 Pool 被多个测试文件的 `afterAll`
调用 `closePool()` 会互相踩（「Cannot use a pool after calling end」「end twice」）。
解法：连接池**懒创建 + 幂等 close + close 后自动重开**——

```typescript
let pool: Pool | null = null
function getPool(): Pool {
  if (!pool) pool = new Pool({ connectionString: config.DATABASE_URL })
  return pool
}
export async function closePool(): Promise<void> {
  const current = pool
  pool = null
  await current?.end()
}
```

## 验证方式

```bash
bun run db:up && bun run db:seed   # 可重复执行（幂等）
bun test test/faq.test.ts          # §3 铺完检索后回填
```

## 启下：为下一步铺垫什么

`services/db.ts` 是四工具的唯一数据出口（§3 的工具只做编排不写 SQL）；
`kb/policy-faq.json` 等着 §3 的关键词检索来命中；两个数据坑留给 §4 之后的
评估用例（Agent 是否如实转告矛盾）。下一步把 FAQ 检索和四个工具铺出来。
