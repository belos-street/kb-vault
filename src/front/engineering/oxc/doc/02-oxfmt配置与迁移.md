# oxfmt — 配置、能力与 Prettier 迁移

> 对应大纲模块 2 | 预计时间：0.5 天
> 面试可答：formatter 的价值在于终结风格讨论——oxfmt 兼容 Prettier 风格且快两个数量级，多语言与排序能力内置。
> 前置阅读：[01-oxlint规则与插件](01-oxlint规则与插件.md)

---

## 学习目标

完成本篇后，你应该能够：

- 用一份 `.oxfmtrc.jsonc` 固化团队风格，并知道它与 Prettier 默认值的差异
- 用 `--migrate prettier` 完成存量项目迁移，判断哪些 Prettier 插件依赖无法替代
- 把 format 接进 CI 与提交前钩子，形成"不合规进不了仓库"的闭环

---

## 核心概念

### 1. formatter 的定位：风格问题不值得讨论

缩进几个空格、单双引号、换行位置——这些讨论的收益为零。formatter 的价值是**把"风格"从 code review 里彻底移除**：写的时候随便写，提交前一个命令统一。

oxfmt 在这个前提下加了两点：

- **快**：Rust 实现，整仓格式化秒级完成（Prettier 大仓库要分钟级）
- **聚合**：把过去"Prettier + eslint-plugin-import + prettier-plugin-tailwindcss + sort-package-json"的插件拼盘收进一个工具

### 2. 配置速查（含与 Prettier 的差异）

```jsonc
// .oxfmtrc.jsonc
{
  "semi": false,              // 无分号
  "singleQuote": true,        // 单引号
  "trailingComma": "none",    // 无尾逗号
  "arrowParens": "always",    // 箭头函数始终加括号
  "printWidth": 80,           // 行宽 80 —— ⚠️ oxfmt 默认 100（Prettier 默认 80），显式声明避免歧义
  "indentWidth": 2,           // 2 空格缩进
  "endOfLine": "lf"           // 跨平台必须锁 LF（配合 .gitattributes）
}
```

选项名与 Prettier 同名同义，**心智零成本迁移**。唯一要留意的默认值差异就是行宽。

### 3. 多语言支持

不再只是 JS/TS 的格式化器，一份配置管全仓：

| 文件类型 | 场景 |
| -------- | ---- |
| JSON / JSONC | 配置文件（tsconfig、.oxlintrc 等） |
| YAML / TOML | CI workflow、Cargo.toml |
| HTML / Vue | 模板缩进 |
| CSS | 样式表 |
| Markdown | 文档表格、列表（配合 kb-vault 这类纯 md 仓库很实用） |
| GraphQL | schema 文件 |

### 4. 内置排序能力（过去要靠插件拼盘）

以下能力开箱即用（具体选项名以 [oxc.rs](https://oxc.rs/docs/guide/usage/formatter) 官方文档为准）：

- **import 排序**：node 内置 → 三方 → 本地别名，组间自动空行（替代 `eslint-plugin-import` 的 order 规则）
- **Tailwind class 排序**：按官方推荐顺序重排 class 字符串（替代 `prettier-plugin-tailwindcss`）
- **package.json 字段排序**：name/description/... 固定骨架（替代 `sort-package-json`）

> 💡 排序是"纯机械变换"，放 formatter 比 linter 合理——linter 报错、formatter 直接改。

### 5. Prettier 迁移实操

```bash
# ① 读取现有 .prettierrc，生成对应 .oxfmtrc 配置
bunx oxfmt --migrate prettier

# ② 先 dry 看差异范围（不写盘）
bunx oxfmt --check .

# ③ 一次性全量格式化，单独成一个 commit（不要混功能改动！）
bunx oxfmt .
git commit -m "style: oxfmt 全量格式化（从 Prettier 迁移）"
```

**迁移边界检查清单**：

- [ ] 项目用了 Prettier 插件吗？→ 常用能力（排序类）oxfmt 已内置可平替；**冷门自定义插件无法迁移**，此类项目保留 Prettier 双跑
- [ ] 行宽默认值对齐了吗？→ 显式写 `printWidth`，别赌默认值
- [ ] `.gitattributes` 锁 LF 了吗？→ `* text=auto eol=lf`，否则 Windows 协作者会把 CRLF 混进来
- [ ] 全量格式化 commit 与功能 commit 分开了吗？→ 混在一起，diff 噪音会让这次变更 review 不了

### 6. 接线：CI 与提交前钩子

```jsonc
// package.json
{
  "scripts": {
    "fmt": "oxfmt .",
    "fmt:check": "oxfmt --check .",
    "lint": "oxlint",
    "lint:fmt": "oxfmt --check . && oxlint"
  }
}
```

提交前钩子（lefthook 示例）：

```yaml
# lefthook.yml
pre-commit:
  commands:
    format:
      glob: '*.{js,ts,tsx,vue,css,json,md}'
      run: bunx oxfmt {staged_files}
    lint:
      glob: '*.{js,ts,tsx}'
      run: bunx oxlint {staged_files}
```

CI 里只跑 `--check`（只读不改），本地钩子负责改——**CI 挂了说明有人绕过了钩子，重格式化一个 commit 即可，不要在 CI 里自动改再推**。

---

## 常见踩坑点

- **裸 `oxfmt` 会直接全仓写盘** → 默认行为就是格式化（既不是无操作也不是 `--check`），想先看差异加 `--check`；ignore 没配好前别对着生成产物目录裸跑
- **Markdown 表格被重排后 diff 巨大** → 正常现象（列对齐），文档仓库迁移时把 md 格式化单独一个 commit
- **同事 IDE 用 Prettier 扩展自动格式化** → 两个 formatter 打架；在 `.vscode/settings.json` 里把默认 formatter 设为 oxfmt 或禁用 format on save 由钩子接管
- **生成文件被格式化** → 产物目录（dist/generated）加进 ignore 列表

---

## 面试高频问题

1. 为什么"格式化"要交给工具而不是人？oxlint 和 oxfmt 的职责怎么分？
2. oxfmt 相对 Prettier 的取舍是什么？

## 面试回答模板

> **问：linter 和 formatter 的职责怎么分？**
> **答：** formatter 管"纯机械、无语义"的变换——缩进、引号、换行、排序，直接改文件；linter 管"有语义判断"的规则——未使用变量、逻辑陷阱、可访问性，报错让人修。判断标准：这个规则能不能无脑自动改而不改变语义。能 → formatter；需要理解代码意图 → linter。风格类规则放 linter 里（如 ESLint 的 stylistic）是历史包袱，迁移时整体关掉交给 oxfmt。

> **问：oxfmt 的取舍？**
> **答：** 换来速度与聚合（多语言 + 内置排序），付出的是插件生态——Prettier 的自定义插件体系它不支持。团队若依赖冷门插件（如特定模板语言的格式化）就暂时双跑；依赖的是常见能力（import 排序、Tailwind 排序）则可直接平替。选择依据是"你最缺的是速度还是某个插件"。

---

## 练习

1. **迁移演练**：找一个有 `.prettierrc` 的项目跑 `--migrate prettier`，diff 生成配置，列出三处与 Prettier 默认值不同的地方（至少能找到行宽）。
2. **排序验证**：写一段乱序 import + 乱序 Tailwind class 的组件，格式化前后 diff，确认排序生效。
3. **钩子闭环**：给项目配 lefthook，故意提交一个未格式化的文件，验证钩子自动修正后进仓库的是格式化版本。

**预期效果**：练习 1 产出一份"默认值差异"清单；练习 3 完整走通"脏提交 → 钩子修正 → 干净入库"。

---

## 本模块完成标准

- [ ] 能默写 oxfmt 与 Prettier 的默认值差异（行宽 100 vs 80）
- [ ] 说清"不支持 Prettier 插件"边界及双跑条件
- [ ] 走通一次迁移三连：migrate → 全量格式化（独立 commit）→ 钩子接管
