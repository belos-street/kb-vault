# Monorepo — 快速上手

> 定位：**工具速查**。一个仓库管多个包的最小可用方案：pnpm workspace 打底 + Turborepo 编排 + changesets 发版。
> 版本口径：pnpm 11 / Turborepo 2.x / changesets（验证时间：2026-09）。

***

## 学习目标

完成本模块后，你应该能够：

- 搭出 apps/packages 结构的 workspace，用 `workspace:` + `catalog:` + `--filter` 管好多包互引
- 写出正确的 turbo.json 任务管道，说清缓存哈希的输入集合，配 CI 增量构建
- 用 changesets 走通"攒变更 → 改版本 → 发包"循环

## 篇目

| 篇 | 内容 | 定位 |
| -- | ---- | ---- |
| [01-pnpm-workspace上手](doc/01-pnpm-workspace上手.md) | pnpm 结构原理 + workspace/catalog/filter + 幽灵依赖 | 教学 |
| [02-任务编排与发版](doc/02-任务编排与发版.md) | turbo.json 走读 + 缓存机制 + CI 增量 + changesets 三步走 | 教学 |

***

## 30 秒理解

| 问题 | 方案 |
| ---- | ---- |
| 多包怎么互相引用？ | pnpm workspace + `workspace:` 协议 |
| 多包怎么按依赖顺序构建、只构建改过的？ | Turborepo 任务管道 + 缓存 |
| 多包怎么发版改版本号？ | changesets |

**什么时候不需要**：只有一个应用、无共享包诉求 → 单仓库就好，别为了时髦上 monorepo。

---

## 选型速查

| 工具 | 一句话定位 | 什么时候用 |
| ---- | --------- | --------- |
| pnpm workspace | 包管理基础，硬链接省磁盘 | **必选**，一切的地基 |
| Turborepo | 任务编排 + 远程缓存 | 2+ 包、构建慢、CI 重复劳动 |
| Nx | 更重的全家桶（依赖图/生成器/插件体系） | 大型组织、多团队 |
| changesets | 声明式版本管理 + CHANGELOG | 要对外发包 |
| Lerna | 老牌，功能与 turborepo+changesets 重叠 | 新项目不建议再用 |

---

## pnpm workspace 快速上手

**第 1 步：声明 workspace**

```yaml
# pnpm-workspace.yaml（仓库根目录）
packages:
  - 'apps/*'
  - 'packages/*'
```

```
my-monorepo/
├── pnpm-workspace.yaml
├── package.json
├── apps/
│   ├── web/          # 前端应用（Vite + React）
│   └── admin/        # 另一个应用
└── packages/
    ├── ui/           # 共享组件库
    └── utils/        # 共享工具库
```

**第 2 步：包之间互相引用**

```jsonc
// apps/web/package.json
{
  "dependencies": {
    "@acme/ui": "workspace:*"    // 指向 packages/ui，软链接，改了即时生效
  }
}
```

> `workspace:*` = 锁定本地任意版本；`workspace:^` = 发包时转成 `^实际版本号`。

**依赖版本单一来源（catalog 协议）**——多个包共用 react/typescript 等依赖时，别在各包里各写版本号：

```yaml
# pnpm-workspace.yaml 里声明
catalog:
  react: ^19.2.0
  typescript: ^5.9.0
  zod: ^4.0.0
```

```jsonc
// 各包 package.json 里引用
{
  "dependencies": {
    "react": "catalog:"
  }
}
```

升级时只改 catalog 一处，全 workspace 生效（pnpm 9.5+ 引入，多包仓库标配）。

**第 3 步：常用命令**

```bash
pnpm install                     # 全 workspace 安装
pnpm -r run build                # 所有包按依赖顺序执行 build
pnpm --filter web dev            # 只跑 web 包的 dev
pnpm --filter @acme/ui build     # 只构建 ui 包
pnpm add zod --filter web        # 给 web 装依赖
pnpm add zod -r                  # 所有包装依赖
```

`--filter` 支持包名 / 目录 / git 变更（`--filter ...[origin/main]` = 受本次改动影响的包），组合出"只测改动相关包"的 CI 策略。

---

## Turborepo 快速上手

**装 + 配：**

```bash
pnpm add -Dw turbo
# 新仓库也可脚手架一步到位：pnpm create turbo
```

Turborepo 没有一次性初始化命令，接入 = 装包 + 手写一份 `turbo.json`（各包的 build/test/lint 脚本本来就在各自 package.json 里）：

```jsonc
// turbo.json（根目录）
{
  "tasks": {
    "build": {
      "dependsOn": ["^build"],        // 先构建上游依赖包
      "outputs": ["dist/**"]          // 缓存这些产物
    },
    "lint": {},                        // 无依赖，可并行
    "test": {
      "dependsOn": ["build"]
    }
  }
}
```

```bash
pnpm turbo build       # 全量构建，二次执行直接命中缓存
pnpm turbo build --filter=web   # 只构建 web 及其上游
```

核心心智：**Turborepo 不装依赖、不跑环境，只负责"按依赖图调度任务 + 哈希缓存"**。输入没变（代码/依赖/环境变量）→ 直接吐上次产物。

---

## changesets 快速上手

```bash
pnpm add -Dw @changesets/cli
pnpm changeset init          # 生成 .changeset/config.json
```

日常流程三步：

```bash
pnpm changeset               # ① 改完代码：声明哪些包、升什么版本（patch/minor/major）、写变更说明 → 生成一个 md 文件随代码一起提交
pnpm changeset version       # ② 发版时：消费所有 md → 更新各包版本号 + CHANGELOG
pnpm changeset publish       # ③ 发布到 npm（私有包跳过）
```

> 💡 独立版本模式（每个包自己升版本）是默认；要"所有包统一版本号"在 config 里设 `fixed: [["@acme/*"]]`。

---

## 常见踩坑

- **根 package.json 装了 devDependencies 却没 `-w`** → pnpm 会拒绝或装错位置，根目录装依赖必须 `pnpm add -Dw`
- **pnpm 11 不再读 package.json 的 `pnpm` 字段** → 构建脚本（如 postinstall）批准改写在 `pnpm-workspace.yaml` 的 `allowBuilds` 字段
- **幽灵依赖**：包 A 用了没声明进自己 package.json 的依赖（hoisting 时碰巧能用）→ pnpm 默认严格隔离，装不到就是好事，逼你显式声明
- **`workspace:*` 发布时忘转正式版本** → 用 `pnpm publish`（会自动替换成真实版本号），别用 `npm publish`
- **循环依赖构建卡死** → turbo 报错会指出环，先解环再谈构建

---

## 边界说明

- 包内构建工具（Vite / tsdown——Rolldown 系的库打包器，tsup 后继）→ [../vite/](../vite/readme.md)
- 各包的 lint/format 统一 → [../oxc/](../oxc/readme.md)
- CI 里的缓存与 filter 策略 → `src/deploy/ci/`
- 面试向原理深挖（pnpm 结构原理、turbo 缓存机制、changesets 优势）→ 两篇 doc 的面试节
