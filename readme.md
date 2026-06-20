# kb-vault — 个人技术知识库

[![Obsidian](https://img.shields.io/badge/Obsidian-7C3AED?style=flat\&logo=obsidian\&logoColor=white)](https://obsidian.md)
[![GitHub](https://img.shields.io/badge/GitHub-181717?style=flat\&logo=github\&logoColor=white)](https://github.com)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](./LICENSE)

> 我的私人技术知识库 — 用 Obsidian 写作，Git + GitHub 托管，面向未来的 AI 知识检索系统。

***

## 这是什么？

一个**纯技术文档私有仓库**，专门存放：

- 📝 编程语言深度学习笔记
- 🏗️ 框架 & 中间件原理分析
- 🔍 开源项目源码阅读记录
- 🎯 架构设计与技术方案
- ☁️ DevOps & 云原生实践
- ⚡ 编程踩坑与经验沉淀

**不在这个仓库放**：业务代码、公司项目、配置文件密钥、大文件。

***

##

## 快速开始

```bash
# 克隆仓库
git clone git@github.com:<你的用户名>/kb-vault.git

# 切换到 dev 分支开始写作
git checkout dev

# 用 Obsidian 打开
# Obsidian → Open folder as vault → 选择 kb-vault 目录
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
