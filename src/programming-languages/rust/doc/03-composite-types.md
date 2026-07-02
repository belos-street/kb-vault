# 第 3 章：组合类型（struct、enum、模式匹配）

> Rust 没有"类"的继承体系，但用 struct 和 enum 的组合可以表达任何数据结构。这一章帮你建立起与 TS/Java 的数据类型映射。

[[outline|← 返回目录]]

---

## 3.1 结构体（struct）

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

## 3.2 方法（Method）

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

// 可以有多个 impl 块
impl Rectangle {
    fn is_square(&self) -> bool {
        self.width == self.height
    }
}
```

**关键区别**（对比 Java/TS）：
- 方法和数据**分离**：struct 定义数据，`impl` 块定义方法
- 方法的第一个参数总是 `self`（或其变体 `&self`、`&mut self`）
- `self` 是**显式**的（对比 Java/TS 的隐式 `this`）
- 可以有**多个** `impl` 块（代码组织更灵活）

## 3.3 枚举（Enum）—— Rust 最强大的特性之一

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

## 3.4 `Option<T>` 和 `Result<T, E>`（Rust 版 null/异常）

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
use std::fs::File;

let f = File::open("hello.txt");

let f = match f {
    Ok(file) => file,          // 文件打开成功
    Err(error) => panic!("打开文件失败: {:?}", error),  // 处理错误
};

// 使用 ? 运算符（更简洁）—— 自动传播错误到调用者
fn read_file() -> Result<String, std::io::Error> {
    let mut s = String::new();
    File::open("hello.txt")?.read_to_string(&mut s)?;
    Ok(s)
}

// 对比：Java try/catch, JS try/catch, Python try/except
```

## 3.5 模式匹配（match）

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

### 模式匹配的高级用法

```rust
// 解构结构体
struct Point {
    x: i32,
    y: i32,
}
let p = Point { x: 0, y: 7 };
let Point { x, y } = p;  // 解构，类似 JS 的 const { x, y } = p

// 解构时忽略字段 —— 使用 `..` 忽略其余字段
let Point { x, .. } = p;  // 只取 x，忽略 y

// match 中的解构
match p {
    Point { x, y: 0 } => println!("在 x 轴上，x = {}", x),
    Point { x: 0, y } => println!("在 y 轴上，y = {}", y),
    Point { x, y } => println!("不在轴上：({}, {})", x, y),
}

// 匹配守卫（match guards）
let num = Some(4);
match num {
    Some(x) if x < 5 => println!("小于五：{}", x),
    Some(x) => println!("{}", x),
    None => (),
}

// @ 绑定 —— 匹配的同时绑定值
enum Message {
    Hello { id: i32 },
}
let msg = Message::Hello { id: 5 };
match msg {
    Message::Hello { id: id_variable @ 3..=7 } => {
        println!("id 在 3-7 范围内：{}", id_variable)
    }
    Message::Hello { id: 10..=12 } => {
        println!("id 在 10-12 范围内（但不绑定值）")
    }
    Message::Hello { id } => {
        println!("其他 id：{}", id)
    }
}
```

**与 TS/Java 对比**：

| Rust | TypeScript | Java |
|------|-----------|------|
| `match` | `switch` / discriminated union + switch | `switch` / pattern matching (Java 17+) |
| 穷举检查 ✅ | 无穷举检查 ❌ | 无穷举检查 ❌ |
| 可解构嵌套数据 ✅ | 需手动解构 | 需手动解构 |

---

## 练习

1. **用 enum 替代多级 `if`**：定义一个 `Temperature` 枚举，变体为 `Celsius(f64)` 和 `Fahrenheit(f64)`，为它实现一个 `to_celsius()` 方法。对照本章 enum 的方法语法。

2. **`Option<T>` 的 match**：写一个函数，接收 `Option<i32>`，用 `match` 返回字符串：`Some(0)` → "zero"、`Some(n)` → "positive/negative"、`None` → "nothing"。用 `if let` 重写一次看看。

3. **解构练习**：定义一个 `struct Person { name: String, age: u8 }`，在 `match` 中解构它，分别处理 `age < 18`（"未成年人"）、`age >= 60`（"老年人"）、其他（"成年人"）。使用 `match` 守卫（`if`）实现。

---

> **下一步**：学习 Rust 的接口系统 → [[04-traits-generics|第 4 章：Trait 与泛型]]
