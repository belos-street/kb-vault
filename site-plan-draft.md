# kb-vault 在线站点实现方案（bun + VitePress）

> 目标：在不改动知识库结构的前提下，把 `src/` 下的 Markdown 笔记渲染成可在线浏览的静态站点，支持本地开发、一键构建、CI 自动部署（GitHub Pages / Vercel 二选一）。
>
> 状态：**方案待确认**。下文是可执行细节 + 验收清单，确认后按 TODO 实施。

---

## 1. 可行性结论

**可行，且推荐这么做。** 依据：

| 关注点 | 结论 |
|--------|------|
| bun 运行 VitePress | ✅ VitePress 底层是 Vite，bun 1.1.38 可直接 `bun install` / `bun run`（脚本均走 bun） |
| 内容目录就是 `src/` | ✅ VitePress 支持 `srcDir: 'src'`，不要求改成 `docs/`，零迁移 |
| 站点扩展文件放哪 | ✅ 根目录建 `.vitepress/`（配置 + 插件 + 生成物），与笔记完全隔离 |
| Obsidian `[[wikilink]]` | ⚠️ VitePress 原生不解析，需一个小的 Vite 插件在渲染前转换（见 §5.2） |
| Mermaid / LaTeX 数学公式 | ⚠️ 默认不渲染，需挂两个 markdown-it 插件（见 §5.1） |
| 中文文件名 / 嵌套目录 | ✅ 原生支持（URL 自动编码），脚本按目录树生成侧边栏 |
| 私有仓库 × GitHub Pages | ⚠️ 免费版私有仓库不能启用 Pages；若如此直接用 Vercel（§7.2） |

180 个 Vue 组件约自尊重；本库规模（千篇笔记级别）静态预渲染无压力。

---

## 2. 目标与非目标

**目标**
- `bun run dev` 本地实时预览；`bun run build` 产出纯静态站点
- 侧边栏 / 顶部导航由脚本按目录树自动生成，新增笔记无需改配置
- Obsidian wikilink、Mermaid、LaTeX 均正常渲染
- 推送到 `main` 自动构建部署，可在线浏览

**非目标**（本期不做）
- 评论、登录、私密内容鉴权（知识库默认公开可读）
- 全文搜索仅用 VitePress 内置本地搜索（`local` provider），不上搜索引擎
- 不改造已有笔记的链接规范

---

## 3. 目录结构（新增部分，标 `+`）

```
kb-vault/
├── package.json                  +  站点依赖与脚本
├── bun.lock                      +  bun 锁文件
├── src/
│   ├── index.md                  +  站点首页（也兼容 Obsidian 打开）
│   └── ...                       现有内容原样不动
├── .vitepress/
│   ├── config.mts                +  主配置（srcDir/base/markdown/主题）
│   ├── sidebar.generated.mts     +  gen-sidebar 生成（gitignore）
│   ├── plugin/
│   │   └── obsidian-wikilinks.ts +  [[目标|别名]] → [别名](目标.md) 的 Vite 插件
│   └── dist/                     +  构建产物（已被全局 .gitignore 的 **/dist/ 覆盖）
├── scripts/
│   ├── gen-sidebar.ts            +  扫 src/**/*.md → 生成 sidebar + nav
│   └── check-links.ts            +  可选：死链检查（CI 门禁）
└── .github/
    └── workflows/
        └── deploy.yml            +  GitHub Pages CI（若选 Vercel 则用 vercel.json）
```

> 不需要新建 `docs/`，不需要改动 `.obsidian/`、`agents.md`、`README.md` 之外的文件（README 最后补一段使用说明）。

---

## 4. 依赖与脚本（package.json）

```json
{
  "name": "kb-vault",
  "private": true,
  "type": "module",
  "scripts": {
    "gen:sidebar":  "bun scripts/gen-sidebar.ts",
    "dev":          "bun run gen:sidebar && vitepress dev .",
    "build":        "bun run gen:sidebar && vitepress build .",
    "preview":      "vitepress preview .",
    "check:links":  "bun scripts/check-links.ts"
  },
  "devDependencies": {
    "vitepress": "^1.6.0",
    "vitepress-plugin-mermaid": "^2.0.16",
    "mermaid": "^11",
    "markdown-it-mathjax3": "^4.3.2"
  }
}
```

安装：

```bash
bun install
```

命令速查：

| 命令 | 作用 |
|------|------|
| `bun run dev` | 本地开发，默认 http://localhost:5173，改 md 热更新 |
| `bun run build` | 构建到 `.vitepress/dist/`，构建前自动重新生成侧边栏 |
| `bun run preview` | 本地预览构建产物（验证与线上一致） |
| `bun run check:links` | 死链检查（可选，CI 用它做门禁） |

---

## 5. 核心实现细节

### 5.1 `.vitepress/config.mts`

```ts
import { defineConfig } from 'vitepress'
import markdownItMathjax3 from 'markdown-it-mathjax3'
import { markdownItMermaid } from 'vitepress-plugin-mermaid'
import { obsidianWikilinks } from './plugin/obsidian-wikilinks'
import { nav, sidebar } from './sidebar.generated'

// GitHub Pages 子路径部署用 /kb-vault/；Vercel 根路径部署用 /
const base = process.env.VITE_BASE ?? '/'

export default defineConfig({
  lang: 'zh-CN',
  title: 'KB Vault',
  description: 'belos-street 的个人技术知识库',
  srcDir: 'src',
  base,
  outDir: '.vitepress/dist',
  lastUpdated: true,
  cleanUrls: false,
  vite: {
    plugins: [obsidianWikilinks()],
  },
  markdown: {
    config(md) {
      md.use(markdownItMathjax3) // $...$ / $$...$$
      md.use(markdownItMermaid)  // mermaid 图表
    },
  },
  srcExclude: [
    '**/skills/**', // 不收录 agent skill 文档（如 pixi/skills），想收录就删掉这行
    '**/node_modules/**',
    '**/assets/.gitkeep',
    '**/{package.json,bun.lock,tsconfig.json,.oxlintrc.json,.oxfmtrc.jsonc,vite.config.ts}',
    '**/*.{ts,js}',
    '**/*.db',
  ],
  themeConfig: {
    nav,
    sidebar,
    outline: { level: [2, 3], label: '本页目录' },
    search: { provider: 'local' },
    lastUpdated: { text: '更新于' },
    socialLinks: [{ icon: 'github', link: 'https://github.com/belos-street/kb-vault' }],
    docFooter: { prev: '上一篇', next: '下一篇' },
  },
})
```

要点：
- `srcDir: 'src'` 让 VitePress 直接把知识库当内容根；新增笔记即新增页面。
- `srcExclude` 只影响**页面/静态资源收录**，不影响本地文件本身——笔记目录里的代码工程（如 `design-patterns/src/`）保留在仓库但不进站点。
- `base` 由环境变量控制，同一套配置兼容两种部署平台。

### 5.2 Obsidian wikilink 转换插件（`.vitepress/plugin/obsidian-wikilinks.ts`）

现状：已发现 `src/programming-languages/`、`src/artificial-intelligence/.../04-RAG架构原理与实践.md` 等约 10 个文件使用 `[[outline|← 返回目录]]`、`[[02-ownership-borrowing|第 2 章：…]]` 语法。VitePress 不认，需在渲染前转成标准 md 链接。

思路：Vite 插件在 `transform` 阶段改写 `.md` 源码，构建前扫一遍全库建「文件名 → 路径」索引：

```
继续处理 [[目标#锚点|别名]] / ![[图片.png]]
解析顺序：同目录直查 → 全库 basename 唯一匹配 → 找不到则保留原文并打 warning
输出：[别名](相对路径.md#锚点)  /  ![](相对路径.png)
```

核心逻辑（实现时约 40 行）：

```ts
const RE = /!?\[\[([^\]|#]+)(?:#([^\]|]*))?(?:\|([^\]]*))?\]\]/g

transform(code, id) {
  if (!/\.md$/.test(id) || !id.startsWith(vaultRoot)) return
  return code.replace(RE, (_m, target, anchor, alias) => {
    const resolved = resolve(target, /* 同目录优先，索引兜底 */)
    const rel = 正斜杠相对路径from(dirname(id), resolved) // posix
    const label = alias || target
    return url.startsWith('![')
      ? `![${label}](${rel}${anchor ? '#' + anchor : ''})`
      : `[${label}](${rel}${anchor ? '#' + anchor : ''})`
  })
}
```

同时处理 `![[image.png]]` 图片嵌入和同目录 `canon/outline.md` 这类相对引用。

### 5.3 自动侧边栏 / 导航（`scripts/gen-sidebar.ts`）

不写死目录，扫描 `src/` 树生成：

```ts
// 规则
// 1. 递归 src/ 下所有 *.md（跳过 srcExclude 同款名单）
// 2. 目录 → collapsible 分组，text 取目录名（去数字前缀）
// 3. 文件 → text 取文件首个 # 标题（回退为去 .md 的文件名），link 为相对路径
// 4. 同一目录下 readme.md 作为该分组的默认进入页
// 5. 顶层目录 → 同时生成 nav（没有 readme 的目录回退到第一篇笔记）
// 输出 → .vitepress/sidebar.generated.mts 导出 { nav, sidebar }
```

```bash
# 输出示例（节选）
# sidebar['/front/'] = [
#   { text: '前端', items: [
#     { text: '跨平台', items: [ { text: 'Electron', link: '/front/cross-platform/electron/' }, ... ] },
#     { text: 'CSS', items: [...] },
#   ]}
# ]
```

新增/删除笔记无需改配置，改 md 即生效（`dev`/`build` 前置执行该脚本）。

### 5.4 首页（`src/index.md`）

VitePress 要求 `srcDir` 下必须有 `index.md` 作首页（同时兼容 Obsidian 打开）。内容：仓库简介 + 七大分类卡片入口 + 使用说明，静态维护即可（分类固定，很少变动）。

```
src/ 顶层目录（用于首页与导航）：
artificial-intelligence · computer-science · deploy · front · mathematics · programming-languages · server
```

---

## 6. TODO 执行清单

### Phase 1 — 初始化骨架
- [ ] 根目录写 `package.json`（§4），`bun install`
- [ ] 建 `.vitepress/config.mts`（§5.1）
- [ ] 建 `src/index.md` 首页
- [ ] `bun run dev` 启动，抽样验证 3 个页面正常渲染

### Phase 2 — 脚本与兼容层
- [ ] 实现 `scripts/gen-sidebar.ts`，`bun run gen:sidebar` 产出 `sidebar.generated.mts`
- [ ] 实现 wikilink 插件（§5.2），验证 `programming-languages/rust/doc/01-basic-syntax.md` 的 `[[outline|← 返回目录]]` 可跳转
- [ ] 验证 Mermaid（抽查 `electron/doc/00-…md`）与 LaTeX（抽查含 `$...$` 的笔记）
- [ ] `bun run build` + `bun run preview` 全量过一遍，修 404/死链

### Phase 3 — 体验与质量（可选强化）
- [ ] 核对 `srcExclude` 名单跑出干净的 dist 体积
- [ ] 实现 `scripts/check-links.ts`，`bun run check:links` 输出死链报告
- [ ] 首页样式微调（深色模式跟随系统）

### Phase 4 — 部署（二选一，默认 GitHub Pages）
- [ ] **GitHub Pages**：按 §7.1 写 workflow 并完成首次部署
- [ ] **或 Vercel**：按 §7.2 建 `vercel.json` 并导入仓库
- [ ] 站点上线后，`README.md` 补充「在线浏览」小节
- [ ] `.gitignore` 追加 `.vitepress/sidebar.generated.mts`（生成物不提交）

### Phase 5 — 验收（见 §8 标准）

---

## 7. CI 部署

### 7.1 GitHub Pages（推荐，默认）

`.github/workflows/deploy.yml`：

```yaml
name: Deploy VitePress site to Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
        with:
          bun-version: latest
      - run: bun install --frozen-lockfile
      - run: bun run build
        env:
          VITE_BASE: /kb-vault/
      - uses: actions/upload-pages-artifact@v3
        with:
          path: .vitepress/dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

接入步骤（一次性）：
1. 推送本方案与 workflow 到 `main`
2. GitHub → Settings → Pages → **Source: GitHub Actions**
3. 构建成功后访问 `https://belos-street.github.io/kb-vault/`

> ⚠️ 前置条件：仓库须为 **public**（免费版私有仓库不支持 Pages）。本仓库当前是私有 or 公开需确认——若不是公开，直接走 7.2 Vercel（免费版支持私有仓库）。

### 7.2 Vercel（备选，私有仓库推荐）

根目录 `vercel.json`：

```json
{
  "framework": "vitepress",
  "installCommand": "bun install",
  "buildCommand": "bun run build",
  "outputDirectory": ".vitepress/dist"
}
```

接入步骤（一次性）：
1. vercel.com → Import Git Repository → 选 `kb-vault`
2. 无需额外配置；如需自定义域名，设置 `VITE_BASE = /`（默认即为 `/`）
3. 每次 push 到 `main` 自动部署，得到 `<project>.vercel.app`

---

## 8. 验收标准

- [ ] `bun run build` 零报错，`.vitepress/dist` 产出约 N 个页面（与 src 下 md 数量一致）
- [ ] `bun run preview` 下所有顶层分类可导航、返回主页正常
- [ ] wikilink 样例、Mermaid 图表、LaTeX 公式三处抽查渲染正确
- [ ] 中文文件名页面 URL 可访问（编码无 404）
- [ ] 部署后线上地址首页 + 任意一篇深层笔记可打开
- [ ] `git status` 无意外改动；新增文件均属 §3 白名单

---

## 9. 决策点（实施前确认）

1. **部署平台**：默认 GitHub Pages（仓库需公开）；若私有 → Vercel。本方案两套都写了，实施时按你确认的来。
2. **agent skill 文档**（`pixi/skills/` 等）默认不进站点，删除 `srcExclude` 里的 `'**/skills/**'` 一行即收录。
3. **代码文件进站点与否**：默认排除（`*.ts/js/package.json` 等）。若想让笔记里的 demo 代码在线上可点开，可调整为保留。
4. 方案执行的产物（`sidebar.generated.mts`）不提交，构建时自动再生，CI/本地行为一致。