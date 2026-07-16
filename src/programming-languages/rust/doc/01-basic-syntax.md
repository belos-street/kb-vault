# 第 1 章：Rust 基础语法（快速扫盲）

> 你有 JS/TS/Python/Java 基础，Rust 的语法对你来说很好上手。这一章的目的是用你已经懂的概念快速带你"写起来"。
>
> 📖 预计阅读：1-2 小时 &nbsp;|&nbsp; 🎯 面试可答：shadowing vs mut、表达式语义、隐式转换 &nbsp;|&nbsp; ⬅️ 前置：无

[[outline|← 返回目录]]

---

## 1.1 环境与工具链

- `rustup`、`rustc`、`cargo` 的关系
- Cargo 创建项目：`cargo new hello_rust`
- Cargo 常用命令：`build`、`run`、`check`、`test`
- VS Code 插件推荐：rust-analyzer（必备）、crates、Even Better TOML
- 与 npm/pip/maven 的类比：**Cargo = npm + webpack + tsconfig**，一站式包管理和构建

## 1.2 Hello World 与项目结构

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
// 注意：以下写法需要 Rust 2021 edition（Cargo.toml 默认就是 2021）
let arr = [1, 2, 3];
for element in arr {
    println!("{}", element);
}

// 如果你不确定 edition，也可以用 iter() 明确按引用迭代
for element in arr.iter() {
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

## 练习

### 1. 计算圆的面积

- **要求**：写一个函数 `fn area(r: f64) -> f64`，返回圆的面积（`π * r²`）。
- **提示**：Rust 没有 `Math.PI`，可用 `std::f64::consts::PI`。
- **预期效果**：`area(2.0)` 输出约 `12.566370614359172`。

### 2. FizzBuzz

- **要求**：用 `for` 循环和 `if` 表达式实现经典 FizzBuzz，范围 1 到 30。
- **提示**：3 的倍数输出 `Fizz`，5 的倍数输出 `Buzz`，同时是 3 和 5 的倍数输出 `FizzBuzz`，其他输出数字本身。
- **预期效果**：`1 2 Fizz 4 Buzz Fizz 7 8 Fizz Buzz 11 Fizz 13 14 FizzBuzz ...`

### 3. 类型转换实验

- **要求**：分别运行以下代码，观察结果并解释：
  - `let x: i32 = 5; let y: f64 = x as f64;`
  - `let z: i32 = 3.14 as i32;`
  - 尝试 `let a: f64 = x;`（不用 `as`）
- **提示**：Rust 不允许隐式类型转换。
- **预期效果**：前两个分别得到 `5.0` 和 `3`；第三个会在编译期报错，提示 `expected f64, found i32`。

---

## 面试回答模板

> **问：Rust 中 shadowing 和 mut 有什么区别？什么时候用哪个？**
>
> shadowing 是用 `let` 重新声明同名变量，可以**改变类型**，前一个变量在新声明后不可访问；`mut` 是声明可变变量，**类型不能变**，只是值可以修改。
> 优先用 shadowing：需要类型转换时（如 `let x = "5"; let x = x.parse::<i32>()`）；优先用 mut：需要原地修改值时（如 `let mut v = Vec::new(); v.push(1)`）。日常中 mut 更常用。

> **问：Rust 为什么默认不可变？和 JS 的 const 有什么区别？**
>
> Rust 默认不可变是为了**编译期安全**——编译器可以假设变量不会变，从而做更激进的优化和借用检查。JS 的 `const` 只保证引用不可变（对象内部仍可修改），Rust 的 `let` 不可变是**值不可变**（连内部字段都不能改）。需要可变时显式加 `mut`，让编译器和读者都知道"这里会变"。

> **问：Rust 的表达式和语句有什么区别？这和 Java/Python 有什么不同？**
>
> Rust 中 `if`、`match`、代码块 `{}` 都是**表达式**，可以返回值；语句是执行操作但不返回值的（以分号结尾）。Java/Python 中 `if` 是语句，不能赋值给变量（Java 需要三元运算符，Python 需要单独赋值）。Rust 的表达式语义让代码更简洁：`let x = if cond { 5 } else { 6 }` 直接赋值，不需要三元运算符。

> **问：Rust 为什么不允许隐式类型转换？**
>
> 隐式转换是 bug 的常见来源（如 JS 的 `1 + "1" = "11"`、Java 的 int→long 可能丢失精度）。Rust 要求显式转换（`as` 关键字），让类型变化在代码中可见，编译器可以检查转换是否合理。代价是代码稍多，但换来的是类型安全保证。

> **下一步**：学习 Rust 最核心的概念 → [[02-ownership-borrowing|第 2 章：所有权、借用与生命周期]]
