---
name: testing
title: Go 测试
description: 写标准库测试：表格驱动测试、httptest 测 handler、基准测试、-race/-cover、testify 断言。当用户要写/review Go 测试代码时使用。
tags: [go, testing, httptest, benchmark]
---

# Go 测试

一句话定位：用内置 `testing` 写出可维护、无外部服务依赖的测试 —— 表格驱动 + httptest + race/coverage。

## 什么时候用
- 给函数/单元写断言式测试。
- 测 HTTP handler（不启动真实服务器）。
- 做性能基准、并发竞态检测、覆盖率统计。

## 怎么做（核心步骤）

### 1. 命名规范
- 文件名 `xxx_test.go` 结尾；函数 `TestXxx(t *testing.T)` 开头。
- 与源码同一包即可（`package main`），能测未导出函数。

### 2. 表格驱动测试（Go 社区惯用）
```go
func TestAdd(t *testing.T) {
    tests := []struct { name string; a, b, want int }{
        {"positive", 1, 2, 3},
        {"zero", 0, 0, 0},
    }
    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) { // 子测试，失败定位清晰
            if got := Add(tt.a, tt.b); got != tt.want {
                t.Errorf("Add(%d,%d)=%d; want %d", tt.a, tt.b, got, tt.want)
            }
        })
    }
}
```
用 `t.Run` 分包命名，可单独 `go test -run TestAdd/zero`。

### 3. httptest 测 handler（不启动真实服务器）
```go
req := httptest.NewRequest("GET", "/hello?name=Go", nil)
rec := httptest.NewRecorder()
helloHandler(rec, req)
if rec.Code != http.StatusOK { ... }
if rec.Body.String() != "Hello, Go!" { ... }
// 测依赖外部网络/慢响应的逻辑，用 httptest.NewServer 起本地服务
```

### 4. 运行与质量关卡
```bash
go test                      # 当前包
go test ./...                # 所有子包
go test -run TestXxx         # 只跑某函数
go test -v                   # 详细输出
go test -race                # 竞态检测 —— 并发代码必跑
go test -cover               # 覆盖率
go test -bench=.             # 基准
```

### 5. 断言库（可选）
```go
// go get github.com/stretchr/testify
assert.Equal(t, 5, Add(2, 3))
assert.NotEqual(t, 0, Add(-1, 1))
assert.True(t, Add(1, 2) > 0)
```

## 常见坑 ⚠️
| 错误做法 ❌ | 后果 | 正确做法 ✅ |
|------------|------|------------|
| 测试依赖真实外部服务/网络 | 不稳定、慢、CI 难跑 | 用 httptest、stub、依赖注入替身 |
| 一个 `TestXxx` 罗列 50 个分支 | 定位失败靠肉眼看行号 | 表格 + `t.Run` 分包命名 |
| 写并发代码却跳过 `-race` | 数据竞争不报警，上线偶发崩溃 | 并发相关测试一律 `-race` |
| 只测 happy path | 错误/边界路径裸露 | 补错误分支与零值/越界用例 |

## 决策点
| 场景 | 推荐 | 理由 |
|------|------|------|
| 多输入多期望 | 表格驱动 | 加用例只加一行 |
| 测 handler/路由 | httptest.NewRecorder / NewServer | 免起服务器、隔离网络 |
| 并发安全 | 跑 `-race` | 捕捉数据竞争 |
| 需要更顺滑断言 | testify/assert | 省样板，语义清晰 |
| 性能回归 | `BenchmarkXxx` + `-bench` | 量化基线 |

## 参考：官方文档（核验用）🔗
| 关键点 | 官方文档 |
|--------|----------|
| testing 包与命名规则 | [pkg.go.dev/testing](https://pkg.go.dev/testing) |
| httptest 工具 | [pkg.go.dev/net/http/httptest](https://pkg.go.dev/net/http/httptest) |
| 测试工作流覆盖 | [Go Doc: Testing](https://go.dev/doc/code#Testing) |

## 一句话结论
- 测试内置且原生保持同包；优先表格驱动 + `t.Run`；handler 用 httptest；并发必开 `-race`；保持可测边界（依赖接口/注入，不连真实服务）。