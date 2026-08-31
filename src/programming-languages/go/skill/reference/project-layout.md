---
name: project-layout
title: Go 项目结构与依赖管理
description: 搭建/改造 Go 工程：模块初始化、目录结构（cmd/internal/pkg）、包可见性、依赖纪律。当用户要初始化 Go 项目、定目录、管依赖时使用。
tags: [go, project, layout]
---

# Go 项目结构与依赖管理

一句话定位：把"怎么组织 Go 工程"从习惯变成纪律 —— 目录怎么摆、谁能被谁导入、依赖怎么锁，一次性做对。

## 什么时候用
- 新建 Go 工程要初始化模块、定目录结构。
- 组织多入口（CLI + 服务）、区分对外可复用包与内部实现。
- 判断 `internal/` / `pkg/` / `cmd/` 该放什么。
- 要加/清/订依赖版本。

## 怎么做（核心步骤）

### 1. 初始化模块
```bash
go mod init <module-path>   # 模块路径通常用仓库地址，如 github.com/you/url-checker
go version                  # 校验工具链
```
- `go.mod` 存 module 路径 + `go` 版本 + require 精确依赖。
- `go.sum` 记录依赖哈希，**提交进 Git**，保证可复现构建。

### 2. 目录结构（标准模板）
```
myapp/
├── go.mod  |  go.sum
├── main.go                 # 入口，尽量保持简短
├── cmd/                    # 多入口点（可选）：cmd/cli/main.go、cmd/server/main.go
├── internal/               # 内部包——外部禁止导入
│   ├── handler/  |  service/  |  repository/  |  middleware/
├── pkg/                    # 可导出的公共包（对外复用）
├── config/
├── api/                    # API 定义（OpenAPI/protobuf）
└── migrations/             # 数据库迁移 SQL
```

### 3. 包可见性（只有两个级别）
| 写法 | 可见性 | 说明 |
|------|--------|------|
| `Exported`（首字母大写） | 公开 | 其他包可 `import` 使用 |
| `unexported`（首字母小写） | 包内 | 其他包无法访问 |

没有 `public`/`private`/`protected` 关键字。

### 4. 依赖纪律
```bash
go get github.com/foo@v1.2.3  # 添加/锁定精确版本
go mod tidy                   # 清理未用依赖 + 补全缺失
go mod vendor                 # 依赖复制进 vendor/（离线构建用）
go mod download               # 预下载依赖到本地缓存
```
- 提交前务必 `go mod tidy`，保持 `go.mod` / `go.sum` 干净一致。

## 常见坑 ⚠️
| 错误做法 ❌ | 后果 | 正确做法 ✅ |
|------------|------|------------|
| 只提交 `go.mod` 忘 `go.sum` | 构建不可复现，团队拉不到一致依赖 | `go mod tidy` 后连带提交 `go.sum` |
| 把业务包放 `pkg/` 对外暴露 | 内部实现被误用、难以演化 | 内部实现一律放 `internal/` |
| 一个大 `main.go` 塞全部逻辑 | 不可测试、职责混乱 | 逻辑拆 `internal/`，入口只做装配与展示 |
| 不提交 `go.sum` 进 Git | 依赖哈希无保障 | 默认纳入版本控制 |

## 决策点
| 场景 | 推荐 | 理由 |
|------|------|------|
| 只有单个入口 | 顶部 `main.go` 即可 | 不需要 `cmd/`，别过度分层 |
| 多入口（CLI+Server） | `cmd/<name>/main.go` | 每个入口独立爆炸半径 |
| 仅供本项目使用的包 | `internal/` | Go 强制禁止外部导入，天然隔离 |
| 要给其他项目复用 | `pkg/` 或用独立 module | 明确对外契约 |
| 离线/严格交付 | `go mod vendor` | 依赖随源码提交，构建不依赖网络 |

## 一句话结论
- 业务实现放 `internal/` 强制隔离；可见性由首字母大小写决定；`go.sum` 必须进 Git；`go mod tidy` 是收尾必跑。