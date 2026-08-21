# 03 — 查询进阶：窗口函数与分页

> 后置篇。本章只讲两件事：**窗口函数**（报表/分组 Top N 的终极武器）和 **keyset 分页**（大数据下列表接口不炸的姿势）。写报表、做后台列表、被"分页慢"卡过的时候再回来读这章。

---

## 📌 元信息

| 项目 | 内容 |
|------|------|
| **模块** | 基础层 · 第 4 篇（后置：用到再看） |
| **预计时间** | 45 ~ 60 分钟 |
| **面试可答** | 窗口函数 vs GROUP BY；OFFSET 深分页为什么慢；游标分页怎么写 |

---

## 1. 窗口函数：不丢行明细的"分组"

`GROUP BY` 一分组，明细行就折叠没了。**窗口函数（`OVER`）让你又能分组、又能保留每一行原始记录**——它是"在每一行旁边挂一列"分组的计算结果。

语法一句话：`函数() OVER (PARTITION BY 组 ORDER BY 排)`，OVER 里的东西决定了"窗口"的形状。

```sql
-- 场景：给每个用户的订单按金额从高到低编号（1 = 该用户最大单）
SELECT u.id AS user_id, o.id AS order_id, o.total_amount,
       ROW_NUMBER() OVER (PARTITION BY u.id ORDER BY o.total_amount DESC) AS rn
FROM users u JOIN orders o ON o.user_id = u.id
ORDER BY u.id, rn;

-- 场景：分组 Top N —— 每个用户金额最大的前 2 单
WITH ranked AS (
  SELECT u.id AS user_id, o.total_amount,
         ROW_NUMBER() OVER (PARTITION BY u.id ORDER BY o.total_amount DESC) AS rn
  FROM users u JOIN orders o ON o.user_id = u.id
)
SELECT * FROM ranked WHERE rn <= 2;
```

**三件套怎么选**（对金额相同的行）：

| 函数 | 结果 | 语义 |
|------|------|------|
| `ROW_NUMBER()` | 1,2,3,4 | 严格不重复，就是"第几行" |
| `RANK()` | 1,1,3,4 | 并列占位（两个第一后直接第三） |
| `DENSE_RANK()` | 1,1,2,3 | 并列不占位（两个第一后是第二） |

**还有两个高频亲戚**（且不基于排名）：

```sql
-- LAG/LEAD：看"隔壁行"，环比/复购间隔就靠它
SELECT created_at::date AS day,
       LAG(total_amount) OVER (ORDER BY created_at) AS prev_amount,   -- 上一行
       total_amount                                                 AS cur_amount
FROM orders
ORDER BY day;

-- SUM 累计/移动平均（OVER 加 ORDER BY = 累加窗口）
SELECT date_trunc('month', created_at) AS month,
       sum(total_amount) OVER (ORDER BY date_trunc('month', created_at)) AS running_total
FROM orders
```

> 💡 记忆口决：**窗口函数 = "分组的聚合/排名"但不删行**。`PARTITION BY` 决定组，`ORDER BY` 决定组内顺序/累加方向。

---

## 2. 分页三式：OFFSET 到大数据的拐点

### 2.1 LIMIT/OFFSET——简单但会退化

```sql
SELECT * FROM orders ORDER BY created_at DESC LIMIT 20 OFFSET 1000;
```

OFFSET 的语义是"跳过前 1000 行"——PG 必须先**扫描并丢弃**这 1000 行再取 20 行。页数越深，扫描越多：`OFFSET 100000` 就要先扫 10 万行。**深分页 = 必然变慢**。

> ⚠️ 另一个坑：排序不稳定。`ORDER BY created_at` 遇到相同时间，返回顺序不定，翻页会出现"重复/漏行"。必须加唯一列做 tie-breaker：`ORDER BY created_at, id`。

### 2.2 keyset 分页（游标分页）——生产主选

不给"页码"，给"上一页最后一条的位置"（游标），SQL 直接定位：

```sql
-- 每页 20 条，客户端传来上一页最后一条 (created_at, id)
SELECT * FROM orders
WHERE (created_at, id) < ($1, $2)          -- 行比较：比上页最后一条更早
ORDER BY created_at DESC, id DESC
LIMIT 20;
```

- 无 OFFSET → 不扫废行 → **深翻页复杂度稳定 O(页大小)**；
- 适合**顺序/瀑布流**（微博、订单列表、日志），不适合"跳到第 57 页"这种中间页需求；
- tie-breaker 天然由唯一列 `id` 承担。

```ts
// 服务端返回 nextCursor，前端拿它请求下一页
const { rows } = await pool.query(
  `SELECT * FROM orders
    WHERE (created_at, id) < ($1::timestamptz, $2::bigint)
    ORDER BY created_at DESC, id DESC LIMIT 20`,
  [cursor.createdAt, cursor.id],
)
const nextCursor = rows.at(-1)  // 最后一条即下一页游标
```

### 2.3 什么时候用哪种

| 需求 | 方案 |
|------|------|
| 小表、后台内部、页码跳转 | LIMIT/OFFSET 够了 |
| 用户可见列表、数据可能涨 | **keyset** |
| 需要"数据库无关"的通用接口 | 妥协：OFFSET + 阈值截断 |

---

## 3. DISTINCT ON：每组取一条（PG 特色）

"每个用户最近一单"用窗口函数 + 子查询能写，PG 有更短的 `DISTINCT ON`：

```sql
SELECT DISTINCT ON (user_id) user_id, id, total_amount, created_at
FROM orders
ORDER BY user_id, created_at DESC;   -- 每组按此取第一行
```

> 💡 语义 ="**每个 (user_id) 组内按 ORDER BY 取第一条**"，比窗口写法的子查询版本短一截。注意它不是标准 SQL（PG 方言），跨库时回退窗口写法。

---

## 🎯 练习

**要求**（基于第 4 章库）：
1. 用窗口函数写「每个用户最近 2 笔订单」；
2. 用 `SUM() OVER (ORDER BY date_trunc('month', created_at))` 画月度累计 GMV；
3. 造 2 万行订单，对比 `LIMIT/OFFSET` 第 1000 页与 keyset 第 1000 页的执行时间（EXPLAIN ANALYZE）。

**提示**：造数用第 5 章的 `generate_series`；keyset 需要 (created_at, id) 的排序索引才最快——`CREATE INDEX orders_keyset_idx ON orders (created_at DESC, id DESC)`。

**预期效果**：第 1、2 题结果正确；第 3 题 OFFSET 页 cost 随页数涨、keyset 页 cost 恒定——**用数据说服自己"为什么该用游标"**。

---

## 🎤 面试问答

> **问：窗口函数和 GROUP BY 有什么区别？**
> **答：** GROUP BY 把多行折叠成一行（分组聚合）；窗口函数在**每一行旁边**附加该行的组内聚合/排名，行不丢失。需要"既要累计/排名、又保留明细"时就是窗口函数的主场。
>
> **问：OFFSET 深分页为什么慢？怎么解决？**
> **答：** OFFSET 跳行靠扫描丢弃——跳到 10 万行之前要先把 10 万行都扫一遍，页越深越慢。解法是**keyset 分页**（`WHERE (created_at, id) < (游标)`），没有 OFFESET 就没有废扫描，深度无关。代价是不支持随机跳页，还要唯一列做 tie-breaker。
>
> **追问：keyset 分页为什么排序必须加唯一列？**
> **答：** 有相同排序键的行之间顺序不定，翻页时"前页的边界"和下页起点对不齐，就会漏行/重复。加唯一列 `id` 作为次级排序，保证全序稳定。

---

## 🔁 对比板块：OFFSET vs keyset vs 三方分页库

| 维度 | OFFSET | keyset（游标） | 三方库（typeorm 等内置） |
|------|--------|----------------|--------------------------|
| 深翻页性能 | 递增衰减 | 恒定 | 一般映射到 OFFSET |
| 随机跳页 | ✅ | ❌（只能顺序翻） | ✅ |
| 实现复杂度 | 零 | 一个 WHERE + 游标字段 | 几乎零 |
| 适用 | 后台小页 | **用户列表/Feed** | 原型期 |

> 一句话：**用户能看到的列表、且可能变大 → keyset；否则 OFFSET。**

---

**下一篇**（主线续）：[04-data-modeling.md](04-data-modeling.md)（04 之后可随时回读本页组装技能）；第 13 章的"列表接口游标分页"会调用本页结论。