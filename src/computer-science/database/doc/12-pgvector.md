# 12 — pgvector：把语义检索装进 PG

> 后置篇。想在 PG 里做**向量相似检索**（商品语义搜索、RAG 记忆召回）——不需要新开一个向量库，pgvector 直接给你。这一章从建列、插数据、HNSW 索引到 Node 里调用，一路跑到能响应的语义搜索接口，最后说清楚它的**能力边界**。**目标：知道什么规模下 PG 顶得住、什么规模该换专用库。**

---

## 📌 元信息

| 项目 | 内容 |
|------|------|
| **模块** | 速查层 · 第 13 篇（后置） |
| **预计时间** | 45 ~ 60 分钟 |
| **面试可答** | pgvector 定位 vs 专用向量库；HNSW vs IVFFlat；向量 + 结构化混合检索怎么写 |

---

## 1. 为什么在 PG 里搞向量（而不直接上 Milvus）

| 出发点 | 说明 |
|--------|------|
| **少一套系统** | 与业务数据同库：一个连接串、一套备份、一份权限 |
| **混合查询** | `WHERE status='active'` 过滤 + 向量排序，天然一条 SQL |
| **事务一致** | 商品下架和它的向量一起提交，不会有同步窗口 |
| **代价** | 高频写入/亿级数据/高 QPS 实时检索时，性能不如专用库——**边界在 §5** |

> ⚠️ 版本红线：pgvector 请用 **≥ 0.8.2**——0.8.0/0.8.1 的 HNSW **并行构建存在 buffer overflow** 缺陷。本机装：`brew install pgvector`，或 Docker 用 `pgvector/pgvector:0.8.2-pg18`。

---

## 2. 从零到第一个向量查询

```sql
-- 1. 启用扩展（每库一次）
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. 给商品加向量列（1536 维 = OpenAI text-embedding-3-small 的输出）
ALTER TABLE products ADD COLUMN embedding vector(1536);

-- 3. 写入：embedding 由模型生成（§3），这里用假数据演示
--    （price 有 NOT NULL 约束，记得带上）
INSERT INTO products (name, price, embedding)
VALUES ('限量跑步鞋', 299.00, '[0.1, 0.2, ... 1536 个数 ...]');

-- 4. 相似检索：按向量距离排序取 Top 5
SELECT name, 1 - (embedding <=> '[0.12, 0.19, ...]') AS similarity
FROM products
ORDER BY embedding <=> '[0.12, 0.19, ...]'      -- <=> 余弦距离，值越小越相似
LIMIT 5;
```

**三个距离算子**（记住选一个用）：

| 算子 | 数学含义 | 适合 |
|------|---------|------|
| `<->` | 欧氏距离（L2） | 数值特征差异 |
| `<=>` | 余弦距离 | **文本语义相似（Embedding 默认场景）** |
| `<#>` | 内积（返回负值） | 归一化后的向量可近似成内积排序 |

> 💡 余弦相似度 = `1 - 余弦距离`——PG 里按"距离升序"排序，`1 - distance` 转成"相似度"展示。

---

## 3. 向量从哪来：Embedding 生成

```ts
// 用 OpenAI（或任意本地模型）把文本转向量
import OpenAI from 'openai'
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function embed(text: string): Promise<number[]> {
  const r = await openai.embeddings.create({
    model: 'text-embedding-3-small',       // 1536 维
    input: text,
  })
  return r.data[0].embedding
}
```

**语义搜索的原理**：同一个模型把"跑步鞋"和"运动鞋"都编码成高维向量，语义相近 → 向量在空间里挨得近。所以「用户输入一句话 → 编码 → 库内按距离 Top K」就是最简 RAG 检索链路（Agent 记忆召回同理）。

---

## 4. HNSW 索引：数据多了怎么不慢

没有索引时是**精确检索**（全表算距离），数据多了要近似检索。两种索引：

| 索引 | 原理一句话 | 适合 |
|------|-----------|------|
| **HNSW** | 多层小世界图，插入即建、无训练期 | **默认选它**（召回好、构建稳） |
| IVFFlat | 先聚类再桶内搜，**建索引前要有数据**做训练 | 海量数据、接受构建周期 |

```sql
-- HNSW（余弦距离版本）
CREATE INDEX products_embedding_hnsw_idx
  ON products USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);     -- m 连接数、ef_construction 建图质量

-- 查询期可调 recall/速度
SET hnsw.ef_search = 40;                   -- 越大召回越高、越慢
```

> ⚠️ 插曲：加了近似索引后，**结果会和"精确 Top K"略有出入**——这是近似搜索的正常行为，不是 bug。对召回率有硬要求才考虑 IVFFlat 或精确扫。

**混合检索**（业务条件 + 向量，一条 SQL 的事）：

```sql
SELECT name, 1 - (embedding <=> $1) AS similarity
FROM products
WHERE is_on_sale = true                        -- 结构化过滤（本 schema 无 status 列）
ORDER BY embedding <=> $1                       -- 向量排序
LIMIT 10;
```

---

## 5. Node/TS 集成：`pgvector-node`

```ts
import pg from 'pg'
import pgvector from 'pgvector/pg'   // toSql：把 number[] 序列化成向量字面量

const { Pool } = pg
const pool = new Pool({ connectionString: process.env.DATABASE_URL })

export async function searchProducts(queryVec: number[], limit = 10) {
  const { rows } = await pool.query(
    `SELECT name, 1 - (embedding <=> $1) AS similarity
       FROM products
      WHERE is_on_sale = true
      ORDER BY embedding <=> $1
      LIMIT $2`,
    [pgvector.toSql(queryVec), limit],   // 参数化传向量字面量，防注入一样适用
  )
  return rows
}
```

`pgvector-node` 只是把 `number[]` 序列化成 string 字面量（`'[0.1, 0.2]'`），**SQL 还是你熟悉的参数化写法**——和全系列章节完全同构。

---

## 6. 能力边界：什么时候该换专用向量库

| 信号 | 出现时 | 换谁 |
|------|--------|------|
| 向量数据过亿、**写入 QPS 高** | HNSW 构建/写入吃不住 | Milvus |
| 检索 QPS 极高、延迟敏感 | PG 单机到顶 | Qdrant / Pinecone |
| 需要复杂 ANN 参数调优/分布式 | 集群化运维成本 > 收益 | 专用向量库 |

**演进路线一句话**：**业务小 → pgvector 足够（少一套系统）；到了"亿级向量 + 高 QPS 实时"的拐点再迁移**——和搜索/GIS 的演进哲学一致：先 PG 兜住，拐点再换。

> 💡 对 Agent 开发实际联想：量级在百万级会话记忆以内、又想要事务一致性，**pgvector 直接当记忆库**（呼应 `artificial-intelligence/` 知识库）；等记忆量冲到千万级再评估独立向量库。

---

## 🎯 练习

**要求**：给 `products` 加 `embedding vector(1536)` 列并建 HNSW 索引；用任意模型（或 3~5 个手工构造的简单向量）写入 5 个商品；实现 `searchProducts` 接口，输入"lightweight running shoes"的程序化向量，返回 Top 5 含相似度。

**提示**：手工向量时商品名与向量要有相关性（"跑步鞋"和其他鞋近、和"沙发"远）；`SET hnsw.ef_search` 前先跑一次精确版对比召回差异。

**预期效果**：接口返回结果里，语义近的商品相似度 > 语义远的；`EXPLAIN` 能看到 `Index Scan using products_embedding_hnsw_idx`。

---

## 🎤 面试问答

> **问：pgvector 和 Milvus 这种专用向量库的区别？**
> **答：** 定位不同。pgvector 是 PG 的"向量补丁"：与业务数据同库、事务一致、混合查询一条 SQL，适合中小规模；专用库为亿级向量/高 QPS 实时检索优化，但要同步数据、多一套系统。**先 PG 兜住，拐点再换**。
>
> **问：HNSW 和 IVFFlat 怎么选？**
> **答：** 默认 HNSW：无训练期、插入即建、召回更稳定；IVFFlat 更快建但**必须先有数据训练聚类中心**，且数据分布变了要重建。海量 + 可接受构建周期才选 IVFFlat。
>
> **问：怎么做到"向量 + 结构化条件"一起检索？**
> **答：** 就是在一条 SQL 里 `WHERE 业务条件 ORDER BY embedding <=> 向量`——PG 先走 btree 过滤，再对结果做向量排序（可加 HNSW 辅助）。这正是"放 PG 里"相对独立向量库的核心优势。
>
> **追问：加了近似索引后结果为什么和之前不一样？**
> **答：** ANN（近似最近邻）本来就是"用召回换速度"：HNSW 可能漏掉真 Top K 的极少数。要求精确时用精确扫（无索引）或提高 `ef_search`。

---

## 🔁 对比板块：pgvector vs Milvus vs Qdrant/Pinecone

| 维度 | pgvector（PG 内） | Milvus | Qdrant / Pinecone |
|------|------------------|--------|-------------------|
| 数据一致性 | 与业务事务同台 | 需同步、有窗口 | 需同步 |
| 混合查询 | ✅ 一条 SQL | 一般 | 有限 |
| 规模上限 | 中小（百万级） | 亿级 | 高 QPS |
| 运维 | 零新增（PG 已在） | 集群运维 | 托管省心 |
| 选型 | **默认起点** | 数据量/QPS 拐点后 | 追求托管省心 |

> 一句话：**RAG/商品语义搜索的起点永远是 pgvector；只有"亿级 + 高 QPS"才轮到专用库登场。**

---

**下一篇**（主线收官）：[13-capstone.md](13-capstone.md) — 把全系列组装成可交付的订单后端。