---
name: concurrency
title: Go 并发编程
description: 用 goroutine/channel/select 写安全并发：WaitGroup、worker pool、关闭 channel 纪律、防数据竞争。当用户要写/review Go 并发代码时使用。
tags: [go, concurrency, goroutine, channel]
---

# Go 并发编程

一句话定位：用"通过通信共享内存"把并发写对 —— 何时加 `go`、如何同步、怎么正确关闭 channel、怎样防数据竞争。

## 什么时候用
- 并发执行一批任务再汇总（URL 检查、批量请求）。
- 生产者-消费者、固定并发度的 worker pool。
- 多路 channel 上等"先到者"（超时、取消）。
- 判断某段并发代码是否有数据竞争。

## 怎么做（核心步骤）

### 1. 启动 + 等待（WaitGroup）
```go
var wg sync.WaitGroup
for _, item := range items {
    wg.Add(1)
    go func(it T) {        // 👈 传参，不要闭包捕获循环变量
        defer wg.Done()
        handle(it)
    }(item)
}
wg.Wait()                  // 阻塞直到计数器归零
```

### 2. channel 通信
```go
ch := make(chan int)        // 无缓冲：同步，收发必须配对
ch := make(chan int, 5)     // 有缓冲：异步队列
ch <- v                     // 发送
v, ok := <-ch               // 接收；ok=false 表示已关闭
```

### 3. select 多路复用
```go
select {
case v := <-ch1:   // 任一就绪即执行
case v := <-ch2:
case <-time.After(3 * time.Second): // 超时兜底
case <-ctx.Done(): // 取消传播
default:           // 全部未就绪且非阻塞
}
```

### 4. Worker Pool（固定并发度）
```go
func workers(n int, jobs <-chan Job, results chan<- Result) {
    var wg sync.WaitGroup
    for w := 0; w < n; w++ {
        wg.Add(1)
        go func() {
            defer wg.Done()
            for j := range jobs { results <- process(j) }
        }()
    }
    go func() { wg.Wait(); close(results) }()
}
// 只发送者 close(jobs)；消费者用 for range 自动退出
```

### 5. 单向 channel 声明（约束职责）
```go
func producer(ch chan<- int) // 只发送：chan<-
func consumer(ch <-chan int) // 只接收：<-chan
```

## 常见坑 ⚠️
| 错误做法 ❌ | 后果 | 正确做法 ✅ |
|------------|------|------------|
| 闭包捕获 `for` 循环变量 | 多个 goroutine 读到同一切片/更新值，结果错乱 | 显式传参复制副本<br>（Go 1.22+ `for` 已每轮新变量，但为兼容旧版仍建议传参） |
| 向已关闭 channel 发送 | `panic: send on closed channel` | 遵循"**只由发送方关闭**" |
| 接收方关闭 channel | 发送方 panic 或篡改活跃 channel | 关闭责任永远在发送方 |
| 忘记 `defer wg.Done()` | WaitGroup 永久阻塞/泄漏 | `defer wg.Done()` 紧跟 `wg.Add(1)` |
| 多 goroutine 读写同变量 | 数据竞争（`go test -race` 报错） | 用 channel 传值，或 `sync.Mutex` 保护 |
| `go f()` 后不等待直接退出 | goroutine 没跑完程序已结束 | `wg.Wait()` 或 channel 等待 |

## 决策点
| 场景 | 推荐 | 理由 |
|------|------|------|
| 并发量小、要全部完成 | 每任务一个 goroutine + WaitGroup | 简单直接 |
| 并发量很大需限流 | buffered channel 令牌桶 / worker pool | 保护下游，稳定吞吐 |
| 等"第一个结果"或超时 | `select` | 非阻塞 + 超时兼顾 |
| 共享计数值/状态 | `sync.Mutex` 或 `sync/atomic` | 防数据竞争 |
| 单个阻塞结果 | channel 即可 | 无需 select |

## 参考：官方文档（核验用）🔗
| 关键点 | 官方文档 |
|--------|----------|
| 并发与多路复用 semantics | [Go 官方：Concurrency](https://go.dev/doc/effective_go#concurrency) |
| channel/sync 用法 | [The Go Blog](https://go.dev/blog/concurrency-is-not-parallelism) |
| Go 1.22 循环变量语义修正 | [Go 1.22 Release Notes](https://go.dev/doc/go1.22) |

## 一句话结论
- `for` 循环变量别闭包捕获（传参）；`wg.Add` 配对 `defer wg.Done`；只有发送方 close；并发改共享状态先跑 `go test -race`。