# 08 — Schema 迁移：改表怎么不出事

> 生产环境改表是最高频的事故源：加个字段锁死全库、跑了个 `DROP` 收不回。这一章把"改表"变成"可追溯、可回滚、可多人协作"的日常操作。**目标：schema 演进像 git 一样有版本，能上能下，且不炸线上。**

---

## 📌 元信息

| 项目 | 内容 |
|------|------|
| **模块** | 工程层 · 第 9 篇（主线） |
| **预计时间** | 45 ~ 60 分钟 |
| **面试可答** | 为什么用迁移而不是手敲 DDL；加列会不会锁表；回填数据的正确姿势 |

---

## 1. 为什么必须用迁移（而不是 psql 手敲 DDL）

| 手敲 DDL | 迁移文件 |
|---------|---------|
| 没人记得哪张表被谁改过 | 每个变更一个文件，全员可见 |
| 改错了靠截图/回忆回滚 | 每个迁移带"上/下"成对操作 |
| 本地、测试、生产三处各改一遍，早晚不一致 | 一条命令跑通三处环境 |
| 一个人改了，你不知道 | 代码评审时能看到 schema diff |

一句话：**把 DDL 当代码管**。工具上，TS 生态里最贴近 SQL 的是 **Drizzle**（能生成迁移 + 维护类型），Prisma 工程化强但对"裸 SQL 控场"不友好。本章示例用 Drizzle，但核心思想工具无关。

```bash
bun init -y && bun add drizzle-orm pg && bun add -d drizzle-kit
```

---

## 2. Drizzle 迁移工作流（核心三步）

```ts
// drizzle.config.ts
import { defineConfig } from 'drizzle-kit'
export default defineConfig({
  dialect: 'postgresql',
  schema: './src/db/schema.ts',      // 你的 TS schema 定义
  out: './migrations',                // 生成的 SQL 迁移文件
  dbCredentials: { url: process.env.DATABASE_URL! },
})
```

```bash
# 1. 在 schema.ts 里改定义（比如给 orders 加一列）
# 2. 生成迁移（产物是纯 SQL，可 review）
bunx drizzle-kit generate
# 3. 应用到数据库（本地 / 测试 / 生产各跑一次）
bunx drizzle-kit migrate
```

**铁则**：`migrate` 只增不改历史迁移文件；改错了写"下一个迁移去改"，而不是回手编辑旧文件。**迁移历史是审计日志，不是编辑器草稿。**

---

## 3. 迁移实践：四条必背

### 3.1 加列：`DEFAULT` 与锁表

```sql
-- PG 11+ 的快速默认值：加"带常量默认值"的列不重写整表、不锁死写入
ALTER TABLE orders ADD COLUMN coupon_code text DEFAULT NULL;

-- ⚠️ 但"非 NULL + 有默认值"在大表上：PG 11+ 用常量默认近乎免费；
--    唯一的坑在"默认值非常量表达式"（如 uuid 生成）和 11 之前版本 —— 会上 ACCESS EXCLUSIVE 锁
```

**锁表心法**：`ALTER TABLE` 默认拿 **ACCESS EXCLUSIVE** 锁（最重），连读都挡。所以大表上所有 DDL 都要问一句"这操作是瞬间元数据变更，还是要重写全表"。

### 3.2 重命名：让旧的也活着

```sql
-- 先加新列，回填，再删旧列（长流程但零停机）
ALTER TABLE orders RENAME COLUMN amount TO total_amount;
ALTER TABLE orders RENAME COLUMN total_amount TO amount;   -- 反悔也成立（up/down 成对）
```

> ⚠️ 重命名对**运行中的旧应用**是断崖：应用还在 `SELECT amount`，你改成了 `total_amount` → 线上大规模报错。零停机套路：**加新列 → 双写 → 切读 → 删旧列**，四步分布在多个迁移里。

### 3.3 数据回填：分批而不是一下

```sql
-- ❌ 全表一把 UPDATE：锁全表 + 长事务（第 6 章噩梦）
UPDATE order_items SET product_name = ... WHERE product_name = '';

-- ✅ 分批：每次只碰一小段，给别的查询让路
DO $$
DECLARE done boolean := false;
BEGIN
  LOOP
    UPDATE order_items SET product_name = '默认名'
    WHERE id IN (SELECT id FROM order_items
                 WHERE product_name = '' LIMIT 100)     -- 100 行一批
    RETURNING id;
    IF NOT FOUND THEN done := true; EXIT; END IF;
    PERFORM pg_sleep(0.05);                              -- 每批喘口气
  END LOOP;
END $$;
```

### 3.4 down 策略：能下钻到任意版本

每个迁移成对写 `up` / `down`。ups 供应链要安全，downs 在紧急回滚时救命：

```ts
// migrations/0003_add_coupon_code.ts（示意）
export const up = `ALTER TABLE orders ADD COLUMN coupon_code text DEFAULT NULL;`
export const down = `ALTER TABLE orders DROP COLUMN coupon_code;`
```

> 💡 别把 down 当成"日常要跑"的路径——**生产上 99% 的修复靠"追加新迁移"，而不是回滚旧迁移**。down 的价值在"紧急 - 灾难性变更"时止损。

---

## 4. 与最小权限衔接（呼应第 7 章）

- **迁移角色**跑 `migrate`（有 DDL 权限）；
- **应用角色**只读 DML——但注意：**新建的表默认不会自动授权给 shop_app**。

```sql
-- schema.sql 第 4 章建的表在跑迁移后要给应用角色补授权
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO shop_app;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO shop_app;
```

把这条写进迁移脚本尾部或 CI 里，避免"新表上线 → 应用 403"的经典事故。

---

## 🎯 练习

**要求**：用 Drizzle（或你熟的迁移工具）完成两条变更 + 一次回滚：
1. `orders` 表加 `coupon_code text` 列（含 down）；
2. 新增 `coupons` 表（id、code、discount、expires_at），应用角色授权补齐；
3. 跑 up 后 `\d orders` 验证、跑 down 后确认列消失。

**提示**：先改 `schema.ts` 再 `generate` 再 `migrate`；down 在工具里用 `drizzle-kit` 的 `--custom` 或手写 SQL 文件对应。

**预期效果**：`migrations/` 下出现两条可 review 的 .sql；库能上能下，`coupons` 表能让应用角色正常读写。

---

## 🎤 面试问答

> **问：生产加一列会锁表吗？**
> **答：** `ALTER TABLE` 默认拿 ACCESS EXCLUSIVE 锁，会挡读写。好在 PG 11+ 对"**带常量默认值的加列**"优化为纯元数据变更，不重写表、近乎无感；非常量默认（如默认生成 UUID）或老版本才可能重写全表。加列前先评估"是否常量默认"。
>
> **问：为什么迁移文件不能改？**
> **答：** 迁移记录已经应用到多套环境，是"已发生事实"的审计。改历史文件 = 篡改已投产的版本，环境间对不上。改错的补救是**追加一个新迁移**去纠正。
>
> **问：大数据量回填要注意什么？**
> **答：** 别一把 UPDATE 全表——长事务 + 全表锁 + WAL 爆炸。**分批 + 喘息**（LIMIT 小批 + 间隔），让其他事务能插进来，随时可中断可恢复。
>
> **追问：应用在改表期间在干嘛？**
> **答：** 老应用还在用旧 schema。所以"零停机改表"的通用四步是**加新列 → 双写新旧 → 切读 → 删旧**，每一步一个迁移，应用版本与 schema 版本要能满足中间态。

---

## 🔁 对比板块：drizzle-kit vs prisma migrate vs node-pg-migrate

| 维度 | drizzle-kit | prisma migrate | node-pg-migrate |
|------|-------------|----------------|-----------------|
| 生成方式 | TS schema → 可 review 的 SQL | schema.prisma → SQL | 手写 SQL |
| 类型同步 | ✅ 弱依赖 schema.ts | ✅ 全链路 | ❌ 无 |
| 裸 SQL 可编辑 | ✅ 生成后直接改 | 生成后改要小心 diff | ✅ 就是 SQL |
| 锁表/大表操作文档 | 中 | 中 | 一般 |
| 适合 | **TS 全栈 + 想控场** | 重 CRUD + 自动乐观 | 只想管 DDL 的老项目 |

> 一句话：**想"类型安全 + SQL 可控"选 Drizzle；想要"零配置开箱"选 Prisma；只想管裸 DDL 用 node-pg-migrate。迁移的心法（成对 up/down、只增不改、分批回填）三家通用。**

---

**下一篇：[13-capstone.md](13-capstone.md)**（主线最后一站）或按需后置篇：**03 窗口函数分页 / 09 性能排障 / 10 备份恢复 / 11 高级特性 / 12 pgvector**。