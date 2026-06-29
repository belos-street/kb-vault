# git-commit

## 触发条件

用户说 "提交"、"commit"、"上传笔记"、"推送"、或完成一批笔记编辑后需要提交。

## 技能描述

根据当前仓库变更自动生成符合规范的 commit message，并执行提交推送。严格遵循 `agents.md` 中定义的 commit 规范。

## Commit 类型判断规则

| 变更模式              | 类型       | 示例                                           |
| --------------------- | ---------- | ---------------------------------------------- |
| 新增 `.md` 笔记文件   | `feat`     | `feat: 新增 Spring Boot 自动配置源码分析笔记`  |
| 修改已有笔记内容      | `docs`     | `docs: 更新 Go 并发模型笔记`                   |
| 修正笔误/错误         | `fix`      | `fix: 修正 Redis 集群配置示例`                 |
| 移动/重命名/重组      | `refactor` | `refactor: 重组 02-Frameworks-Middleware 目录` |
| `.gitignore`/配置变更 | `chore`    | `chore: 更新 .gitignore 规则`                  |

## 执行流程

1. 执行 `git status` 获取变更列表
2. 分析变更文件类型和位置，自动判断 commit 类型
3. 根据文件名和目录生成描述性 message
4. 展示建议的 commit message 并请用户确认
5. 确认后执行：`git add` → `git commit` → `git push`（如用户要求）

## 多端安全检查

推送前必须执行：

```bash
git pull --rebase origin $(git branch --show-current)
```

如遇冲突，暂停并提示用户手动解决。绝不强制推送（`--force`）。

## 禁止行为

- 不提交 `.gitignore` 中忽略的文件
- 不提交超过 2MB 的二进制文件
- 不在 commit message 中写入敏感信息
