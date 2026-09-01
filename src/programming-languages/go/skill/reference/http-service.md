---
name: http-service
title: Go HTTP 服务与 Context
description: 用 net/http 写生产级服务：路由、JSON、中间件、Context 超时/取消、优雅关闭、连接与 Body 释放。当用户要写/review Go HTTP 服务或 Context 代码时使用。
tags: [go, http, context]
---

# Go HTTP 服务与 Context

一句话定位：用标准库搭起可上线的 HTTP 服务 —— 路由 + JSON + 中间件 + Context 传播 + 优雅关闭，并管住连接与 Body 的释放。

## 什么时候用
- 写 HTTP 服务器/客户端。
- 给 handler 加 JSON 编解码与 struct tag。
- 做超时/取消/请求级值传递（Context）。
- 实现优雅关闭（SIGTERM 时放走进行中的请求）。
- 写中间件（鉴权、recover、日志）。

## 怎么做（核心步骤）

### 1. 最小服务器
```go
mux := http.NewServeMux()
mux.HandleFunc("/", helloHandler)
http.ListenAndServe(":8080", mux)
```

### 2. JSON + struct tag
```go
type Person struct {
    Name string `json:"name"`
    Age  int    `json:"age"`
    City string `json:"city,omitempty"` // 空值忽略
}
data, _ := json.Marshal(p)
json.Unmarshal(body, &p2)
```
- tag 控制序列化字段名与取舍；`omitempty` 跳过零值字段。

### 3. Context：超时 / 取消 / 传值
```go
ctx := r.Context()                                    // 每个请求自带 ctx
ctx, cancel := context.WithTimeout(ctx, 3*time.Second)
defer cancel()
result, err := slowOp(ctx)                            // 阻塞函数都收 ctx
```
- 取消信号在调用链自动传播：DB 用 `QueryRowContext`，HTTP 客户端用 `req.WithContext(ctx)`，其一触发即整体中断并释放连接。
- 不确定该用哪个 ctx 时用 `context.TODO()` 占位（如 library 代码、移植期）；无取消需求直接传 `context.Background()`，**绝不传 nil**。

### 4. 优雅关闭
```go
server := &http.Server{Addr: ":8080", Handler: mux}
go func() { // 监听 SIGTERM/SIGINT → 优雅退出
    sig := make(chan os.Signal, 1)
    signal.Notify(sig, syscall.SIGTERM, syscall.SIGINT)
    <-sig
    ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
    defer cancel()
    if err := server.Shutdown(ctx); err != nil { log.Printf("shutdown error: %v", err) } // 等现有请求完成，丢弃新请求
}()
server.ListenAndServe() // 返回 http.ErrServerClosed 属正常退出
```

### 5. HTTP 客户端最佳实践
```go
client := &http.Client{Timeout: 5 * time.Second} // 永远设超时，防 http 挂死
resp, err := client.Get(url)
defer resp.Body.Close()   // 不关 Body → 连接泄漏
```

## 常见坑 ⚠️
| 错误做法 ❌ | 后果 | 正确做法 ✅ |
|------------|------|------------|
| 不设 `http.Client.Timeout` | 请求可能永久阻塞泄漏 | 一律设超时 |
| 忘记 `defer resp.Body.Close()` | 连接池耗尽（goroutine/连接泄漏） | 紧跟接收后 `defer` 关闭 |
| `ctx` 存进 struct / 传 nil | 生命周期失控、不可取取消 | 作为函数第一参数显式传递 |
| 创建 `WithTimeout` 后不 `defer cancel()` | 资源泄漏 | 每次 `cancel()` 必须释放 |
| 不用 `mux` 直接全局 `http.HandleFunc` | 路由全局污染，难测试 | 用 `NewServeMux` 注入 server |
| handler 内不判 ctx 取消 | 客户端断开后仍在跑重活 | select `<-ctx.Done()` |

## 决策点
| 场景 | 推荐 | 理由 |
|------|------|------|
| 超时/取消/传值 | `WithTimeout` / `WithCancel` / `WithValue` | Context 三用途 |
| 优雅关闭 | `signal.Notify` + `server.Shutdown` | 放行在途请求 |
| 鉴权/日志/恢复 | 中间件包 handler | 横切关注点复用 |
| 复杂路由 | chi / gin / echo | 标准库 mux 覆盖不足时再引入 |

## 参考：官方文档（核验用）🔗
| 关键点 | 官方文档 |
|--------|----------|
| net/http Server 与 Handler | [pkg.go.dev/net/http](https://pkg.go.dev/net/http) |
| Context 三条最佳实践 | [The Go Blog: Context](https://go.dev/blog/context-and-structs) |
| Signal + Shutdown 优雅退出模式 | [Go by Example: HTTP Servers](https://gobyexample.com/http-servers) |

## 一句话结论
- 标准库 `net/http` + mux 够用；JSON 用 struct tag；Context 永远第一参数且 `defer cancel()`；客户端/服务端都设超时并用 `defer Close` 防泄漏；配合 `Shutdown` 做优雅关闭。