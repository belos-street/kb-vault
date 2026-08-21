# 06 — 事务、隔离级别与并发控制

> 并发写数据会不会错？这一章是数据库的唯一"硬骨头"，也是面试出现率最高的一章。用两个 psql 窗口复现脏读/不可重复读/死锁，再落地电商最经典的**防超卖扣库存**。**目标：能解释为什么并发会错，并能写出不会错的写入代码。**

---

## 📌 元信息

| 项目 | 内容 |
|------|------|
| **模块** | 核心层 · 第 7 篇（主线） |
| **预计时间** | 75 ~ 90 分钟（本章建议一次专注） |
| **面试可答** | 四档隔离级别各防什么；MVCC 一句话；超卖的三种解法及选型 |

---

## 1. 事务与 ACID：先把"正确性"立起来

事务 = **一组要么全成、要么全败**的操作。ACID 四字不背定义，记"错了会怎样"：

| 字母 | 含义 | 不守的后果 |
|------|------|-----------|
| A 原子性 | 全部执行或全部回滚 | 扣了款没扣库存 |
| C 一致性 | 约束/规则全程成立 | 库存变负数 |
| I 隔离性 | 并发事务互不干扰 | 读到别人没提交的数据 |
| D 持久性 | 提交后不丢 | 断电丢单（WAL 的作用，第 0 章） |

```sql
-- 手工开事务（第 7 章会包装成应用的 commit/rollback）
BEGIN;
INSERT INTO orders (user_id, total_amount) VALUES (1, 199.00);
UPDATE inventory SET stock = stock - 1 WHERE product_id = 1 AND stock >= 1;
COMMIT;      -- 或者 ROLLBACK;  撤销全部
```

---

## 2. 并发出错的四态（都要能复现）

| 问题 | 现象 | 能复现的最低档位 |
|------|------|----------------|
| 脏读 | 读到**未提交**的数据（事务 A 改了又回滚，B 已读到） | 任何支持它的档位（PG 不存在） |
| 不可重复读 | 同一事务内两次读同一行，结果不同（别人提交了 UPDATE） | READ COMMITTED |
| 幻读 | 同一事务内两次范围查询，行数/新行出现（别人 INSERT 了） | REPEATABLE READ 以下 |
| 更新丢失 | 两个事务同时改一行，后提交覆盖先提交 | 与隔离级别无关，靠锁/乐观锁 |

PG 的默认隔离级别是 **READ COMMITTED**，它允许不可重复读和幻读——这也是绝大多数"线上读到了怪数据"的根源。先感受一下：开两个 psql 窗口（A、B）。

```sql
-- 窗口 A
BEGIN;
UPDATE users SET display_name = 'A改了' WHERE id = 1;

-- 窗口 B（读到的还是旧值，因为 A 未提交）
SELECT display_name FROM users WHERE id = 1;   -- '阿明'
```

> ⚠️ 一句话记忆：**脏读看"未提交"，不可重复读看"单行变"，幻读看"行数变"。**

---

## 3. 隔离级别四档（PG 视角）

| 级别 | 防脏读 | 防不可重复读 | 防幻读 | PG 说明 |
|------|:--:|:--:|:--:|--------|
| READ UNCOMMITTED | ✗ | ✗ | ✗ | **PG 的实现等同 READ COMMITTED**（PG 不允许脏读） |
| **READ COMMITTED**（默认） | ✅ | ✗ | ✗ | 每条语句拿新快照 |
| REPEATABLE READ | ✅ | ✅ | ✅（PG 快照式） | 事务开始拿固定快照；写冲突直接报"could not serialize" |
| SERIALIZABLE | ✅ | ✅ | ✅ | 快照 + SSI 偏序检测，最强也最贵 |

**实操结论**：普通业务用默认 RC 即可；金融/对账类查询需要"同一个事务内看到一致的报表"时才升 RR。

```sql
-- 窗口 A：升到 RR，快照固定
BEGIN ISOLATION LEVEL REPEATABLE READ;
SELECT sum(total_amount) FROM orders WHERE status = 'paid';
-- （窗口 B 此时又插入一笔 paid 订单）
SELECT sum(total_amount) FROM orders WHERE status = 'paid';  -- 结果不变（快照）
COMMIT;
```

---

## 4. MVCC 与 vacuum：PG 为什么读写不互斥

MVCC 的核心就一句：**一行数据可以有多个历史版本，事务只看得到自己"可见"的那个版本**。

- 每行带 `xmin`（创建它的事务号）/ `xmax`（删除它的事务号）。读事务对比事务号判定该看哪版；
- **读不阻塞写、写不阻塞读**——这是 PG 高并发的底气，也直接解释了第 2 节 B 窗口为什么读到旧值；
- 代价：每次 `UPDATE`/`DELETE` 产生**新版本**，旧版本变"死元组"，表越来越膨胀（bloat）→ 靠 **`VACUUM`/`autovacuum`** 回收。

```sql
-- 观察你的表膨胀情况（第 9 章会展开）
SELECT relname, n_live_tup, n_dead_tup
FROM pg_stat_user_tables WHERE relname IN ('orders', 'inventory');
```

> 💡 工程直觉：**长事务是膨胀的放大器**。一个跑 1 小时的只读事务，会挡住它之后所有死元组的回收——这解释了为什么"应用层开了事务忘了提交"能拖垮整库。

---

## 5. 行锁与死锁：怎么复现、怎么排

PG 有行级锁：`UPDATE`/`DELETE`/`SELECT FOR UPDATE` 都对目标行加排他锁，另一个事务写同一行会**阻塞等待**。交错加锁就死锁：

```sql
-- 窗口 A                         -- 窗口 B
BEGIN;                            BEGIN;
UPDATE orders SET status='paid' WHERE id=1;
                                  UPDATE orders SET status='paid' WHERE id=2;
UPDATE orders SET status='paid' WHERE id=2;  -- 被 B 锁住
                                  UPDATE orders SET status='paid' WHERE id=1;  -- 被 A 锁住 → 死锁
```

PG 会**自动检测死锁**并把其中一个事务回滚，抛 `ERROR: deadlock detected`。

**排查三板斧**：

```sql
-- 1. 谁在等谁
SELECT pid, wait_event_type, wait_event, state, query
FROM pg_stat_activity WHERE state = 'active';

-- 2. 谁锁着哪张表哪一行
SELECT lock.locktype, lock.mode, rel.relname
FROM pg_locks lock JOIN pg_class rel ON rel.oid = lock.relation;

-- 3. 配置里开锁等待日志（生产必开）
-- postgresql.conf: log_lock_waits = on
```

**预防原则就两条**：**统一加锁顺序**（比如总是"先订单后库存"）；**事务要短**（不在事务里发 HTTP/等外部服务）。

---

## 6. 防超卖扣库存：三条路线（电商核心题）

场景：`inventory.stock = 100`，1000 个人同时抢 100 件。最容易写错的是：`SELECT stock` → 应用判断 → `UPDATE stock=99`。两个并发事务读到 100，都写 99 → **超卖**。

### 路线一：原子条件更新（推荐，正确且简单）

```sql
UPDATE inventory
SET    stock = stock - 1
WHERE  product_id = 1 AND stock >= 1
RETURNING *;
-- 影响行数 = 1 → 扣成功；= 0 → 库存不足
```

`UPDATE ... WHERE stock >= 1` 的"检查 + 扣减"是**一条语句内原子完成**的，不存在读到旧值的窗口。90% 的业务这个就够。

### 路线二：SELECT ... FOR UPDATE（悲观锁，必要时）

```sql
BEGIN;
SELECT stock FROM inventory WHERE product_id = 1 FOR UPDATE;  -- 锁住该行
-- 应用层判断 stock，够了才 UPDATE
UPDATE inventory SET stock = stock - 1 WHERE product_id = 1;
COMMIT;
```

缺点：持锁期间并发全在等，吞吐低。适合"更新前要读多列做复杂判断"的场景。

### 路线三：SKIP LOCKED（队列/抢单，高并发下不排队）

```sql
-- 秒杀队列：每次取一单没人锁的任务
SELECT id FROM task_queue
WHERE status = 'pending'
ORDER BY id
LIMIT 10
FOR UPDATE SKIP LOCKED;   -- 跳过已被别人锁住的行，而不是等
```

`SKIP LOCKED` 让并发任务**各取各的、互不等待**，典型的"抢单/任务分发"模式。

> 💡 选型一句话：**路线一优先；要加复杂判断用二；要并行抢任务用三。** 三条都能在应用层配合 `RETURNING` / 受影响行数判定成败并提交/回滚（第 7 章落地）。

---

## 🎯 练习

**要求**：开两个 psql 窗口完成：1) 复现第 5 节死锁并观察 `deadlock detected`；2) 复现"不可重复读"（A 事务里两次读同一行，B 在中间 UPDATE 提交）；3) 用路线一写防超卖：预置 `inventory.stock = 5`，两个窗口同时扣 3 次，确认不会出现负数。

**提示**：窗口 A 的第一次 `SELECT` 后别 COMMIT，切到窗口 B 改数据再回来读；扣库存用 `RETURNING` 和受影响行数判断，别先 `SELECT`。

**预期效果**：每个窗口截图里能清楚看到三次扣减成功的只有 5 次——**第 6 次 `affected rows = 0` 拒绝扣减**。

---

## 🎤 面试问答

> **问：PG 默认隔离级别是什么？四种级别分别防什么？**
> **答：** 默认 READ COMMITTED。四种防度依次：RC 防脏读；RR 防不可重复读（PG 快照式实现顺带防幻读）；SERIALIZABLE 靠 SSI 防写偏/串行化。PG 的 READ UNCOMMITTED 实现等同于 RC（不允许脏读）。
>
> **问：MVCC 是什么？它带来了什么代价？**
> **答：** 多版本并发控制：每行保留多个历史版本，事务靠 xmin/xmax 判断可见性，使读写互不阻塞。代价是旧版本变死元组造成表膨胀，需要 VACUUM/autovacuum 回收；**长事务会拖延清理**。
>
> **问：库存超卖怎么避免？**
> **答：** 首选原子条件更新 `UPDATE ... SET stock = stock - n WHERE stock >= n`——检查与扣减同语句原子完成；复杂场景才上 `SELECT FOR UPDATE` 悲观锁；高并发抢单可用 `SKIP LOCKED` 避免排队。**绝不要在应用层"先读再写"。**
>
> **追问：为什么应用层"先读再写"会超卖？**
> **答：** 读和写之间有空窗。两个事务都读到 stock=100，自己算完各写 99，第二个写覆盖第一个——写是整个覆盖，不是"基于最新值增减"。原子 UPDATE 没有这个空窗（行锁在语句内生效）。

---

## 🔁 对比板块：PG MVCC vs MySQL InnoDB 并发模型

| 维度 | PostgreSQL | MySQL InnoDB |
|------|-----------|--------------|
| 多版本 | 行内多版本 + xmin/xmax | undo log 回滚段 |
| 清理 | `VACUUM`（物理回收） | purge 后台线程 |
| 读写互斥 | 读不用锁，互不阻塞 | 快照读也不阻塞，但有 gap lock 规则差异 |
| 幻读处理 | RR 快照即可防 | RR 靠 gap lock 防插入 |
| 死锁检测 | 自动检测回滚一方 | 同样自动，redo/rollback 成本不同 |

> 一句话：**两者都叫 MVCC，实现路径不同但工程结论接近——读写不互斥、都依赖后台清理、RR 之上都有各自的并发保障。** 面试别只说名字，能说出"清理靠什么"才算懂。

---

**下一篇：[07-node-ts-driver.md](07-node-ts-driver.md)** — 在 Bun/TS 里正确连库：驱动、连接池与事务封装。