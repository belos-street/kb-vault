# kb-vault — 个人技术知识库

[![Obsidian](https://img.shields.io/badge/Obsidian-7C3AED?style=flat\&logo=obsidian\&logoColor=white)](https://obsidian.md)
[![GitHub](https://img.shields.io/badge/GitHub-181717?style=flat\&logo=github\&logoColor=white)](https://github.com/belos-street/kb-vault)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](./LICENSE)

> 我的私人技术知识库 — 用 Obsidian 写作，Git + GitHub 托管，VitePress 发布为静态站点。

**在线站点**：<https://belos-street.github.io/kb-vault/>

***

## 这是什么？

一个**纯技术文档私有仓库 + 可发布的知识站点**，专门存放：

- 📝 编程语言深度学习笔记
- 🏗️ 框架 & 中间件原理分析
- 🔍 开源项目源码阅读记录
- 🎯 架构设计与技术方案
- ☁️ DevOps & 云原生实践
- ⚡ 编程踩坑与经验沉淀

**不在这个仓库放**：业务代码、公司项目、配置文件密钥、大文件。

`src/` 下的 Markdown 由 VitePress 构建成站点：侧边栏 / 导航按目录树自动生成，支持 Obsidian 双链、Mermaid、LaTeX 与本地全文搜索；英语、数学、Agent 等练习平台是独立构建的 React SPA，挂在同一站点的子路径下。

***

## 快速开始

```bash
# 克隆仓库
git clone git@github.com:belos-street/kb-vault.git

# 切换到 dev 分支开始写作
git checkout dev

# 用 Obsidian 打开
# Obsidian → Open folder as vault → 选择 kb-vault 目录

# 本地预览站点（需要 Bun）
bun install
bun run dev
```

### 多端写作

```bash
# 写作前先拉取
git pull --rebase origin dev

# 写作完成后提交
git add .
git commit -m "feat: 新增 xxx 笔记"

# 推送前再次拉取，防止冲突
git pull --rebase origin dev
git push origin dev
```

### 安卓端同步

手机单向拉取 GitHub 知识库的方法见 [`sync/android.md`](./sync/android.md)。

***

## 在线站点

知识库主站与 5 个配套学习平台统一发布在 GitHub Pages，共用 `https://belos-street.github.io/kb-vault/` 前缀：

| 子路径            | 平台                                                 | 说明                                                            |
| -------------- | -------------------------------------------------- | ------------------------------------------------------------- |
| `/`            | [kb-vault](https://belos-street.github.io/kb-vault/) | VitePress 知识库主站，收录 `src/` 下全部笔记                                |
| `/lexio/`      | [Lexio](https://belos-street.github.io/kb-vault/lexio/) | 通用英语练习平台：课文朗读、拼写 / 默写 / 听写、八题型练习，进度存本地                        |
| `/grammar-play/` | [grammar-play](https://belos-street.github.io/kb-vault/grammar-play/) | 语法学习平台：读 → 拆 → 判的语法认知训练，精讲 + 分层随堂练习                           |
| `/grammar-course/` | [grammar-course](https://belos-street.github.io/kb-vault/grammar-course/) | 语法微课平台：以微课为单位组织的语法课程                                          |
| `/calculus/`   | [calculus](https://belos-street.github.io/kb-vault/calculus/) | 高等数学（数二）学习台：讲义 + 可交互函数图像演示 + 分步练习                              |
| `/agent-fullstack/` | [agent-fullstack](https://belos-street.github.io/kb-vault/agent-fullstack/) | AI Agent 全栈讲义（React 交互版）                                       |

***

## 部署

推送到 `main`（改动命中 `src/**`、`.vitepress/**`、`package.json` 或 workflow 自身）时自动触发 [`.github/workflows/deploy.yml`](./.github/workflows/deploy.yml)，也可在 Actions 页 `workflow_dispatch` 手动执行：

1. 用 `oven-sh/setup-bun@v2` 安装 Bun，装依赖后 VitePress 构建知识库主站
2. 依次构建 5 个子应用：各自跑 `validate` / 类型检查 / lint / 测试，再以 `--base=/kb-vault/<name>/` 构建
3. 子应用产物汇总进 `.vitepress/dist` 的对应子目录，整体上传并发布到 GitHub Pages

***

## 规范

- **Commit Message**：`feat` / `docs` / `fix` / `refactor` / `chore`
- **分支**：`main`（稳定） + `dev`（日常写作）
- **文件命名**：英文短横线连接（如 `spring-ioc-source-analysis.md`）
- **图片**：放在 `assets/` 下，小图直接上传，大图用外部图床

详细的仓库规范请阅读 [`agents.md`](./agents.md)。

***

## AI Agent 能力

本仓库内置了 `.agents/skills/` 目录，定义了可被 AI Agent 调用的技能：

| 技能                     | 说明               |
| ---------------------- | ---------------- |
| `vault-search`         | 智能检索笔记           |
| `vault-index`          | 生成知识库索引          |
| `knowledge-qa`         | 基于知识库的问答         |
| `note-check`           | 笔记质量检查（死链、缺失图片等） |
| `git-commit`           | 规范化的 Git 提交      |
| `doc-quality-reviewer` | 六维评分模型审查教学文档质量   |

***

## 注意事项

- ❌ **绝不提交**：密钥、Token、密码、公司机密、大文件（PDF/压缩包/视频）
- ✅ **可以提交**：Markdown 笔记、小图片（< 1MB）、Obsidian 配置文件
- 👥 **私人仓库**：内容为个人观点和经验，不构成技术权威

***

## License

MIT © belos-street
