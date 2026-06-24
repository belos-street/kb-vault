# Rust 入门教程

> 面向有 JS/TS/Python/Java 经验的全栈工程师，快速掌握 Rust 核心概念 —— 从"会用"到"理解为什么"，建立起 Rust 独特的心智模型。

---

## 🎯 学习目标

- 理解 Rust 的设计哲学：零成本抽象、内存安全、无畏并发
- 掌握 Rust **所有权（Ownership）**、**借用（Borrowing）** 与 **生命周期（Lifetimes）** 这三大核心机制
- 能编写结构化的 Rust 代码：函数、结构体、枚举、模式匹配、方法
- 理解 **Trait** 系统，掌握泛型和 trait bound 的基本使用
- 能编写包含错误处理、文件读写、集合操作的实用程序
- 建立起与 JS/TS/Python/Java 的心智映射，加速迁移

---

## 📋 前置要求

| 领域 | 要求 | 备注 |
|------|------|------|
| 编程基础 | 熟悉变量、函数、控制流、数据结构 | 你已经掌握，Rust 的语法和 Java/TS 有相似之处 |
| 类型系统 | 理解静态类型、泛型 | Java 泛型 / TypeScript 类型系统可以类比 |
| 函数式概念 | 理解 map/filter/reduce | Rust 大量使用迭代器和闭包 |
| 内存模型 | 了解栈（Stack）和堆（Heap）的基本概念 | 不理解也不影响入门，但理解后能更好地掌握所有权 |

---

## 🗺️ 学习路径（六章递进）

整个教程按 **基础语法 → 所有权（核心）→ 组合类型 → Trait 与泛型 → 实战能力 → 持续精进** 递进：

```
第1章: 基础语法 ──→ 第2章: 所有权 ──→ 第3章: 组合类型 ──→ 第4章: Trait与泛型 ──→ 第5章: 实战 ──→ 第6章: 精进
(快速上手)        (核心难点)        (struct/enum)       (接口抽象)         (项目)         (方向)
```

| 章节 | 内容 | 定位 |
|------|------|------|
| **第 1 章** | Rust 基础语法 | 快速扫盲，让你能用 Rust 写简单程序 |
| **第 2 章** | 所有权、借用、生命周期 | **Rust 最难也最核心的部分**，必须集中攻破 |
| **第 3 章** | struct、enum、模式匹配 | 组合数据类型，与 TS/Python 的类/联合类型对照 |
| **第 4 章** | Trait、泛型、常用 Trait | Rust 的 "接口" 系统 |
| **第 5 章** | 错误处理、集合、文件 I/O | 能写实用的 CLI 工具 |
| **第 6 章** | 后续精进方向 | 并发、Cargo 生态、测试、异步 |

---

## 第 1 章：Rust 基础语法（快速扫盲）

> 你有 JS/TS/Python/Java 基础，Rust 的语法对你来说很好上手。这一章的目的是用你已经懂的概念快速带你"写起来"。

### 1.1 环境与工具链

- `rustup`、`rustc`、`cargo` 的关系
- Cargo 创建项目：`cargo new hello_rust`
- Cargo 常用命令：`build`、`run`、`check`、`test`
- VS Code 插件推荐：rust-analyzer（必备）、crates、Even Better TOML
- 与 npm/pip/maven 的类比：**Cargo = npm + webpack + tsconfig**，一站式包管理和构建

### 1.2 Hello World 与项目结构

```rust
fn main() {
    println!("Hello, Rust!");
}
```

**两点注意**（与其他语言的区别）：
1. **`fn main()` 是入口函数**：无参数、无返回值（对比 Java 的 `public static void main(String[] args)`）
2. **`println!` 是宏**：注意末尾的 `!`，这是 Rust 的宏调用语法（类似 Python 的 `print`，但底层是编译期展开）
3. **`Cargo.toml` 是项目配置**：类比 `package.json`，定义了项目名、版本、依赖等

```toml
# Cargo.toml
[package]
name = "hello_rust"
version = "0.1.0"
edition = "2021"
```

- 项目目录结构：`src/main.rs`（入口）、`src/lib.rs`（库入口）、`Cargo.toml`（配置）、`Cargo.lock`（依赖锁定，类比 `package-lock.json`）

### 1.3 变量与绑定

```rust
// 默认不可变（immutable）—— 和 const 声明一致
let x = 5;
// x = 6; // ❌ 编译错误

// mut 关键字声明可变 —— 类似 let 但默认 const 的意识
let mut y = 5;
y = 6; // ✅

// 常量 —— 编译期确定，必须标注类型
const MAX_POINTS: u32 = 100_000;  // 类似 TS const / Java final

// 变量遮蔽（Shadowing）—— 同名变量"覆盖"之前的值
let z = "hello";
let z = z.len();  // z 现在是 usize 类型
// 对比 JS: let z = "hello"; z = z.length; — 类似效果，但 Rust 不可变更类型
```

**与 JS/TS/Java 对比**：
| 特性 | Rust | JS | TS | Java |
|------|------|-----|-----|------|
| 不可变声明 | `let x = 5` | `const x = 5`（引用不可变） | `const x = 5` | `final int x = 5` |
| 可变声明 | `let mut x = 5` | `let x = 5` | `let x = 5` | `int x = 5` |
| 常量 | `const X: i32 = 5` | `const X = 5` | `const X = 5` | `static final int X = 5` |

### 1.4 基本数据类型

```rust
// 整数类型 —— 明确区分有符号/无符号、位数（对比 Java 的 byte/short/int/long）
let a: i32 = -100;    // 有符号 32 位，最常用（类似 Java 的 int）
let b: u32 = 100;     // 无符号 32 位（只有正数）
let c: i64 = 1_000_000;  // 有符号 64 位（类似 Java 的 long）
let d: i8 = 127;      // 有符号 8 位（类似 Java 的 byte）

// 浮点类型
let x: f64 = 3.14;    // 双精度（类似 Java 的 double，默认）
let y: f32 = 2.5;     // 单精度（类似 Java 的 float）

// 布尔 —— 同 JS/Java/Python
let t: bool = true;
let f: bool = false;

// 字符 —— 不是 ASCII！是 Unicode 标量值（类似 Python 的单个字符）
let c: char = 'z';
let emoji: char = '🦀';
let zhong: char = '中';   // char 是 4 字节，支持任意 Unicode

// 元组（Tuple）—— 类似 TS 的 tuple 或 Python 的 tuple，但更严格
let t: (i32, f64, u8) = (500, 6.4, 1);
let (x, y, z) = t;               // 解构赋值（类似 TS 的数组解构）
let first = t.0;                 // 点号索引（类似 TS 的 t[0]）
```

**与 TS/Java 对比**：
| 特性 | Rust | TypeScript | Java |
|------|------|-----------|------|
| 整数类型 | `i32`, `u64` 等（明确区分符号和位数） | `number`（统一浮点） | `int`, `long` 等 |
| 字符 | `char`（4 字节 Unicode） | `string` 的子元素 | `char`（2 字节 UTF-16） |
| 元组 | 原生支持，可解构 | `[number, string]` 元组 | 无原生支持 |
| 类型转换 | 无隐式转换 ❌ | 宽松隐式转换 | 窄化隐式转换 |

- **表达式 vs 语句** —— Rust 中一切皆是表达式（对比 Python/Java 差异显著）

```rust
// if 是表达式，可以返回值
let condition = true;
let number = if condition { 5 } else { 6 };
// 类似 TS 三元表达式：const number = condition ? 5 : 6;

// 代码块也是表达式，最后一行不带分号就是返回值
let y = {
    let x = 3;
    x + 1  // 没有分号，就是返回值
};
```

### 1.5 函数

```rust
// 函数声明 —— 类似 TS 带类型标注
fn add(x: i32, y: i32) -> i32 {
    x + y  // 表达式返回值，没有 return
}

// 对比 TS:    function add(x: number, y: number): number { return x + y; }
// 对比 Java:  public static int add(int x, int y) { return x + y; }
// 对比 Python: def add(x: int, y: int) -> int: return x + y
```

### 1.6 控制流

- `if/else if/else`：表达式风格
- `loop` 无限循环：`break` 可带出值
- `while`：条件循环
- `for`：迭代器循环

```rust
// for 循环 —— 类似 Python 的 for-in，或 JS 的 for-of
let arr = [1, 2, 3];
for element in arr {
    println!("{}", element);
}

// Range 语法
for i in 0..10 {      // 0 到 9，类似 Python 的 range(10)
    println!("{}", i);
}
for i in 0..=10 {     // 0 到 10，包含两端
    println!("{}", i);
}
```

---

## 第 2 章：所有权、借用与引用（Rust 核心难点）

> 这一章是 Rust **最重要**也 **最不同** 的部分。如果你用 Java/JS/Python，垃圾回收帮你管理内存。Rust 则通过**编译器静态检查**来确保内存安全 —— 没有 GC，没有手动 free，一切在编译期确定。

### 2.1 所有权规则（三条黄金法则）

1. Rust 中每个值都有且只有一个**所有者（Owner）**
2. 当所有者离开作用域，值被自动释放
3. 值在同一时刻只能有一份所有权（可通过 move/clone 转移）

```rust
// 类比理解：JS 的引用赋值是"共享引用"（多个变量指向同一对象）
// Rust 的所有权是"独占引用"（一个值只有一个主人）

let s1 = String::from("hello");
let s2 = s1;           // s1 的所有权 moved 到 s2
// println!("{}", s1); // ❌ 编译错误：s1 已失效

// 对比 JS: let s1 = "hello"; let s2 = s1; // 都可用（值类型拷贝）
// 对比 JS: let s1 = [1,2,3]; let s2 = s1; // 引用共享，s1 仍可用
// Rust 的行为更像：s1 被"移动"到 s2，s1 不再有效
```

**为什么会这样？** Rust 的目标是避免双重释放（double free）—— 每个内存在被释放时只能有一个所有者。

### 2.2 克隆（Clone）和拷贝（Copy）

```rust
// Clone —— 深度拷贝（堆数据）
let s1 = String::from("hello");
let s2 = s1.clone();
println!("{} {}", s1, s2); // 都可用 ✅

// Copy —— 栈数据的自动拷贝
let x = 5;
let y = x;
println!("{} {}", x, y); // 都可用 ✅（整数实现了 Copy trait）
```

- 标量类型、元组（仅包含 Copy 类型时）默认是 Copy 语义
- String、Vec、自定义结构体默认是 Move 语义

### 2.3 借用（Borrowing）与引用

> 如果每次传参都要 move，代码就没法写了。**借用**允许你引用一个值而不获取它的所有权。

```rust
// & 表示不可变引用（可以理解为"只读借用"，类比 Java 的 const 引用）
fn calculate_length(s: &String) -> usize {  // s 是借用，不是所有者
    s.len()
}  // s 离开作用域，但不释放值（不是所有者）

let s = String::from("hello");
let len = calculate_length(&s);
println!("{} {}", s, len); // s 仍然可用 ✅
```

### 2.4 借用规则（面试必考）

**同时只能有两种情况之一：**
1. 任意多个不可变引用（`&T`）
2. 最多一个可变引用（`&mut T`）

```rust
let mut s = String::from("hello");

let r1 = &s;      // ✅
let r2 = &s;      // ✅（多个不可变引用 OK）
// let r3 = &mut s; // ❌ 编译错误：已有不可变引用时不能有可变引用
println!("{} {}", r1, r2); // 引用使用结束

let r3 = &mut s;  // ✅ 之前的引用已用完
r3.push_str(" world");
```

**类比理解：**
- 多个读者（不可变引用）可以同时读一本书 ✅
- 一个写者（可变引用）可以写书 ✅
- 不能同时有人读又有人写 ❌ —— 这就是**数据竞争**的根源

### 2.5 悬垂引用（Dangling References）

Rust 编译器保证**不存在悬垂引用**：

```rust
fn dangle() -> &String {
    let s = String::from("hello");
    &s  // ❌ 编译错误：s 离开函数就被释放，返回的引用会悬垂
}
// 应返回 String 本身，让所有权转移出去
```

### 2.6 生命周期（Lifetimes）入门

> 生命周期是 Rust 最让人头疼的概念。这里只讲入门场景，高级用法可以在第 6 章深入。

```rust
// 核心概念：生命周期标注告诉编译器"引用 a 和引用 b 存活多久"
// 最常见的场景：函数参数和返回值存在引用关系时

// 最简单的例子：&'a str 表示"这个引用至少存活 'a 这么长时间"
fn longest<'a>(x: &'a str, y: &'a str) -> &'a str {
    if x.len() > y.len() { x } else { y }
}
```

**生命周期入门原则：**
- 每个引用都有生命周期（编译器可以自动推断大部分情况）
- 生命周期标注不会改变引用的存活时间，只是让编译器能检查正确性
- 99% 的日常代码中生命周期会自动推断（**生命周期省略规则**），你只需在少数复杂场景下手动标注

**一次直观理解**：生命周期就是告诉编译器"这个入参和返回值是有关联的，它们的存活时间一致"。

---

## 第 3 章：组合类型（struct、enum、模式匹配）

### 3.1 结构体（struct）

```rust
// 定义 —— 类似 TS 的 interface 或 Java 的 class（只有字段）
struct User {
    username: String,
    email: String,
    sign_in_count: u64,
    active: bool,
}

// 创建实例
let user1 = User {
    email: String::from("someone@example.com"),
    username: String::from("someone"),
    active: true,
    sign_in_count: 1,
};

// 结构体更新语法 —— 类似 JS 的 spread
let user2 = User {
    email: String::from("another@example.com"),
    ..user1  // 其余字段从 user1 复制
};

// 元组结构体（tuple struct）
struct Color(i32, i32, i32);
let black = Color(0, 0, 0);

// 类单元结构体（unit-like struct）
struct AlwaysEqual;
```

**与 TS/Java 对比**：
| Rust struct | TypeScript | Java |
|-------------|-----------|------|
| 纯数据结构 | `interface` 或 `type` | 纯粹的 POJO/DTO |
| 方法在 `impl` 块中 | 方法在 class 中 | 方法在 class 中 |
| 没有继承 | 可以 extends | 可以 extends |

### 3.2 方法（Method）

```rust
// 方法通过 impl 块附加到 struct 上
struct Rectangle {
    width: u32,
    height: u32,
}

impl Rectangle {
    // &self 是不可变引用（类似 this，但是显式）
    fn area(&self) -> u32 {
        self.width * self.height
    }

    // &mut self 可变引用
    fn set_width(&mut self, width: u32) {
        self.width = width;
    }

    // 关联函数（类似静态方法），没有 self
    fn square(size: u32) -> Rectangle {
        Rectangle { width: size, height: size }
    }
}
```

### 3.3 枚举（Enum）—— Rust 最强大的特性之一

```rust
// 基本枚举 —— 类似 TS 的联合类型
enum IpAddrKind {
    V4,
    V6,
}

// 枚举可以携带数据 —— 远超 Java enum 的能力
// 对比 TS: type IpAddr = V4(string) | V6(string);
enum IpAddr {
    V4(u8, u8, u8, u8),  // 元组风格
    V6(String),           // 不同变体可以携带不同类型
}

// 枚举也可以带结构体数据
enum Message {
    Quit,                       // 没有数据
    Move { x: i32, y: i32 },   // 匿名结构体
    Write(String),             // 元组风格
    ChangeColor(i32, i32, i32),
}

// 枚举也可以有方法 —— 类似 struct
impl Message {
    fn call(&self) { /* ... */ }
}
```

**与 TS/Java 对比**：
| Rust enum | TypeScript | Java |
|-----------|-----------|------|
| 变体可携带不同类型 | 联合类型 + 鉴别字段 | Java 传统 enum 不能携带额外类型数据 |
| `Option<T>` | `T \| undefined` / `T \| null` | `Optional<T>` |
| `Result<T, E>` | 需手动 throw/catch | `throws` + try/catch |

### 3.4 `Option<T>` 和 `Result<T, E>`（Rust 版 null/异常）

**没有 null 的世界**：Rust 没有 null！用 `Option<T>` 表示可能存在或不存在的值。

```rust
enum Option<T> {
    Some(T),   // 有值
    None,      // 没有值
}

// 使用
let some_number = Some(5);          // Option<i32>
let absent_number: Option<i32> = None;

// 对比: Java 的 null, JS 的 undefined, Python 的 None
// 关键区别：编译器强制你处理 None 的情况
```

**`Result<T, E>`**：Rust 用 `Result` 处理可恢复错误，没有 try/catch 异常。

```rust
enum Result<T, E> {
    Ok(T),
    Err(E),
}

// 使用 match 模式匹配处理
// 对比：Java try/catch, JS try/catch, Python try/except
```

### 3.5 模式匹配（match）

```rust
// match 是 Rust 的 switch 加强版，必须穷举所有可能
enum Coin {
    Penny,
    Nickel,
    Dime,
    Quarter,
}

fn value_in_cents(coin: Coin) -> u8 {
    match coin {
        Coin::Penny => 1,
        Coin::Nickel => 5,
        Coin::Dime => 10,
        Coin::Quarter => 25,
        // 编译器会检查是否穷举所有变体
    }
}

// 通配符（类似 switch default）
let dice_roll = 9;
match dice_roll {
    3 => println!("三"),      // 匹配字面值
    7 => println!("七"),       // 匹配字面值
    other => println!("{}", other), // 通配
    // _ => ()               // _ 通配符表示忽略该值
}

// if let —— match 的语法糖，只关心一种模式
let config_max = Some(3u8);
if let Some(max) = config_max {
    println!("The maximum is configured to be {}", max);
}
// 相当于：
// match config_max {
//     Some(max) => println!("..."),
//     _ => (),
// }
```

**与 TS/Java 对比**：
| Rust | TypeScript | Java |
|------|-----------|------|
| `match` | `switch` / discriminated union + switch | `switch` / pattern matching (Java 17+) |
| 穷举检查 ✅ | 无穷举检查 ❌ | 无穷举检查 ❌ |
| 可解构嵌套数据 ✅ | 需手动解构 | 需手动解构 |

---

## 第 4 章：Trait 与泛型（Rust 的"接口"与"模板"）

### 4.1 泛型（Generics）

```rust
// 类似 Java 泛型或 TS 泛型
fn largest<T: PartialOrd>(list: &[T]) -> &T {
    let mut largest = &list[0];
    for item in list {
        if item > largest {
            largest = item;
        }
    }
    largest
}

// 结构体中的泛型 —— 类似 TS: interface Point<T> { x: T; y: T; }
struct Point<T> {
    x: T,
    y: T,
}

// 对比: Java class Point<T> { T x; T y; }
// 对比: TS  interface Point<T> { x: T; y: T; }
// 对比: Python 无编译器检查的泛型
```

**Rust 泛型 vs 其他语言——零成本抽象**：

Rust 的泛型是**单态化（Monomorphization）**的——编译器会为每个具体类型生成专用代码，运行时没有额外开销。

| 语言 | 泛型实现方式 | 运行时开销 |
|------|-------------|-----------|
| **Rust** | 单态化（编译期展开） | **零** —— 和手写具体类型一样快 |
| Java | 类型擦除（编译后擦除泛型信息） | 有（装箱/拆箱、类型检查） |
| TypeScript | 编译后泛型消失，无运行时保证 | 无（但无编译期安全保证） |
| C++ | 模板（类似单态化） | 零 |

### 4.2 Trait —— Rust 的接口

```rust
// 定义 trait —— 类似 Java interface 或 TS interface
pub trait Summary {
    fn summarize(&self) -> String;
}

// 实现 trait —— 类似 Java implements 或 TS implements
pub struct NewsArticle {
    pub headline: String,
    pub location: String,
    pub author: String,
    pub content: String,
}

impl Summary for NewsArticle {
    fn summarize(&self) -> String {
        format!("{}, by {} ({})", self.headline, self.author, self.location)
    }
}

// trait 默认实现 —— 类似 Java 的 default 方法
pub trait Summary {
    fn summarize(&self) -> String {
        String::from("(Read more...)")
    }
}
```

**与 TS/Java 对比**：

| Rust Trait | Java Interface | TypeScript Interface |
|------------|---------------|---------------------|
| 定义行为契约 | ✅ 类似 | ✅ 类似 |
| 默认实现 | `default` 方法 | ✅ 无法直接实现 |
| 泛型约束 | `<T extends SomeInterface>` | 泛型约束 |
| 为已有类型实现 trait | 不可为已有类实现接口 | ✅ Declaration Merging |
| Trait 作为参数 | 多态 | ✅ 参数类型 |

### 4.3 Trait Bound 语法

```rust
// Trait 作为参数约束 —— 类似 Java 的 <T extends Summary>
pub fn notify(item: &impl Summary) {  // 语法糖
    println!("Breaking news! {}", item.summarize());
}

// 完整语法
pub fn notify<T: Summary>(item: &T) {
    println!("Breaking news! {}", item.summarize());
}

// 多个 trait 约束
pub fn notify(item: &(impl Summary + Display)) { }
// 或
pub fn notify<T: Summary + Display>(item: &T) { }

// where 子句（函数签名太长时用）
fn some_function<T, U>(t: &T, u: &U) -> i32
where
    T: Display + Clone,
    U: Clone + Debug,
{ 0 }
```

### 4.4 常用标准库 Trait

| Trait | 作用 | 类似概念 |
|-------|------|----------|
| `Display` | 格式化输出 `{}` | `toString()` / `__str__` |
| `Debug` | 调试输出 `{:?}` | IDE 中的 debug view |
| `Clone` | 显式深度拷贝 | `.clone()` / copy constructor |
| `Copy` | 栈上自动拷贝 | 原始类型默认行为 |
| `Eq / PartialEq` | 相等比较 `==` | `equals()` / `__eq__` |
| `Ord / PartialOrd` | 大小比较 `< >` | `compareTo()` / `__lt__` |
| `Iterator` | 迭代器 | JS 的 `Symbol.iterator` / Java `Iterable` |
| `From / Into` | 类型转换 | 类型转换 |

---

## 第 5 章：实战能力（写实用程序）

### 5.1 错误处理

```rust
// Result 的模式 —— 用 match 或 ? 运算符
use std::fs::File;
use std::io::{self, Read};

// 方式一：match 处理
fn read_username_from_file() -> Result<String, io::Error> {
    let f = File::open("hello.txt");

    let mut f = match f {
        Ok(file) => file,
        Err(e) => return Err(e),
    };

    let mut s = String::new();
    match f.read_to_string(&mut s) {
        Ok(_) => Ok(s),
        Err(e) => Err(e),
    }
}

// 方式二：? 运算符（推荐）—— 类似 JS 的 Optional Chaining 但用于错误传播
fn read_username_from_file() -> Result<String, io::Error> {
    let mut f = File::open("hello.txt")?;  // Err 会自动 return
    let mut s = String::new();
    f.read_to_string(&mut s)?;
    Ok(s)
}

// unwrap/expect —— 快速失败（适合原型或确定不会失败的场景）
let f = File::open("hello.txt").unwrap();       // panic on error
let f = File::open("hello.txt").expect("Failed to open");  // 自定义 panic 信息
```

**与 Java/JS/Python 对比**：

| Rust | Java | JS | Python |
|------|------|-----|--------|
| `Result<T, E>` | 受检异常（Checked Exception） | 手动 try/catch | try/except |
| `?` 运算符 | 自动抛异常 | 无等价物（需手动 throw） | 无等价物 |
| `unwrap()` | 不常用 | 无等价物 | 无等价物 |
| `panic!()` | `RuntimeException` | `throw new Error()` | 无捕获的异常 |
| 没有 try/catch（Result 模式） | try/catch | try/catch | try/except |

### 5.2 常用集合

```rust
// Vec —— 动态数组，类似 JS Array / Java ArrayList / Python list
let mut v: Vec<i32> = Vec::new();
v.push(1);
v.push(2);
v.push(3);

// vec! 宏
let v = vec![1, 2, 3];

// 遍历
for i in &v {
    println!("{}", i);
}

// HashMap —— 类似 JS Map / Java HashMap / Python dict
use std::collections::HashMap;

let mut scores = HashMap::new();
scores.insert(String::from("Blue"), 10);
scores.insert(String::from("Yellow"), 50);
```

### 5.3 迭代器与闭包

```rust
// 迭代器 —— 类似 JS 的 Array 方法链 / Python 列表推导
let numbers = vec![1, 2, 3, 4, 5];

// 对比 TS: numbers.filter(n => n % 2 == 0).map(n => n * 2)
let doubled_even: Vec<i32> = numbers
    .iter()
    .filter(|n| *n % 2 == 0)
    .map(|n| n * 2)
    .collect();

println!("{:?}", doubled_even); // [4, 8]

// 闭包 —— 类似 JS 箭头函数 / Python lambda
let add_one = |x: i32| -> i32 { x + 1 };
// 类型注释可省略（编译器推断）：
let add_one = |x| x + 1;

println!("{}", add_one(5)); // 6
```

**与 TS/Java/Python 对比**：

| Rust | TypeScript | Java | Python |
|------|-----------|------|--------|
| `\|x\| x + 1` | `(x) => x + 1` | `x -> x + 1` | `lambda x: x + 1` |
| `.iter().map().collect()` | `.map()` 返回新数组 | `.stream().map().collect()` | `map()` / 列表推导 |
| `.filter()` | `.filter()` | `.filter()` | `filter()` / `if` 在推导式中 |

### 5.4 文件 I/O

```rust
use std::fs;
use std::io::Write;

// 读取文件
let content = fs::read_to_string("hello.txt")
    .expect("Should have been able to read the file");

// 写入文件
let mut file = fs::File::create("output.txt")
    .expect("Could not create file");
file.write_all(b"Hello, world!")
    .expect("Could not write to file");

// 简写
fs::write("output.txt", "Hello, world!")
    .expect("Could not write to file");
```

### 5.5 实战项目：CLI 命令行待办事项管理工具

> **场景描述**：一个简单的命令行 TODO 工具，支持添加、列出、标记完成、删除待办事项，数据存储在 JSON 文件中。

**功能规格**：

```bash
# 添加待办
cargo run -- add "Buy milk"
cargo run -- add "Read Rust book" --priority high

# 列出所有待办
cargo run -- list
# 输出：
# [1] Buy milk              [pending]
# [2] Read Rust book        [pending] ⬆ high

# 标记完成
cargo run -- done 1

# 删除
cargo run -- remove 2
```

**覆盖知识点**：

| 功能 | 涉及知识点 |
|------|-----------|
| CLI 参数解析 | 使用 `clap` crate 或标准库 `std::env::args` |
| 文件 I/O | `fs::read_to_string` / `fs::write` 读写 JSON 文件 |
| 序列化/反序列化 | 使用 `serde` + `serde_json`：`#[derive(Serialize, Deserialize)]` |
| 结构体与方法 | `TodoItem` 结构体（id, title, status, priority），`impl` 块 |
| 枚举 | `Status { Pending, Done }`、`Priority { Low, Medium, High }` |
| `Option<T>` | 可选字段（如 `--priority` 未提供时为 `None`） |
| 错误处理 | `?` 运算符传播文件 I/O 错误，`unwrap_or` 处理可选值 |
| Vec 集合 | 添加、遍历、按 id 查找/删除 |

**项目结构建议**：

```
todo-cli/
├── Cargo.toml          # 依赖：clap, serde, serde_json
└── src/
    └── main.rs         # 约 150-200 行，全部在一个文件中
```

---

## 第 6 章：后续精进方向

### 6.1 核心进阶

- **生命周期深入**：多个生命周期参数的交互、生命周期子类型、lifetime elision 规则
- **智能指针**：`Box<T>`、`Rc<T>`（引用计数，类似 Python 引用计数 / JS 引用）、`RefCell<T>`（内部可变性）
- **`Send` / `Sync` trait**：Rust 并发安全的基础
- **`Drop` trait**：析构函数自定义清理（对比 Java `AutoCloseable` / Python `__exit__` / JS 无原生等价物）

### 6.2 并发编程

- `std::thread` 线程创建
- `mpsc` 通道（Channel）—— 类似 Go channel / JS Worker 消息
- `Mutex<T>` / `Arc<T>` 共享状态
- **async/await 异步编程**：`tokio` 运行时、`async fn`、`await!`
  - 对比：JS async/await、Python asyncio

### 6.3 Cargo 生态

- `crates.io` —— 类似 npm registry / Maven Central / PyPI
- 常用 crate：
  - `serde` / `serde_json` —— 序列化（对比：JSON.stringify / JSON.parse）
  - `tokio` —— 异步运行时（对比：Node.js event loop、Python asyncio）
  - `clap` —— CLI 参数解析（对比：commander/yargs、argparse）
  - `reqwest` —— HTTP 客户端（对比：fetch/axios、requests）
- 工作空间（Workspace）：多 crate 项目管理
- 自定义 `build.rs` 构建脚本

### 6.4 测试

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn it_works() {
        let result = 2 + 2;
        assert_eq!(result, 4);
    }

    #[test]
    #[should_panic(expected = "something went wrong")]
    fn test_panic() {
        // 测试预期 panic 的场景
    }
}
```

- `cargo test` —— 类似 `npm test` / `mvn test` / `pytest`
- 文档测试（doc test）：`///` 注释中的代码示例会自动作为测试运行

### 6.5 项目架构建议

```
my_project/
├── Cargo.toml           # 类似 package.json / pom.xml / setup.py
├── src/
│   ├── main.rs          # 入口（或 lib.rs 作为库入口）
│   ├── lib.rs           # 库 crate 根
│   ├── config.rs        # 模块 —— 类似 ES Module / Java package
│   ├── models/
│   │   ├── mod.rs
│   │   ├── user.rs
│   │   └── post.rs
│   └── utils/
│       ├── mod.rs
│       └── helpers.rs
├── tests/               # 集成测试
│   └── integration_test.rs
└── examples/            # 示例代码
    └── basic_usage.rs
```

---

## 🕹️ 入门实践项目：CLI 命令行待办事项管理工具

### 场景描述

一个简单的命令行 TODO 工具，支持添加、列出、删除待办事项，数据存储在 JSON 文件中。

### 覆盖知识点

| 功能 | 涉及知识点 |
|------|-----------|
| CLI 参数解析 | 使用 `clap` crate，match 模式匹配子命令 |
| 文件 I/O | `fs::read_to_string` / `fs::write` |
| 序列化/反序列化 | 使用 `serde` + `serde_json` 读写 JSON |
| 结构体与方法 | TodoItem struct，impl 块定义方法 |
| 错误处理 | `?` 运算符，自定义错误类型 |
| 集合操作 | Vec 的增删改查 |
| 枚举和 Option | 状态枚举（Pending/Done）、Option 处理 |

### 功能要求

```bash
cargo run -- add "Buy milk"
cargo run -- list
cargo run -- done 1
cargo run -- remove 1
```

---

## 🗓️ 建议学习时间线（每天 1-2 小时）

| 阶段 | 内容 | 时间 |
|------|------|------|
| **第 1-2 天** | 第 1 章：基础语法 | 快速过，重点在表达式语义和类型系统 |
| **第 3-5 天** | 第 2 章：所有权、借用 | **最核心也最花时间**，务必理解，多写代码验证 |
| **第 6 天** | 第 3 章：struct / enum / match | 结合 TS 联合类型对比学习 |
| **第 7-8 天** | 第 4 章：Trait 与泛型 | 重点在 Trait 的基本使用 |
| **第 9-10 天** | 第 5 章：实战（错误处理 + 集合 + I/O） | 多写代码 |
| **第 11-12 天** | 实践项目：CLI TODO | 综合练习 |
| **后续** | 第 6 章：按需深入 | 并发、异步、生态 |
| **合计** | **~12 天入门** | **能独立写 CLI 工具** |

---

## ✅ 入门完成标准（第 1-5 章）

- [ ] 理解变量可变性、shadowing 和表达式的概念
- [ ] **能清晰解释所有权三条规则**，理解 move / clone / copy 的区别
- [ ] **能解释借用规则**：多个不可变引用 或 一个可变引用
- [ ] 能定义 struct 和 enum，使用 match 做模式匹配
- [ ] 能定义 trait 并为类型实现 trait
- [ ] 能使用 `Option<T>` 和 `Result<T, E>` 做错误处理
- [ ] 能使用 `?` 运算符传播错误
- [ ] 能使用 Vec 和 HashMap 操作集合数据
- [ ] 能使用迭代器和闭包链式处理数据
- [ ] 能独立完成一个 CLI 工具（文件读写 + 参数解析）

---

## 📝 学习建议

- **所有权是 Rust 的门槛**：不要试图一次看懂第 2 章所有细节，先理解"为什么 Rust 要这样设计"，再理解"怎么用"
- 每次编译错误都是学习机会：Rust 的编译器错误信息是所有语言中最好的之一，**仔细阅读错误信息**，它往往会告诉你如何修复
- **多写多编译**：Rust 的学习曲线主要来自编译器约束，你越早习惯"编译器帮你找问题"的体验，学得越快
- 用你熟悉的语言做对照：碰到新概念时问自己"这在 JS/TS/Java/Python 中怎么做"，然后用 Rust 实现一遍
- 善用 `cargo check`：快速检查编译错误，比 `cargo build` 更快
- **遇到看不懂的错误**：复制错误信息到 Google 或 Stack Overflow，大概率有人遇到过

### 与各语言的核心差异速查

| 概念 | Rust | TypeScript | Java | Python |
|------|------|-----------|------|--------|
| 内存管理 | 所有权 + 借用（编译期检查） | GC（引用计数 + 标记清除） | GC（分代收集） | GC（引用计数 + 循环检测） |
| null | 无（用 `Option<T>`） | `undefined` / `null` | `null` | `None` |
| 异常 | 无（用 `Result<T, E>`） | `throw` / `try/catch` | `throw` / `try/catch` | `raise` / `try/except` |
| 继承 | 无（用 Trait 组合） | `extends` 类继承 / `implements` 接口 | `extends` / `implements` | 类继承 |
| 类型系统 | 静态 + 强类型 + 类型推断 | 静态 + 弱类型（渐进式） | 静态 + 强类型 | 动态 + 强类型 |
| 包管理 | Cargo（crates.io） | npm（npmjs.com） | Maven/Gradle | pip（PyPI） |
| 编译/运行 | 编译为原生二进制 | 编译为 JS，再解释执行 | 编译为 bytecode（JVM） | 解释执行 |
| 构建系统 | 内置在 Cargo 中 | Webpack/Vite 等 | Maven/Gradle | 无标准构建工具 |
| 并发模型 | OS 线程 + async/await | 事件循环 + Worker 线程 | OS 线程 + virtual threads | GIL 受限的线程 |

---

## 🔗 推荐资源

- [Rust 程序设计语言（The Book）](https://doc.rust-lang.org/book/) — Rust 官方入门书，必读
- [Rust 通过例子学](https://doc.rust-lang.org/rust-by-example/) — 边看代码边学
- [Rustlings](https://github.com/rust-lang/rustlings) — 交互式练习题（强烈推荐，对所有权理解帮助极大）
- [Rust 圣经（中文）](https://course.rs/) — 中文社区的优秀教程
- [Tour of Rust](https://tourofrust.com/) — Rust 交互式教程
- [Rust 标准库 API 文档](https://doc.rust-lang.org/std/)

---

*最后更新：2026年6月*
