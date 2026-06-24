# 02 — 组合类型（struct、slice、map、函数进阶）

> 面向有 JS/TS/Python/Java 经验的全栈工程师。本章覆盖 Go 的核心组合类型 —— 你的日常代码 80% 都在和这些类型打交道。

---

## 本章目标

- 理解数组与切片的本质区别（固定长度 vs 动态数组）
- **掌握 slice 的底层结构**（array pointer + len + cap）与扩容机制
- 掌握 map 的增删改查操作
- 掌握 struct 的定义、创建、字段操作
- 理解值接收者与指针接收者在方法中的区别
- 掌握函数作为一等公民（闭包、函数作为参数）
- **建立起与 JS/TS/Python/Java 的对照**

---

## 2.1 数组（Array）

> 数组在 Go 中**长度固定**，很少直接使用。绝大多数场景用 slice。

```go
// 声明 —— 长度是类型的一部分！
var arr [5]int            // [0, 0, 0, 0, 0]（全是零值）
arr[0] = 1

// 字面量初始化
arr := [3]int{1, 2, 3}    // [1, 2, 3]

// 让编译器推导长度
arr := [...]int{1, 2, 3}  // [3]int

// 指定索引初始化
arr := [5]int{0: 1, 2: 3} // [1, 0, 3, 0, 0]
```

**数组的关键特性**：

```go
// 长度是类型的一部分！[3]int 和 [5]int 是不同的类型
var a [3]int
var b [5]int
// a = b  // ❌ 编译错误：类型不匹配

// 数组是值类型 —— 赋值会复制整个数组（类似 C 的数组，不是 Java/JS 的引用）
arr1 := [3]int{1, 2, 3}
arr2 := arr1        // 复制整个数组！
arr2[0] = 99
fmt.Println(arr1)   // [1, 2, 3] — 不受影响
fmt.Println(arr2)   // [99, 2, 3]
```

---

## 2.2 切片（Slice）—— 动态数组

> 切片是 Go 中最常用的集合类型。**几乎不用数组，用切片。**

### 创建切片

```go
// 字面量创建
s := []int{1, 2, 3}       // 类似 JS: const s = [1, 2, 3]

// make 创建（指定长度和容量）
s := make([]int, 5)       // 长度 5，容量 5，元素零值
s := make([]int, 5, 10)   // 长度 5，容量 10（预留空间）

// 空切片（不是 nil）
s := []int{}
```

**与各语言对比**：

| Go | TypeScript | Java | Python |
|----|-----------|------|--------|
| `s := []int{1, 2, 3}` | `const s = [1, 2, 3]` | `List.of(1, 2, 3)` | `s = [1, 2, 3]` |
| `make([]int, 5, 10)` | `new Array(5)` | `new ArrayList<>(10)` | `[None] * 5` |
| `append(s, 4)` | `s.push(4)` | `list.add(4)` | `s.append(4)` |

### 切片操作

```go
// 切片操作 —— 类似 Python 的切片语法
arr := []int{0, 1, 2, 3, 4, 5}

s := arr[1:4]   // [1, 2, 3]（半开区间：包含 1，不包含 4）
s := arr[:3]    // [0, 1, 2]（从开头到索引 3）
s := arr[3:]    // [3, 4, 5]（从索引 3 到末尾）
s := arr[:]     // [0, 1, 2, 3, 4, 5]（整个切片）

// 追加元素
s := []int{1, 2, 3}
s = append(s, 4)          // [1, 2, 3, 4]
s = append(s, 5, 6, 7)    // [1, 2, 3, 4, 5, 6, 7]

// 合并切片
s = append(s, []int{8, 9}...)  // [1, 2, 3, 4, 5, 6, 7, 8, 9]
```

### Slice 底层结构（面试高频）

```
slice 在内存中是一个 24 字节的结构体（64 位系统）：
┌─────────────────────────────────────────────────┐
│  type slice struct {                             │
│      array unsafe.Pointer   // 8 字节            │
│      len   int              // 8 字节            │
│      cap   int              // 8 字节            │
│  }                                               │
└─────────────────────────────────────────────────┘

内存布局示例：
  slice s                   底层数组
  ┌──────┬─────┬─────┐     ┌─────┬─────┬─────┬─────┬─────┐
  │ ptr  │ len │ cap │ ──→ │  0  │  1  │  2  │  3  │  4  │
  │  │   │  3  │  5  │     └─────┴─────┴─────┴─────┴─────┘
  └──┴───┴─────┴─────┘
```

### 切片共享底层数组

```go
// 多个切片可以指向同一个底层数组！
arr := []int{0, 1, 2, 3, 4, 5}
s1 := arr[0:3]   // [0, 1, 2]
s2 := arr[2:5]   // [2, 3, 4]

// s1 和 s2 共享 arr 的底层数组
s1[2] = 99       // 修改 s1[2] 会影响 s2[0]
fmt.Println(s2)  // [99, 3, 4]
```

### 扩容机制

```go
// 当 len == cap 时，append 会触发扩容
s := make([]int, 2, 2)  // 长度 2，容量 2
s[0], s[1] = 1, 2

s = append(s, 3)        // 触发扩容！
// 1. 分配一个新的更大的底层数组（容量翻倍：2 → 4）
// 2. 复制旧数据：[1, 2]
// 3. 追加新元素：[1, 2, 3]

// 扩容策略：
// 容量 < 256  → 翻倍
// 容量 >= 256 → 增加约 25%
```

| 操作 | 时间复杂度 | 说明 |
|------|-----------|------|
| `s[i]` | O(1) | 直接索引 |
| `s = append(s, x)` | 摊还 O(1) | 扩容时 O(n) |
| `s[a:b]` | O(1) | 不复制数据，只创建新 slice header |
| `len(s)` / `cap(s)` | O(1) | 直接读取结构体字段 |

---

## 2.3 Map（映射）

> map —— 类似 JS Map / Java HashMap / Python dict

```go
// 创建 map
// 方式一：make
m := make(map[string]int)

// 方式二：字面量
m := map[string]int{
    "apple":  1,
    "banana": 2,
}

// 增/改
m["orange"] = 3
m["apple"] = 10

// 查 —— "comma ok" 模式（Go 的标志性写法）
value, exists := m["apple"]
if exists {
    fmt.Println("apple =", value)  // apple = 10
}

// 删
delete(m, "banana")

// 遍历（无序！）
for key, value := range m {
    fmt.Printf("%s -> %d\n", key, value)
}
// 输出顺序每次运行可能不同！

// 获取长度
fmt.Println(len(m))  // 2
```

**与各语言对比**：

| Go | TypeScript | Java | Python |
|----|-----------|------|--------|
| `map[K]V` | `Map<K, V>` | `HashMap<K, V>` | `dict` |
| `m["key"]` | `map.get("key")` | `map.get("key")` | `m["key"]` |
| `delete(m, "k")` | `map.delete("k")` | `map.remove("k")` | `del m["k"]` |
| `for k, v := range m` | `for (const [k, v] of map)` | `for (var e : map)` | `for k, v in m.items()` |
| "comma ok" 检查 key 存在 ✅ | `map.has("k")` | `map.containsKey("k")` | `"k" in m` |

### Map 注意事项

```go
// 1. map 的零值是 nil —— 不能直接写入
var m map[string]int
// m["key"] = 1  // ❌ panic: assignment to entry in nil map
m = make(map[string]int)  // 必须先初始化

// 2. map 不是并发安全的！
// 并发读写需要加锁或使用 sync.Map

// 3. 遍历顺序不保证 —— 每次运行都可能不一样
```

---

## 2.4 结构体（struct）

> struct —— 类似 Java 的 POJO / TS 的 interface / Python 的 dataclass

### 定义与创建

```go
type User struct {
    Name  string
    Email string
    Age   int
}

// 创建实例
u1 := User{"Alice", "alice@example.com", 30}     // 按字段顺序（不推荐，易错）
u2 := User{Name: "Bob", Email: "bob@example.com"} // 指定字段名（推荐）
u3 := User{}                                      // 零值：Name="", Email="", Age=0
u4 := User{Name: "Charlie"}                       // 只设置部分字段，其余为零值

// 访问字段
fmt.Println(u2.Name)  // "Bob"
fmt.Println(u2.Age)   // 0（零值）
```

### 指针 vs 值

```go
u := User{Name: "Alice"}
u.Age = 25             // 值类型，直接修改（Go 自动处理）

up := &User{Name: "Bob"}
up.Age = 30            // 指针类型，Go 自动解引用
// 等价于 (*up).Age = 30，但 Go 允许直接写 up.Age
```

**与各语言对比**：

| Go struct | TypeScript | Java | Python |
|-----------|-----------|------|--------|
| `type User struct { ... }` | `interface User { ... }` | `class User { ... }` | `@dataclass class User:` |
| 纯数据，没有方法在内部 | 可以定义方法 | 方法通常定义在类内部 | 方法在类内部 |
| 没有构造器（用字面量） | 有构造器 | 有构造器 | `__init__` |
| 零值自动初始化 | `undefined` | `null` | 需要 `__init__` 或 `field` |
| 没有继承 | `extends` | `extends` | 类继承 |

### 结构体嵌套

```go
type Address struct {
    City    string
    Country string
}

type User struct {
    Name    string
    Address Address   // 嵌套结构体
}

// 创建
u := User{
    Name: "Alice",
    Address: Address{
        City:    "Beijing",
        Country: "China",
    },
}

// 访问嵌套字段
fmt.Println(u.Address.City)  // "Beijing"

// 匿名字段（嵌入）—— Go 的"继承"模拟
type Admin struct {
    User              // 嵌入 User 的所有字段和方法（匿名）
    Role   string
}

admin := Admin{
    User: User{Name: "Alice"},
    Role: "superadmin",
}

// 可以直接访问嵌入的字段
fmt.Println(admin.Name)  // "Alice"（admin.User.Name 的语法糖）
fmt.Println(admin.Role)  // "superadmin"
```

---

## 2.5 方法（Method）

> Go 没有 class，但可以在类型上定义方法。方法是"有接收者的函数"。

### 值接收者 vs 指针接收者

```go
type Rectangle struct {
    Width  float64
    Height float64
}

// 值接收者 —— 方法操作的是原值的副本，不修改原值
func (r Rectangle) Area() float64 {
    return r.Width * r.Height
}

// 指针接收者 —— 可以修改原值
func (r *Rectangle) Scale(factor float64) {
    r.Width *= factor
    r.Height *= factor
}
```

**如何选择？**

| 场景 | 推荐接收者类型 |
|------|--------------|
| 不修改原值 | 值接收者或指针接收者均可 |
| 需要修改原值 | **必须用指针接收者** |
| 结构体太大（避免复制） | **指针接收者** |
| 包含 `sync.Mutex` 等不可复制字段 | **必须用指针接收者** |

```go
// 使用
rect := Rectangle{10, 5}
fmt.Println(rect.Area())   // 50（值接收者）
rect.Scale(2)              // 指针接收者，修改了 rect
fmt.Println(rect.Area())   // 200
```

### 为任何类型定义方法

```go
// 不能为其他包的类型定义方法
// 不能为基本类型直接定义方法（需要用 type 创建别名类型）

type MyInt int  // 基于 int 创建新类型

func (m MyInt) Double() MyInt {
    return m * 2
}

var n MyInt = 5
fmt.Println(n.Double())  // 10
```

---

## 2.6 函数进阶

### 函数是一等公民

```go
// 函数可以赋值给变量（类似 JS）
add := func(a, b int) int {
    return a + b
}
fmt.Println(add(3, 4))  // 7

// 函数可以作为参数传递（类似 JS 回调 / Java 函数式接口 / Python 高阶函数）
func compute(fn func(int, int) int, a, b int) int {
    return fn(a, b)
}

fmt.Println(compute(add, 3, 4))        // 7
fmt.Println(compute(func(a, b int) int {
    return a*a + b*b
}, 3, 4))                              // 25
```

### 闭包

```go
// 闭包 —— 函数内部引用外部变量
// 类似 JS 闭包 / Java lambda / Python 闭包

func counter() func() int {
    i := 0
    return func() int {
        i++       // 引用外部函数的变量 i
        return i
    }
}

c1 := counter()
fmt.Println(c1())  // 1
fmt.Println(c1())  // 2
fmt.Println(c1())  // 3

c2 := counter()     // 新的计数器，新的 i
fmt.Println(c2())  // 1（独立于 c1）
```

**在 URL 健康检查项目中的应用（来自第 5 章实战）**：

```go
// 闭包的经典用法：在 goroutine 中捕获变量
for _, url := range urls {
    go func(u string) {     // u 是闭包捕获的参数，避免了循环变量陷阱
        results <- checkURL(u, *timeout)
    }(url)                  // 立即求值传入
}
```

---

## 本章总结

### 面试高频题

1. **数组和切片的区别？**
   - 数组长度固定，是类型的一部分；切片长度可变
   - 数组是值类型（赋值复制全部）；切片是引用类型（共享底层数组）
   - 几乎所有场景都用切片

2. **切片的底层结构是什么？**
   - `(array pointer, len, cap)` 三元组
   - `array` 指向底层数组的指针
   - `len` 当前元素数量，`cap` 底层数组总容量

3. **切片什么时候扩容？怎么扩容？**
   - `append` 导致 `len == cap` 时触发
   - 容量 < 256 翻倍，>= 256 增加约 25%

4. **值接收者和指针接收者的区别？**
   - 值接收者：操作副本，不修改原值
   - 指针接收者：可以修改原值，适合大结构体避免复制

5. **Go 的 struct 有继承吗？**
   - 没有继承，但可以通过**结构体嵌入**（匿名嵌套）模拟类似行为
   - Go 推崇组合优于继承

6. **map 的 for range 遍历顺序是固定的吗？**
   - 不固定！Go 故意随机化遍历顺序，防止程序依赖特定顺序

### 学习检查

- [ ] 理解数组和切片的本质区别
- [ ] 能说出 slice 的底层结构（ptr + len + cap）
- [ ] 能解释 slice 的扩容机制
- [ ] 能使用 map 进行增删改查和遍历
- [ ] 能定义 struct 并创建实例
- [ ] 能区分值接收者和指针接收者的使用场景
- [ ] 能写出闭包和使用函数作为参数

### 推荐资源

- [Go by Example: Arrays](https://gobyexample.com/arrays)
- [Go by Example: Slices](https://gobyexample.com/slices)
- [Go by Example: Maps](https://gobyexample.com/maps)
- [Go by Example: Structs](https://gobyexample.com/structs)
- [Go by Example: Methods](https://gobyexample.com/methods)
- [Go by Example: Closures](https://gobyexample.com/closures)
- [Go Blog: Go Slices: usage and internals](https://go.dev/blog/slices-intro)

---

*最后更新：2026年6月*
