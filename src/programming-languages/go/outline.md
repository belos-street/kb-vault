# Go 入门教程

> 面向有 JS/TS/Python/Java 经验的全栈工程师，快速掌握 Go 核心概念 —— 简洁的语法、强大的并发模型、"少即是多"的设计哲学。

---

## 🎯 学习目标

- 理解 Go 的设计哲学：**简洁**、**实用**、**工程化**
- 掌握 Go 基础语法与类型系统（与其他语言的差异）
- 理解 **goroutine** 与 **channel** —— Go 最核心的并发模型
- 掌握 **interface** 与 **struct** 的组合式设计（Go 没有继承）
- 能编写包含 HTTP 服务、并发任务、错误处理的实用程序
- 建立起与 JS/TS/Python/Java 的心智映射，加速迁移

---

## 📋 前置要求

| 领域 | 要求 | 备注 |
|------|------|------|
| 编程基础 | 熟悉变量、函数、控制流、数据结构 | Go 的语法非常简洁，几乎零门槛 |
| 静态类型 | 理解编译型语言的基本概念 | Go 是静态类型，但类型推导让你写起来像动态语言 |
| 并发概念 | 了解线程/进程的基本概念 | 不必须，Go 的 goroutine 比线程好理解得多 |
| 网络基础 | 了解 HTTP 协议 | 对第 5 章的实战有帮助 |

---

## 🗺️ 学习路径（六章递进）

```
第1章: 基础语法 ──→ 第2章: 组合类型 ──→ 第3章: interface ──→ 第4章: 并发 ──→ 第5章: 实战 ──→ 第6章: 精进
(快速上手)        (struct/slice/map)  (接口与组合)       (核心亮点)       (项目)         (方向)
```

| 章节 | 内容 | 定位 |
|------|------|------|
| **第 1 章** | Go 基础语法 | 快速扫盲，半小时就能上手 |
| **第 2 章** | struct、slice、map、函数 | 组合数据类型与集合操作 |
| **第 3 章** | interface 与 error 处理 | Go 的"鸭子类型"接口哲学 |
| **第 4 章** | goroutine 与 channel | **Go 最核心的并发武器** |
| **第 5 章** | 实战：HTTP 服务 + CLI 工具 | 能写实用程序 |
| **第 6 章** | 后续精进方向 | 包管理、测试、生态 |

---

## 第 1 章：Go 基础语法（半小时快速上手）

> Go 的设计目标之一是"15 分钟看懂代码"。语法比 Java 简洁，比 Python/JS 更规整。

### 1.1 环境与工具链

- 安装 Go：`brew install go`（已要求你安装）
- `go version` 验证
- 三个核心命令：

| 命令 | 作用 | 类比 |
|------|------|------|
| `go run main.go` | 直接运行（不产生二进制） | `node index.js` / `python main.py` |
| `go build` | 编译为二进制 | `tsc` / `javac` / `mvn package` |
| `go fmt` | 自动格式化代码 | Prettier（但 Go 的格式化有官方标准，无争议） |

- VS Code 插件：官方的 **Go** 扩展（gopls 语言服务器）
- `go mod init <module-name>` 创建项目（类比 `npm init` / `pip init`）

### 1.2 Hello World 与项目结构

```go
package main  // 可执行的包

import "fmt"  // 标准库的格式化 I/O

func main() {
    fmt.Println("Hello, Go!")
}
```

**三点注意**（与其他语言的区别）：
1. **package 声明**：每个 Go 文件第一行必须是 `package xxx`（类比 Java 的 package，但 Go 的包管理更简单）
2. **import 是关键字**：不是 require/import 语句，是编译期指令
3. **`main` 是入口函数**：无参数、无返回值（对比 Java 的 `public static void main(String[] args)`）

### 1.3 变量与类型

```go
// 显式声明 —— 类似 Java
var name string = "Go"

// 类型推导 —— 类似 TS 的自动类型推断
var name = "Go"          // string 类型
count := 42              // := 是简短声明（最常用），类似 TS const / let
// count := 43           // ❌ 编译错误：:= 左侧不能有重复变量

// 多变量声明
var x, y int = 1, 2
a, b := "hello", true

// 零值（Zero Values）—— Go 没有未初始化的变量
var i int       // 0
var s string    // ""（空字符串）
var b bool      // false
```

**与 JS/TS/Python/Java 对比**：

| 特性 | Go | TypeScript | Java | Python |
|------|-----|-----------|------|--------|
| 变量声明 | `var x int` / `x := 1` | `let x: number = 1` | `int x = 1` | `x = 1` |
| 常量 | `const x = 42` | `const x = 42` | `final int x = 42` | 惯例大写 |
| 零值 | 内置零值 ✅ | `undefined` ❌ | `null` / 默认值 | `None` ❌ |
| 类型在后 | `var x int` ✅ | `let x: number` | `int x` ❌ | 注解式 |

### 1.4 基本数据类型

```go
// 整数
var a int     // 平台相关：64 位系统上是 int64
var b int8    // -128 ~ 127
var c int32   // -2^31 ~ 2^31-1（对应 Java 的 int）
var d int64   // -2^63 ~ 2^63-1（对应 Java 的 long）
var e uint    // 无符号整数

// 浮点
var f float64  // 默认（对应 Java 的 double）
var g float32  // （对应 Java 的 float）

// 布尔
var h bool     // true / false

// 字符串 —— 不可变（类似 Java String）
var s string = "hello"
s[0] = 'c'    // ❌ 编译错误：字符串不可变

// 字符串拼接
s = "hello" + " world"  // ✅

// 字节与符文
// byte = uint8（ASCII 字符）
// rune = int32（Unicode 码点，类比 Java 的 char / Python 的单个字符）
var r rune = '中'  // 单引号，rune 字面量
```

### 1.5 控制流

```go
// if/else —— 条件不需要括号！但大括号必须
if x > 0 {
    fmt.Println("positive")
} else if x < 0 {
    fmt.Println("negative")
} else {
    fmt.Println("zero")
}

// if 中可以写一个简单语句（很 Go 的风格）
if err := doSomething(); err != nil {
    fmt.Println("Error:", err)
}
// 对比 JS: if ((err = doSomething()) != null) { ... }

// for —— Go 只有 for，没有 while 或 do-while
// 类似 Java 的 for loop
for i := 0; i < 10; i++ {
    fmt.Println(i)
}

// 类似 while
sum := 1
for sum < 1000 {
    sum += sum
}

// 无限循环
for {
    // ...
}

// switch —— 默认带 break（和 Java/C 不同！）
switch os := runtime.GOOS; os {
case "darwin":
    fmt.Println("macOS")
case "linux":
    fmt.Println("Linux")
default:
    fmt.Printf("%s\n", os)
}

// switch 没有条件 —— 相当于 if/else if 链
score := 85
switch {
case score >= 90:
    fmt.Println("A")
case score >= 80:
    fmt.Println("B")
default:
    fmt.Println("C")
}
```

### 1.6 函数

```go
// 基本函数 —— 注意：类型在变量名后面！
func add(x int, y int) int {
    return x + y
}

// 参数类型相同时可以省略前面的类型
func add(x, y int) int {
    return x + y
}

// 多返回值 —— Go 的标志性特性！
func divide(a, b int) (int, error) {
    if b == 0 {
        return 0, fmt.Errorf("division by zero")
    }
    return a / b, nil
}

// 多返回值赋值
result, err := divide(10, 2)
if err != nil {
    fmt.Println("Error:", err)
}

// 命名返回值（类似 Python 的 annotation，但 Go 会真的初始化）
func split(sum int) (x, y int) {
    x = sum * 4 / 9
    y = sum - x
    return  // "裸返回"，返回 x 和 y 的当前值
}
```

**与 JS/TS/Python/Java 对比**：

| 特性 | Go | TypeScript | Java | Python |
|------|-----|-----------|------|--------|
| 多返回值 | ✅ 原生支持 | ❌ 需要包装成对象/元组 | ❌ 需要包装 | ✅ 元组 |
| 函数重载 | ❌ 不支持 | ✅ 支持 | ✅ 支持 | ❌ 不支持 |
| 默认参数 | ❌ 不支持 | ✅ 支持 | ❌ 需重载 | ✅ 支持 |
| 命名返回值 | ✅ | ❌ | ❌ | ❌ |
| defer | ✅ 特有 | ❌ | `finally` | ❌ 无等价物 |

### 1.7 defer —— Go 的"finally"

```go
// defer 确保函数返回前执行某个操作（类似 Java 的 finally 或 Python 的上下文管理器）
func readFile() {
    f, err := os.Open("file.txt")
    if err != nil {
        return
    }
    defer f.Close()  // 函数返回前自动关闭文件
    // 读取文件...
}

// defer 是 LIFO（后进先出）—— 类似栈
func example() {
    defer fmt.Println("first defer")   // 第二个执行
    defer fmt.Println("second defer")  // 第一个执行
}
```

---

## 第 2 章：组合类型（struct、slice、map、函数进阶）

### 2.1 数组（Array）

```go
// 数组 —— 长度固定，很少直接用
var arr [5]int           // [0, 0, 0, 0, 0]
arr[0] = 1

// 数组字面量
arr := [3]int{1, 2, 3}

// ... 让编译器推导长度
arr := [...]int{1, 2, 3}

// 对比：Java 的数组也固定长度，JS 的数组可变
```

### 2.2 切片（Slice）—— 动态数组

```go
// 切片 —— 类似 JS Array / Java ArrayList / Python list
// 几乎不用数组，用切片

// 创建
s := []int{1, 2, 3}
s = append(s, 4, 5)  // 追加元素

// make 创建（指定长度和容量）
s := make([]int, 5, 10)  // 长度 5，容量 10

// 切片操作 —— 类似 Python 的切片
arr := []int{0, 1, 2, 3, 4, 5}
s := arr[1:4]  // [1, 2, 3]（半开区间）

// 遍历 —— range 关键字
for i, v := range arr {
    fmt.Printf("index=%d, value=%d\n", i, v)
}

// 只要值不要索引
for _, v := range arr {
    fmt.Println(v)
}
```

**Slice 底层结构（面试高频）**：

```
type slice struct {
    array unsafe.Pointer  // 指向底层数组的指针
    len   int             // 当前长度（已使用的元素数量）
    cap   int             // 容量（底层数组的总长度）
}
```

- **切片共享底层数组**：多个切片可以指向同一个底层数组，修改一个会影响另一个（类似 JS 的数组引用共享）
- **扩容机制**：当 `len == cap` 时 `append` 会触发扩容——新分配一个更大的底层数组（容量翻倍或按比例增长），然后复制旧数据
- **扩容后原切片不变**：扩容产生新数组，旧切片仍指向原数组（此时 `s1 = append(s1, x)` 后 `s1` 和 `s2` 不再共享）

| 操作 | 时间复杂度 | 说明 |
|------|-----------|------|
| `s[i]` | O(1) | 直接索引 |
| `s = append(s, x)` | 摊还 O(1) | 可能触发扩容（O(n)） |
| `s[a:b]` | O(1) | 不复制数据，只创建新 slice header |
| `len(s)` / `cap(s)` | O(1) | 直接读取字段 |

```go
// map —— 类似 JS Map / Java HashMap / Python dict

// 声明
m := make(map[string]int)
m["apple"] = 1
m["banana"] = 2

// map 字面量
m := map[string]int{
    "apple":  1,
    "banana": 2,
}

// 取值 —— 第二个返回值表示 key 是否存在（Go 特有的"comma ok"模式）
value, exists := m["apple"]
if exists {
    fmt.Println("apple =", value)
}

// 删除
delete(m, "apple")

// 遍历（无序！）
for key, value := range m {
    fmt.Printf("%s -> %d\n", key, value)
}
```

### 2.4 结构体（struct）

```go
// struct —— 类似 Java 的 POJO / TS 的 interface / Python 的 dataclass
type User struct {
    Name  string
    Email string
    Age   int
}

// 创建实例
u1 := User{"Alice", "alice@example.com", 30}    // 按字段顺序
u2 := User{Name: "Bob", Email: "bob@example.com"} // 指定字段（推荐）
u3 := User{}  // 零值

// 访问字段
fmt.Println(u2.Name)  // "Bob"

// 指针 vs 值 —— Go 自动解引用
u := User{Name: "Alice"}
u.Age = 25           // 值类型，直接修改

up := &User{Name: "Bob"}
up.Age = 30          // 指针类型，Go 自动解引用（(*up).Age = 30 的语法糖）
```

**与 TS/Java/Python 对比**：

| Go struct | TypeScript | Java | Python |
|-----------|-----------|------|--------|
| 纯数据结构 | `interface` / `type` | POJO / Record | `@dataclass` / dict |
| 方法在外部定义（接收者） | class 内定义 | class 内定义 | class 内定义 |
| 没有继承 | `extends` | `extends` | 类继承 |
| 组合优先 | 组合 + 继承 | 组合 + 继承 | 组合 + 继承 |

### 2.5 方法（Method）

```go
// Go 的方法很特别 —— 在函数外面绑定到类型
type Rectangle struct {
    Width  float64
    Height float64
}

// 值接收者（不修改原值）
func (r Rectangle) Area() float64 {
    return r.Width * r.Height
}

// 指针接收者（可以修改原值）
func (r *Rectangle) Scale(factor float64) {
    r.Width *= factor
    r.Height *= factor
}

// 使用
rect := Rectangle{10, 5}
fmt.Println(rect.Area())  // 50
rect.Scale(2)
fmt.Println(rect.Area())  // 200
```

**关键区别**：Go 的方法只是"有接收者的函数"。同一个 Go 文件里可以为不同的类型添加方法，不需要修改类型定义。

### 2.6 函数进阶

```go
// 函数是一等公民 —— 可以赋值给变量、作为参数传递

// 函数作为参数（类似 JS 回调 / Java 函数式接口）
func compute(fn func(int, int) int) int {
    return fn(3, 4)
}

add := func(a, b int) int { return a + b }
fmt.Println(compute(add))  // 7

// 闭包 —— 类似 JS 闭包 / Java lambda
func counter() func() int {
    i := 0
    return func() int {
        i++
        return i
    }
}

c := counter()
fmt.Println(c())  // 1
fmt.Println(c())  // 2
```

---

## 第 3 章：interface 与错误处理（Go 的"鸭子类型"）

### 3.1 interface —— 隐式实现

```go
// Go 的 interface 是"方法的集合"
// 最经典的例子：空接口 interface{} 可以表示任何类型（类似 TS 的 any / Java 的 Object）

type Writer interface {
    Write([]byte) (int, error)  // 方法签名
}

// 实现 —— Go 是隐式实现！不需要 implements 关键字
// 只要一个类型实现了 Writer 接口的所有方法，它就"是"一个 Writer

type ConsoleWriter struct{}

func (cw ConsoleWriter) Write(data []byte) (int, error) {
    n, err := fmt.Println(string(data))
    return n, err
}

// 使用
var w Writer = ConsoleWriter{}
w.Write([]byte("Hello Go!"))
```

**与 TS/Java 对比**：

| Go | TypeScript | Java |
|----|-----------|------|
| 隐式实现（duck typing） | 显式/隐式皆可 | 显式 `implements` |
| 接口只定义方法 | 接口可定义属性+方法 | 接口可定义常量+方法 |
| 不需要 `implements` 关键字 | `implements` 可选 | 必须 `implements` |
| 组合小接口（一个接口 1-3 个方法） | 可大可小 | 可大可小 |

### 3.2 空接口与类型断言

```go
// 空接口 interface{} —— 可以表示任何类型（Go 1.18 后可以用 any）
var v any = 42
v = "hello"
v = true

// 类型断言 —— 获取具体类型的值
value, ok := v.(string)  // "comma ok" 模式
if ok {
    fmt.Println("v is string:", value)
}

// type switch —— 根据类型分支
switch v := v.(type) {
case int:
    fmt.Println("int:", v)
case string:
    fmt.Println("string:", v)
default:
    fmt.Printf("unknown type: %T\n", v)
}
```

### 3.3 error 接口 —— Go 的错误处理哲学

```go
// error 是一个内置接口
type error interface {
    Error() string
}

// 创建错误
errors.New("something went wrong")
fmt.Errorf("user %d not found", id)

// Go 没有异常（exception）—— 错误就是普通的返回值！
// 没有 Java 的 try/catch，没有 JS/Python 的 throw
// 也没有 Rust 的 Result 枚举 —— 就是普通的"返回一个值"

func readConfig(path string) ([]byte, error) {
    data, err := os.ReadFile(path)
    if err != nil {
        return nil, fmt.Errorf("read config: %w", err)
    }
    return data, nil
}

// 调用者必须检查错误
data, err := readConfig("config.json")
if err != nil {
    log.Fatal(err)  // 打印错误并退出
}
```

**与 Rust/Java/JS/Python 对比**：

| Go | Rust | Java | JS | Python |
|----|------|------|-----|--------|
| 返回 `(T, error)` | 返回 `Result<T, E>` | 抛出异常 | 抛出异常 | 抛出异常 |
| 必须手动检查 `err != nil` | 用 `?` 自动传播 | 自动向上抛 | 自动向上抛 | 自动向上抛 |
| 没有 try/catch | 没有 try/catch | try/catch | try/catch | try/except |
| 不会意外崩溃（除非 panic） | panic 是惩罚 | 受检异常必须处理 | 未捕获会崩溃 | 未捕获会崩溃 |

**错误链检查（Go 1.13+）**：

当错误被 `fmt.Errorf("...: %w", err)` 包装后，可以用 `errors.Is` 和 `errors.As` 解包检查原始错误：

```go
import "errors"

var ErrNotFound = errors.New("not found")

func findUser(id int) (*User, error) {
    if id < 0 {
        return nil, fmt.Errorf("find user: %w", ErrNotFound)
    }
    return &User{ID: id}, nil
}

// errors.Is —— 判断错误链中是否包含特定错误值（类似 Java 的 instanceof 检查）
_, err := findUser(-1)
if errors.Is(err, ErrNotFound) {
    fmt.Println("user not found")  // ✅ 能匹配到被包装的 ErrNotFound
}

// errors.As —— 从错误链中提取特定类型的错误（类似 Java 的 catch (SomeException e)）
var pathErr *os.PathError
if errors.As(err, &pathErr) {
    fmt.Println("path:", pathErr.Path)
}
```

| 函数 | 作用 | 类比 |
|------|------|------|
| `errors.Is(err, target)` | 判断错误链中是否存在目标错误 | Java `instanceof` / `Exception.getCause()` |
| `errors.As(err, &target)` | 从错误链中提取特定类型 | Java `catch (SpecificException e)` |
| `fmt.Errorf("...: %w", err)` | 包装错误（保留原始错误链） | Java `new Exception("msg", cause)` |

### 3.4 panic 与 recover（Go 的"异常"）

```go
// panic —— 类似 Java 的 RuntimeException / JS 的 Error
// 通常只用于"不可能发生"的错误
panic("something went terribly wrong")

// recover —— 从 panic 中恢复（类似 try/catch，但在 defer 中使用）
func safeCall() {
    defer func() {
        if r := recover(); r != nil {
            fmt.Println("Recovered from panic:", r)
        }
    }()
    panic("boom!")
}
```

**最佳实践**：99% 的场景用 error 返回值，不要用 panic。只有程序真的无法继续时才用 panic（比如初始化失败）。

---

## 第 4 章：并发 —— goroutine 与 channel（Go 的杀手锏）

> 这是 Go 最独特的核心优势。其他语言的并发模型通常靠操作系统线程或回调/async/await，Go 用 **goroutine**（轻量级线程）+ **channel**（通信管道）实现了"通过通信来共享内存，而不是通过共享内存来通信"。

### 4.1 goroutine —— 轻量级线程

```go
// goroutine —— 在函数调用前加 go 关键字即可
func sayHello() {
    fmt.Println("Hello from goroutine!")
}

go sayHello()  // 在另一个 goroutine 中执行
// 对比: Java new Thread(() -> sayHello()).start()
// 对比: JS 无等价物（需要 Worker 线程）
// 对比: Python 无等价物（需要 threading.Thread）

// 匿名函数
go func() {
    fmt.Println("Hello!")
}()

// goroutine 是"轻量级"的
// 对比：OS 线程 ~1MB 栈，goroutine ~2KB 栈，可以轻松创建数千个
```

**goroutine vs OS 线程 vs async/await**：

| 特性 | Go goroutine | OS 线程 | JS async/await | Python asyncio |
|------|-------------|---------|----------------|----------------|
| 栈大小 | ~2KB（动态增长） | ~1MB（固定） | N/A | N/A |
| 创建成本 | 极低 | 高 | 低 | 低 |
| 调度 | Go runtime 调度 | OS 内核调度 | 事件循环 | 事件循环 |
| 可创建数量 | 数十万 | 数千 | N/A | N/A |
| 通信方式 | channel | 共享内存/锁 | Promise | await |

### 4.2 同步 —— WaitGroup

```go
// 等待 goroutine 完成
var wg sync.WaitGroup

for i := 0; i < 5; i++ {
    wg.Add(1)  // 计数器 +1
    go func(id int) {
        defer wg.Done()  // 计数器 -1
        fmt.Println("goroutine", id)
    }(i)
}

wg.Wait()  // 等待计数器归零
fmt.Println("all done")
```

### 4.3 channel —— 在 goroutine 之间通信

```go
// channel —— 类似 Unix pipe / 有类型的消息队列
// 类比：JS 中没有直接等价物，最接近的是 MessageChannel 或 EventEmitter

// 创建 channel
ch := make(chan int)     // 无缓冲 channel（同步）
ch := make(chan int, 5)  // 有缓冲 channel（异步，容量 5）

// 发送与接收
ch <- 42   // 发送
value := <-ch  // 接收

// 示例
func sum(s []int, c chan int) {
    sum := 0
    for _, v := range s {
        sum += v
    }
    c <- sum  // 把结果发送到 channel
}

nums := []int{1, 2, 3, 4, 5}
ch := make(chan int)
go sum(nums[:len(nums)/2], ch)
go sum(nums[len(nums)/2:], ch)

x, y := <-ch, <-ch  // 从 channel 接收（阻塞等待）
fmt.Println(x, y, x+y)

// 关闭 channel
close(ch)
// 接收者可以用第二个参数检测是否关闭
value, ok := <-ch
if !ok {
    fmt.Println("channel closed")
}
```

### 4.4 带缓冲 channel 与 range

```go
// 有缓冲 channel —— 类似一个大小有限的队列
ch := make(chan string, 3)
ch <- "A"
ch <- "B"
ch <- "C"

fmt.Println(<-ch)  // "A"
fmt.Println(<-ch)  // "B"

// range 遍历 channel（直到 channel 关闭）
for msg := range ch {
    fmt.Println(msg)
}
```

### 4.5 select —— 多路复用

```go
// select —— 类似 JS Promise.race / Java 的 Selector
// 等待多个 channel 中的一个就绪

ch1 := make(chan string)
ch2 := make(chan string)

go func() {
    time.Sleep(1 * time.Second)
    ch1 <- "one"
}()
go func() {
    time.Sleep(2 * time.Second)
    ch2 <- "two"
}()

select {
case msg1 := <-ch1:
    fmt.Println("received:", msg1)
case msg2 := <-ch2:
    fmt.Println("received:", msg2)
case <-time.After(3 * time.Second):
    fmt.Println("timeout")
default:
    fmt.Println("no channel ready")  // 非阻塞
}
```

### 4.6 并发模式示例

```go
// 生产者-消费者模式
func producer(ch chan<- int) {  // chan<- 表示只发送
    for i := 0; i < 10; i++ {
        ch <- i
    }
    close(ch)
}

func consumer(ch <-chan int) {  // <-chan 表示只接收
    for n := range ch {
        fmt.Println("consumed:", n)
    }
}

ch := make(chan int, 5)
go producer(ch)
consumer(ch)

// Worker Pool 模式 —— 固定数量的 worker 处理任务
func worker(id int, jobs <-chan int, results chan<- int) {
    for j := range jobs {
        results <- j * 2
    }
}

jobs := make(chan int, 10)
results := make(chan int, 10)

// 启动 3 个 worker
for w := 1; w <= 3; w++ {
    go worker(w, jobs, results)
}

// 发送 5 个任务
for j := 1; j <= 5; j++ {
    jobs <- j
}
close(jobs)

// 收集结果
for r := 1; r <= 5; r++ {
    <-results
}
```

---

## 第 5 章：实战能力（写实用程序）

### 5.1 标准库 —— Go 最大的优势

Go 的标准库极其强大，自带 HTTP 服务器、JSON 编解码、模板引擎、加密等。**很多场景不需要任何第三方依赖。**

| 包 | 功能 | 类比 |
|----|------|------|
| `fmt` | 格式化 I/O | `console.log` / `print` / `System.out` |
| `net/http` | HTTP 客户端和服务器 | Express / Flask / Spring Boot |
| `encoding/json` | JSON 编解码 | `JSON.parse` / `JSON.stringify` / `ObjectMapper` |
| `io/ioutil` / `os` | 文件 I/O | `fs` / `Path` / `open()` |
| `time` | 时间处理 | `Date` / `LocalDateTime` / `datetime` |
| `sync` | 同步原语（Mutex、WaitGroup） | `synchronized` / `threading.Lock` |
| `testing` | 测试框架 | Jest / JUnit / pytest |
| `flag` | 命令行参数解析 | commander/argparse/argparse |
| `strings` / `strconv` | 字符串和类型转换 | `String` / string methods |

### 5.2 HTTP 服务器（10 行代码）

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
    // 对比 JS: app.listen(8080)
    // 对比 Python: app.run(port=8080)
    // 对比 Java: SpringApplication.run()
}
```

### 5.3 JSON 处理

```go
type Person struct {
    Name string `json:"name"`           // 结构体标签（tag）—— Go 的反射机制
    Age  int    `json:"age"`
    City string `json:"city,omitempty"` // 为空时忽略
}

// 序列化 —— 类似 JSON.stringify
p := Person{Name: "Alice", Age: 30}
data, _ := json.Marshal(p)
fmt.Println(string(data))  // {"name":"Alice","age":30}

// 反序列化 —— 类似 JSON.parse
jsonStr := `{"name":"Bob","age":25}`
var p2 Person
json.Unmarshal([]byte(jsonStr), &p2)
fmt.Println(p2.Name)  // Bob
```

### 5.4 文件 I/O

```go
// 读取文件
data, err := os.ReadFile("input.txt")
if err != nil {
    log.Fatal(err)
}
fmt.Println(string(data))

// 写入文件
err := os.WriteFile("output.txt", []byte("Hello Go!"), 0644)
if err != nil {
    log.Fatal(err)
}

// 逐行读取
file, err := os.Open("input.txt")
if err != nil {
    log.Fatal(err)
}
defer file.Close()

scanner := bufio.NewScanner(file)
for scanner.Scan() {
    fmt.Println(scanner.Text())
}
```

### 5.5 实战项目小结

| 项目 | 涉及知识点 | 难度 |
|------|-----------|------|
| **CLI 文件搜索工具** | flag 参数解析、文件 I/O、正则匹配 | ⭐ |
| **RESTful API 服务器** | net/http、路由、JSON、中间件 | ⭐⭐ |
| **并发 URL 检查器** | goroutine、channel、WaitGroup、HTTP 客户端 | ⭐⭐ |
| **简易聊天室** | WebSocket、goroutine 管理、channel 广播 | ⭐⭐⭐ |

---

## 第 6 章：后续精进方向

### 6.1 包管理与模块

```go
// go.mod —— 类似 package.json / pom.xml / pyproject.toml
module myapp

go 1.22

require (
    github.com/gin-gonic/gin v1.9.1
    github.com/go-sql-driver/mysql v1.7.1
)

// 常用命令
go mod init myapp       // 初始化（类似 npm init）
go get github.com/xxx   // 添加依赖（类似 npm install xxx）
go mod tidy             // 清理无用依赖（类似 npm prune）
go mod vendor           // 生成 vendor 目录（类似 node_modules）
```

**包可见性规则**：
- 首字母大写的名称 = public（导出）
- 首字母小写的名称 = private（包内可见）
- Go 没有 `public` / `private` / `protected` 关键字

### 6.2 测试

```go
// math.go
func Add(a, b int) int {
    return a + b
}

// math_test.go —— 文件名必须以 _test.go 结尾
package main

import "testing"

func TestAdd(t *testing.T) {
    got := Add(2, 3)
    want := 5
    if got != want {
        t.Errorf("Add(2,3) = %d; want %d", got, want)
    }
}

// 运行测试
// go test           —— 类似 npm test / mvn test / pytest
// go test -v        —— 详细输出
// go test -bench=.  —— 基准测试

// 表格驱动测试（Go 社区的惯用模式）
func TestAdd(t *testing.T) {
    tests := []struct {
        a, b, want int
    }{
        {1, 2, 3},
        {0, 0, 0},
        {-1, 1, 0},
    }
    for _, tt := range tests {
        got := Add(tt.a, tt.b)
        if got != tt.want {
            t.Errorf("Add(%d,%d)=%d; want %d", tt.a, tt.b, got, tt.want)
        }
    }
}
```

### 6.3 常用第三方库

| 库 | 用途 | 类比 |
|----|------|------|
| **gin** / **echo** / **fiber** | HTTP 框架（比标准库更易用） | Express / Flask / Spring Boot |
| **gorm** / **sqlx** | 数据库 ORM | Prisma / TypeORM / JPA / SQLAlchemy |
| **cobra** | CLI 框架 | commander / click |
| **viper** | 配置管理 | dotenv / config |
| **zap** / **logrus** | 日志 | winston / logback / structlog |
| **testify** | 测试断言库 | Jest assertions / JUnit assertions |
| **validator** | 结构体验证 | class-validator / Hibernate Validator |

### 6.4 Context —— Go 的"请求级上下文"

```go
// context.Context —— 用于传递截止时间、取消信号、请求级值
// 类似 Java 的 ThreadLocal，但更安全（显式传递）

func handler(w http.ResponseWriter, r *http.Request) {
    ctx := r.Context()

    // 3 秒超时的 context
    ctx, cancel := context.WithTimeout(ctx, 3*time.Second)
    defer cancel()

    result, err := slowOperation(ctx)
    if err != nil {
        http.Error(w, err.Error(), http.StatusInternalServerError)
        return
    }
    fmt.Fprint(w, result)
}

func slowOperation(ctx context.Context) (string, error) {
    select {
    case <-time.After(2 * time.Second):
        return "done", nil
    case <-ctx.Done():
        return "", ctx.Err()  // 返回超时或取消错误
    }
}
```

### 6.5 项目架构建议

```
myapp/
├── go.mod                # 类似 package.json / pom.xml
├── go.sum                # 依赖锁文件（类似 package-lock.json）
├── main.go               # 入口文件
├── cmd/                  # 多个入口（可选）
│   └── cli/
│       └── main.go
├── internal/             # 内部包（外部不可导入，Go 的特殊目录名）
│   ├── handler/
│   │   └── user.go
│   ├── service/
│   │   └── user.go
│   └── repository/
│       └── user.go
├── pkg/                  # 可导出的公共包
│   └── utils/
│       └── http.go
├── api/                  # API 定义（protobuf / OpenAPI）
├── config/
│   └── config.go
└── test/                 # 集成测试
    └── integration_test.go
```

---

## 🕹️ 入门实践项目：URL 健康检查 CLI 工具

### 场景描述

一个命令行工具，接收多个 URL，并发检查它们的 HTTP 状态码，输出可达性和响应时间。

### 覆盖知识点

| 功能 | 涉及知识点 |
|------|-----------|
| CLI 参数解析 | `os.Args` 或 `flag` 包 |
| HTTP 请求 | `net/http` 标准库 |
| 并发检查 | goroutine + channel + WaitGroup |
| 超时控制 | `http.Client.Timeout` 或 context |
| 结果汇总 | channel 收集结果 |
| 输出格式化 | `fmt` 包 |

### 功能要求

```bash
go run main.go https://google.com https://github.com https://example.com

# 输出示例：
# URL                    STATUS   TIME
# https://google.com     200      120ms
# https://github.com     200      85ms
# https://example.com    200      45ms
# ---
# Total: 3, Success: 3, Failed: 0
```

---

## 🗓️ 建议学习时间线（每天 1-2 小时）

| 阶段 | 内容 | 时间 |
|------|------|------|
| **第 1 天** | 第 1 章：基础语法 | 一小时扫盲，重点在多返回值和 defer |
| **第 2 天** | 第 2 章：struct、slice、map | 重点在 slice 操作和 range 遍历 |
| **第 3 天** | 第 3 章：interface 与 error | 重点在隐式实现和错误处理哲学 |
| **第 4-5 天** | 第 4 章：goroutine + channel | **Go 最核心的部分**，多写并发示例 |
| **第 6 天** | 第 5 章：HTTP 服务 + 标准库 | 10 行写一个 Web 服务 |
| **第 7 天** | 实践项目：URL 健康检查 | 综合练习 |
| **后续** | 第 6 章：按需深入 | gin/gorm、Context、测试 |
| **合计** | **~7 天入门** | **能独立写 Web 服务和 CLI 工具** |

---

## ✅ 入门完成标准（第 1-5 章）

- [ ] 理解 Go 的变量声明、简短声明、零值机制
- [ ] 能正确使用 slice 和 map，理解切片操作的底层行为
- [ ] **能解释 Go 的 interface 隐式实现机制**
- [ ] **能正确使用 error 返回值处理错误**，理解 Go 的错误处理哲学
- [ ] **能用 goroutine + channel 编写并发程序**
- [ ] 能使用 `select` 多路复用 channel
- [ ] 能 10 行代码写一个 HTTP 服务器
- [ ] 能使用 JSON 序列化/反序列化
- [ ] 能使用 `os.ReadFile` / `os.WriteFile` 读写文件
- [ ] 能独立完成 URL 健康检查 CLI 工具

---

## 📝 学习建议

- **Go 极其简洁**：语法比任何主流语言都少关键字。花半小时就能读代码，一两天就能写代码。
- **不要抗拒 `if err != nil`**：这是 Go 最被吐槽但也最核心的设计。它让错误处理变得显式、可控、不会遗漏。
- **goroutine 不是黑魔法**：理解"goroutine 是轻量级的并发执行单元"就够了。不要过度优化，先写出正确的并发代码。
- **写 Go 要用 Go 的风格**：不要试图把 Java/Python 的模式搬到 Go 里。Go 推崇组合而非继承、简单而非灵活。
- **标准库是你的朋友**：Go 的标准库质量极高，很多场景不需要第三方库。

### 与各语言的核心差异速查

| 概念 | Go | TypeScript | Java | Python |
|------|-----|-----------|------|--------|
| 内存管理 | GC（并发标记清除） | GC | GC | GC |
| 继承 | 无（用组合） | `extends` / `implements` | `extends` / `implements` | 类继承 |
| 泛型 | ✅ Go 1.18+ 引入 | ✅ | ✅ | ❌（typing 是注解） |
| 异常 | 无（error 返回值） | `throw` / `try/catch` | `throw` / `try/catch` | `raise` / `try/except` |
| null/nil | nil（有类型的 nil） | `undefined` / `null` | `null` | `None` |
| 并发模型 | goroutine + channel | 事件循环 + Worker | OS 线程 + virtual threads | GIL 受限的线程 |
| 包管理 | go mod（官方） | npm | Maven/Gradle | pip |
| 编译速度 | 极快 | 转译到 JS | 中等 | N/A（解释型） |
| 元编程 | 反射 + 代码生成 | 装饰器/Proxy | 注解 + 反射 | 装饰器/元类 |
| 格式化 | `gofmt`（官方标准） | Prettier | 无官方标准 | Black |

---

## 🔗 推荐资源

- [Go 官方教程（Tour of Go）](https://go.dev/tour/) — 浏览器中交互式学 Go，推荐必看
- [Go 官方文档](https://go.dev/doc/) — 语言规范 + 标准库文档
- [Go by Example](https://gobyexample.com/) — 通过代码示例学 Go
- [Effective Go](https://go.dev/doc/effective_go) — 写出地道 Go 代码的指南
- [Go 语言圣经（中文）](https://books.studygolang.com/gopl-zh/) — 《The Go Programming Language》的中文版
- [Go 标准库中文文档](https://studygolang.com/pkgdoc)

---

*最后更新：2026年6月*
