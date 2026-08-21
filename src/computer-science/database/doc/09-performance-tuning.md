# 09 — 性能排障与调优

> 后置篇。线上"卡了"，第一步做什么、关键参数怎么判断。这一章给一条可复制的**排障流程**和一份**性能杀手清单**，让你从"感觉慢"到"有数据地找到慢点"。第 5 章的 EXPLAIN 是这里的显微镜。

---

## 📌 元信息

| 项目 | 内容 |
|------|------|
| **模块** | 工程层 · 第 10 篇（后置） |
| **预计时间** | 45 ~ 60 分钟 |
| **面试可答** | 慢查询定位流程；N+1 在哪层放大；表膨胀为什么拖慢查询 |

---

## 1. 排障流程：先有数据，再有结论

线上的第一性原理：**别靠猜，先开统计。**

### 第一步：开 pg_stat_statements（慢 SQL 雷达）

```bash
# postgresql.conf —— 需要重启生效
shared_preload_libraries = 'pg_stat_statements'
```

```sql
CREATE EXTENSION pg_stat_statements;   -- 每个新建的库各执行一次

-- 按总耗时排 Top 10，慢果蔬一目了然
SELECT calls, round(total_exec_time::numeric, 1) AS total_ms,
       round(mean_exec_time::numeric, 1)  AS mean_ms,
       query
FROM pg_stat_statements
ORDER BY total_exec_time DESC
LIMIT 10;
```

### 第二步：对着 Top N 逐条 EXPLAIN

把榜首的 SQL 拿去 `EXPLAIN ANALYZE`（第 5 章技能），看三类信号：

- `Seq Scan` + 大行数 → 缺索引或选择性差；
- `Index Scan` 却慢 → 回表多（宽行）；
- `Rows Removed by Filter` 巨大 → 索引建错维度。

### 第三步：看系统面——连接与事务

```sql
-- 连接打满没有？谁占着连接？
SELECT state, count(*) FROM pg_stat_activity GROUP BY state;

-- 有没有"开了没提交"的长事务（第 6 章膨胀放大器）？
SELECT pid, now() - xact_start AS dur, query
FROM pg_stat_activity WHERE xact_start IS NOT NULL
ORDER BY dur DESC LIMIT 10;
```

---

## 2. 性能杀手清单（每条都有对应排法）

| 杀手 | 症状 | 排法 |
|------|------|------|
| **N+1** | 接口慢、慢 SQL 一大串相似查询 | 应用层看日志；查"每行又查一次"的上层代码（第 13 章 repo 层排查） |
| **深分页 OFFSET** | 页越深越慢 | 第 3 章：keyset 分页 |
| **连接打满** | 大量 `connection limit exceeded` | 池调小 + `SELECT 1` 探活；查未关闭事务 |
| **长事务** | 膨胀 + 死锁等待 | 事务里别做外部调用；`statement_timeout` 兜底 |
| **表膨胀** | 同查询越来越慢 | `VACUUM`（见 §3） |
| **统计信息过期** | 计划突然变差 | `ANALYZE`（见 §3） |

> 💡 遇到"莫名其妙的慢"，先跑一遍上面的 `pg_stat_activity` 长事务查询——**应用层漏 COMMIT 是最高频的生产事故**，比索引问题常见得多。

---

## 3. VACUUM / ANALYZE / REINDEX：三兄弟

| 命令 | 干什么 | 触发时机 |
|------|--------|---------|
| `ANALYZE` | 更新优化器统计信息（pg_stat 里行数/分布） | **执行计划漂移**时；大量导入后 |
| `VACUUM` | 回收死元组，防膨胀（autovacuum 默认常开） | 常态下靠自动；手动只用于"大表删完数据"等异常 |
| `REINDEX` | 重建索引（索引膨胀/损坏） | 极少；索引异常时 |

```sql
ANALYZE orders;                       -- 常用，很快
VACUUM (VERBOSE, ANALYZE) orders;     -- 手动收紧 + 顺带 ANALYZE
REINDEX TABLE orders;                 -- 必要时
```

实操建议：**VACUUM/ANALYZE 交给 autovacuum 默认即可**，手动干涉只是异常时的工具。别在生产随手跑全库 `VACUUM FULL`（它要拿重量级锁、会中断业务）。

---

## 4. 关键参数：不背表，给判断链路

| 参数 | 默认 | 调它的前提 |
|------|------|-----------|
| `shared_buffers` | 128MB | 缓存命中率低、内存用不完时；一般取物理内存 25% 上限内 |
| `work_mem` | 4MB | 看到 `Sort`/`Hash Join` 落临时磁盘（External sort）时按查询调 |
| `effective_cache_size` | 4GB | 优化器判断"能走索引/顺序扫"的预算，设成"OS 缓存 + shared_buffers"的估算 |

**判断链路**（不背数字、给方法）：

1. `EXPLAIN ANALYZE` 的慢查询出现 **External sort / spills** → 调大 `work_mem`（会话级 `SET work_mem=...` 先验证）；
2. 全表扫的查询很多、缓存命中低（`pg_stat_database.blks_hit/blks_read`）→ 调 `shared_buffers`（要重启）；
3. 优化器保守地不选索引 → 检查 `effective_cache_size` 是否低估。

> ⚠️ 金句：**99% 的问题靠加索引/SQL 解决，参数只碰那 1%。** 不要一上来调参数。

---

## 🎯 练习

**要求**：按下面的"事故现场"走完排障流程——给它一个 seq scan 慢查询、一个未提交长事务、一张膨胀的表，然后：1) 开 `pg_stat_statements` 找到榜首；2) 分析两个慢 SQL 的 EXPLAIN 并补索引/改写法；3) 杀掉长事务；4) 手动 `VACUUM` 后对比前后查询时间。

**提示**：用第 5 章造数的方式把 `orders` 加到 20 万行再制造事故；`pg_stat_activity` 里 `xact_start` 是长事务定位关键。

**预期效果**：能在 10 分钟内走完"统计 → 定位 → 修复 → 复测"全流程，每一步都有数支撑，不靠"感觉"。

---

## 🎤 面试问答

> **问：线上数据库突然变慢，第一步你干什么？**
> **答：** 先看两样东西：`pg_stat_activity` 查长事务/连接打满（应用层漏 COMMIT 的高发事故），`pg_stat_statements` 按耗时找慢 SQL。**先有数据再行动，而不是猜索引**。拿到 SQL 再 `EXPLAIN ANALYZE` 定位扫描方式。
>
> **问：N+1 一般发生在哪一层、怎么发现？**
> **答：** 发生在**应用层**：查出 N 条主记录，循环里每条再发一条查询，共 N+1 次。ORM 最容易写出来。发现手段：慢日志里一串同构 SQL、网络往返耗时爆炸。
>
> **问：表膨胀为什么让查询变慢？**
> **答：** UPDATE/DELETE 只写新版本（第 6 章 MVCC），旧版本躺成死元组 → 表越来越大，顺序扫要读的页面变多。VACUUM/autovacuum 负责回收。**长事务会挡住回收**，这是"应用层事务没提交"能拖垮全库的机制。
>
> **追问：什么时候该调 work_mem？**
> **答：** `EXPLAIN ANALYZE` 里出现 External sort / Hash Join 溢出磁盘的时候，先**会话级**调大验证效果，再评估全局。参数是最后手段，先试索引与 SQL。

---

## 🔁 对比板块：自建调优 vs 云托管默认配置

| 维度 | 自建（按需调参） | 云托管（RDS/Neon/Supabase） |
|------|-----------------|---------------------------|
| 参数 | 随便调，全可控 | 部分参数锁定，超限走工单 |
| 监控 | 自建 prometheus 等 | 控制台开箱：连接数/慢查询/存储 |
| 性价比 | 小规模省钱 | 省运维，中规模后贵 |
| 灾难兜底 | 自己写 | 自带备份/PITR/只读副本（第 10 章） |

> 一句话：**自己写业务就先用云托管把"不会炸"的成本外包出去**；调参依然是那 1% 的事，但云上你只剩"该不该加只读副本/加索引"这类设计决策——反而更聚焦。

---

**下一篇**（后置续）：[10-backup-recovery.md](10-backup-recovery.md) — 备份恢复与可靠。