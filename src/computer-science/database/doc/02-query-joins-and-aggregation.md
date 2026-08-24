# 02 — 查询实战：JOIN 与聚合

> 业务数据落库之后，最大的日常就是**把它查出来**。这一章讲 SELECT 的执行顺序、五种 JOIN、聚合与分组，并会带着你在第 1 章的 `users` / `products` 基础上搭一套简化订单演示数据。**目标是：任何业务查询，你能一次写对、不炸行数。**

---

## 📌 元信息

| 项目 | 内容 |
|------|------|
| **模块** | 基础层 · 第 3 篇（主线） |
| **预计时间** | 45 ~ 60 分钟 |
| **面试可答** | SELECT 的执行顺序；`HAVING` vs `WHERE`；JOIN 写错为什么行数爆炸 |

---

## 1. 先搭演示数据（本系列从这章开始有订单）

第 4 章会给订单系统设计**完整** schema，这里先用简化版把查询能力练起来——两张表加一张订单表：

```sql
CREATE TABLE orders (
  id         bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id    bigint NOT NULL REFERENCES users(id),   -- 1:N：用户 → 订单
  amount     numeric(12, 2) NOT NULL CHECK (amount >= 0),
  status     text NOT NULL DEFAULT 'paid'
             CHECK (status IN ('pending', 'paid', 'cancelled')),
  created_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO users (email, display_name, role) VALUES
  ('a@example.com', '阿明', 'user'),
  ('b@example.com', '小红', 'user'),
  ('c@example.com', '老张', 'admin');

INSERT INTO orders (user_id, amount, status) VALUES
  (1, 199.00, 'paid'),
  (1, 59.90, 'paid'),
  (2, 999.00, 'paid'),
  (2, 999.00, 'cancelled'),
  (2, 30.00, 'pending'),
  (3, 5.00,  'paid');
```

> 💡 `REFERENCES users(id)` 就是外键约束：**不允许插入不存在的 user_id**。三种关系（1:1 / 1:N / M:N）的正式设计在第 4 章，这里先感受 1:N。

---

## 2. SELECT 执行顺序心法（所有查询 BUG 的根源）

SQL 的**书写顺序**和**执行顺序**不一样。你以为是"先 SELECT 再 WHERE"，实际执行是：

```mermaid
flowchart LR
    A["FROM / JOIN<br/>(先找表、拼表)"] --> B["WHERE<br/>(过滤行)"]
    B --> C["GROUP BY<br/>(分组)"]
    C --> D["HAVING<br/>(过滤分组)"]
    D --> E["SELECT<br/>(投影/计算列)"]
    E --> F["DISTINCT<br/>(去重)"]
    F --> G["ORDER BY<br/>(排序)"]
    G --> H["LIMIT / OFFSET<br/>(截断)"]
```

三个立刻能用上的推论：

1. **WHERE 里不能使用 SELECT 里起的别名**（因为 WHERE 先执行）：
   ```sql
   -- ❌ ERROR: column "total" does not exist
   SELECT amount * 0.9 AS total FROM orders WHERE total > 100;
   -- ✅
   SELECT amount * 0.9 AS total FROM orders WHERE amount * 0.9 > 100;
   ```
2. **WHERE 在分组前过滤行，HAVING 在分组后过滤组**——`WHERE status != 'cancelled'` 和 `HAVING` 不能互相替代。
3. **理解顺序才能读懂执行计划**（第 5 章 EXPLAIN 的铺垫）。

---

## 3. 单表查询基本功

```sql
-- 条件、排序、限量
SELECT id, amount, status
FROM orders
WHERE status = 'paid'            -- 过滤行
ORDER BY amount DESC             -- 排序（DESC 降序）
LIMIT 3;                         -- 截断（OFFSET n 可跳过前 n 条，深分页坑见第 3 章）

-- 范围与匹配
SELECT * FROM orders
WHERE created_at >= now() - interval '7 days'
  AND amount BETWEEN 10 AND 500;

SELECT * FROM users WHERE email ILIKE '%example%';   -- ILIKE 不区分大小写
```

> ⚠️ `LIKE '%x%'` 带前导 `%` 无法走 btree 索引（要扫全表），小表无所谓，大表是灾难——第 5 章索引、第 11 章全文检索分别给解法。**现在记住：`%` 开头的 LIKE 会全表扫**。

---

## 4. 聚合与 GROUP BY：分组是折叠，不是拼接

`GROUP BY` 把行**折叠成组**，因此 SELECT 列表里只能出现两种列：**分组列本身**、或**聚合函数结果**。

```sql
-- 每个用户的下单次数 —— 折叠成 3 行
SELECT user_id, count(*)                      -- count : 数行数（见第 1 章 NULL 篇）
FROM orders
GROUP BY user_id;

-- HAVING 过滤"组"（在分组之后）
SELECT user_id, count(*) AS n, sum(amount) AS total
FROM orders
GROUP BY user_id
HAVING count(*) >= 2;                         -- 只看下单 ≥ 2 次的用户
```

**经典陷阱**：

```sql
-- ❌ 逻辑错：SELECT 出现了不分组、也不聚合的列
SELECT user_id, status, count(*) FROM orders GROUP BY user_id;
-- PG 会直接报错（或者按功能依赖偷偷放行），换成：
SELECT user_id, status, count(*) FROM orders GROUP BY user_id, status;
```

- **HAVING vs WHERE**：`WHERE` 在 `GROUP BY` 之前按行过滤，`HAVING` 在分组后按组过滤。**先 WHERE 能少算、多快**；HAVING 只在它"必须"时用。
- **`COUNT(*)` vs `COUNT(col)`**：`*` 数行数；`col` 数非 NULL 数量。
- **别在聚合查询里"顺便"取明细**：`GROUP BY` 之后你就看不到组内单个用户的一行行明细了。要"既分组又保留明细" = 窗口函数（第 3 章）。

---

## 5. JOIN：把多张表拼起来

- `INNER JOIN`：两边都匹配才出现（默认 JOIN 就是它）
- `LEFT JOIN`：左表全保留，右表没匹配就补 NULL（**用得最多**）
- `RIGHT JOIN`：反向的 LEFT，日常几乎用不到（改写成 LEFT 更易读）
- `FULL JOIN`：两边都全保留，取并集，用得少
- `CROSS JOIN`：笛卡尔积（一般只用来造数据）

```sql
-- 场景：列出所有订单 + 下单人邮箱 —— INNER JOIN（订单必有所属用户）
SELECT o.id, o.amount, u.email
FROM orders o
JOIN users u ON u.id = o.user_id
ORDER BY o.id;

-- 场景：每个用户的累计金额 —— LEFT JOIN，没下过单的用户也要出现（NULL）
SELECT u.email, count(o.id) AS order_cnt, COALESCE(sum(o.amount), 0) AS total
FROM users u
LEFT JOIN orders o ON o.user_id = u.id
GROUP BY u.id, u.email;
-- COALESCE(x, 0)：x 为 NULL 时兜底为 0 —— 没下过单的用户 sum 出来是 NULL，显示 0 更友好
```

**为什么 JOIN 会行数爆炸？** JOIN 是"对左边每行，找右边所有匹配行"。匹配错（比如 JOIN 错了列、或漏了 `ON` 里的一个条件让多行互相匹配）就会翻倍：

```sql
-- ❌ 事故现场：漏掉 user_id 关联条件 → 每组都交叉 → 行数翻番
SELECT * FROM orders o JOIN users u ON true;  -- 6 张订单 × 3 个用户 = 18 行

-- ✅ 常规检查法：写完先 SELECT count(*) 对一下预期
```

> 💡 心法：**JOIN 完怀疑行数变多，先想"是不是有一侧重复行被乘进去了"。** 典型：一对多的"多"表上带过滤条件，或漏了关联字段。

---

## 6. 子查询 vs CTE（WITH）

- **子查询** 适合"简单嵌套"，但层层嵌套可读性差
- **CTE（`WITH ... AS`）** 把中间结果起个名，可读性、可复用、可分层，**多步查询首选**

```sql
-- 例：找出"累计消费 > 500 的用户"，用 CTE 分两步，先聚合再过滤
WITH user_totals AS (
  SELECT user_id, sum(amount) AS total
  FROM orders
  WHERE status = 'paid'
  GROUP BY user_id
)
SELECT u.email, t.total
FROM user_totals t
JOIN users u ON u.id = t.user_id
WHERE t.total > 500
ORDER BY t.total DESC;

-- 结果：阿明 258.9（不到 500 被滤掉），小红 999
```

---

## 🎯 练习

**要求**：基于演示数据，写出并跑通下面 6 条业务查询：
1. 所有已支付订单（含用户邮箱），按金额降序；
2. **每个用户的下单总额与笔数**（含 0 单用户：LEFT JOIN 从 users 出发 + COALESCE 兜 NULL；演示数据里所有用户都有单，先自行插一个无订单用户来验证 NULL 兜底）；
3. 单笔金额最高的 3 笔订单；
4. 最近 7 天的订单数与总金额；
5. 下单 ≥ 2 次的用户列表（HAVING）；
6. 用 CTE 重写第 2 条，输出"邮箱 + 总额 + 笔数"。

**提示**：第 2、5 条注意"没下单的用户也要出现"和"分组列才能进 SELECT"；每条写完先数行数（自己确认预期再往下写）。

**预期效果**：6 条查询全部返回正确结果；你能对着 §2 的执行顺序图，给每条查询指出"先 JOIN 还是先 WHERE、HAVING 卡在哪里"。

---

## 🎤 面试问答

> **问：HAVING 和 WHERE 什么区别？**
> **答：** 执行时机不同。WHERE 在 `GROUP BY` 分组**之前**按行过滤（也适用于非聚合查询）；HAVING 在分组**之后**按组过滤（此时可用聚合结果，如 `HAVING count(*) > 2`）。能用 WHERE 就先 WHERE——早点缩小数据量。
>
> **问：JOIN 之后行数变多了，一般是什么原因？**
> **答：** JOIN 是"左侧每行 × 右侧匹配行"，行数翻倍几乎总是因为**匹配条件不唯一**：比如 JOIN 的字段在一侧有重复、或 ON 条件漏了字段造成交叉匹配。排查口径：两侧先各自查去重后的基数，再看 ON 是否确定"一对一"。
>
> **问：子查询和 CTE 怎么选？**
> **答：** 代码上 CTE 可读性、可复用更好，多步查询（先聚合再过滤）用 `WITH`；性能上两者执行计划可能等价，**但 CTE 不能假设"只算一次"**——PG 12 起，非递归且只被引用一次的 CTE 默认**内联**（等价于子查询，可被下推过滤），被多次引用或递归时才默认物化；要强制某行为用 `WITH ... AS MATERIALIZED` / `NOT MATERIALIZED` 显式控制。日常 99% 的场景选 CTE 不为过，真涉及大表性能就 `EXPLAIN` 实看。
>
> **追问：SELECT 里有别名，WHERE 里能用吗？**
> **答：** 不能。WHERE 在 SELECT **之前**执行，别名在 SELECT 阶段才产生。ORDER BY 和 HAVING **能**用别名（它们排在后边）。

---

## 🔁 对比板块：显式 JOIN vs 子查询 vs ORM 写法

| 维度 | 显式 JOIN | 子查询 / CTE | ORM（drizzle/prisma） |
|------|-----------|--------------|----------------------|
| 可读性 | 表关系看得清 | 逻辑分步清晰 | 免写 SQL，但复杂查询反而不如 SQL 直观 |
| 可调优 | 直接控制执行计划（第 5 章） | 中间结果可控 | 部分由框架生成，弱 |
| 幻觉成本 | JOIN 错了行数炸 | CTE 物化行为要懂 | 框架遮掉 SQL 细节，出事难排查 |
| 适用 | **默认姿势**（先练熟这个） | 多步骤/报表查询 | 简单 CRUD、类型安全（第 7 章） |

> 一句话：**简单 CRUD 可以交给 ORM，但"表与表怎么拼"的判断力只能靠手写 JOIN 练出来——这正是本章和下一章的使命。**

---

**下一篇：[03-window-functions-and-pagination.md](03-window-functions-and-pagination.md)** — 窗口函数与分页（后置篇：做报表、Top N、游标分页时再回看）。