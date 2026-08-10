# 第 4 章：Trait 与泛型（Rust 的"接口"与"模板"）

> Trait 是 Rust 实现**多态**的唯一方式 —— 没有继承、没有重载，一切通过 Trait 组合。如果你熟悉 Java 的 `interface` 或 TypeScript 的 `interface` / `type`，Trait 对你来说会很自然。
>
> 📖 预计阅读：1-2 天 &nbsp;|&nbsp; 🎯 面试可答：Trait vs Interface、单态化 vs 类型擦除、Trait Bound 写法、孤儿规则、From/Into &nbsp;|&nbsp; ⬅️ 前置：[[03-composite-types|03 组合类型]]

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

| 特性 | Rust Trait | Java Interface | TypeScript Interface |
|------|-----------|---------------|---------------------|
| 定义行为契约 | ✅ | ✅ | ✅ |
| 默认实现 | ✅（trait 内提供默认方法体） | ✅（Java 8+ `default` 方法） | ❌ 无法直接实现 |
| 泛型约束 | `<T: Summary>` | `<T extends Summary>` | `<T extends Summary>` |
| 为已有类型实现 | ✅（孤儿规则允许下） | ❌ 不可为已有类追加接口 | ✅ 声明合并（Declaration Merging） |

## 4.3 Trait Bound 语法

```rust
// Trait 作为参数约束 —— 类似 Java 的 <T extends Summary>
// 以下 notify 的几种写法等价，实际代码中任选其一（不要全部同时定义）
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
// 先定义目标类型
struct MyNumber(i32);

// From trait —— 将一个类型转换为另一个类型
impl From<i32> for MyNumber {
    fn from(value: i32) -> Self {
        MyNumber(value)
    }
}

// Into —— From 的"反向"（自动实现）
let num: MyNumber = 5.into();  // 因为 MyNumber: From<i32>，所以 i32: Into<MyNumber> 自动成立
```

### 使用 `#[derive]` 自动实现

Rust 可以通过 `derive` 属性自动为自定义类型实现常见 trait：

```rust
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord)]
struct Point {
    x: i32,
    y: i32,
}
// 一行定义等价于手动实现 7 个 trait
```

---

## 练习

### 1. 实现一个 Trait

- **要求**：定义 `trait Area { fn area(&self) -> f64; }`，为 `Circle` 和 `Rectangle` 分别实现它。
- **提示**：`Circle { radius: f64 }`，`Rectangle { width: f64, height: f64 }`。
- **预期效果**：`Circle { radius: 2.0 }.area()` 返回约 `12.566`，`Rectangle { width: 3.0, height: 4.0 }.area()` 返回 `12.0`。

### 2. 泛型函数

- **要求**：写一个泛型函数 `fn max_of_two<T: PartialOrd>(a: T, b: T) -> T`，返回较大的值。
- **提示**：分别用 `i32`、`f64`、`&str` 测试。
- **预期效果**：`max_of_two(3, 5) == 5`，`max_of_two(2.5, 1.2) == 2.5`，`max_of_two("apple", "banana") == "banana"`。

### 3. From trait 的使用

- **要求**：为 `struct Point { x: i32, y: i32 }` 实现 `From<(i32, i32)>`，并用 `.into()` 创建实例。
- **提示**：实现 `impl From<(i32, i32)> for Point`，在 `from` 方法中解构元组。
- **预期效果**：`let p: Point = (3, 4).into();` 编译通过，且 `p.x == 3, p.y == 4`。

---

## 面试回答模板

> **问：Trait 和 Java Interface 有什么区别？Rust 为什么不用继承？**
>
> 核心区别：(1) Trait 可以有**默认实现**（类似 Java 8 的 default 方法）；(2) 可以为**已有类型实现新 trait**（孤儿规则允许下，Java 不能为已有类加接口）；(3) Trait 作为参数有 `impl Trait` 语法糖，比 Java 的泛型约束更简洁。Rust 不用继承是因为**组合优于继承**——继承导致紧耦合和脆弱基类问题，Trait 组合更灵活、更安全。Rust 的多态只通过 Trait 实现，没有 extends 关键字。

> **问：Rust 泛型的单态化是什么？和 Java 类型擦除有什么区别？**
>
> 单态化（Monomorphization）：编译器为每个具体类型生成专用代码，如 `Vec<i32>` 和 `Vec<String>` 是两份不同的编译产物。Java 类型擦除：编译后泛型信息消失，`List<Integer>` 和 `List<String>` 运行时都是 `List<Object>`。区别：Rust 单态化**零运行时开销**（和手写具体类型一样快），Java 类型擦除有装箱/拆箱开销。代价：Rust 二进制文件可能更大（多份代码），但换来的是性能保证。

> **问：Trait Bound 的几种写法什么时候用哪个？**
>
> `fn foo(item: &impl Trait)`——简单参数约束，签名简洁，最常用；`fn foo<T: Trait>(item: &T)`——需要多次引用同一类型 T，或多个参数同类型时；`fn foo<T: Trait1 + Trait2>(item: &T)`——需要多个 trait 约束；`where T: Trait, U: Trait`——多个泛型参数、函数签名太长时。原则：简单场景用 `impl Trait`，复杂场景用 `where`。

> **问：孤儿规则是什么？为什么需要它？**
>
> 孤儿规则：只能为"当前 crate 中定义的类型"实现"当前 crate 中定义的 trait"，即 trait 或类型至少有一个是你自己的。原因：防止两个 crate 为同一外部类型实现同一外部 trait，导致冲突（如 crate A 和 crate B 都为 `String` 实现 `Display`，编译器不知道用哪个）。保证全局一致性——每个 (Type, Trait) 组合只有一份实现。

> **问：From 和 Into 的关系是什么？**
>
> 实现了 `From<A> for B` 后，`Into<B> for A` 会**自动实现**（编译器自动生成反向转换）。所以只需实现 `From`，就能同时获得 `.into()` 方法。日常用法：`let b: B = a.into()`——因为 `B: From<A>`，所以 `A: Into<B>` 自动成立。面试追问：为什么推荐实现 From 而非 Into？因为 From 的 `from()` 是无歧义的（类型明确），而 `into()` 的目标类型靠推断，复杂场景可能推断失败。

> **下一步**：用 Rust 写实用程序 → [[05-practical-skills|第 5 章：实战能力]]
