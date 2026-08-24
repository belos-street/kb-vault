# 01 — SQL 基础与类型系统

> 数据怎么落到表里、并且存得对。这一章覆盖 DDL 建表、主键策略、高频类型选型和约束，是后面所有章节的地基。**学完你会建出一张正确的表，能说出"为什么这样建"。**

---

## 📌 元信息

| 项目 | 内容 |
|------|------|
| **模块** | 基础层 · 第 2 篇（主线） |
| **预计时间** | 45 ~ 60 分钟 |
| **面试可答** | 主键用自增还是 UUID；`NULL` 三值逻辑的坑；`text` vs `varchar`；钱为什么不能存 `float` |

---

## 1. 建表 DDL 心法

一张表的 DDL 就五块：**类型、主键、约束、默认值、注释**。先看一张"教科书正确"的表（本系列主线 `shop` 库的第一张表）：

```sql
CREATE TABLE users (
  id           bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,  -- 自增主键
  email        text        NOT NULL UNIQUE,                      -- 登录名，唯一且必填
  display_name text        NOT NULL DEFAULT '',                  -- 展示名，不许为 NULL
  role         text        NOT NULL DEFAULT 'user'
               CHECK (role IN ('user', 'admin')),                -- 枚举值白名单
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE products (
  id       bigint      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name     text        NOT NULL,
  price    numeric(12, 2) NOT NULL CHECK (price >= 0),           -- 钱必须用 numeric
  is_on_sale boolean   NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
```

三个立刻要记住的决策：

- **必填 = `NOT NULL`，不是"不加默认值"**。默认值只解决"没传时给什么"，`NOT NULL` 解决"空值没意义"。
- **该有约束的地方写约束**，别靠应用层拦。数据库约束是最后一道防线，任何客户端都可能绕过你的校验。
- **时间统一 `timestamptz`**，别用 `timestamp`（详见 §3）。

---

## 2. 主键三选一（今天起不再纠结）

| 方案 | 写法 | 优点 | 缺点 | 结论 |
|------|------|------|------|------|
| `bigint` + IDENTITY | `bigint GENERATED ALWAYS AS IDENTITY` | 紧凑 8 字节、索引高效、可读 | ID 会暴露业务量、不可跨库合并 | **内部自增首选** |
| `serial` | `serial PRIMARY KEY` | 老代码常见 | 官方建议新代码改用 IDENTITY（serial 未废弃，但行为藏在 sequence 上、权限易漏） | ⚠️ 新写代码别再用 |
| `uuid`（UUIDv7） | `uuid PRIMARY KEY DEFAULT uuidv7()` | 全局唯一、**时间有序**、可由客户端生成、不暴露 ID 规律 | 16 字节更大、UUIDv7 泄漏创建时间 | **需要暴露/分布式生成的场景** |

> 💡 关键事实：PG 18 起内置 `uuidv7()`（RFC 9562，**时间有序**的 UUID），**不需要任何扩展**。它兼顾了"全局唯一"和"自增索引友好"——过去 UUIDv4 乱序导致 B+Tree 碎片化的问题，在 v7 上不存在。第 4 章设计订单 schema 时，订单号这类需要对外暴露的 ID 就用它；内部表（users/products）用 IDENTITY 完全够。
>
> 留一个判断标准：**ID 会不会出现在 URL / 场景里让用户感知到？会 → UUIDv7；不会 → IDENTITY。**

---

## 3. 高频类型速查（只记用得上的）

| 类型 | 存什么 | 关键注意点 |
|------|--------|-----------|
| `numeric(p, s)` | **钱、金额** | 十进制精确，`numeric(12,2)` 表示最多 12 位、小数 2 位 |
| `float8` / `double precision` | 科学计算 | ⚠️ 二进制浮点有误差，**存钱必炸**（0.1 + 0.2 ≠ 0.3） |
| `integer` / `bigint` | 整数 | 枚举/状态用 `smallint` 或 `text` 看场景 |
| `timestamptz` | 时间点 | **存储为 UTC，按会话时区显示**；`now()` = `transaction_timestamp()` |
| `timestamp` | 无时区时间 | 只有"本地钟表时间"且不在乎时区才用它，其余一律 `timestamptz` |
| `date` / `interval` | 日期 / 时段 | `'2026-08-21'::date`、`age(created_at)` 算年龄 |
| `text` | 任意长度字符串 | 无长度限制；pgtrgm/全文检索都基于它 |
| `varchar(n)` | 限制长度的字符串 | 与 `text` **性能和存储完全一致**，差别只是 `n` 截断约束 |
| `uuid` | UUID | 配合 `uuidv7()` 做主键 |
| `jsonb` | JSON 文档 | 第 11 章专门讲；现在知道"结构化动态字段用它"即可 |
| `boolean` | 布尔 | `NOT NULL DEFAULT false` 是常见正确姿势 |

**反例备忘录（见过太多次的坑）**：

- ❌ 金额用 `float` → 对账不平。唯一正解：`numeric`。
- ❌ 时间存字符串 `'2026-08-21 10:00'` → 无法比较、无法索引、时区全靠猜。唯一正解：`timestamptz`。
- ❌ 手机号用 `int` → 溢出、前导 0 丢失。正解：`text`。
- ❌ `timestamp without time zone` 存 UTC → 显示时以为在本地。正解：`timestamptz`。

---

## 4. NULL 三值逻辑（本系列第一个面试必考点）

SQL 的逻辑判断不是二值的 true/false，而是**三值：true / false / NULL（未知）**。一切与 NULL 的运算结果都是 NULL，而 `WHERE NULL` 会被当作"不成立"直接过滤掉行：

```sql
SELECT NULL = NULL;                    -- NULL（未知），不是 true！
SELECT 1 = NULL;                       -- NULL
SELECT NULL AND true;                  -- NULL

SELECT 1 IN (1, NULL);                 -- true（找到了匹配就不在乎 NULL）
SELECT 1 NOT IN (2, NULL);             -- NULL —— 这行不返回！
```

最后一行就是**著名的 `NOT IN` 陷阱**：`WHERE x NOT IN (子查询)` 一旦子查询结果里带任何 NULL，整条查询返回 0 行。

**工程后果**（写代码必踩）：

```sql
-- ❌ 翻车写法：某用户在子查询里是 NULL，所有人都不返回
SELECT * FROM users WHERE id NOT IN (
  SELECT user_id FROM orders WHERE user_id IS NOT NULL  -- 忘了排除 NULL
);

-- ✅ 正确写法一：NOT EXISTS（无 NULL 语义坑）
SELECT * FROM users u
WHERE NOT EXISTS (SELECT 1 FROM orders o WHERE o.user_id = u.id);

-- ✅ 正确写法二：明确排除 NULL 再 NOT IN
SELECT * FROM users WHERE id NOT IN (
  SELECT user_id FROM orders WHERE user_id IS NOT NULL
);
```

> 💡 心法：**判断相等用 `=`，判断"是不是 NULL"永远用 `IS NULL` / `IS NOT NULL`；涉及"排除"优先 `NOT EXISTS`。**

---

## 5. 约束：让坏数据进不来

| 约束 | 作用 | 示例 |
|------|------|------|
| `NOT NULL` | 不可为空 | `email text NOT NULL` |
| `UNIQUE` | 值全局唯一（自动建索引） | `email text UNIQUE` |
| `PRIMARY KEY` | 唯一 + 非空（自动建索引） | `id bigint PRIMARY KEY` |
| `CHECK` | 自定义条件 | `CHECK (price >= 0)`、`CHECK (role IN ('user','admin'))` |
| `FOREIGN KEY` | 引用另一张表，禁止孤儿数据 | 第 4 章落到订单表 |
| `DEFAULT` | 未传值时的兜底 | `DEFAULT now()`、`DEFAULT uuidv7()` |

```sql
-- CHECK 的两种写法都合法：列内联 / 表级
ALTER TABLE users
  ADD CONSTRAINT users_role_check CHECK (role IN ('user', 'admin'));
```

**枚举该用 `CHECK` 还是 `ENUM` 类型？** 现在先记住结论（第 4 章展开）：`CHECK` 已验证够用且好改；`ENUM` 类型一旦上线，加枚举值要跑 `ALTER TYPE`，改起来重。默认 `text + CHECK`。

---

## 🎯 练习

**要求**：在 `shop` 库中把 §1 的 `users` / `products` 两张表原样建出来；然后人为触发三条"数据进不来"的错误（违反唯一、违反 CHECK、违反 NOT NULL）。

**提示**：违反约束的 INSERT 会报形如 `ERROR: duplicate key value violates unique constraint` 的错误——看到错误说明约束生效了，是好事。

**预期效果**：`\d users` 能看到主键、唯一约束、check 约束；误插的 3 条坏数据全被拒；`INSERT ... RETURNING id, created_at;` 能拿到自增 ID 和自动时间戳。

---

## 🎤 面试问答

> **问：主键用自增还是 UUID，你怎么选？**
> **答：** 分暴露与否。内部表用 `bigint IDENTITY`（8 字节、索引最快、可读）；需要对外暴露、或需要应用层预生成 ID（比如离线导入、分布式产生）时用 UUID，且 **PG 18 的 `uuidv7()` 时间有序**，不会有 UUIDv4 的索引碎片问题。
>
> **问：`text` 和 `varchar(n)` 有什么区别？**
> **答：** 在 PG 里**两者性能完全一样、存储也一样**，区别只在 `varchar(n)` 强加了长度约束、超长报错；`text` 无长度限制。不像 MySQL 里定长/变长有实际差异。
>
> **问：为什么 `WHERE x NOT IN (子查询)` 可能一条都查不出来？**
> **答：** NULL 是三值逻辑。只要子查询结果中出现任意 NULL，`NOT IN` 对每行都得到"未知"，`WHERE` 视未知为不成立 → 全部被过滤。**正确姿势是 `NOT EXISTS`**，它没有这个语义坑。
>
> **追问：`COUNT(*)` 和 `COUNT(col)` 呢？**
> **答：** `COUNT(*)` 数所有行；`COUNT(col)` 只数 `col` 不为 NULL 的行。这个铺到第 2 章聚合部分细讲，现在记住"想要行数用 `*`"。

---

## 🔁 对比板块：IDENTITY vs SERIAL vs UUIDv7

| 维度 | `bigint IDENTITY` | `serial` | `uuid` + `uuidv7()` |
|------|--------------------|----------|---------------------|
| 大小 | 8B，索引最省 | 8B | 16B |
| 可预生成 | ✗（要 DB 分配） | ✗ | ✅（客户端生成） |
| 暴露业务量 | ✅ 泄露 | ✅ 泄露 | ✗（基本无规律） |
| 版本要求 | PG 10+ | 全版本 | **PG 18+**（旧版需 `pgcrypto`/应用端生成） |
| 结论 | 内部默认 | ❌ 官方不再推荐（未废弃） | 对外/分布式用 |

> 一句话：**内部表 IDENTITY，对外/分布式 UUIDv7，`serial` 只在读老代码时认识它。**

---

**下一篇：[02-query-joins-and-aggregation.md](02-query-joins-and-aggregation.md)** — 把业务查出来：SELECT、JOIN、聚合。