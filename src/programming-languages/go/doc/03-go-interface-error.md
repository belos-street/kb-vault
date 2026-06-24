# 03 — Interface 与错误处理

> 面向有 JS/TS/Python/Java 经验的全栈工程师。本章讲透 Go 的两个核心机制：**interface**（Go 的"鸭子类型"接口哲学）和 **error**（Go 没有异常，错误只是返回值）。

---

## 本章目标

- 理解 Go interface 的隐式实现机制及其设计哲学
- 掌握 interface 的声明、组合、类型断言
- 理解 Go 的错误处理哲学（对比 Java/JS/Python 的异常机制）
- 掌握 `errors.Is` / `errors.As` 处理错误链
- 理解 panic/recover 的使用场景与最佳实践

---

## 3.1 Interface —— Go 的"鸭子类型"

### 3.1.1 什么是 Interface？

Go 的 interface 是 **方法集合** 的定义。一个类型只要实现了 interface 中声明的方法，它就"是"这个 interface —— **不需要显式声明 `implements`**。

```go
// 定义一个接口：只有方法的签名，没有实现
type Writer interface {
    Write([]byte) (int, error)
}

// 定义一个结构体
type ConsoleWriter struct{}

// ConsoleWriter 实现了 Write 方法 —— 不需要写 "implements Writer"！
func (cw ConsoleWriter) Write(data []byte) (int, error) {
    n, err := fmt.Println(string(data))
    return n, err
}

// 使用接口
var w Writer = ConsoleWriter{}   // ConsoleWriter 可以赋值给 Writer 类型变量
w.Write([]byte("Hello Go!"))     // 输出: Hello Go!
```

**与其他语言的对比**：

| Go | TypeScript | Java | Python |
|----|-----------|------|--------|
| 隐式实现（不用写 `implements`） | 显式 `implements` 或结构兼容 | 必须显式 `implements` | 鸭子类型（完全隐式） |
| 接口只定义方法 | 可定义属性+方法 | 可定义常量+方法 | 抽象基类（ABC） |
| 编译时检查 ✅ | 编译时检查 ✅ | 编译时检查 ✅ | 运行时检查 ⚠️ |

**最直观的理解**：
- Java：你必须在简历上写"我会写 Go" 才能被认为是一个 Gopher
- Go：你只要会写 Go，你就是 Gopher —— **不关心你是谁，只关心你会什么**

### 3.1.2 Interface 值

```go
// interface 值由两部分组成：(具体类型, 具体值)
type Animal interface {
    Speak() string
}

type Dog struct{}
func (d Dog) Speak() string { return "Woof!" }

type Cat struct{}
func (c Cat) Speak() string { return "Meow!" }

var animal Animal

animal = Dog{}
fmt.Printf("(%T, %v)\n", animal, animal) // (main.Dog, {})
fmt.Println(animal.Speak())              // Woof!

animal = Cat{}
fmt.Printf("(%T, %v)\n", animal, animal) // (main.Cat, {})
fmt.Println(animal.Speak())              // Meow!
```

### 3.1.3 Interface 组合 —— Go 没有继承，只有组合

Go 的 interface 可以嵌入其他 interface，形成更大接口 —— 类似 TS 的交叉类型或 Java 的接口继承。

```go
// 小接口（Go 推崇小而美）
type Reader interface {
    Read(p []byte) (n int, err error)
}

type Writer interface {
    Write(p []byte) (n int, err error)
}

// 通过嵌入组合成大接口 —— 类似 TS 的交叉类型
// type ReadWriter = Reader & Writer
type ReadWriter interface {
    Reader
    Writer
}

// 标准库中大量使用这种模式：
// io.ReadWriter、io.ReadCloser、io.WriteCloser 等
```

### 3.1.4 面向接口编程 —— 消除依赖

```go
// 糟糕的设计：依赖具体类型
func SaveToFile(data []byte, path string) error {
    return os.WriteFile(path, data, 0644)
}

// 好的设计：依赖接口，解耦实现
func SaveData(data []byte, w Writer) error {
    _, err := w.Write(data)
    return err
}

// 使用时可以传入文件、网络连接、缓冲区等任何实现了 Writer 的类型
SaveData(data, os.Stdout)     // 输出到终端
SaveData(data, myFile)         // 写入文件
SaveData(data, mySocket)       // 写入网络连接
```

**为什么这样更好？**
- 测试时可以传入 `bytes.Buffer`，不需要真的写文件
- 更换后端实现时无需修改调用代码
- 这就是 Go 的"依赖反转"——依赖抽象，不依赖具体实现

---

## 3.2 空接口与类型断言

### 3.2.1 空接口 `interface{}` / `any`

```go
// 空接口没有定义任何方法，所以"任何类型都实现了空接口"
// 类似 Java 的 Object、TS 的 unknown/any
var v interface{} = 42
v = "hello"
v = true
v = []int{1, 2, 3}

// Go 1.18+ 可以用 any 替代 interface{} —— 两者完全等价
var v any = 42
```

### 3.2.2 类型断言

```go
var v any = "hello"

// 类型断言语法：v.(T) —— 尝试将 v 转为 T 类型
// "comma ok" 模式（Go 的标志性写法）
s, ok := v.(string)
if ok {
    fmt.Println("v is string:", s)  // "v is string: hello"
} else {
    fmt.Println("v is not a string")
}

// 直接断言 —— 不 OK 会 panic
s := v.(string)        // ✅ v 确实是 string
// n := v.(int)        // ❌ panic: interface conversion
```

### 3.2.3 Type Switch

```go
// type switch —— 根据类型分支处理
func inspect(v any) {
    switch v := v.(type) {  // 注意这里的 := ，创建了新的 v
    case int:
        fmt.Printf("int: %d\n", v)
    case string:
        fmt.Printf("string: %q (len=%d)\n", v, len(v))
    case float64:
        fmt.Printf("float64: %f\n", v)
    case []int:
        fmt.Printf("slice of ints: %v\n", v)
    default:
        fmt.Printf("unknown type: %T\n", v)
    }
}

inspect(42)         // int: 42
inspect("hello")    // string: "hello" (len=5)
inspect(3.14)       // float64: 3.140000
```

### 3.2.4 接口的 nil 陷阱

```go
// 重要！interface 为 nil 的条件是：类型和值都是 nil
var w Writer          // w 是 nil（类型和值都是 nil）
fmt.Println(w == nil) // true

var dw *Dog = nil
w = dw                // w 不是 nil 了！因为类型是 *Dog
fmt.Println(w == nil) // false！⚠️ 常见的坑
```

---

## 3.3 Error 接口 —— Go 的错误处理哲学

### 3.3.1 设计哲学：错误就是值

```go
// error 是 Go 内置的一个简单接口
type error interface {
    Error() string
}

// 创建错误
var err error = errors.New("something went wrong")
err = fmt.Errorf("user %d not found", 42)
```

**Go 的错误处理哲学：**

| Java | JS | Go |
|------|-----|-----|
| ⚠️ 异常是特殊的控制流 | ⚠️ 异常会冒泡到 try/catch | ✅ 错误就是一个普通的返回值 |
| 你可能忘记 catch | 你可能忘记 catch | ❌ **你不检查就会编译通过但逻辑错** |
| 异常路径是隐式的 | 异常路径是隐式的 | ✅ 错误路径是**显式**的 |

```go
// 对比：读文件
// Java: 可能抛出 FileNotFoundException，你不知道
// Go: 返回值明确告诉你"这个函数可能失败"
func readConfig(path string) ([]byte, error) {
    data, err := os.ReadFile(path)
    if err != nil {
        return nil, fmt.Errorf("read config: %w", err)
    }
    return data, nil
}
```

**为什么 Go 要这么设计？**

> "Errors are values." — Rob Pike

Go 的设计者认为异常机制让程序员忽略了错误处理的必要性。通过让错误成为**普通返回值**，Go 迫使你在每个可能出错的地方显式处理错误。这看起来啰嗦，但**生产环境中 70% 的 Bug 来自未处理的异常路径**。

### 3.3.2 基本用法

```go
// 写 Go 的一个"固定套路"：if err != nil
func getUser(id int) (*User, error) {
    if id < 0 {
        return nil, errors.New("invalid user id")
    }
    // 模拟数据库查询
    return &User{ID: id, Name: "Alice"}, nil
}

user, err := getUser(1)
if err != nil {
    log.Printf("failed to get user: %v", err)
    return  // 或继续处理
}
fmt.Println(user.Name)  // 正常处理
```

### 3.3.3 sentinel error（哨兵错误）

```go
// 定义包级别的"哨兵错误"—— 类似 Java 的自定义异常类
var (
    ErrNotFound   = errors.New("not found")
    ErrPermission = errors.New("permission denied")
    ErrTimeout    = errors.New("request timeout")
)

// 调用方可以精确判断错误类型
func findUser(id int) (*User, error) {
    if id == 0 {
        return nil, ErrNotFound
    }
    return &User{ID: id}, nil
}

user, err := findUser(0)
if err == ErrNotFound {
    fmt.Println("user not found, create a new one")
} else if err != nil {
    fmt.Println("unexpected error:", err)
}
```

### 3.3.4 自定义错误类型

```go
// 实现 error 接口的结构体
type ValidationError struct {
    Field   string
    Message string
}

func (e *ValidationError) Error() string {
    return fmt.Sprintf("validation failed on %s: %s", e.Field, e.Message)
}

// 使用自定义错误
func validateUser(user User) error {
    if user.Name == "" {
        return &ValidationError{Field: "Name", Message: "cannot be empty"}
    }
    return nil
}

// 调用方用 errors.As 获取详细信息
err := validateUser(User{})
var valErr *ValidationError
if errors.As(err, &valErr) {
    fmt.Printf("field: %s, message: %s\n", valErr.Field, valErr.Message)
}
```

### 3.3.5 错误链（Go 1.13+）—— 现代 Go 错误处理

```go
// %w 动词包装错误 —— 保留原始错误链
func readConfig(path string) ([]byte, error) {
    data, err := os.ReadFile(path)
    if err != nil {
        // %w 创建一个"包装错误"，原始错误可以通过 errors.Is/As 访问
        return nil, fmt.Errorf("reading config file: %w", err)
    }
    return data, nil
}

data, err := readConfig("/etc/config.json")
if err != nil {
    fmt.Println(err)
    // 输出: reading config file: open /etc/config.json: no such file or directory
    //         ↑ 包装信息                  ↑ 原始错误
}
```

#### errors.Is —— 判断错误链中是否包含特定错误

```go
// 类似 Java 的 catch (SpecificException e) 或 instanceof 检查
var ErrNotFound = errors.New("not found")

func findUser(id int) (*User, error) {
    if id < 0 {
        return nil, fmt.Errorf("find user: %w", ErrNotFound)
    }
    return &User{ID: id}, nil
}

_, err := findUser(-1)
if errors.Is(err, ErrNotFound) {
    fmt.Println("user not found, will create")
}
```

#### errors.As —— 从错误链中提取特定类型

```go
// 类似 Java 的 catch (ValidationException e)
var pathErr *os.PathError
_, err := os.Open("/nonexistent")
if errors.As(err, &pathErr) {
    fmt.Println("path:", pathErr.Path)   // /nonexistent
    fmt.Println("op:", pathErr.Op)        // open
    fmt.Println("err:", pathErr.Err)      // no such file or directory
}
```

| 函数 | 作用 | 类比 |
|------|------|------|
| `errors.Is(err, target)` | 判断错误链中是否存在目标错误 | Java `instanceof` 错误类型 |
| `errors.As(err, &target)` | 从错误链中提取特定类型的错误 | Java `catch (SpecificException e)` |
| `fmt.Errorf("...: %w", err)` | 包装错误 | Java `new Exception("msg", cause)` |

### 3.3.6 实际项目中的错误处理模式

```go
// 一个真实的 API Handler
func handler(w http.ResponseWriter, r *http.Request) {
    // 1. 解析请求
    userID, err := strconv.Atoi(r.URL.Query().Get("id"))
    if err != nil {
        http.Error(w, "invalid id", http.StatusBadRequest)
        return
    }

    // 2. 业务逻辑
    user, err := userService.GetUser(userID)
    if err != nil {
        if errors.Is(err, ErrNotFound) {
            http.Error(w, "not found", http.StatusNotFound)
        } else {
            log.Printf("unexpected error: %v", err)
            http.Error(w, "internal error", http.StatusInternalServerError)
        }
        return
    }

    // 3. JSON 响应
    data, err := json.Marshal(user)
    if err != nil {
        log.Printf("marshal error: %v", err)
        http.Error(w, "internal error", http.StatusInternalServerError)
        return
    }

    // 4. 成功
    w.Header().Set("Content-Type", "application/json")
    w.Write(data)
}
```

---

## 3.4 Panic 与 Recover

### 3.4.1 Panic —— Go 的"不可恢复错误"

```go
// panic —— 类似 Java 的 RuntimeException / JS 的 throw new Error()
// 只有"不可能发生"的情况才用 panic

// ✅ 合理使用：初始化失败，程序无法继续
func mustInit() {
    config, err := loadConfig()
    if err != nil {
        panic("failed to load config: " + err.Error())
    }
}

// ❌ 错误使用：本可以用 error 返回值
func divide(a, b int) int {
    if b == 0 {
        panic("division by zero")  // 应该返回 error！
    }
    return a / b
}
```

**关键原则**：99% 的场景用 `error`，只有程序真的无法继续才用 `panic`。

### 3.4.2 Recover —— 从 Panic 中恢复

```go
// recover 只能在 defer 中使用 —— 类似 try/catch，但更显式
func safeHandler() {
    defer func() {
        if r := recover(); r != nil {
            // r 是 panic 传入的值
            log.Printf("recovered from panic: %v", r)
            // 清理资源、记录日志
        }
    }()
    // 可能会 panic 的代码
    process()
}

// 实际场景：HTTP 服务器中防止单个请求导致整个程序崩溃
func recoverMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        defer func() {
            if err := recover(); err != nil {
                log.Printf("panic recovered: %v, request: %s", err, r.URL.Path)
                http.Error(w, "Internal Server Error", 500)
            }
        }()
        next.ServeHTTP(w, r)
    })
}
```

### 3.4.3 Panic 传播链

```go
// panic 会沿着调用栈向上传播，直到被 recover 或程序崩溃
func a() { b() }
func b() { c() }
func c() { panic("boom") }

func main() {
    defer func() {
        if r := recover(); r != nil {
            fmt.Println("recovered:", r)
        }
    }()
    a()  // c 中 panic → b → a → main → recover
}
// 输出: recovered: boom ✅ 程序安全退出
```

---

## 本章总结

### 面试高频题

1. **Go 的 interface 和 Java 的 interface 有什么区别？**
   - Go 是隐式实现，Java 需要 `implements` 关键字
   - Go 的 interface 可以组合（嵌入），不需要继承
   - Go 推崇小接口（1-3 个方法）

2. **interface 为 nil 的条件是什么？**
   - 类型和值都必须为 nil
   - `(*Dog)(nil)` 赋值给 interface 后，interface 不是 nil（类型是 `*Dog`）

3. **Go 为什么不用 try/catch 而用 error 返回值？**
   - 错误是控制流的一部分，应该显式处理
   - 避免未处理的异常路径导致 Bug
   - 编译期没有强制检查，但代码审查时可以清楚地看到错误路径

4. **errors.Is 和 errors.As 的区别？**
   - `errors.Is`：检查错误链中是否包含目标**值**
   - `errors.As`：从错误链中提取目标**类型**

5. **什么场景用 panic 而不是 error？**
   - 初始化失败（程序无法正常运行）
   - 不可能发生的错误（如 switch 的 default 分支）

### 学习检查

- [ ] 能声明和使用 interface，理解隐式实现机制
- [ ] 能使用空接口 `any` 和类型断言
- [ ] 能使用 `errors.New` / `fmt.Errorf` 创建错误
- [ ] 能使用 `errors.Is` / `errors.As` 检查错误链
- [ ] 能定义自定义错误类型
- [ ] 理解 panic/recover 的使用场景
- [ ] 能在实际代码中遵循 Go 的错误处理规范

### 推荐资源

- [Go Blog: Errors are values](https://go.dev/blog/errors-are-values)
- [Go Blog: Working with Errors in Go 1.13](https://go.dev/blog/go1.13-errors)
- [Go by Example: Errors](https://gobyexample.com/errors)
- [Go by Example: Interfaces](https://gobyexample.com/interfaces)

---

*最后更新：2026年6月*
