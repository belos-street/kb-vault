# 11 — 高级特性速查：JSONB 与全文检索

> 后置篇，速查性质。这一章解决两类"非典型"需求：**异构数据怎么存**（JSONB）和**模糊/搜索怎么做**（pg_trgm、全文检索）。按需查阅，不背全部——每个功能只记住"什么时候用它"这一句。

---

## 📌 元信息

| 项目 | 内容 |
|------|------|
| **模块** | 速查层 · 第 12 篇（后置，随用随查） |
| **预计时间** | 30 ~ 40 分钟通读 |
| **面试可答** | JSONB vs 关系表怎么选；GIN 索引解决什么；`LIKE '%x%'` 为什么慢 |

---

## 1. JSONB：结构自由的数据怎么存

第 4 章给 `products.attributes` 留了 `jsonb` 列。JSONB 与 `json` 的区别一句话：**jsonb 按二进制存、查询更快、会规范化（去重 key、排序），json 原样存文本**——日常一律用 **jsonb**。

### 高频操作符（真正常用的就 4 个）

```sql
-- 建索引前先保证有 GIN
CREATE INDEX products_attrs_gin_idx
  ON products USING gin (attributes);

SELECT
  attributes -> 'color'                                  AS color_json,     -- 取值，保留 jsonb 类型
  attributes ->> 'color'                                 AS color_text,     -- 取值，转成 text（最常用）
  attributes #>> '{spec, weight}'                        AS weight,         -- 多层路径取 text
  attributes ? 'color'                                   AS has_color,      -- 键是否存在
  attributes @> '{"color": "red"}'::jsonb                AS is_red          -- 是否包含子结构（走 GIN）
FROM products
WHERE attributes @> '{"color":"red"}'::jsonb;                              -- 条件过滤也用它
```

### 什么时候用 JSONB（对照第 4 章三角对比）

| ✅ 用 | ❌ 别用 |
|-------|--------|
| 字段**随实体差异巨大**、且查询靠"包含"而非"精确列"（商品属性） | 需要**外键/唯一约束/范围查询**的数据 |
| 第三方回调的**原始报文**要原样归档 | 需要**全量筛选**的核心业务列（查询频繁且条件精确） |
| 快速迭代、字段还**没定型** | 已经在用关系表且没痛点 |

> ⚠️ 代价：**每次 UPDATE 全量重写整块 JSON**（不是局部替换），`jsonb_set` 也只是"改完重写"。高频字段更新就别塞 JSONB。

---

## 2. 模糊搜索三选一（从能用到好用）

| 方案 | 写法 | 优点 | 缺点 | 用在哪 |
|------|------|------|------|--------|
| `LIKE '%x%'` | `WHERE name LIKE '%跑%'` | 零成本 | **无法走 btree 索引**、全表扫 | 小表/可忍 |
| **pg_trgm + GIN** | `CREATE EXTENSION pg_trgm;` + GIN(`gin_trgm_ops`) | 走索引、支持模糊 | 短词(<3)效果差 | **90% 的搜索场景** |
| 全文检索 `tsvector` | `to_tsvector(name) @@ to_tsquery(...)` | 词干/权重/语言 | 中文分词要扩展 | 长文本/英文 |

```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX products_name_trgm_idx
  ON products USING gin (name gin_trgm_ops);

-- 现在 %跑% 能走索引了（EXPLAIN 验证）
EXPLAIN SELECT * FROM products WHERE name ILIKE '%跑步鞋%';
```

> ⚠️ **中文的坑**：PG 自带全文检索对中文**不做分词**（默认按整词/空格分词，`to_tsvector('跑步鞋')` 是一整块）。要中文全文搜索只能上 `zhparser` 等扩展，或直接评估 Elasticsearch/Meilisearch（第 2 章思路：搜索是对的旁路场景）。所以**中文站点的"商品名搜索"用 pg_trgm 更务实**（按字符 trigram 匹配）。

---

## 3. 触发器 / 存储函数 / 物化视图：什么时候值得

| 特性 | 值得用 | 别用 |
|------|--------|------|
| **触发器** | 审计日志、`updated_at`（第 4 章）、跨表一致性兜底 | 业务规则进 DB（难调试、难版本化） |
| **存储函数** | 高频、标准化的数据操作（如 `set_updated_at`） | 复杂业务逻辑（应该留在应用层） |
| **物化视图** | 低频重聚合（月度报表），刷新间隔可忍 | 需要近实时数据又不想维护刷新 |

```sql
-- 物化视图：月度销售快照，按需刷新
CREATE MATERIALIZED VIEW mv_monthly_sales AS
SELECT date_trunc('month', created_at) AS month,
       sum(total_amount)                AS gmv,
       count(*)                         AS orders
FROM orders WHERE status = 'paid'
GROUP BY 1;
REFRESH MATERIALIZED VIEW mv_monthly_sales;   -- 手动刷新（大表上占资源，避高峰）
```

> ⚠️ 触发器与函数的经典劝退场景：**在触发器里调外部 API / 加密 / 分词**——DB 进程里做外部 IO，卡一下整库都慢。**凡涉及'外部世界'的逻辑，离开触发器。**

---

## 🎯 练习

**要求**（基于第 4 章库）：
1. 给 `products.attributes` 插入 5 条异构属性（有的有 color、有的有 spec），用 `@>` 和 `->>` 各写一条检索；
2. 装 pg_trgm，给 `products.name` 建 GIN，跑 `EXPLAIN` 对比 `%关键词%` 建索引前后；
3. 建 `mv_monthly_sales` 并验证刷新。

**提示**：GIN 对空表也能建（不需要先有数据）；`ILIKE` 与 `@>` 的 `EXPLAIN` 里应看到 `Bitmap Index Scan` 或 `Index Scan`。

**预期效果**：properties 检索命中、模糊搜索走索引、物化视图出月度汇总——三件"非典型需求"全给你留了可复用读写。

---

## 🎤 面试问答

> **问：什么数据适合放 JSONB，什么不适合？**
> **答：** 适合：字段随实体差异大（商品属性）、需要原样存储的第三方报文。不适合：需要唯一/外键/范围约束的强结构化数据，以及**高频字段更新**（JSONB 更新是整块重写）。
>
> **问：`LIKE '%xx%'` 为什么慢？**
> **答：** 前导通配符让 btree 无法利用"前缀有序"，只能全表扫。解法用 **pg_trgm + GIN**，把"模糊匹配"转成 trigram 相似度走索引——`%xx%` 也就被"救回来"了。
>
> **问：中文全文搜索用 PG 自带的可以吗？**
> **答：** 默认不行——PG 自带分词只按空格/语言规则，中文需要 `zhparser` 等扩展。轻量场景建议 pg_trgm（按字符匹配），重度搜索再引专用引擎。
>
> **追问：触发器里能写什么、不能写什么？**
> **答：** 适合审计/统一赋值等数据侧规则；**不能做外部 IO**（HTTP、加密服务等）——数据库进程里卡一下，整库抖动。

---

## 🔁 对比板块：PG 全文检索 vs Elasticsearch vs Meilisearch

| 维度 | pg_trgm / tsvector（PG 内） | Elasticsearch | Meilisearch |
|------|---------------------------|---------------|-------------|
| 定位 | 数据库顺带 | 重型搜索集群 | 轻量即插即用搜索 |
| 中文分词 | 弱（需扩展） | 强（ik 等） | 一般 |
| 部署成本 | 零（在 PG 里） | 高（集群/运维） | 低 |
| 数据一致性 | 与业务事务一致 | 需同步，有延迟 | 需同步 |
| 适用 | **中小业务先够用** | 大数据/复杂聚合 | 站内快速搜索 |

> 一句话：**先 PG 兜住 90% 的场景，等搜索真正成为瓶颈再上专用引擎**——和第 12 章的 pgvector→专用向量库是同一套演进哲学。

---

**下一篇**（后置续）：[12-pgvector.md](12-pgvector.md) — pgvector：把语义检索装进 PG。