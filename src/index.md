---
layout: home

hero:
  name: KB Vault
  text: 个人技术知识库
  tagline: 源码级理解 × 系统化沉淀 —— 用 Obsidian 写作，用 VitePress 发布
  actions:
    - theme: brand
      text: 人工智能
      link: /artificial-intelligence/agent/agent-fullstack/readme
    - theme: alt
      text: 编程语言
      link: /programming-languages/c/doc/01-basic-syntax

features:
  - icon: 🤖
    title: 人工智能
    details: Agent 开发、RAG、机器学习与深度学习
    link: /artificial-intelligence/agent/agent-fullstack/readme
  - icon: 🧠
    title: 计算机科学
    details: 设计模式、算法与数据结构
    link: /computer-science/readme
  - icon: 🚀
    title: 部署与运维
    details: CI/CD、网络、Linux 与脚本
    link: /deploy/ci/ci-learning-outline
  - icon: 📖
    title: 英语
    details: 通用英语课程，按 book → unit → lesson 体系推进
    link: /english/readme
  - icon: 🖥️
    title: 前端
    details: React、Electron、可视化与工程化
    link: /front/readme
  - icon: 📐
    title: 数学
    details: 线性代数、微积分（考研向）
    link: /mathematics/readme
  - icon: ⌨️
    title: 编程语言
    details: Rust、JavaScript、C 的语言机制精读
    link: /programming-languages/c/doc/01-basic-syntax
  - icon: 🗄️
    title: 服务端
    details: Hono、Nest、Prisma 与数据库
    link: /server/db/prisma/readme
---

## 关于本库

这是 [belos-street](https://github.com/belos-street) 的个人技术知识库，源文件为 Obsidian Vault（`src/` 目录），通过 VitePress 构建为静态站点。

- **侧边栏与导航**按目录树自动生成，新增笔记无需改配置
- 支持 Obsidian 双链、Mermaid 图表、LaTeX 公式
- 页面右上角可全文搜索；「更新于」取自 Git 提交时间
- 英语课程配套练习平台 [Lexio](https://belos-street.github.io/kb-vault/lexio/)（拼读、默写与跟读，进度存本地）
