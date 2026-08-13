# AGENT 快速理解项目

> **给 AI Agent 的导航文件** — 遍历本仓库前先读此文件，了解项目定位、目录结构、规范约定。

***

## 1. 项目定位

- **仓库名称**：kb-vault（Knowledge Base Vault）
- **用途**：纯个人技术知识私有库，存储技术文档、源码阅读笔记、框架学习、架构设计、编程踩坑、后端/开发类个人沉淀
- **编辑器**：Obsidian（Markdown 为主）
- **版本控制**：Git + GitHub 私有仓库
- **仓库隔离原则**：不混入任何业务代码、公司项目、生产环境配置

### 1.1 作者画像

- **角色**：前端 Leader / 全栈工程师 / Agent 开发工程师
- **专业**：计算机科学
- **主力技术栈**：TypeScript、JavaScript、Node.js、Bun 及 JS 生态架构体系
- **辅助语言**：Python、Rust、Go
- **已掌握（无需基础解释）**：前端工程化、Node 运行时、JS/TS 语言机制、全栈架构设计、AI Agent 开发
- **输出偏好**：源码级解释 > 概念科普；代码示例 > 纯文字描述；直接给结论和实现路径，少铺垫

## 2. 目录结构

```
kb-vault/
├── README.md                          # 仓库说明（给人看）
├── agents.md                          # Agent 导航（给 AI 看，即本文件）
├── .gitignore                         # Git 忽略规则
├── .obsidian/                         # Obsidian 配置目录（部分纳入版本控制）
├── .agents/                           # Agent 配置 & Skill 定义
│   ├── skills/                        # 可复用的 Agent Skill（详见第 9 节）
│   └── coding/                        # 编码参考知识库（源码学习、框架最佳实践等）
├── assets/                            # 全局附件（截图、流程图、小图片）
```

### 2.1 目录设计原则

| 原则        | 说明                                    |
| --------- | ------------------------------------- |
| 数字前缀      | `01`\~`07` 保证 Obsidian 文件列表中按技术分类有序排列 |
| 英文命名      | 分类名用英文，便于 GitHub 展示和命令行 `cd`          |
| 独立 assets | 每个分类有专属 `assets/` 存放该分类的截图和图片         |
| 全局 assets | 根目录 `assets/` 存放跨分类共享的附件              |

## 3. 文件命名规范

- Markdown 笔记：`标题英文-短横线连接.md`（如 `spring-ioc-source-analysis.md`）
- 中文笔记也允许：`标题中文.md`
- 图片附件：放在对应层级的 `assets/` 下，命名用 `分类-描述-序号.png`
- 禁止空格和特殊字符（`/ \ : * ? " < > |`）在文件名中

## 4. Git 规范

### 4.1 分支策略

| 分支     | 用途                    |
| ------ | --------------------- |
| `main` | 稳定主分支，长期可用的知识库        |
| `dev`  | 日常开发/写作分支，完成后合并到 main |

### 4.2 Commit Message 规范

```
feat: 新增 xxx 笔记/分类
docs: 文档更新
fix: 修正 xxx 笔记错误
refactor: 重构 xxx 目录结构/笔记
chore: 维护性操作（.gitignore 更新等）
```

### 4.3 多端协作流程

```
git pull --rebase origin main    # 1. 先拉取最新
# 本地编辑笔记...
git add .
git commit -m "feat: xxx"        # 2. 提交
git pull --rebase origin main    # 3. 再拉取（防止冲突）
git push origin main             # 4. 推送
```

## 5. 内容规范

### 5.1 允许提交（✅）

- 所有 `.md` 笔记文档
- 小型图片（`.png`, `.jpg`, `.gif`, `.svg`，建议 < 1MB）
- `.gitignore`, `README.md`, `agents.md` 等仓库配置
- Obsidian 目录/模板/外观配置（`.obsidian/` 中不含插件的部分）
- Agent Skill 定义文件

### 5.2 禁止提交（❌）

- 密钥、Token、密码、API Key（任何形式的凭据）
- 公司内部机密文档、业务代码
- 大文件：PDF、压缩包（`.zip`, `.tar.gz`）、安装包（`.dmg`, `.exe`）
- 视频文件（`.mp4`, `.mov`）
- `node_modules/`, `.terraform/`, `__pycache__/` 等依赖
- Obsidian 工作区状态文件（`workspace.json`, `workspace-mobile.json`）

### 5.3 数学公式规范

文档中的数学公式统一使用 **LaTeX** 语法：

| 位置   | 语法                              | 示例                                     |
| ---- | ------------------------------- | -------------------------------------- |
| 行内公式 | `$...$`                         | `$\sin x \sim x$`                      |
| 独立公式 | `$$...$$`                       | `$$\int_a^b f(x)dx$$`                  |
| 矩阵   | `\begin{matrix}...\end{matrix}` | `$\begin{matrix}1&2\\3&4\end{matrix}$` |

> ⚠️ **GitHub 兼容性**：`$` 前面如果是 CJK 字符（中文、逗号、冒号等），GitHub 的 math parser 会无法识别公式边界。**务必在 CJK 字符与** **`$`** **之间加一个空格**。例如 `，$` → `， $`，`：$` → `： $`，`、$` → `、 $`。

### 5.4 图表规范

文档中的技术绘图统一使用 **Mermaid** 语法：

| 图表类型 | Mermaid 关键字          | 适用场景         |
| ---- | -------------------- | ------------ |
| 架构图  | `graph` / `graph TB` | 系统架构、模块关系    |
| 流程图  | `flowchart`          | 业务流程、逻辑分支    |
| 时序图  | `sequenceDiagram`    | 交互流程、API 调用链 |
| 类图   | `classDiagram`       | 领域模型、类结构设计   |
| 状态图  | `stateDiagram-v2`    | 状态机、生命周期     |
| ER 图 | `erDiagram`          | 数据库关系建模      |

> **图片引用规则**：
>
> - 优先使用 Mermaid 内嵌代码块
> - 如需使用外部图片，仅允许以下来源：
>   - `https://` 协议的远程图片
>   - 本项目内的相对路径图片（`assets/` 或各分类下的 `assets/`）
> - 禁止使用 `http://` 非加密链接的图片

### 5.5 emoji 使用规范

- 文档中**适量使用 emoji** 提升阅读体验，用于提示语、关键结论、表格标记、行动号召等场景
- 推荐用法：`💡` 专业小提示、`📷` 摄影师私房话、`✅/❌` 正反对比、`🚀` 行动号召、`⚠️` 注意事项
- 注意克制：同一段落不超过 2~3 个 emoji，避免视觉噪音；同一符号在全文档中保持含义一致

### 5.6 项目 Demo / 示例代码技术栈

在学习文档中创建前端/全栈项目 Demo 时，**除非用户另有指定**，统一使用以下技术栈：

| 层面 | 选型 | 说明 |
|------|------|------|
| 包管理 & 运行时 | **Bun** | `bun install` / `bun run dev` / `bun test` |
| 语言 | **TypeScript**（strict） | `tsconfig.json` 开启 `strict: true` |
| 构建 / Dev Server | **Vite**（涉及前端时） | 纯 Node 后端项目可省略 |
| Lint | **oxlint** | 配置文件 `.oxlintrc.json` |
| Format | **oxfmt** | 配置文件 `.oxfmtrc.jsonc` |

**参考配置（创建新项目时直接复制）**：

- Lint：`src/artificial-intelligence/agent/agent-fullstack/projects/02-customer-service/.oxlintrc.json`
- Format：`src/artificial-intelligence/agent/agent-fullstack/projects/02-customer-service/.oxfmtrc.jsonc`

**代码风格要点**（由 oxfmt 配置决定）：

- 单引号、无分号、2 空格缩进
- 无尾逗号（`trailingComma: "none"`）
- 箭头函数始终加括号（`arrowParens: "always"`）
- 行宽 80、LF 换行

**项目初始化模板**：

```bash
mkdir <project-name> && cd <project-name>
bun init -y
bun add -d typescript vite oxlint oxfmt
# 复制参考配置 → .oxlintrc.json / .oxfmtrc.jsonc
# 如涉及前端：bun add -d @vitejs/plugin-react（或其他框架插件）
```

> ⚠️ `node_modules/` 不提交（已在 `.gitignore` 中忽略），但 `package.json` + lockfile 必须提交。

## 6. Obsidian 配置版本控制策略

| 纳入版本控制                      | 永久忽略                                                |
| --------------------------- | --------------------------------------------------- |
| `appearance.json`（主题设置）     | `workspace.json`（工作区布局，多端不同）                        |
| `hotkeys.json`（快捷键）         | `workspace-mobile.json`                             |
| `templates.json`（模板配置）      | 第三方插件源码                                             |
| `core-plugins.json`（核心插件开关） | `.obsidian/cache/`                                  |
| 自定义 CSS 片段                  | `.obsidian/plugins/`（建议用 `.gitignore` 忽略后用社区插件列表记录） |

## 7. 给 AI Agent 的遍历指南

1. **起点**：先读 `agents.md`（本文件），了解全局
2. **分类检索**：按 `01`\~`07` 数字前缀遍历分类目录
3. **笔记内链**：Obsidian `[[wikilink]]` 格式的链接，可解析为同仓库内相对路径
4. **忽略项**：`.gitignore` 中的内容无需关心；`.obsidian/` 中的配置仅在需要理解用户工作流时才读取
5. **上下文理解**：笔记中提到的 "源码" 引用通常是外部仓库路径，不在本仓库内

## 8. 未来规划

- 接入 MCP Agent 做智能问答、全文检索、内容摘要
- 通过 `.agents/skills/` 定义领域专用 Skill
- 可扩展 CI 自动检查笔记死链、图片引用完整性

***

## 9. Agent Skill 一览

`.agents/skills/` 目录存放可复用的 Agent Skill 定义文件。Skill 是预定义的能力模块，当用户发出特定指令时自动触发，执行标准化流程。

| Skill 文件                                                              | 触发场景                          | 功能说明                                         |
| --------------------------------------------------------------------- | ----------------------------- | -------------------------------------------- |
| [doc-quality-reviewer/](.agents/skills/doc-quality-reviewer/SKILL.md) | "review 文档质量"、"检查教程写得好不好"     | 六维评分模型审查教学文档，输出逐篇评分与改进建议                     |
| [syllabus-designer/](.agents/skills/syllabus-designer/SKILL.md)       | "设计教学大纲"、"规划教程章节"             | 设计教学文档大纲：六层递进分篇、每篇定位与要素分配、学习路径图，与 doc-quality-reviewer 共用验收标准 |
| [git-commit.md](.agents/skills/git-commit.md)                         | "提交"、"commit"、"推送笔记"          | 自动分析变更、生成符合规范的 commit message、执行提交推送         |
| [knowledge-qa.md](.agents/skills/knowledge-qa.md)                     | "这个知识点怎么理解"、"根据笔记回答 xxx"      | RAG 模式：先检索相关笔记，再基于笔记内容生成回答                   |
| [note-check.md](.agents/skills/note-check.md)                         | "检查笔记完整性"、"找死链"、"检查图片引用"      | 检测死链、缺失图片、空笔记、无标题笔记，输出健康报告                   |
| [vault-index.md](.agents/skills/vault-index.md)                       | "生成索引"、"列出所有笔记"、"知识库概览"       | 遍历 7 个分类目录，生成结构化的知识库索引视图                     |
| [vault-search.md](.agents/skills/vault-search.md)                     | "找一下 xxx 的笔记"、"搜索 xxx"        | 关键词/语义检索，返回匹配笔记列表及内容摘要                       |
| [grill-me/](.agents/skills/grill-me/SKILL.md)                         | "需求不清晰"、"帮我澄清需求"、`/grill-me`、`/grill-with-docs` | 四层递进式提问（业务目标 → 输入输出 → 边界异常 → 硬约束）澄清模糊需求，输出结构化需求摘要；`/grill-with-docs` 模式额外增量维护根目录 `CONTEXT.md` 持久化业务上下文 |
| [superpowers/](.agents/skills/superpowers/skill.md)                   | "头脑风暴"、"制定实施计划"、"执行计划"、"系统调试"、"代码评审" | obra/superpowers 开发工作流合集（14 个子 Skill）：方案设计 → 计划制定 → 计划执行 → TDD → 调试 → 评审 → 分支收尾全流程（含原 brainstorming 与 writing-plans） |
| [belos-street/](.agents/skills/belos-street/skill.md)                 | "遵循编码规范"、"按风格指南写代码"           | 个人编码习惯与最佳实践：命名规范、代码组织、代码风格、测试理念、LLM 编码指南     |

### Skill 使用示例

```
用户: "review 一下 d3/doc 的文档质量"
→ 触发 doc-quality-reviewer，六维评分输出审查报告

用户: "设计一份 D3.js 的教学大纲"
→ 触发 syllabus-designer，输出六层递进的篇目规划与学习路径图

用户: "提交一下今天的笔记"
→ 触发 git-commit，自动生成 commit message 并推送

用户: "D3 的 Update 模式是什么"
→ 触发 knowledge-qa，检索相关笔记后生成回答

用户: "这个需求我还没想清楚，帮我澄清一下"
→ 触发 grill-me，四层递进提问澄清需求，输出结构化需求摘要

用户: "我想做一个 Markdown 编辑器功能"
→ 触发 superpowers/brainstorming，探索需求 → 设计方案 → 输出规格文档

用户: "帮我制定这个功能的实施计划"
→ 触发 superpowers/writing-plans，将设计文档分解为 TDD 小步骤计划

用户: "按我的编码规范写这段代码"
→ 触发 belos-street，遵循命名规范和代码风格指南
```

### Skill 文件格式

- **单文件 Skill**：直接写在 `.agents/skills/xxx.md`，包含触发条件、执行流程、输出格式
- **多文件 Skill**：放在 `.agents/skills/xxx/` 目录下，主文件为 `SKILL.md`
- **Skill 合集**：`.agents/skills/xxx/` 下按子目录组织多个 Skill，入口为 `skill.md` 索引文件（如 `superpowers/`）

***

### `.agents/coding/` 说明

`.agents/coding/` 存放与编码相关的**参考学习资料**，不是自动触发的 Skill。例如框架最佳实践、运行时文档、源码阅读笔记等。当用户需要编写或 review 相关技术代码时，可主动参考该目录下的内容。
