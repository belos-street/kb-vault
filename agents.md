# AGENT 快速理解项目

> **给 AI Agent 的导航文件** — 遍历本仓库前先读此文件，了解项目定位、目录结构、规范约定。

---

## 1. 项目定位

- **仓库名称**：kb-vault（Knowledge Base Vault）
- **用途**：纯个人技术知识私有库，存储技术文档、源码阅读笔记、框架学习、架构设计、编程踩坑、后端/开发类个人沉淀
- **编辑器**：Obsidian（Markdown 为主）
- **版本控制**：Git + GitHub 私有仓库
- **仓库隔离原则**：不混入任何业务代码、公司项目、生产环境配置

## 2. 目录结构

```
kb-vault/
├── README.md                          # 仓库说明（给人看）
├── agents.md                          # Agent 导航（给 AI 看，即本文件）
├── .gitignore                         # Git 忽略规则
├── .obsidian/                         # Obsidian 配置目录（部分纳入版本控制）
├── .agents/                           # Agent 配置 & Skill 定义
│   └── skills/                        # 可复用的 Agent Skill 文件
├── assets/                            # 全局附件（截图、流程图、小图片）
├── 01-Programming-Languages/          # 编程语言
│   └── assets/                        # 分类附件
├── 02-Frameworks-Middleware/          # 框架 & 中间件
│   └── assets/
├── 03-Architecture-Design/            # 架构设计
│   └── assets/
├── 04-Source-Code-Reading/            # 源码阅读笔记
│   └── assets/
├── 05-DevOps-CloudNative/             # 运维 & 云原生
│   └── assets/
├── 06-Interview-Notes/                # 面试总结
│   └── assets/
└── 07-Tips-Pitfalls/                  # 踩坑随笔 & 经验沉淀
    └── assets/
```

### 2.1 目录设计原则

| 原则 | 说明 |
|------|------|
| 数字前缀 | `01`~`07` 保证 Obsidian 文件列表中按技术分类有序排列 |
| 英文命名 | 分类名用英文，便于 GitHub 展示和命令行 `cd` |
| 独立 assets | 每个分类有专属 `assets/` 存放该分类的截图和图片 |
| 全局 assets | 根目录 `assets/` 存放跨分类共享的附件 |

## 3. 文件命名规范

- Markdown 笔记：`标题英文-短横线连接.md`（如 `spring-ioc-source-analysis.md`）
- 中文笔记也允许：`标题中文.md`
- 图片附件：放在对应层级的 `assets/` 下，命名用 `分类-描述-序号.png`
- 禁止空格和特殊字符（`/ \ : * ? " < > |`）在文件名中

## 4. Git 规范

### 4.1 分支策略

| 分支 | 用途 |
|------|------|
| `main` | 稳定主分支，长期可用的知识库 |
| `dev` | 日常开发/写作分支，完成后合并到 main |

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

## 6. Obsidian 配置版本控制策略

| 纳入版本控制 | 永久忽略 |
|-------------|---------|
| `appearance.json`（主题设置） | `workspace.json`（工作区布局，多端不同） |
| `hotkeys.json`（快捷键） | `workspace-mobile.json` |
| `templates.json`（模板配置） | 第三方插件源码 |
| `core-plugins.json`（核心插件开关） | `.obsidian/cache/` |
| 自定义 CSS 片段 | `.obsidian/plugins/`（建议用 `.gitignore` 忽略后用社区插件列表记录） |

## 7. 给 AI Agent 的遍历指南

1. **起点**：先读 `agents.md`（本文件），了解全局
2. **分类检索**：按 `01`~`07` 数字前缀遍历分类目录
3. **笔记内链**：Obsidian `[[wikilink]]` 格式的链接，可解析为同仓库内相对路径
4. **忽略项**：`.gitignore` 中的内容无需关心；`.obsidian/` 中的配置仅在需要理解用户工作流时才读取
5. **上下文理解**：笔记中提到的 "源码" 引用通常是外部仓库路径，不在本仓库内

## 8. 未来规划

- 接入 MCP Agent 做智能问答、全文检索、内容摘要
- 通过 `.agents/skills/` 定义领域专用 Skill
- 可扩展 CI 自动检查笔记死链、图片引用完整性
