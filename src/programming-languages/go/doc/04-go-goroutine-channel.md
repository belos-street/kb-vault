# 04 — Goroutine 与 Channel（Go 的杀手锏）

> 面向有 JS/TS/Python/Java 经验的全栈工程师。本章讲透 Go 最核心的并发武器 —— **goroutine**（轻量级线程）和 **channel**（通信管道）。

---

## 本章目标

- 理解 goroutine 与 OS 线程的本质区别
- 掌握 `go` 关键字启动 goroutine
- 掌握 `sync.WaitGroup` 同步多个 goroutine
- 掌握 channel 的创建、发送、接收、关闭
- 理解无缓冲 channel 与有缓冲 channel 的行为差异
- 掌握 `select` 多路复用 channel
- 掌握生产者-消费者、Worker Pool 等经典并发模式
- **建立起与 Java/JS/Python 的并发模型对照**

---

## 4.1 Goroutine —— 轻量级线程

### 4.1.1 启动一个 goroutine

```go
// 在函数调用前加 go 关键字，就在新的 goroutine 中执行
func sayHello() {
    fmt.Println("Hello from goroutine!")
}

go sayHello()  // 启动一个新的 goroutine

// 也可以用匿名函数
go func() {
    fmt.Println("Hello!")
}()
```

**与各语言对比**：

| Go | Java | JS | Python |
|----|------|-----|--------|
| `go f()` | `new Thread(() -> f()).start()` | `new Worker('worker.js')` | `threading.Thread(target=f).start()` |
| 2KB 栈，可创建数十万 | 1MB 栈，几千个就 OOM | 需要独立 Worker 文件 | GIL 限制，不适合 CPU 密集 |

### 4.1.2 Goroutine vs OS 线程

```
OS 线程 (~1MB 栈，固定)
┌──────────────────────────────────────┐
│  栈 (1MB，固定大小，创建慢、切换慢)    │
│  由 OS 内核调度（上下文切换 ~1μs）     │
│  最大几千个                          │
└──────────────────────────────────────┘

Goroutine (~2KB 栈，动态增长)
┌─────┐
│ 栈  │  ← 初始 2KB，按需增长到 GB 级别
│     │
│     │  ← Go runtime 调度（M:N 调度）
│     │     上下文切换 ~0.2μs
│     │     可创建数十万
└─────┘
```

```go
// 验证 goroutine 的轻量级 —— 创建 10 万个 goroutine
var wg sync.WaitGroup
for i := 0; i < 100_000; i++ {
    wg.Add(1)
    go func(id int) {
        defer wg.Done()
        // 每个 goroutine 只占 2KB~ 栈空间
        // 10 万个只占 ~200MB 内存
        _ = id
    }(i)
}
wg.Wait()
fmt.Println("100k goroutines done!")
```

### 4.1.3 主 goroutine 与退出

```go
// 重要：main 函数退出时，所有 goroutine 都会被强制终止！
func main() {
    go func() {
        fmt.Println("This may never print!")
    }()
    // main 函数立即结束，goroutine 来不及执行
}

// 解决办法：等待 goroutine 完成
func main() {
    go fmt.Println("Hello!")
    time.Sleep(time.Millisecond)  // 不优雅，但先凑合
}
```

---

## 4.2 同步 —— WaitGroup

```go
// sync.WaitGroup —— 等待一组 goroutine 完成
// 类似 Java CountDownLatch / JS Promise.all / Python threading.Barrier

func main() {
    var wg sync.WaitGroup

    for i := 1; i <= 5; i++ {
        wg.Add(1)  // 计数器 +1（通常放在启动 goroutine 之前）
        go func(id int) {
            defer wg.Done()  // goroutine 结束时计数器 -1
            time.Sleep(time.Duration(id) * 100 * time.Millisecond)
            fmt.Printf("Worker %d done\n", id)
        }(i)
    }

    wg.Wait()  // 阻塞直到计数器归零
    fmt.Println("All workers done!")
}
// 输出（顺序不定）：
// Worker 1 done
// Worker 3 done
// Worker 2 done
// Worker 4 done
// Worker 5 done
// All workers done!
```

**WaitGroup 的三个方法**：

| 方法 | 作用 | 类比 |
|------|------|------|
| `wg.Add(n)` | 计数器 +n | `countDownLatch = new CountDownLatch(5)` |
| `wg.Done()` | 计数器 -1 | `countDownLatch.countDown()` |
| `wg.Wait()` | 阻塞直到计数器 = 0 | `countDownLatch.await()` |

---

## 4.3 Channel —— 在 goroutine 之间通信

### 4.3.1 核心概念

> **"Do not communicate by sharing memory; instead, share memory by communicating."**
> — 不要通过共享内存来通信，而要通过通信来共享内存。

```go
// Channel 是一个有类型的管道：chan T 表示"可以发送和接收 T 类型值的管道"

// 创建 channel
ch := make(chan int)       // 无缓冲 channel（同步）
ch := make(chan int, 10)  // 有缓冲 channel（异步，容量 10）

// 发送与接收
ch <- 42      // 发送：把 42 发送到 ch
value := <-ch // 接收：从 ch 接收一个值

// 关闭
close(ch)
```

**Channel 的方向**：

```go
chan T          // 可读可写
chan<- T        // 只写（只能发送）
<-chan T        // 只读（只能接收）

// 函数参数中指定方向 —— 编译器强制执行！
func producer(ch chan<- int) {   // 只能写
    ch <- 1
}
func consumer(ch <-chan int) {   // 只能读
    <-ch
}
```

### 4.3.2 无缓冲 Channel（同步）

```go
// 无缓冲 channel：发送和接收必须同时发生！
// 发送方会阻塞，直到接收方准备好
// 接收方会阻塞，直到发送方准备好

ch := make(chan int)

// goroutine 1 发送
go func() {
    ch <- 42  // 阻塞，直到有人接收
    fmt.Println("sent 42")
}()

// main goroutine 接收
value := <-ch  // 阻塞，直到有人发送
fmt.Println("received:", value)

// 输出：
// received: 42
// sent 42
```

**无缓冲 channel 的行为**：

```
时间 → 
Goroutine A:    准备发送 ──→ 阻塞等待 ──→ 发送成功
                                        │
Goroutine B:                阻塞等待 ←───┘ 接收成功
```

### 4.3.3 有缓冲 Channel（异步）

```go
// 有缓冲 channel：发送方可以一直发，直到缓冲区满
// 接收方可以一直收，直到缓冲区空

ch := make(chan string, 3)

ch <- "A"   // ✅ 不阻塞（缓冲区有空间）
ch <- "B"   // ✅ 不阻塞
ch <- "C"   // ✅ 不阻塞
// ch <- "D" // ❌ 阻塞！缓冲区已满

fmt.Println(<-ch)  // "A"
fmt.Println(<-ch)  // "B"
fmt.Println(<-ch)  // "C"
// fmt.Println(<-ch) // ❌ 阻塞！缓冲区为空
```

**有缓冲 vs 无缓冲**：

| 特性 | 无缓冲 `make(chan T)` | 有缓冲 `make(chan T, n)` |
|------|----------------------|-------------------------|
| 行为 | **同步**：发送和接收必须同时配对 | **异步**：发送到缓冲区，接收从缓冲区取 |
| 发送方 | 阻塞直到接收方就绪 | 阻塞仅当缓冲区满 |
| 接收方 | 阻塞直到发送方就绪 | 阻塞仅当缓冲区空 |
| 类比 | 两个人握手（必须同时伸手） | 邮箱（发送方投递，接收方稍后取） |
| 场景 | 信号同步、goroutine 通信 | 流水线、生产者-消费者 |

### 4.3.4 关闭 Channel

```go
// 发送方可以 close 来通知接收方"没有更多数据了"
ch := make(chan int)

go func() {
    for i := 0; i < 5; i++ {
        ch <- i
    }
    close(ch)  // 关闭 channel，通知接收方结束
}()

// 方式一：带 ok 检测
for {
    value, ok := <-ch
    if !ok {
        break  // channel 已关闭
    }
    fmt.Println(value)
}

// 方式二：range 自动检测关闭（推荐）
for value := range ch {
    fmt.Println(value)
}
```

**关闭规则**：

| 操作 | 已打开的 channel | 已关闭的 channel |
|------|-----------------|-----------------|
| `ch <- v` 发送 | ✅ | ❌ panic |
| `<-ch` 接收 | ✅ 可能阻塞 | ✅ 返回零值 |
| `close(ch)` 关闭 | ✅ | ❌ panic |
| `range ch` | ✅ 正常遍历 | ✅ 立即结束 |

### 4.3.5 range 遍历 Channel

```go
// range channel：自动遍历直到 channel 关闭
func main() {
    ch := make(chan int)

    go func() {
        for i := 0; i < 5; i++ {
            ch <- i
        }
        close(ch)
    }()

    for n := range ch {
        fmt.Println(n)  // 0, 1, 2, 3, 4
    }
    fmt.Println("channel closed")
}
```

---

## 4.4 Select —— 多路复用

### 4.4.1 基本用法

```go
// select 等待多个 channel 中的一个就绪（类似 JS 的 Promise.race）
func main() {
    ch1 := make(chan string)
    ch2 := make(chan string)

    go func() {
        time.Sleep(1 * time.Second)
        ch1 <- "from ch1"
    }()
    go func() {
        time.Sleep(2 * time.Second)
        ch2 <- "from ch2"
    }()

    select {
    case msg1 := <-ch1:
        fmt.Println(msg1)
    case msg2 := <-ch2:
        fmt.Println(msg2)
    case <-time.After(3 * time.Second):
        fmt.Println("timeout")
    }
}
```

### 4.4.2 Select 的三种使用模式

```go
// 1. 非阻塞检查 —— 用 default 实现
select {
case msg := <-ch:
    fmt.Println("received:", msg)
default:
    fmt.Println("no message ready")  // 不阻塞
}

// 2. 超时控制 —— 用 time.After 实现
select {
case result := <-ch:
    fmt.Println(result)
case <-time.After(3 * time.Second):
    fmt.Println("timed out")
}

// 3. 无限循环监听多个 channel
for {
    select {
    case msg := <-incoming:
        fmt.Println("incoming:", msg)
    case <-quit:
        fmt.Println("quitting")
        return
    }
}
```

---

## 4.5 经典并发模式

### 4.5.1 生产者-消费者

```go
// 一个生产者，多个消费者
func producer(ch chan<- int) {
    for i := 0; i < 10; i++ {
        ch <- i
        fmt.Printf("produced: %d\n", i)
    }
    close(ch)
}

func consumer(id int, ch <-chan int, wg *sync.WaitGroup) {
    defer wg.Done()
    for n := range ch {
        fmt.Printf("consumer %d consumed: %d\n", id, n)
        time.Sleep(50 * time.Millisecond)  // 模拟工作
    }
}

func main() {
    ch := make(chan int, 3)  // 有缓冲 channel
    var wg sync.WaitGroup

    go producer(ch)

    // 启动 3 个消费者
    for i := 1; i <= 3; i++ {
        wg.Add(1)
        go consumer(i, ch, &wg)
    }

    wg.Wait()
}
```

### 4.5.2 Worker Pool（工作池）

```go
// 固定数量的 worker 处理任务队列 —— 类似 Java 的 ThreadPoolExecutor
func worker(id int, jobs <-chan int, results chan<- int) {
    for j := range jobs {
        fmt.Printf("worker %d processing job %d\n", id, j)
        time.Sleep(time.Second)  // 模拟耗时工作
        results <- j * 2
    }
}

func main() {
    const numJobs = 10
    const numWorkers = 3

    jobs := make(chan int, numJobs)
    results := make(chan int, numJobs)

    // 启动 3 个 worker
    for w := 1; w <= numWorkers; w++ {
        go worker(w, jobs, results)
    }

    // 发送 10 个任务
    for j := 1; j <= numJobs; j++ {
        jobs <- j
    }
    close(jobs)  // 通知 worker 没有更多任务了

    // 收集结果
    for r := 1; r <= numJobs; r++ {
        <-results
    }
}
```

### 4.5.3 Pipeline（流水线）

```go
// 多个 goroutine 通过 channel 串联成流水线
// 类似 Unix 的 pipe：gen → square → print

// 第 1 阶段：生成数字
func generate(nums ...int) <-chan int {
    out := make(chan int)
    go func() {
        for _, n := range nums {
            out <- n
        }
        close(out)
    }()
    return out
}

// 第 2 阶段：计算平方
func square(in <-chan int) <-chan int {
    out := make(chan int)
    go func() {
        for n := range in {
            out <- n * n
        }
        close(out)
    }()
    return out
}

// 第 3 阶段：打印
func main() {
    // pipeline: generate → square → print
    nums := generate(1, 2, 3, 4, 5)
    squares := square(nums)

    for s := range squares {
        fmt.Println(s)  // 1, 4, 9, 16, 25
    }
}
```

### 4.5.4 Fan-out / Fan-in

```go
// Fan-out（扇出）：多个函数从同一个 channel 读取
// Fan-in（扇入）：多个 channel 合并到同一个输出 channel
// 使用 WaitGroup 确保所有输入 channel 关闭后，输出 channel 也关闭

func fanIn(channels ...<-chan string) <-chan string {
    out := make(chan string)
    var wg sync.WaitGroup

    for _, ch := range channels {
        wg.Add(1)
        go func(c <-chan string) {
            defer wg.Done()
            for msg := range c {  // range 会在 channel 关闭后自动退出
                out <- msg
            }
        }(ch)
    }

    go func() {
        wg.Wait()    // 等待所有输入 goroutine 退出
        close(out)   // 关闭输出 channel，通知下游
    }()

    return out
}

// 使用示例：
func main() {
    ch1 := producer("A")
    ch2 := producer("B")
    merged := fanIn(ch1, ch2)

    for msg := range merged {  // 当 ch1 和 ch2 都关闭后，merged 也会关闭
        fmt.Println(msg)
    }
}
```

---

## 4.6 竞态条件与同步

### 4.6.1 数据竞态（Data Race）

```go
// ❌ 错误示例：多个 goroutine 同时读写变量
var counter int

func main() {
    var wg sync.WaitGroup
    for i := 0; i < 1000; i++ {
        wg.Add(1)
        go func() {
            defer wg.Done()
            counter++  // 竞态条件！多个 goroutine 同时写
        }()
    }
    wg.Wait()
    fmt.Println(counter)  // 可能不是 1000！
}
```

### 4.6.2 互斥锁 —— Mutex

```go
var (
    counter int
    mu      sync.Mutex  // 互斥锁
)

func main() {
    var wg sync.WaitGroup
    for i := 0; i < 1000; i++ {
        wg.Add(1)
        go func() {
            defer wg.Done()
            mu.Lock()
            counter++  // 加锁保护，同一时间只有一个 goroutine 能进入
            mu.Unlock()
        }()
    }
    wg.Wait()
    fmt.Println(counter)  // 1000 ✅
}
```

### 4.6.3 检测数据竞态

```go
// Go 内置竞态检测器！
// 运行：go run -race main.go
// 或：go test -race ./...

// 输出示例：
// WARNING: DATA RACE
// Read at 0x... by goroutine X:
//   main.main.func1()
// Previous write at 0x... by goroutine Y:
//   main.main.func2()
```

---

## 4.7 常见陷阱与最佳实践

### 陷阱 1：goroutine 中的循环变量

```go
// ❌ 错误
for i := 0; i < 5; i++ {
    go func() {
        fmt.Println(i)  // 可能全是 5！
    }()
}

// ✅ 正确：传参复制
for i := 0; i < 5; i++ {
    go func(id int) {
        fmt.Println(id)  // 0, 1, 2, 3, 4
    }(i)
}

// 或者捕获循环变量（Go 1.22+ 已修复此问题，旧版本需注意）
for i := 0; i < 5; i++ {
    i := i  // 创建副本
    go func() {
        fmt.Println(i)
    }()
}
```

### 陷阱 2：向已关闭的 channel 发送数据

```go
ch := make(chan int)
close(ch)
ch <- 42  // ❌ panic: send on closed channel
```

### 陷阱 3：goroutine 泄漏

```go
// ❌ goroutine 泄漏：没有 goroutine 从 ch 接收数据
func leak() {
    ch := make(chan int)
    go func() {
        <-ch  // 永远阻塞在此，goroutine 无法退出
    }()
    // 函数返回，但没有 goroutine 发数据到 ch
}

// ✅ 使用有缓冲 channel 或 context 取消
func safe() {
    ch := make(chan int, 1)  // 缓冲区大小 1
    go func() {
        <-ch
    }()
    ch <- 42  // ✅ 发送成功，goroutine 正常退出
}
```

### 最佳实践总结

| 实践 | 说明 |
|------|------|
| **谁创建，谁关闭** | 发送方负责关闭 channel |
| **不要在接收方关闭** | 向已关闭的 channel 发送会 panic |
| **明确 goroutine 生命周期** | 确保 goroutine 能正常退出，避免泄漏 |
| **优先用 channel 传递数据** | 而非共享变量 + 锁 |
| **用 WaitGroup 而不是 time.Sleep** | 显式等待优于盲目等待 |
| **`go run -race` 检测竞态** | 开发阶段始终开启竞态检测 |

---

## 本章总结

### 面试高频题

1. **goroutine 和 OS 线程的区别？**
   - 栈大小：goroutine ~2KB（动态增长），OS 线程 ~1MB（固定）
   - 调度：Go runtime（用户态）vs OS 内核（内核态）
   - 创建成本：极低（~1μs）vs 高（~1ms）
   - 数量：数十万 vs 数千

2. **无缓冲 channel 和有缓冲 channel 的区别？**
   - 无缓冲：同步，发送和接收必须同时进行
   - 有缓冲：异步，发送到缓冲区满才阻塞

3. **select 的作用是什么？**
   - 多路复用多个 channel
   - 结合 default 实现非阻塞检查
   - 结合 time.After 实现超时控制

4. **如何避免 goroutine 泄漏？**
   - 确保 goroutine 有明确的退出条件
   - 使用 context 做取消
   - 使用 WaitGroup 管理生命周期

5. **如何检测数据竞态？**
   - `go run -race` / `go test -race`

### 学习检查

- [ ] 能使用 `go` 关键字启动 goroutine
- [ ] 能使用 `sync.WaitGroup` 等待多个 goroutine 完成
- [ ] 能创建和使用无缓冲/有缓冲 channel
- [ ] 能使用 `range` 遍历 channel
- [ ] 能使用 `select` 多路复用 channel
- [ ] 能实现生产者-消费者和 Worker Pool 模式
- [ ] 理解并避免数据竞态和 goroutine 泄漏
- [ ] 能在开发中使用 `-race` 检测竞态

### 推荐资源

- [Go Blog: Share Memory By Communicating](https://go.dev/blog/codelab-share)
- [Go Blog: Pipelines](https://go.dev/blog/pipelines)
- [Go Blog: Go Concurrency Patterns](https://go.dev/talks/2012/concurrency.slide)
- [Go by Example: Goroutines](https://gobyexample.com/goroutines)
- [Go by Example: Channels](https://gobyexample.com/channels)

---

*最后更新：2026年6月*
