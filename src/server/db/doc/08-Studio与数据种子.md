# 08 — Studio 与数据种子

> **本系列基于 Prisma ORM 7.x**（2026-08 编写）。

- **所属模块**：Prisma 学习大纲 · 基础层（工具篇：可随用随读，仅依赖 02）
- **预计时间**：30 min
- **面试可答**：两个开发效率工具：**Prisma Studio** 是可视化查看/编辑数据的 GUI；**seed 脚本**是让 dev 库有稳定初始数据的重复性手段。一个当"眼睛"，一个当"造数据的水龙头"。

---

## 1. 一句话定位

写业务前先要有数据可看。这篇把"看数据（Studio）"和"造数据（seed）"两件事讲清楚，都是零成本提升效率的工具——**属于随用随查，不进核心考试范畴**。

---

## 2. Prisma Studio：可视化数据浏览器

```bash
bunx prisma studio
```

打开 `http://localhost:5555`，你能：

- 按模型浏览/搜索/筛选记录
- 直接编辑字段值、删除行
- 关联模型（Post → author）导航点开
- 查看原始 JSON 字段

**定位**：它是"开发期的数据检查器"——`SELECT * FROM ... LIMIT 100` 的图形版。**不是管理后台**（没有权限系统、不做审计），生产环境数据不要依赖它去改。

> 💡 用得最多的两个时刻：写查询前**核对 seed 数据长什么样**；写完查询后**验证落库结果对不对**。比 psql 适合人眼。

---

## 3. Seed：稳定的初始数据

"每次新 clone 仓库、`migrate reset` 之后，库里有数据可以开发"——这就是 seed 的意义。

### 3.1 写一个 seed 脚本

```ts
// prisma/seed.ts
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "../src/generated/prisma/client"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  // 幂等：先清空再灌，保证可重复执行
  await prisma.post.deleteMany()
  await prisma.user.deleteMany()

  const alice = await prisma.user.create({
    data: { email: "alice@example.com", name: "Alice" },
  })
  await prisma.post.create({
    data: {
      title: "Prisma 入门",
      authorId: alice.id,
      tags: { create: [{ name: "orm" }] },
    },
  })
  console.log("seed done")
}

main().finally(async () => {
  await prisma.$disconnect()
})
```

### 3.2 配置 seed 命令

在 `prisma.config.ts` 里注册（Prisma 7 的口径，`migrations` 旁边：

```ts
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "bunx tsx prisma/seed.ts",   // v7: seed 命令注册在 prisma.config.ts（v6 是在 package.json，见下方版本提示）
  },
  datasource: { url: env("DATABASE_URL") },
})
```

> ⚠️ **版本提示**：seed 注册位置在 v6→v7 有变动——v6 写在 `package.json` 的 `"prisma": { "seed": ... }`，v7 收进 `prisma.config.ts` 的 `migrations.seed`（用 `bunx tsx` 跑 TS 脚本，需 `bun add -d tsx`）。若你本地 `db seed` 不好使，以你安装版本对应的[官方 seed 文档](https://www.prisma.io/docs/orm/prisma-migrate/workflows/seeding)为准。

执行：

```bash
bunx prisma db seed
```

```bash
# 常用组合：重置 + 迁移 + seed，一条命令恢复可开发状态
bunx prisma migrate reset    # 会问是否要 reset，选 Yes 后自动(或加 --force)
```

---

## 4. seed 的最佳实践

| 要点 | 原因 |
|------|------|
| **幂等**（先 deleteMany 再建） | 多次执行不炸、结果可预期 |
| 只造"能跑起来的量" | seed 不是压测数据源，几十条即可 |
| 数据贴近真实形状 | 字段格式、关联关系要像生产，才能暴露类型/查询问题 |
| 与环境隔离 | 只跑在 dev/staging，绝不指向生产库（DATABASE_URL 别混） |
| 配合 migrate reset | 让"全新环境 → 可开发"一键完成 |

---

## 5. 练习（要求 + 提示 + 预期效果）

**要求**：① 写一个 seed 脚本：3 个用户、每个用户 2 篇文章、标签若干；② 注册 seed 命令并运行两次，确认**第二次不减反增的行为被幂等处理**（记录数不变）；③ 用 Studio 核对自己的数据。

**提示**：deleteMany 顺序注意外键（先删子表再删父表）；用 `prisma.$transaction([...])` 包批量写入更稳。

**预期效果**：`migrate reset` 之后一条命令即可恢复到可开发状态，你能熟练在 Studio 里查改数据。

---

## 6. 面试问答

> **问：seed 脚本为什么要幂等？**

**答：** `migrate reset`/CI 会反复触发 seed，非幂等会导致第二次执行撞唯一约束抛错、或数据翻倍。幂等（先清后建）保证**任何次数执行结果一致**，这是"可重复环境"的基本要求。

> **追问：seed 和生产数据混在一起会怎样？**

**答：** 最危险的是 DATABASE_URL 指到生产库——`deleteMany()` 会清掉真实数据。工程上 seed 脚本的库地址要用独立 env（如 `SEED_DATABASE_URL`）、并在 CI/dev 环境明确 domain（staging），生产环境禁止 `db seed`/`migrate reset`。

> **问：Studio 能做生产数据修改吗？**

**答：** 技术上能（它就是一个数据库 client），但设计上不建议：Studio 没有任何权限/审计/回滚能力。生产数据的运维改动应走受控变更（迁移文件、维护脚本、双人复核），Studio 留给开发环境看数据、查问题。

---

## 7. 三角对比

| 维度 | **Prisma Studio** | psql 命令行 | 管理后台（自定义） |
|------|------------------|-------------|--------------------|
| 上手 | 可视化零成本 | 要记 SQL | 要写代码 |
| 数据编辑 | 点几下 | SQL DML | 表单 |
| 适合环境 | 开发看数据 | 脚本/运维 | 产品化后台 |

下一篇 [09-实战整合](09-实战整合-REST-API.md)：把 01-07 全串起来做成真正的后端。