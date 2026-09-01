---
name: error-handling
title: Go 现代错误处理
description: 设计健壮的错误处理：哨兵错误、%w 包装保链、errors.Is/As、自定义错误类型、panic/recover 纪律。当用户要写/review Go 错误处理代码时使用。
tags: [go, errors, best-practices]
---

# Go 现代错误处理

一句话定位：把"错误当普通返回值显式处理"的哲学，落实为可检查、可包装、可区分的工程实践。

## 什么时候用
- 让函数返回合理错误而非 panic。
- 需要精确区分"未找到/无权限/超时"等错误种类。
- 想保留跨多层的错误上下文（谁调用了谁、原始错误是什么）。
- 决定某个场景该用 error 还是 panic。

## 怎么做（核心步骤）

### 1. 创建错误
```go
errors.New("something went wrong")            // 简单错误
fmt.Errorf("user %d not found", id)           // 带格式，无链
fmt.Errorf("read config: %w", err)            // %w 包装，保留原始错误
```

### 2. 定义哨兵错误（区分种类）
```go
var (
    ErrNotFound   = errors.New("not found")
    ErrPermission = errors.New("permission denied")
)
```
### 3. 包装 + 检查链（Go 1.13+）
```go
func findUser(id int) (*User, error) {
    if id < 0 {
        return nil, fmt.Errorf("find user: %w", ErrNotFound) // 上一层如果想判断就用 Is
    }
    ...
}

// 检查错误链中是否包含目标错误【值】
if errors.Is(err, ErrNotFound) { ... }
// 从错误链中提取目标错误【类型】
var valErr *ValidationError
if errors.As(err, &valErr) { /* 用 valErr.Field 等 */ }
```

| 函数 | 作用 | 类比 |
|------|------|------|
| `errors.Is(err, target)` | 链里是否存在目标**值** | 沿 cause 链做值判等（Java 无直接等价） |
| `errors.As(err, &target)` | 链里能否提取目标**类型** | Java `catch (SpecificException)` |
| `fmt.Errorf("...: %w", err)` | 包装并保留链 | 保留 cause |

> `errors.Is`/`errors.As` 会遍历整条包装链（每个 `%w` 一层），所以中间层只要用 `%w` 包装，终点的检查就能穿透。

### 4. 自定义错误类型（需要携带结构化字段）
```go
type ValidationError struct { Field, Message string }
func (e *ValidationError) Error() string {
    return fmt.Sprintf("validation failed on %s: %s", e.Field, e.Message)
}
// 调用方用 errors.As 提取明细
```

### 5. panic/recover —— 99% 别用
```go
// ✅ 合理：初始化彻底失败，程序无法继续
// ❌ 不合理：本可返回 error（如除零、JSON 解析）
// recover 只能在 defer 中，用于把 panic 拦截为普通错误（典型：HTTP 中间件兜底）
```

## 常见坑 ⚠️
| 错误做法 ❌ | 后果 | 正确做法 ✅ |
|------------|------|------------|
| 用 `%v` 而不是 `%w` 包装 | 丢失错误链，Is/As 失效 | 需要保链一律 `%w` |
| `err == ErrNotFound` 直接比较 | 若中间有 `%w` 包装则永远拼不上 | 用 `errors.Is(err, ErrNotFound)` |
| 用 `panic` 处理正常业务失败 | 一个请求打崩整个进程 | 一切可预期失败都返回 error |
| 吞掉错误 `_ , err :=` 却不处理 | 错误路径静默，排查无门 | 显式 `if err != nil` 处理或包装上抛 |
| API handler 把内部 error 原文透传给客户端 | 泄露内部实现，易被利用 | 改记日志，返回统一"Internal Error" |

## 决策点
| 场景 | 推荐 | 理由 |
|------|------|------|
| 只想表达"失败了" | `errors.New` / `fmt.Errorf` | 无需分类 |
| 要区分错误种类 | 包级哨兵错误 + `errors.Is` | 值比较防呆，跨包装可靠 |
| 要带上下文数据 | 自定义错误类型 + `errors.As` | 结构化取用字段 |
| 深层跨层传播 | `%w` 逐层包装 | 完整保留调用链，终端可穿透 |
| 底层 API（I/O、解析）边界 | 返回 error，绝不 panic | 让上层可决策 |

## 参考：官方文档（核验用）🔗
| 关键点 | 官方文档 |
|--------|----------|
| 错误链 Is/As/%w 语义 | [Working with Errors in Go 1.13](https://go.dev/blog/go1.13-errors) |
| "Errors are values" | [Errors are values](https://go.dev/blog/errors-are-values) |

## 一句话结论
- 错误走 `%w` 保链 + `errors.Is/As` 区分；可预期失败绝不 panic；API 边界用错误而非异常，且不上抛内部实现细节。