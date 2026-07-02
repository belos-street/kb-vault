# 第 4 章：Trait 与泛型（Rust 的"接口"与"模板"）

> Trait 是 Rust 实现**多态**的唯一方式 —— 没有继承、没有重载，一切通过 Trait 组合。如果你熟悉 Java 的 `interface` 或 TypeScript 的 `interface` / `type`，Trait 对你来说会很自然。

[[outline|← 返回目录]]

---

## 4.1 泛型（Generics）

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

// 多个泛型参数
struct Point2<T, U> {
    x: T,
    y: U,
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

### 在枚举和结构体中使用泛型

```rust
// 这就是 Option 和 Result 的底层原理
enum Option<T> {
    Some(T),
    None,
}

enum Result<T, E> {
    Ok(T),
    Err(E),
}
```

## 4.2 Trait —— Rust 的接口

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

pub struct Tweet {
    pub username: String,
    pub content: String,
    pub reply: bool,
    pub retweet: bool,
}

impl Summary for Tweet {
    fn summarize(&self) -> String {
        format!("{}: {}", self.username, self.content)
    }
}

// trait 默认实现 —— 类似 Java 的 default 方法
pub trait SummaryWithDefault {
    fn summarize(&self) -> String {
        String::from("(Read more...)")
    }
}

impl SummaryWithDefault for NewsArticle {}  // 使用默认实现
```

**关键特性**：可以为**已有类型实现外部 trait**（孤儿规则允许下）：

```rust
// 为自定义类型实现标准库 trait
#[derive(Debug)]
struct Point {
    x: i32,
    y: i32,
}

// 为外部类型实现自定义 trait（前提：trait 或类型至少有一个在当前 crate 中）
trait ToJson {
    fn to_json(&self) -> String;
}

impl ToJson for Point {
    fn to_json(&self) -> String {
        format!(r#"{{"x":{}, "y":{}}}"#, self.x, self.y)
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

## 4.3 Trait Bound 语法

```rust
// Trait 作为参数约束 —— 类似 Java 的 <T extends Summary>
pub fn notify(item: &impl Summary) {  // 语法糖
    println!("Breaking news! {}", item.summarize());
}

// 完整语法（trait bound）
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

// 返回实现 trait 的类型
fn returns_summarizable() -> impl Summary {
    Tweet {
        username: String::from("horse_ebooks"),
        content: String::from("of course, as you probably already know, people"),
        reply: false,
        retweet: false,
    }
}
```

### Trait Bound 的使用场景决策

| 语法 | 适用场景 |
|------|---------|
| `fn foo(item: &impl Trait)` | 简单参数约束，函数签名更简洁 |
| `fn foo<T: Trait>(item: &T)` | 需要多次引用同一类型，或多个参数同类型 |
| `fn foo<T: Trait1 + Trait2>(item: &T)` | 需要多个 trait 约束 |
| `fn foo<T, U>(t: &T, u: &U) where T: Trait, U: Trait` | 多个泛型参数，函数签名太长时 |

### 补充知识：`Sized` 与 `?Sized`

- **`Sized`**：所有在**编译期**能确定大小的类型都自动实现了 `Sized`。绝大多数泛型参数默认是 `Sized` 的，即 `T: Sized` 是隐式约束。
- **`?Sized`**：放宽 Sized 约束，允许运行时才知道大小的类型（如 `dyn Trait`、切片 `[T]`、`str`）。
- 日常极少需要显式写 `?Sized`，但在使用 `Box<dyn Trait>` 或面对 `&[T]` 等 API 时会隐含涉及。

```rust
// 所有泛型参数默认有 Sized bound
fn foo<T>(t: T) {}  // 等价于 fn foo<T: Sized>(t: T) {}

// 放宽：允许动态大小类型
fn bar<T: ?Sized>(t: &T) {}  // t 是引用，所以 T 可以是 ?Sized

// 常见场景：dyn Trait 是动态大小类型，必须放在指针后
let value: Box<dyn std::fmt::Display> = Box::new(42);
// dyn Display 是 ?Sized 的，但 Box<dyn Display> 是 Sized 的
```

## 4.4 常用标准库 Trait

| Trait | 作用 | 类似概念 |
|-------|------|----------|
| `Display` | 格式化输出 `{}` | `toString()` / `__str__` |
| `Debug` | 调试输出 `{:?}` | IDE 中的 debug view |
| `Clone` | 显式深度拷贝 | `.clone()` / copy constructor |
| `Copy` | 栈上自动拷贝 | 原始类型默认行为 |
| `Eq / PartialEq` | 相等比较 `==` | `equals()` / `__eq__` |
| `Ord / PartialOrd` | 大小比较 `< >` | `compareTo()` / `__lt__` |
| `Iterator` | 迭代器 | JS 的 `Symbol.iterator` / Java `Iterable` |
| `From / Into` | 类型转换 | 类型转换构造函数 |

### `From` / `Into` 使用示例

```rust
// From trait —— 将一个类型转换为另一个类型
impl From<i32> for MyNumber {
    fn from(value: i32) -> Self {
        MyNumber(value)
    }
}

// Into —— From 的"反向"（自动实现）
let num: MyNumber = 5.into();  // 因为 MyNumber: From<i32>
```

### 使用 `#[derive]` 自动实现

Rust 可以通过 `derive` 属性自动为自定义类型实现常见 trait：

```rust
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord)]
struct Point {
    x: i32,
    y: i32,
}
// 一行定义等价于手动实现 6 个 trait
```

---

## 练习

1. **实现一个 Trait**：定义一个 `trait Area { fn area(&self) -> f64; }`，为 `struct Circle { radius: f64 }` 和 `struct Rectangle { width: f64, height: f64 }` 分别实现它。参考本章 `Summary` trait 的写法。

2. **泛型函数**：写一个泛型函数 `fn max_of_two<T: PartialOrd>(a: T, b: T) -> T`，返回较大的值。测试时分别传入整数、浮点数和字符串切片，验证能否编译通过。

3. **`From` trait 的使用**：创建一个 `struct Point { x: i32, y: i32 }`，为它实现 `From<(i32, i32)>`。然后尝试用 `let p: Point = (3, 4).into();` 创建实例。

---

> **下一步**：用 Rust 写实用程序 → [[05-practical-skills|第 5 章：实战能力]]
