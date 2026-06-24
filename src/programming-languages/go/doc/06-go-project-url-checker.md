# 06 — 实战项目：URL 健康检查 CLI 工具

> 综合运用第 1-5 章的知识点 —— 从零搭建一个并发 URL 健康检查命令行工具。这是 Go 入门最重要的练习：**用标准库 + goroutine 写一个实用程序**。

---

## 项目概述

一个命令行工具，接收多个 URL，**并发**检查它们的 HTTP 状态码，输出可达性和响应时间。

### 涉及知识点一览

| 知识点 | 来自章节 | 在本项目中的使用 |
|--------|---------|----------------|
| `flag` 包 | 第 5 章 | 解析 `-timeout` 参数和 URL 列表 |
| `net/http` 客户端 | 第 5 章 | 发送 HTTP GET 请求 |
| goroutine | 第 4 章 | 并发检查多个 URL |
| `sync.WaitGroup` | 第 4 章 | 等待所有检查完成 |
| channel | 第 4 章 | 收集并发结果 |
| struct | 第 2 章 | `CheckResult` 结果结构体 |
| 方法 | 第 2 章 | 可考虑定义方法封装检查逻辑 |
| 函数作为参数 | 第 2 章 | 扩展时可传入自定义检查函数 |
| error 处理 | 第 3 章 | 处理请求超时、网络错误 |
| 时间处理 | 第 5 章 | `time.Now()` / `time.Since()` / `time.Duration` |
| `fmt.Printf` | 第 1 章 | 格式化输出表格 |

---

## 第 1 步：项目初始化

```bash
mkdir url-health-checker
cd url-health-checker
go mod init url-health-checker
```

---

## 第 2 步：定义数据结构

从结果结构体开始——**先定义数据，再写逻辑**（Go 的常见开发顺序）。

```go
// checker.go
package main

import (
    "net/http"
    "time"
)

// CheckResult 保存单个 URL 的检查结果
type CheckResult struct {
    URL        string        // 检查的 URL
    StatusCode int           // HTTP 状态码（0 表示请求失败）
    Duration   time.Duration // 请求耗时
    Err        error         // 错误信息（nil 表示成功）
}
```

**为什么定义 struct 而不是用多个 slice？**

```go
// ❌ 不推荐：多个并列的 slice，容易错位
var urls []string
var codes []int
var durations []time.Duration

// ✅ 推荐：一个 struct 切片，数据内聚
var results []CheckResult
```

---

## 第 3 步：实现单个 URL 检查函数

```go
// checker.go

// CheckResult 的 String 方法 —— 方便格式化输出
func (r CheckResult) String() string {
    if r.Err != nil {
        return fmt.Sprintf("%-30s %-8s %s", r.URL, "ERROR", r.Duration.Round(time.Millisecond))
    }
    return fmt.Sprintf("%-30s %-8d %s", r.URL, r.StatusCode, r.Duration.Round(time.Millisecond))
}

// CheckURL 检查单个 URL，返回 CheckResult
func CheckURL(url string, timeout time.Duration) CheckResult {
    start := time.Now()

    client := &http.Client{
        Timeout: timeout,
    }

    resp, err := client.Get(url)
    duration := time.Since(start)

    if err != nil {
        return CheckResult{
            URL:      url,
            Duration: duration,
            Err:      err,
        }
    }
    defer resp.Body.Close()

    return CheckResult{
        URL:        url,
        StatusCode: resp.StatusCode,
        Duration:   duration,
    }
}
```

**关键点说明**：

```go
// 1. 为什么用 time.Now() + time.Since() 而不是在 http.Client 里读？
//    因为我们要测量整个请求的完整耗时，包括 DNS 解析、TCP 连接等

// 2. 为什么要 defer resp.Body.Close()？
//    不关闭 Body 会导致连接泄漏（goroutine 泄漏的常见原因）

// 3. 为什么 StatusCode = 0 表示失败？
//    0 不是合法的 HTTP 状态码，可以作为"请求失败"的标记
```

---

## 第 4 步：实现并发检查

```go
// checker.go

// CheckURLs 并发检查多个 URL，通过 channel 返回结果
func CheckURLs(urls []string, timeout time.Duration) <-chan CheckResult {
    results := make(chan CheckResult, len(urls)) // 有缓冲 channel
    var wg sync.WaitGroup

    for _, url := range urls {
        wg.Add(1)
        go func(u string) {
            defer wg.Done()
            results <- CheckURL(u, timeout)
        }(url)
    }

    // 在另一个 goroutine 中等待所有检查完成，然后关闭 channel
    go func() {
        wg.Wait()
        close(results)
    }()

    return results
}
```

**并发模式解析**：

```
main goroutine
    │
    ├── 启动 goroutine 1 ──→ 检查 google.com ──→ 结果放入 channel
    ├── 启动 goroutine 2 ──→ 检查 github.com ──→ 结果放入 channel
    ├── 启动 goroutine 3 ──→ 检查 example.com ──→ 结果放入 channel
    │
    └── 等待 goroutine（wg.Wait）→ 关闭 channel
           │
           ▼
    for range results ──→ 从 channel 逐条接收结果并打印
```

**常见陷阱**：为什么要把 url 作为参数传入 goroutine？

```go
// ❌ 错误：循环变量陷阱
for _, url := range urls {
    go func() {
        // url 变量被所有 goroutine 共享！
        // 第一个 goroutine 开始执行时，url 可能已经被 for 循环更新了
        results <- CheckURL(url, timeout)
    }()
}

// ✅ 正确：传参复制
for _, url := range urls {
    go func(u string) {     // 每个 goroutine 都有自己的 u 副本
        results <- CheckURL(u, timeout)
    }(url)                  // 立即求值传入
}
```

---

## 第 5 步：编写 CLI 入口

```go
// main.go
package main

import (
    "flag"
    "fmt"
    "os"
    "strings"
    "time"
)

func main() {
    // 1. 解析命令行参数
    timeout := flag.Duration("timeout", 10*time.Second, "request timeout")
    flag.Parse()

    urls := flag.Args()
    if len(urls) == 0 {
        fmt.Println("Usage: go run main.go [-timeout=10s] <url1> <url2> ...")
        os.Exit(1)
    }

    // 2. 输出表头
    fmt.Printf("%-30s %-8s %s\n", "URL", "STATUS", "TIME")
    fmt.Println(strings.Repeat("-", 60))

    // 3. 并发检查 URL
    results := CheckURLs(urls, *timeout)

    // 4. 收集并输出结果
    var total, success, failed int
    for r := range results {
        total++
        fmt.Println(r.String())

        if r.Err != nil {
            failed++
        } else {
            success++
        }
    }

    // 5. 输出汇总
    fmt.Println(strings.Repeat("-", 60))
    fmt.Printf("Total: %d | Success: %d | Failed: %d\n", total, success, failed)

    // 6. 如果有失败，非零退出（CLI 约定）
    if failed > 0 {
        os.Exit(1)
    }
}
```

---

## 第 6 步：运行

```bash
# 基础用法
go run . https://google.com https://github.com https://example.com

# 输出：
# URL                            STATUS   TIME
# https://google.com             200      123ms
# https://github.com             200      85ms
# https://example.com            200      45ms
# ----------------------------------------------------------
# Total: 3 | Success: 3 | Failed: 0

# 带超时（某些 URL 可能超时）
go run . -timeout=3s https://google.com https://httpbin.org/delay/10

# 输出：
# URL                            STATUS   TIME
# https://google.com             200      120ms
# https://httpbin.org/delay/10   0        timeout
# ----------------------------------------------------------
# Total: 2 | Success: 1 | Failed: 1
```

---

## 项目结构

最终项目目录结构：

```
url-health-checker/
├── go.mod        # 模块定义（标准库项目，无外部依赖）
├── main.go       # CLI 入口：参数解析、输出格式化
└── checker.go    # 核心逻辑：CheckURL、CheckURLs、CheckResult
```

**为什么拆成两个文件？**

- `checker.go`：纯业务逻辑，**可复用、可测试**
- `main.go`：CLI 入口，只负责参数解析和展示

这体现了 Go 的一个设计原则：**业务逻辑与 UI/IO 分离**。

---

## 扩展练习

完成基础功能后，尝试以下扩展（按难度递增）：

### 扩展 1：添加并发限制（Worker Pool）

当前版本对所有 URL 同时发起请求。如果 URL 列表有 1000 个，可能把目标服务器打挂。

```go
// 用 Worker Pool 限制同时最多 5 个并发
const maxConcurrency = 5

func CheckURLsWithLimit(urls []string, timeout time.Duration, limit int) <-chan CheckResult {
    // ...
    // 提示：用 buffered channel 作为"令牌桶"控制并发数
}
```

### 扩展 2：支持 JSON 输出

```bash
go run . -json https://google.com https://github.com
```

JSON 输出便于集成到其他工具（比如 CI/CD 管道）。

### 扩展 3：定时监控模式

```bash
# 每 30 秒检查一次，持续 5 分钟
go run . -interval=30s -duration=5m https://google.com
```

适用于服务健康监控场景。

### 扩展 4：输出到文件

```bash
go run . -output=report.csv https://google.com https://github.com
```

CSV 格式，可以用 Excel/WPS 打开分析。

---

## 如何测试这个项目

```go
// checker_test.go
package main

import (
    "net/http"
    "net/http/httptest"
    "testing"
    "time"
)

func TestCheckURL_Success(t *testing.T) {
    // 用 httptest 创建本地测试服务器 —— 不依赖外部网络
    server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        w.WriteHeader(http.StatusOK)
    }))
    defer server.Close()

    result := CheckURL(server.URL, 5*time.Second)
    if result.Err != nil {
        t.Errorf("expected no error, got %v", result.Err)
    }
    if result.StatusCode != 200 {
        t.Errorf("expected 200, got %d", result.StatusCode)
    }
}

func TestCheckURL_Timeout(t *testing.T) {
    // 模拟慢响应：10 秒后才返回
    server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        time.Sleep(10 * time.Second)
        w.WriteHeader(http.StatusOK)
    }))
    defer server.Close()

    result := CheckURL(server.URL, 1*time.Second)
    if result.Err == nil {
        t.Error("expected timeout error, got nil")
    }
    if result.StatusCode != 0 {
        t.Errorf("expected 0 for timeout, got %d", result.StatusCode)
    }
}

func TestCheckURLs_Concurrent(t *testing.T) {
    // 创建多个本地测试服务器（每个模拟 1 秒延迟）
    var urls []string
    for i := 0; i < 3; i++ {
        server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
            time.Sleep(1 * time.Second)
            w.WriteHeader(http.StatusOK)
        }))
        defer server.Close()
        urls = append(urls, server.URL)
    }

    start := time.Now()
    results := CheckURLs(urls, 10*time.Second)

    count := 0
    for range results {
        count++
    }

    elapsed := time.Since(start)
    if count != len(urls) {
        t.Errorf("expected %d results, got %d", len(urls), count)
    }
    // 3 个请求各 1 秒，并发执行总耗时应远小于 3 秒
    if elapsed > 2*time.Second {
        t.Errorf("expected concurrent execution < 2s, took %v", elapsed)
    }
}
```

```bash
go test -v ./...
```

---

## 完成标准

- [ ] 能用 `go run . https://google.com https://github.com` 正常运行
- [ ] 能正确输出 URL、状态码、响应时间的格式化表格
- [ ] 能并发检查多个 URL（总耗时 ≈ 最慢的那个 URL）
- [ ] 能处理超时和网络错误（输出 ERROR 而不是 panic）
- [ ] 能使用 `-timeout` 参数控制超时
- [ ] 失败时以非零退出码结束
- [ ] 能通过 `go test` 运行测试
- [ ] （扩展）实现至少一个扩展练习

---

## 本章总结

### 你巩固了哪些知识点？

| 知识点 | 项目中怎么用的 |
|--------|-------------|
| `flag.Duration` | 解析 `-timeout` 参数 |
| `http.Client{Timeout}` | 自定义 HTTP 客户端超时 |
| `time.Now()` / `time.Since()` | 测量请求耗时 |
| `goroutine` | 每个 URL 一个 goroutine |
| `sync.WaitGroup` | 等待所有 goroutine 完成 |
| `chan CheckResult` | 收集并发结果 |
| `for range ch` | 从 channel 读取直到关闭 |
| `defer resp.Body.Close()` | 防止连接泄漏 |
| 格式化输出 | `fmt.Printf` 表格对齐 |
| 包结构 | 逻辑与入口分离（checker.go + main.go） |

### 推荐资源

- [Go by Example: HTTP Clients](https://gobyexample.com/http-clients)
- [Go by Example: Worker Pools](https://gobyexample.com/worker-pools)
- [Go by Example: Rate Limiting](https://gobyexample.com/rate-limiting)
- [Go by Example: Testing](https://gobyexample.com/testing)

---

*最后更新：2026年6月*
