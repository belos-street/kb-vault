# 05 — 索引原理与 EXPLAIN

> 数据量上来后，查询为什么慢、怎么让它快。这一章讲 B+Tree 的直觉、六类索引分别什么时候用、复合/覆盖/部分索引怎么落地，并用 `EXPLAIN ANALYZE` 完成一次真实的慢查询优化闭环。**目标：任何慢查询，你能自己判断该不该建索引、建什么索引。**

---

## 📌 元信息

| 项目 | 内容 |
|------|------|
| **模块** | 核心层 · 第 6 篇（主线） |
| **预计时间** | 60 ~ 75 分钟 |
| **面试可答** | B+Tree 为什么快；最左前缀原则；索引失效场景；读 EXPLAIN 的 seq/index/bitmap scan |

---

## 1. B+Tree 直觉（够用版）

数据库的索引几乎都是 **B+Tree**。它要回答的问题只有一个：**给定一个值，在一亿行里快速找到它**。

- 叶子节点存"键 + 行指针"，**非叶子节点只存键**（所以一层能装成百上千个分支）；
- 树高固定基本 = 3~4 层，一次查询就 3~4 次磁盘 IO——**这就是"O(log n)"在工程里最诚实的形态**；
- 叶子之间首尾相连，天然支持**范围查询**（`BETWEEN`、`> <`），这也是它淘汰哈希表的原因。

对比：哈希表等值查找 O(1)，但**范围查询退化为全扫**。所以 PG 默认索引是 btree，不是 hash。

```sql
-- 第 4 章 schema 已带的两个索引，看看长什么样
\d orders          -- 能看到 orders_user_id_idx / orders_status_idx
\d order_items     -- 能看到 order_items_order_id_idx
```

> 💡 直觉锚点：**索引 = 书的目录**。目录帮你跳到页，正文（堆表）才是数据本身。没有目录就从头翻（顺序扫），有目录但查的维度不在目录里，书照样帮不了你。

---

## 2. 索引类型盘点：六类，各备一种场景

| 索引 | 场景一句话 | 本 schema 落点 |
|------|-----------|---------------|
| **btree**（默认） | 等值 + 范围、排序 | 主键、外键、`email` |
| **hash** | 仅等值、且列巨大（nb 变化大） | 很少用；`IN`/`=` 一般 btree 够 |
| **gin** | 数组、jsonb、全文检索（第 11 章） | `products.attributes` 反查 |
| **gist** | 地理/范围类型 | 无（地理数据才用） |
| **brin** | 超大表、物理有序、范围查询 | 日志/流水类大表 |
| **部分/表达式** | 只给"常见子集"建索引 | 见 §4 |

> ⚠️ 别神话"索引"。**写放大**：每次 INSERT/UPDATE 要同步维护所有索引，索引越多写入越慢。判断标准永远是"这个查询多久跑一次 + 表多大"。几千行的表，索引收益趋近于零。

---

## 3. 复合索引与最左前缀原则

索引 (a, b) 本质是一棵"先按 a 排、再按 b 排"的字典树。能命中的查询形态：

```sql
CREATE INDEX orders_user_status_idx ON orders (user_id, status);

-- ✅ 用得上（前缀匹配）
WHERE user_id = 5;                  -- 用 a
WHERE user_id = 5 AND status='paid'; -- 用 a+b
ORDER BY user_id, status;           -- 连排序都能省

-- ❌ 用不上（跳过前缀 a 直接从 b 开始查）
WHERE status = 'paid';              -- 只能全扫或另个索引
```

**最左前缀原则**：复合索引只能从最左列开始连续匹配，跳列即失效。所以列顺序要按"**等值优先、选择性高的靠左**"排。

> ❌ 别为每个查询各建一个索引。`orders` 建 `(user_id, status)` 后，(user_id) 一个查询也能用——**复合索引天然覆盖其前缀**。索引数量压下来，写放大才可控。

---

## 4. 部分索引与表达式索引（对症下药）

**部分索引**：只给"最常见的那一小撮行"建索引——索引小、命中快。

```sql
-- 只对"待处理"订单建索引；paid/cancelled 是历史大部分，不值得进索引
CREATE INDEX orders_pending_idx ON orders (id)
  WHERE status = 'pending';

-- 第 4 章的软删除唯一索引就是部分索引的实战
CREATE UNIQUE INDEX users_email_unique_active
  ON users (email) WHERE deleted_at IS NULL;
```

**表达式索引**：查询把字段包进函数后，普通索引失效（见 §6），要给"函数后的结果"建索引：

```sql
SELECT * FROM users WHERE lower(email) = 'a@example.com';
CREATE INDEX users_email_lower_idx ON users (lower(email));  -- 对着表达式建
```

---

## 5. 读 EXPLAIN ANALYZE：三次扫描决定"卡不卡"

`EXPLAIN` 告诉你"怎么查"，`EXPLAIN ANALYZE` 告诉你"实际查了多久"。三次扫描类型必须认识：

```sql
-- 0 准备：往 orders 塞 1 万行便于观察
INSERT INTO orders (user_id, status, total_amount)
SELECT (random() * 3 + 1)::int, 'paid', random() * 1000
FROM generate_series(1, 10000);
```

```sql
EXPLAIN ANALYZE
SELECT * FROM orders WHERE status = 'paid';
-- 结果里的三种典型节点：
--   Seq Scan         顺序扫整张表（没走索引/选择性差）
--   Bitmap Index Scan → Bitmap Heap Scan  先扫索引位图、再回表取行（中等选择性，PG 专业姿势）
--   Index Scan       直接按索引找行（选择性高）
```

怎么读：

1. 从上到下是执行管道；**cost 越大越右侧/越顶层的节点越费**；
2. 第一眼找三个词：**Seq Scan**（表小可接受，表大要警惕）、**actual time 的小数 vs 毫秒**（虚高的 cost 是估算，`actual` 才是现实）；
3. 注意 **Rows Removed by Filter**：扫了很多行只留下一行 = 索引没建对。

```sql
-- 实战闭环：这条查询先解释为什么慢，再补索引验证
EXPLAIN ANALYZE
SELECT * FROM orders WHERE user_id = 2 AND status = 'paid'
ORDER BY created_at DESC LIMIT 10;
```

慢 → 建 `CREATE INDEX orders_user_status_created_idx ON orders (user_id, status, created_at DESC);` → 再看 EXPLAIN：Index Scan + 不回表排序，cost 骤降。

---

## 6. 高频踩坑清单（面试答题全在这）

| 坑 | 现象 | 修正 |
|----|------|------|
| 字段包函数 | `WHERE lower(email)=...` 走不了索引 | 表达式索引，见 §4 |
| 隐式类型转换 | `WHERE user_id = '2'`（字符串与 int 比） | 类型匹配（值和参数类型一致） |
| 前导通配符 | `LIKE '%abc'` | 无法用 btree（第 11 章 pg_trgm/GIN） |
| 在索引列上运算 | `WHERE price * 2 > 100` | 把运算移到常量侧：`price > 100/2` |
| 选择性太差 | `WHERE status='paid'`（90% 是它） | 不建索引，或部分索引仅覆盖少数派 |
| 索引堆成山 | 写入越来越慢、表膨胀 | 只给"高频 + 大表"建；定期审视 |

> 💡 判断索引是否被用：`\d 表名` 看索引列表能否对上查询维度；或者直接 `EXPLAIN`。**永远用 EXPLAIN 说话，不要凭感觉"有索引就该快"。**

---

## 🎯 练习

**要求**：沿用本章数据，完成三个动作：
1. `EXPLAIN ANALYZE` 查 `orders` 按 `status` 过滤，确认它是 seq/bitmap/index 哪一种；
2. 为「某用户 + 状态 + 时间倒序，取 10 条」这条高频查询设计复合索引并重建 EXPLAIN 对比 cost；
3. 故意制造一个索引失效场景（对索引列包函数/隐式转换），EXPLAIN 验证"确实没走索引"。

**提示**：验证走没走索引，看节点名是否含 `Index`；`status='paid'` 占绝大多数时 PG 会选择不建索引——**这个"不合理里的合理"正是本节要点**。

**预期效果**：能对着 EXPLAIN 输出说出"用了什么扫描、为什么、怎么建索引能更快"三句话。

---

## 🎤 面试问答

> **问：为什么不用哈希表做数据库索引？**
> **答：** 哈希等值查找是 O(1)，但**范围查询退化**。业务里 `> < BETWEEN`、排序、去重都要 btree 的"有序性"。所以哈希索引只有在极少数"只要等值、列又特别大导致 btree 太大"的场景才出现。
>
> **问：最左前缀原则是什么？**
> **答：** 复合索引 (a, b) 按 a 先排、b 后排。查询必须**从最左列开始连续命中前缀**才有用：`a`、`a+b` 可用，`b` 单独查不可用。设计顺序按"选择性高的等值列放左边"。
>
> **问：SELECT 里不该建索引吗？为什么说索引越多越慢？**
> **答：** 索引是写入代价换读取收益。每次 INSERT/UPDATE 都要同步维护所有索引（树叶加页、甚至页分裂），**写放大**让写入慢慢臃肿。所以索引策略是"给高频且大表的查询建"，不是"给所有 WHERE 列建"。
>
> **追问：函数包了字段为什么失效？**
> **答：** 索引存的是原始列值，`lower(email)` 是"派生值"——没有哪个索引直接记录它。解法是**对表达式建索引**（`ON lower(email)`），等价于建了一列派生值。

---

## 🔁 对比板块：PG 索引 vs MySQL InnoDB

| 维度 | PostgreSQL | MySQL InnoDB |
|------|-----------|--------------|
| 主索引 | B+Tree，叶子存堆块指针（回表拿数据） | B+Tree **聚簇**：叶子直接存整行，主键即数据 |
| 二级索引 | 指针指堆，天然支持"不限于主键" | 二级索引存主键，**必须有主键**、回表 |
| 高级索引 | gin/gist/brin/部分/表达式 全家族 | 基本只有 btree + 全文 |
| 结论 | 索引种类和灵活性 PG 全面占优 | 聚簇让主键查询少一次随机 IO |

> 一句话：**PG 的索引是"功能库"，InnoDB 的索引是"结构约束"**——这也是面试里"PG 功能多"论点的一个具体证据。

---

**下一篇：[06-transactions-isolation.md](06-transactions-isolation.md)** — 并发写会不会错：事务、隔离级别与并发控制。