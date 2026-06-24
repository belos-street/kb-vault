# 05 — HTTP 服务与标准库（写实用程序）

> 面向有 JS/TS/Python/Java 经验的全栈工程师。本章带你领略 Go 标准库的强大 —— 很多场景不需要第三方依赖，标准库就够了。

---

## 本章目标

- 了解 Go 标准库的核心包及其用途
- 能用 `net/http` 编写 HTTP 服务器和客户端
- 能用 `encoding/json` 处理 JSON 序列化/反序列化
- 能用 `os` / `io` 进行文件 I/O
- 能用 `flag` 编写 CLI 工具
- 掌握 Go 的 `struct tag`（结构体标签）机制
- **完成综合实战：URL 健康检查 CLI 工具**

---

## 5.1 标准库概览

Go 的标准库极其强大，很多在 Java/Python/JS 中需要第三方库的功能，Go 标准库自带。

| 包 | 功能 | JS 类比 | Python 类比 | Java 类比 |
|----|------|---------|-------------|-----------|
| `fmt` | 格式化 I/O | `console.log` | `print` / `f-string` | `System.out.printf` |
| `net/http` | HTTP 客户端/服务器 | `fetch` / Express | `requests` / Flask | `HttpURLConnection` / Spring |
| `encoding/json` | JSON 编解码 | `JSON.parse` | `json` 模块 | `Jackson` / `Gson` |
| `os` / `io` | 文件/流操作 | `fs` | `open()` | `java.nio.file` |
| `time` | 时间处理 | `Date` | `datetime` | `LocalDateTime` |
| `sync` | 并发同步 | - | `threading` | `synchronized` / `Lock` |
| `flag` | CLI 参数 | `process.argv` / `yargs` | `argparse` | `args4j` |
| `strings` | 字符串操作 | `String` 方法 | `str` 方法 | `String` 方法 |
| `strconv` | 类型转换 | `Number()` / `String()` | `int()` / `str()` | `Integer.parseInt()` |
| `testing` | 测试框架 | `Jest` | `pytest` | `JUnit` |
| `context` | 上下文（超时/取消） | `AbortController` | - | 无原生等价物 |
| `log` | 日志 | `console` | `logging` | `log4j` |

**核心优势**：标准库覆盖了 Web 开发 90% 的日常需求，不需要像 JS 那样不断抉择框架。

---

## 5.2 HTTP 服务器

### 5.2.1 最简单的 HTTP 服务器（10 行）

```go
package main

import (
    "fmt"
    "net/http"
)

func helloHandler(w http.ResponseWriter, r *http.Request) {
    fmt.Fprintf(w, "Hello, %s!", r.URL.Path[1:])
}

func main() {
    http.HandleFunc("/", helloHandler)
    http.ListenAndServe(":8080", nil)
}
```

```bash
# 运行
go run main.go

# 测试
curl http://localhost:8080/World
# Hello, World!
```

**与传统框架对比**：
```
Express (JS):     app.get('/', (req, res) => res.send('Hello'))
Flask (Python):   @app.route('/') def hello(): return 'Hello'
Spring (Java):    @GetMapping("/") public String hello() { return "Hello"; }
Go 标准库:        http.HandleFunc("/", handler) + ListenAndServe(":8080")
```

### 5.2.2 Handler 与 HandlerFunc

```go
// http.Handler 是一个接口
type Handler interface {
    ServeHTTP(w http.ResponseWriter, r *http.Request)
}

// http.HandleFunc 注册一个函数作为 Handler
// 底层自动将函数转换为 Handler 类型
func handler(w http.ResponseWriter, r *http.Request) {
    w.Write([]byte("Hello"))
}

http.HandleFunc("/", handler)

// 以上等价于：
type myHandler struct{}
func (h myHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
    w.Write([]byte("Hello"))
}
http.Handle("/", myHandler{})
```

### 5.2.3 请求对象 —— `*http.Request`

```go
func handler(w http.ResponseWriter, r *http.Request) {
    // 方法
    fmt.Println(r.Method)     // GET, POST, PUT, DELETE...

    // URL
    fmt.Println(r.URL.Path)   // /users/123
    fmt.Println(r.URL.Query()) // map[id:[123]]

    // 路径参数（Go 没有原生路径参数，需要手动解析或使用第三方 router）
    // 比如：/users/123 → 从 r.URL.Path 中提取

    // Header
    fmt.Println(r.Header.Get("Content-Type"))

    // Body
    body, _ := io.ReadAll(r.Body)
    fmt.Println(string(body))

    // URL 查询参数 ID
    id := r.URL.Query().Get("id")
    fmt.Println(id)
}
```

### 5.2.4 响应对象 —— `http.ResponseWriter`

```go
func handler(w http.ResponseWriter, r *http.Request) {
    // 设置状态码
    w.WriteHeader(http.StatusOK)  // 默认就是 200

    // 设置 Content-Type
    w.Header().Set("Content-Type", "text/plain; charset=utf-8")

    // 写入响应体
    w.Write([]byte("Hello, Go!"))

    // 快捷方式：返回 JSON
    data, _ := json.Marshal(map[string]string{"message": "ok"})
    w.Header().Set("Content-Type", "application/json")
    w.Write(data)

    // 设置状态码 + 消息
    http.Error(w, "not found", http.StatusNotFound)
}
```

### 5.2.5 完整 RESTful API 示例

```go
package main

import (
    "encoding/json"
    "log"
    "net/http"
    "strconv"
    "strings"
)

type User struct {
    ID   int    `json:"id"`
    Name string `json:"name"`
    Age  int    `json:"age"`
}

var users = []User{
    {ID: 1, Name: "Alice", Age: 30},
    {ID: 2, Name: "Bob", Age: 25},
}

func handleUsers(w http.ResponseWriter, r *http.Request) {
    w.Header().Set("Content-Type", "application/json")

    switch r.Method {
    case http.MethodGet:
        // GET /users — 获取所有用户
        json.NewEncoder(w).Encode(users)

    case http.MethodPost:
        // POST /users — 创建用户
        var newUser User
        if err := json.NewDecoder(r.Body).Decode(&newUser); err != nil {
            http.Error(w, err.Error(), http.StatusBadRequest)
            return
        }
        newUser.ID = len(users) + 1
        users = append(users, newUser)
        w.WriteHeader(http.StatusCreated)
        json.NewEncoder(w).Encode(newUser)

    default:
        http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
    }
}

func main() {
    http.HandleFunc("/users", handleUsers)

    log.Println("server starting on :8080")
    log.Fatal(http.ListenAndServe(":8080", nil))
}
```

### 5.2.6 路由 —— 默认 mux 的限制与第三方方案

```go
// 标准库 http.ServeMux 的局限：
// 1. 不支持路径参数：/users/:id 需要手动解析
// 2. 不支持 HTTP 方法匹配

// ✅ 手动解析路径参数
func handleUser(w http.ResponseWriter, r *http.Request) {
    // 解析 /users/123
    parts := strings.Split(r.URL.Path, "/")
    if len(parts) < 3 {
        http.Error(w, "invalid path", http.StatusBadRequest)
        return
    }
    id, err := strconv.Atoi(parts[2])
    if err != nil {
        http.Error(w, "invalid id", http.StatusBadRequest)
        return
    }
    fmt.Fprintf(w, "user id: %d", id)
}

// 更复杂的路由建议用第三方库（但入门阶段先学会用标准库）：
// go get github.com/gorilla/mux
// go get github.com/go-chi/chi
// go get github.com/gin-gonic/gin
```

**Go 1.22+ 新特性**：标准库 `http.ServeMux` 已支持路径参数和方法匹配，上述限制已部分解决：

```go
// Go 1.22+ 新路由语法 —— 不再需要手动 Split 路径
mux.HandleFunc("GET /users/{id}", func(w http.ResponseWriter, r *http.Request) {
    id := r.PathValue("id")  // 直接获取路径参数
    fmt.Fprintf(w, "user id: %s", id)
})

mux.HandleFunc("POST /users", createUser)   // 方法 + 路径匹配
mux.HandleFunc("GET /users", listUsers)      // GET 和 POST 走不同 handler
```

> 如果你的 Go 版本 >= 1.22，建议优先用标准库新语法；需要更复杂的中间件、路由分组等功能时再考虑 `chi` 或 `gin`。

---

## 5.3 JSON 处理

### 5.3.1 结构体标签（Struct Tag）

```go
// 结构体标签是 Go 的反射机制 —— 类似 Java 注解 / Python 装饰器
// 格式：`key:"value"`，多个标签用空格分隔

type Person struct {
    Name  string `json:"name"`            // 序列化为 "name"
    Age   int    `json:"age,omitempty"`   // 为空时省略该字段
    Email string `json:"email,omitempty"`
    Phone string `json:"-"`               // 始终忽略该字段
}
```

### 5.3.2 序列化与反序列化

```go
type Person struct {
    Name string `json:"name"`
    Age  int    `json:"age"`
    City string `json:"city,omitempty"`
}

// 序列化（对象 → JSON）—— 类似 JSON.stringify
p := Person{Name: "Alice", Age: 30}
data, err := json.Marshal(p)
// data = []byte(`{"name":"Alice","age":30}`)

// 格式化输出
data, err := json.MarshalIndent(p, "", "  ")
// data = []byte(`{
//   "name": "Alice",
//   "age": 30
// }`)

// 反序列化（JSON → 对象）—— 类似 JSON.parse
jsonStr := `{"name":"Bob","age":25}`
var p2 Person
err := json.Unmarshal([]byte(jsonStr), &p2)
// p2 = Person{Name: "Bob", Age: 25}
```

### 5.3.3 流式编解码

```go
// 对于文件/网络流，使用 Decoder/Encoder 更高效

// 从文件读取 JSON
file, _ := os.Open("data.json")
defer file.Close()

var person Person
err := json.NewDecoder(file).Decode(&person)

// 写入 JSON 到文件
out, _ := os.Create("output.json")
defer out.Close()

encoder := json.NewEncoder(out)
encoder.SetIndent("", "  ")
err := encoder.Encode(person)
```

### 5.3.4 非结构化数据（`json.RawMessage`）

```go
// 当你不知道 JSON 结构时，可以用 map 或 any
var data map[string]any
json.Unmarshal([]byte(`{"name":"Alice","age":30,"active":true}`), &data)
fmt.Println(data["name"])   // Alice
fmt.Println(data["age"])    // 30（float64 类型！⚠️）
fmt.Println(data["active"]) // true（bool 类型）
```

---

## 5.4 文件 I/O

### 5.4.1 基本读写

```go
// 读取整个文件（最常用）—— 类似 fs.readFileSync
data, err := os.ReadFile("input.txt")
if err != nil {
    log.Fatal(err)
}
fmt.Println(string(data))

// 写入整个文件 —— 类似 fs.writeFileSync
err := os.WriteFile("output.txt", []byte("Hello Go!"), 0644)
if err != nil {
    log.Fatal(err)
}
```

### 5.4.2 逐行读取

```go
// 大文件推荐逐行读取，而不是一次性读入内存
file, err := os.Open("large.txt")
if err != nil {
    log.Fatal(err)
}
defer file.Close()  // 记得关闭文件！

scanner := bufio.NewScanner(file)
lineNum := 0
for scanner.Scan() {
    lineNum++
    line := scanner.Text()
    fmt.Printf("%d: %s\n", lineNum, line)
}

if err := scanner.Err(); err != nil {
    log.Fatal(err)
}
```

### 5.4.3 文件与目录操作

```go
// 创建目录
os.Mkdir("mydir", 0755)
os.MkdirAll("a/b/c", 0755)  // 递归创建（类似 mkdir -p）

// 检查文件是否存在
_, err := os.Stat("file.txt")
if err == nil {
    fmt.Println("file exists")
} else if os.IsNotExist(err) {
    fmt.Println("file does not exist")
}

// 删除文件/目录
os.Remove("file.txt")
os.RemoveAll("mydir")  // 递归删除（类似 rm -rf）

// 重命名/移动
os.Rename("old.txt", "new.txt")

// 判断文件/目录
info, _ := os.Stat("file.txt")
fmt.Println(info.IsDir())  // true → 是目录，false → 是文件
```

---

## 5.5 CLI 工具 —— flag 包

```go
package main

import (
    "flag"
    "fmt"
)

func main() {
    // 定义命令行参数
    // flag.Type(name, defaultValue, description)
    name := flag.String("name", "World", "name to greet")
    count := flag.Int("count", 1, "number of times to greet")
    verbose := flag.Bool("verbose", false, "verbose output")

    // 解析命令行参数（必须在访问参数值之前调用）
    flag.Parse()

    // 使用参数
    for i := 0; i < *count; i++ {
        fmt.Printf("Hello, %s!\n", *name)
    }

    if *verbose {
        fmt.Printf("(greeted %d times)\n", *count)
    }
}
```

```bash
# 使用
go run main.go -name Alice -count 3 -verbose
# 输出：
# Hello, Alice!
# Hello, Alice!
# Hello, Alice!
# (greeted 3 times)

# --help 自动生成帮助信息
go run main.go --help
# Usage of /tmp/go-build...
#   -count int
#         number of times to greet (default 1)
#   -name string
#         name to greet (default "World")
#   -verbose
#         verbose output
```

---

## 5.6 综合实战：URL 健康检查 CLI 工具

### 功能描述

一个命令行工具，接收多个 URL，**并发**检查它们的 HTTP 状态码，输出可达性和响应时间。

### 功能规格

```bash
go run main.go https://google.com https://github.com https://example.com

# 输出：
# URL                          STATUS   TIME
# https://google.com           200      123ms
# https://github.com           200      85ms
# https://example.com          200      45ms
# --------------------------------------------------
# Total: 3 | Success: 3 | Failed: 0

# 带超时参数
go run main.go -timeout=5s https://google.com https://httpbin.org/delay/10
# URL                          STATUS   TIME
# https://google.com           200      120ms
# https://httpbin.org/delay/10 0       timeout
# --------------------------------------------------
# Total: 2 | Success: 1 | Failed: 1
```

### 完整代码

```go
package main

import (
    "flag"
    "fmt"
    "net/http"
    "os"
    "strings"
    "sync"
    "time"
)

type CheckResult struct {
    URL        string
    StatusCode int
    Duration   time.Duration
    Err        error
}

func checkURL(url string, timeout time.Duration) CheckResult {
    start := time.Now()

    client := &http.Client{Timeout: timeout}
    resp, err := client.Get(url)

    duration := time.Since(start)
    if err != nil {
        return CheckResult{URL: url, StatusCode: 0, Duration: duration, Err: err}
    }
    defer resp.Body.Close()

    return CheckResult{URL: url, StatusCode: resp.StatusCode, Duration: duration}
}

func main() {
    timeout := flag.Duration("timeout", 10*time.Second, "request timeout")
    flag.Parse()

    urls := flag.Args()
    if len(urls) == 0 {
        fmt.Println("Usage: go run main.go [-timeout=10s] <url1> <url2> ...")
        os.Exit(1)
    }

    results := make(chan CheckResult, len(urls))
    var wg sync.WaitGroup

    // 并发检查所有 URL
    for _, url := range urls {
        wg.Add(1)
        go func(u string) {
            defer wg.Done()
            results <- checkURL(u, *timeout)
        }(url)
    }

    // 等待所有检查完成
    go func() {
        wg.Wait()
        close(results)
    }()

    // 输出表头
    fmt.Printf("%-30s %-8s %s\n", "URL", "STATUS", "TIME")
    fmt.Println(strings.Repeat("-", 60))

    var total, success, failed int

    // 收集结果
    for r := range results {
        total++
        if r.Err != nil {
            fmt.Printf("%-30s %-8s %s\n", r.URL, "ERROR", r.Duration.Round(time.Millisecond))
            failed++
        } else {
            fmt.Printf("%-30s %-8d %s\n", r.URL, r.StatusCode, r.Duration.Round(time.Millisecond))
            success++
        }
    }

    // 汇总
    fmt.Println(strings.Repeat("-", 60))
    fmt.Printf("Total: %d | Success: %d | Failed: %d\n", total, success, failed)
}
```

### 覆盖知识点

| 部分 | 涉及知识点 |
|------|-----------|
| CLI 参数 | `flag` 包、`flag.Duration`、`flag.Args()` |
| HTTP 请求 | `net/http` 客户端、`http.Client`、超时设置 |
| 并发 | goroutine、`sync.WaitGroup`、channel |
| 时间处理 | `time.Now()`、`time.Since()`、`time.Duration` |
| 格式化输出 | `fmt.Printf`、表格式对齐 |
| 错误处理 | `if err != nil` 模式 |
| 退出码 | `os.Exit` |

### 练习扩展

1. **添加并发限制**：用 Worker Pool 限制同时发起的请求数
2. **输出 JSON**：支持 `-json` 标志输出 JSON 格式结果
3. **检查间隔**：支持 `-interval` 参数定时检查（监控场景）

---

## 本章总结

### 面试高频题

1. **Go 的 HTTP 服务器如何工作？**
   - `http.HandleFunc` 注册路由和 Handler
   - `http.ListenAndServe` 监听端口，接受连接
   - 每个连接在一个 goroutine 中处理

2. **结构体标签（struct tag）有什么用？**
   - 为结构体字段附加元数据
   - 常用于 JSON 序列化（指定字段名、忽略、omitempty）
   - 通过反射读取（`reflect` 包）

3. **json.Marshal 和 json.NewEncoder 的区别？**
   - `Marshal`：生成 `[]byte`，适合内存中的数据
   - `Encoder`：写入 `io.Writer`，适合文件和网络流

4. **flag 包如何处理非标志参数？**
   - `flag.Parse()` 解析标志
   - `flag.Args()` 获取非标志参数（位置参数）
   - `flag.NArg()` 获取非标志参数数量

5. **Go 的 error 返回值如何影响 API 设计？**
   - 函数签名明确标注可能失败（返回 `(T, error)`）
   - 调用方必须处理错误（无法忽略）
   - 链式调用中错误传播清晰

### 学习检查

- [ ] 能 10 行代码写一个 HTTP 服务器
- [ ] 能用 `json.Marshal` / `json.Unmarshal` 处理 JSON
- [ ] 能用 `os.ReadFile` / `os.WriteFile` 读写文件
- [ ] 能用 `flag` 包编写 CLI 工具
- [ ] 能用 `http.Client` 发送 HTTP 请求
- [ ] 理解结构体标签的工作机制
- [ ] 能独立完成 URL 健康检查 CLI 工具
- [ ] 理解 goroutine + WaitGroup + channel 在实战中的应用

### 推荐资源

- [Go by Example: HTTP Server](https://gobyexample.com/http-server)
- [Go by Example: JSON](https://gobyexample.com/json)
- [Go by Example: Reading Files](https://gobyexample.com/reading-files)
- [Go by Example: Command-Line Flags](https://gobyexample.com/command-line-flags)
- [Go 标准库文档](https://pkg.go.dev/std)

---

*最后更新：2026年6月*
