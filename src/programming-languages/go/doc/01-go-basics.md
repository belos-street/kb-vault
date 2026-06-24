# 01 — Go 基础语法（半小时快速上手）

> 面向有 JS/TS/Python/Java 经验的全栈工程师。Go 的设计目标之一是"15 分钟看懂代码"——语法比 Java 简洁，比 Python/JS 更规整，半小时就能上手。

---

## 本章目标

- 搭建 Go 开发环境，理解核心命令链（`go run` / `go build` / `go fmt`）
- 掌握变量声明、类型系统、零值机制
- 理解 Go 独特的控制流（只有 `for`，`switch` 默认不穿透）
- 掌握函数的多返回值与命名返回值
- 理解 `defer` 机制及其典型应用场景
- **建立起与 JS/TS/Python/Java 的语法对照**

---

## 1.1 环境与工具链

### 安装验证

```bash
go version
# 输出示例：go version go1.22.0 darwin/amd64
```

### 三个核心命令

```bash
go run main.go      # 直接运行（不产生二进制文件）
go build            # 编译为二进制可执行文件
go fmt ./...        # 自动格式化代码（Go 有官方标准格式）
```

| 命令 | 作用 | 类比 |
|------|------|------|
| `go run` | 编译 + 运行一次 | `node index.js` / `python main.py` |
| `go build` | 编译为二进制可执行文件 | `tsc` / `javac` / `mvn package` |
| `go fmt` | 强制统一代码格式 | Prettier（但 Go 的是官方标准，无争议） |

### 初始化项目

```bash
go mod init hello    # 初始化模块（类比 npm init）
# 生成 go.mod 文件，类似 package.json
```

### VS Code 插件

- **Go**（官方扩展，由 gopls 语言服务器驱动）
- 提供自动补全、代码跳转、格式化、linting

---

## 1.2 Hello World 与项目结构

```go
package main    // 每个 Go 文件属于一个包

import "fmt"    // 标准库的格式化 I/O 包

func main() {                    // 程序入口
    fmt.Println("Hello, Go!")   // 输出并换行
}
```

**三点注意**（与其他语言的区别）：

1. **`package` 声明**：每个 Go 文件第一行必须是 `package xxx`。`package main` 表示这是一个可执行的程序（类比 Java 的 `public class Main`，但 Go 不需要类包裹）

2. **`import` 是关键字**：不是 `require`/`import` 语句，是编译期指令。如果导入未使用的包，**编译会报错**（Go 非常严格）

3. **`func main()`**：入口函数，**无参数、无返回值**。对比：
   - Java: `public static void main(String[] args)`
   - Python: `if __name__ == '__main__':`
   - Node: 文件直接执行

### go.mod 结构

```go
module hello          // 模块名

go 1.22              // Go 版本
```

---

## 1.3 变量与类型

### 变量声明

```go
// 方式一：完整声明（var + 类型）—— 类似 Java
var name string = "Go"

// 方式二：类型推导 —— 类似 TS 自动类型推断
var name = "Go"    // 编译器自动推导为 string

// 方式三：简短声明（:=）—— 最常用，类似 TS 的 let
count := 42        // 自动推导为 int
// count := 43     // ❌ 编译错误：:= 左侧不能重复声明（同作用域内）

// 多变量声明
var x, y int = 1, 2
a, b, c := 1, "hello", true  // 混合类型可以同时赋值
```

### 零值（Zero Values）

Go 没有未初始化的变量 —— 声明后自动赋"零值"。

```go
var i int       // 0
var f float64   // 0.0
var s string    // ""（空字符串，不是 nil）
var b bool      // false
var p *int      // nil（指针）
```

**与各语言对比**：

| Go | TypeScript | Java | Python |
|----|-----------|------|--------|
| 内置零值 ✅ | `let x: number` → `undefined` ❌ | `int x;` → 编译错误 | `x: int` → 注解而已，不赋值报错 |
| 没有未初始化变量 | 可能为 `undefined` | 成员变量有默认值，局部变量无 | 不赋值无法使用 |

### 常量

```go
const Pi = 3.14159          // 类型推导
const MAX_COUNT int = 100   // 指定类型

// 常量可以批量声明
const (
    StatusOK     = 200
    StatusNotFound = 404
)
```

### := 与 var 的选择

| 场景 | 推荐写法 |
|------|---------|
| 函数内局部变量 | `count := 42`（最常用） |
| 需要显式指定类型 | `var num float64 = 3.14` |
| 包级变量（函数外） | `var version = "1.0"`（函数外用 var） |
| 零值声明 | `var count int` |

---

## 1.4 基本数据类型

### 整数类型

```go
// 有符号整数
var a int     // 平台相关：64 位系统上是 64 位
var b int8    // -128 ~ 127
var c int16   // -32,768 ~ 32,767
var d int32   // -2^31 ~ 2^31-1（对应 Java 的 int）
var e int64   // -2^63 ~ 2^63-1（对应 Java 的 long）

// 无符号整数
var f uint    // 平台相关
var g uint8   // 0 ~ 255（byte 是 uint8 的别名）
var h uint16  // 0 ~ 65,535
var i uint32  // 0 ~ 2^32-1
var j uint64  // 0 ~ 2^64-1

// byte 和 rune 的类型别名
var b byte = 'A'     // byte = uint8
var r rune = '中'    // rune = int32，代表 Unicode 码点
```

### 浮点类型

```go
var x float64 = 3.14159  // 双精度（默认，推荐）—— 对应 Java 的 double
var y float32 = 3.14     // 单精度 —— 对应 Java 的 float
```

### 布尔类型

```go
var active bool = true
var enabled bool         // false（零值）
```

### 字符串

```go
var s string = "hello"

// 字符串不可变（类似 Java String）
// s[0] = 'c'   // ❌ 编译错误

// 获取长度
fmt.Println(len(s))  // 5（字节数，非字符数！中文注意）

// 字符串拼接
s2 := s + " world"   // "hello world"

// 多行字符串：反引号
json := `{
    "name": "Go",
    "year": 2009
}`
```

### 类型转换

Go **没有隐式类型转换**——所有转换必须显式写出。

```go
var x int = 42
var y float64 = float64(x)   // ✅ 显式转换
// var z float64 = x         // ❌ 编译错误

var a int32 = 10
var b int64 = 20
// var c = a + b             // ❌ 类型不匹配
var c = int64(a) + b         // ✅ 显式转换后才可运算

// 字符串 <-> 数字
n, _ := strconv.Atoi("42")       // string → int
s := strconv.Itoa(42)             // int → string
f, _ := strconv.ParseFloat("3.14", 64)  // string → float64
```

**与各语言对比**：

| Go | TypeScript | Java | Python |
|----|-----------|------|--------|
| 无隐式转换，一切显式 ✅ | 宽松隐式转换 | 窄化隐式转换 | 隐式转换很灵活 |

---

## 1.5 控制流

### if/else

```go
// 条件不需要括号！但大括号必须（且必须跟 if 在同一行）
if x > 0 {
    fmt.Println("positive")
} else if x < 0 {
    fmt.Println("negative")
} else {
    fmt.Println("zero")
}

// if 中可以包含一个简单语句（Go 很常见的写法）
if err := doSomething(); err != nil {
    fmt.Println("Error:", err)
}
// err 的作用域仅限 if-else 块内
```

### for —— Go 只有 for

```go
// 经典 for loop（类似 Java）
for i := 0; i < 10; i++ {
    fmt.Println(i)
}

// for 替代 while
sum := 1
for sum < 1000 {
    sum += sum
}

// 无限循环
for {
    // ...
    break    // 需要 break 退出
}

// range 遍历（最常用的遍历方式）
nums := []int{1, 2, 3}
for index, value := range nums {
    fmt.Printf("nums[%d] = %d\n", index, value)
}
```

### switch

```go
// switch 默认带 break —— 和 Java/C 完全不同！
os := "darwin"
switch os {
case "darwin":
    fmt.Println("macOS")
case "linux":
    fmt.Println("Linux")
default:
    fmt.Printf("%s\n", os)
}

// switch 不带条件 —— 相当于 if/else if 链
score := 85
switch {
case score >= 90:
    fmt.Println("A")
case score >= 80:
    fmt.Println("B")
case score >= 70:
    fmt.Println("C")
default:
    fmt.Println("D")
}

// fallthrough —— 强制执行下一个 case（很少用）
switch n := 2; n {
case 1:
    fmt.Println("one")
    fallthrough
case 2:
    fmt.Println("two")    // 也会执行到这里
    fallthrough
case 3:
    fmt.Println("three")  // 也会执行到这里
}
```

---

## 1.6 函数

### 基本函数

```go
// 返回值类型在参数列表后面！
func add(x int, y int) int {
    return x + y
}

// 参数类型相同时可以简写
func add(x, y int) int {
    return x + y
}

// 调用
result := add(3, 4)
```

**与各语言对比**：

```go
// Go:   func add(x, y int) int { return x + y }
// TS:   function add(x: number, y: number): number { return x + y }
// Java: public static int add(int x, int y) { return x + y }
// Python: def add(x: int, y: int) -> int: return x + y
```

### 多返回值 —— Go 的标志性特性

```go
// 函数可以返回多个值（类似 Python 的元组拆包）
func divide(a, b int) (int, error) {
    if b == 0 {
        return 0, fmt.Errorf("division by zero")
    }
    return a / b, nil
}

// 调用
result, err := divide(10, 2)
if err != nil {
    fmt.Println("Error:", err)
    return
}
fmt.Println(result)  // 5
```

| 多返回值 | Go | TS | Java | Python |
|---------|-----|-----|------|--------|
| 原生支持 | ✅ | ❌（需包装对象） | ❌（需包装对象） | ✅ 元组 |

### 命名返回值

```go
// 命名返回值：提前声明返回值的变量名
// 函数体内部不需要再声明，直接赋值，最后 return 裸返回

func split(sum int) (x, y int) {    // x, y 被初始化为 0
    x = sum * 4 / 9
    y = sum - x
    return                          // "裸返回" -> 返回 x 和 y 的当前值
}
```

### 空白标识符 `_`

```go
// 当不需要某个返回值时，用 _ 忽略
result, _ := divide(10, 2)   // 忽略 error
_, err := divide(10, 0)      // 忽略 result，只关心错误

// range 遍历时忽略索引
for _, value := range nums {
    fmt.Println(value)
}
```

---

## 1.7 defer —— Go 的"finally"

### 基本用法

```go
// defer 延迟执行 —— 函数返回前一定会执行（类似 Java finally / Python 上下文管理器）

func readFile() {
    f, err := os.Open("file.txt")
    if err != nil {
        return
    }
    defer f.Close()   // 无论后面发生什么，函数返回前都会执行 f.Close()
    // 读取文件...
}
```

### defer 的执行顺序：LIFO（后进先出）

```go
func example() {
    defer fmt.Println("first")    // 第三个执行
    defer fmt.Println("second")   // 第二个执行
    defer fmt.Println("third")    // 第一个执行
    fmt.Println("hello")
}
// 输出：
// hello
// third
// second
// first
```

### defer 的参数是在注册时求值的

```go
func count() int {
    i := 0
    defer fmt.Println(i)   // 输出 0（注册时 i=0）
    i++
    return i               // 返回 1
}
```

### defer 典型场景

```go
// 1. 关闭资源
defer file.Close()
defer db.Close()
defer resp.Body.Close()

// 2. 解锁
mu.Lock()
defer mu.Unlock()

// 3. 记录函数执行时间
func slowFunc() {
    defer timeTrack(time.Now(), "slowFunc")
    // 业务代码...
}

func timeTrack(start time.Time, name string) {
    elapsed := time.Since(start)
    log.Printf("%s took %s", name, elapsed)
}
```

**与各语言对比**：

| Go | Java | Python | JS |
|----|------|--------|-----|
| `defer f.Close()` | `try { ... } finally { f.close(); }` | `with open(...) as f:` / `try/finally` | `try { ... } finally { f.close(); }` |
| 语言内置，极其简洁 ✅ | 需要 try/finally 块 | 需要上下文管理器或 finally | 需要 try/finally 块 |

---

## 本章总结

### 面试高频题

1. **Go 的变量声明有哪些方式？有什么区别？**
   - `var x int`：显式类型声明，用于包级变量
   - `x := 42`：简短声明，只能在函数内使用
   - `const x = 42`：常量声明

2. **Go 的零值机制有什么好处？**
   - 确保变量总是被初始化，避免了 Java/JS 中的 `NullPointerException`
   - 不需要像 Java 那样手动初始化成员变量

3. **Go 的 for 循环为什么没有 while 和 do-while？**
   - 设计哲学是"少即是多"——`for` 可以表达所有循环模式，减少关键字
   - Go 团队认为 `while` 和 `do-while` 是多余的

4. **Go 的 switch 和 Java 的 switch 有什么不同？**
   - Go 的 case 默认带 break（不会穿透）
   - Go 的 switch 可以没有表达式（替代 if/else if 链）
   - Go 的 case 可以包含多个值：`case "a", "b", "c":`

5. **defer 的执行顺序是怎样的？**
   - LIFO（后进先出）
   - 参数在注册 defer 时求值
   - defer 在函数 return 之后、真正返回之前执行

6. **多返回值在 Go 中主要用在什么场景？**
   - 函数返回 `(value, error)` —— 这是 Go 最普遍的错误处理模式
   - 返回多个计算结果：`(quotient, remainder)`

### 学习检查

- [ ] 能理解并解释 Go 的零值机制
- [ ] 能正确使用 `:=` 和 `var` 声明变量
- [ ] 能进行显式类型转换
- [ ] 能使用 `for` 的三种形式（经典、while、无限）
- [ ] 能使用 `switch` 替代长的 if/else if 链
- [ ] 能写出多返回值函数，并正确处理 error
- [ ] 能使用 `defer` 管理资源释放

### 推荐资源

- [Tour of Go](https://go.dev/tour/) — 浏览器中交互式学 Go
- [Go by Example: Hello World](https://gobyexample.com/hello-world)
- [Go by Example: Variables](https://gobyexample.com/variables)
- [Go by Example: Functions](https://gobyexample.com/functions)
- [Go by Example: Defer](https://gobyexample.com/defer)

---

*最后更新：2026年6月*
