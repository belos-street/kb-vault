# 第 5 章：实战能力（写实用程序）

> 学完前 4 章，你已经掌握了 Rust 的核心概念。这一章带你掌握日常编程最常用的工具：错误处理、集合、迭代器、闭包、文件 I/O，最后用一个完整的 CLI 项目串联所有知识。
>
> 📖 预计阅读：2 天 &nbsp;|&nbsp; 🎯 面试可答：? 运算符、unwrap/expect/? 选型、迭代器惰性、闭包捕获、自定义错误 &nbsp;|&nbsp; ⬅️ 前置：[04 Trait 与泛型](file:///Users/apple/code/personal/kb-vault/src/programming-languages/rust/doc/04-traits-generics.md)

[[outline|← 返回目录]]

---

## 5.1 错误处理

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

// 链式调用更简洁
fn read_username_from_file() -> Result<String, io::Error> {
    let mut s = String::new();
    File::open("hello.txt")?.read_to_string(&mut s)?;
    Ok(s)
}

> 💡 `?` 链式调用拆解：`File::open("hello.txt")?` 先解包出 `File` 或提前返回 `Err`；
>    然后在这个 `File` 上调用 `read_to_string(&mut s)?`，再传播可能的错误。
>    两个 `?` 的返回类型可以不同（第一个是 `io::Error`，第二个也是 `io::Error`），
>    只要当前函数返回的 `Result` 能容纳它们即可。

// unwrap/expect —— 快速失败（适合原型或确定不会失败的场景）
let f = File::open("hello.txt").unwrap();       // panic on error
let f = File::open("hello.txt").expect("Failed to open");  // 自定义 panic 信息
```

### 自定义错误类型

```rust
use std::fmt;

#[derive(Debug)]
pub enum MyError {
    Io(std::io::Error),
    Parse(std::num::ParseIntError),
    Custom(String),
}

impl fmt::Display for MyError {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        match self {
            MyError::Io(err) => write!(f, "IO error: {}", err),
            MyError::Parse(err) => write!(f, "Parse error: {}", err),
            MyError::Custom(msg) => write!(f, "Custom error: {}", msg),
        }
    }
}

impl std::error::Error for MyError {}

// 实现 From trait 以便 ? 运算符自动转换
impl From<std::io::Error> for MyError {
    fn from(err: std::io::Error) -> MyError {
        MyError::Io(err)
    }
}

impl From<std::num::ParseIntError> for MyError {
    fn from(err: std::num::ParseIntError) -> MyError {
        MyError::Parse(err)
    }
}
```

### 使用 `thiserror` crate（推荐）

实际项目中，用 `thiserror` 宏可以大幅减少自定义错误类型的模板代码：

```rust
use thiserror::Error;

#[derive(Error, Debug)]
pub enum MyError {
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),
    
    #[error("Parse error: {0}")]
    Parse(#[from] std::num::ParseIntError),
    
    #[error("Custom error: {message}")]
    Custom { message: String },
}
// 自动实现 Display、From 等
```

**与 Java/JS/Python 对比**：

| Rust | Java | JS | Python |
|------|------|-----|--------|
| `Result<T, E>` | 受检异常（Checked Exception） | 手动 try/catch | try/except |
| `?` 运算符 | 自动抛异常 | 无等价物（需手动 throw） | 无等价物 |
| `unwrap()` | 不常用 | 无等价物 | 无等价物 |
| `panic!()` | `RuntimeException` | `throw new Error()` | 无捕获的异常 |
| 没有 try/catch（Result 模式） | try/catch | try/catch | try/except |

## 5.2 常用集合

### Vec —— 动态数组

```rust
// Vec —— 动态数组，类似 JS Array / Java ArrayList / Python list
let mut v: Vec<i32> = Vec::new();
v.push(1);
v.push(2);
v.push(3);

// vec! 宏
let v = vec![1, 2, 3];

// 索引访问
let third: &i32 = &v[2];        // 越界会 panic
let third: Option<&i32> = v.get(2);  // 安全访问，返回 Option

// 遍历
for i in &v {
    println!("{}", i);
}

// 同时修改
let mut v = vec![1, 2, 3];
for i in &mut v {
    *i *= 2;  // 解引用修改
}
```

### HashMap

```rust
use std::collections::HashMap;

let mut scores = HashMap::new();
scores.insert(String::from("Blue"), 10);
scores.insert(String::from("Yellow"), 50);

// 读取
let team_name = String::from("Blue");
let score = scores.get(&team_name);  // Option<&i32>

// 遍历
for (key, value) in &scores {
    println!("{}: {}", key, value);
}

// 插入或更新
scores.entry(String::from("Blue")).or_insert(50);  // 不存在才插入
scores.entry(String::from("Blue")).and_modify(|e| *e += 10).or_insert(0);
```

### 其他常用集合

| 集合 | 类似 | 说明 |
|------|------|------|
| `Vec<T>` | JS Array / Java ArrayList | 动态数组，最常用 |
| `HashMap<K, V>` | JS Map / Java HashMap / Python dict | 键值对 |
| `HashSet<T>` | JS Set / Java HashSet / Python set | 无重复集合 |
| `VecDeque<T>` | JS Array 当队列用 / Java ArrayDeque | 双端队列 |
| `LinkedList<T>` | Java LinkedList | 链表（少用） |
| `BTreeMap<K, V>` | Java TreeMap | 有序键值对 |

## 5.3 迭代器与闭包

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

### 迭代器适配器

```rust
let numbers = vec![1, 2, 3, 4, 5, 6];

// 链式调用 —— 惰性求值，只有在 collect 等消费者调用时才执行
let result: Vec<i32> = numbers
    .iter()
    .filter(|x| *x % 2 == 0)       // 过滤偶数
    .map(|x| x * 2)                 // 翻倍
    .take(2)                        // 只取前 2 个
    .collect();

// 常见消费者
let sum: i32 = numbers.iter().sum();          // 求和
let count = numbers.iter().count();            // 计数
let max = numbers.iter().max();                // 最大值（返回 Option）
let any_greater_than_5 = numbers.iter().any(|x| *x > 5);  // 是否存在
let all_positive = numbers.iter().all(|x| *x > 0);        // 是否全部满足
```

### 闭包捕获环境

```rust
let x = 5;
let closure = |y| y + x;  // 捕获 x（不可变引用）
println!("{}", closure(3)); // 8

let mut count = 0;
let mut increment = || {
    count += 1;  // 捕获 count（可变引用）
};
increment();
increment();
println!("{}", count); // 2

// move 关键字 —— 强制获取所有权
let s = String::from("hello");
let closure = move || {
    println!("{}", s);  // s 的所有权被移动到闭包中
};
// println!("{}", s); // ❌ s 已被移动
closure();
```

**与 TS/Java/Python 对比**：

| Rust | TypeScript | Java | Python |
|------|-----------|------|--------|
| `\|x\| x + 1` | `(x) => x + 1` | `x -> x + 1` | `lambda x: x + 1` |
| `.iter().map().collect()` | `.map()` 返回新数组 | `.stream().map().collect()` | `map()` / 列表推导 |
| `.filter()` | `.filter()` | `.filter()` | `filter()` / `if` 在推导式中 |

## 5.4 文件 I/O

```rust
use std::fs;
use std::io::Write;

// 读取文件
let content = fs::read_to_string("hello.txt")
    .expect("Should have been able to read the file");

// 写入文件（注意：File::create 会覆盖已存在的文件）
let mut file = fs::File::create("output.txt")
    .expect("Could not create file");
file.write_all(b"Hello, world!")
    .expect("Could not write to file");

// 简写（同样会覆盖已有文件）
fs::write("output.txt", "Hello, world!")
    .expect("Could not write to file");

// 追加写入
use std::fs::OpenOptions;
let mut file = OpenOptions::new()
    .append(true)
    .open("log.txt")
    .expect("Cannot open file");
file.write_all(b"appending to file\n")
    .expect("Cannot write to file");
```

## 5.5 实战项目：CLI 命令行待办事项管理工具

> **场景描述**：一个简单的命令行 TODO 工具，支持添加、列出、标记完成、删除待办事项，数据存储在 JSON 文件中。

### 功能规格

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

### 项目结构

```
todo-cli/
├── Cargo.toml          # 依赖：clap, serde, serde_json
└── src/
    └── main.rs         # 约 150-200 行，全部在一个文件中
```

### `Cargo.toml`

```toml
[package]
name = "todo-cli"
version = "0.1.0"
edition = "2021"

[dependencies]
clap = { version = "4", features = ["derive"] }
serde = { version = "1", features = ["derive"] }
serde_json = "1"
```

### 核心代码框架

```rust
use clap::{Parser, Subcommand};
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;

const DATA_FILE: &str = "data.json";

// 数据模型
#[derive(Debug, Serialize, Deserialize)]
struct TodoItem {
    id: usize,
    title: String,
    status: Status,
    priority: Priority,
}

#[derive(Debug, Serialize, Deserialize)]
enum Status {
    Pending,
    Done,
}

#[derive(Debug, Serialize, Deserialize)]
enum Priority {
    Low,
    Medium,
    High,
}

// CLI 参数
#[derive(Parser)]
#[command(name = "todo")]
struct Cli {
    #[command(subcommand)]
    command: Commands,
}

#[derive(Subcommand)]
enum Commands {
    Add {
        title: String,
        #[arg(long)]
        priority: Option<String>,
    },
    List,
    Done { id: usize },
    Remove { id: usize },
}

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let cli = Cli::parse();
    let data_path = PathBuf::from(DATA_FILE);
    let mut todos = load_todos(&data_path)?;

    match cli.command {
        Commands::Add { title, priority } => {
            let priority = parse_priority(priority.as_deref().unwrap_or("medium"));
            let id = todos.iter().map(|t| t.id).max().unwrap_or(0) + 1;
            todos.push(TodoItem {
                id,
                title,
                status: Status::Pending,
                priority,
            });
            save_todos(&todos, &data_path)?;
            println!("Added todo [{}]", id);
        }
        Commands::List => {
            if todos.is_empty() {
                println!("No todos yet.");
            } else {
                for t in &todos {
                    let status = format!("{:?}", t.status).to_lowercase();
                    let priority_flag = match t.priority {
                        Priority::High => " ⬆ high",
                        _ => "",
                    };
                    println!("[{}] {:20} [{}]{}", t.id, t.title, status, priority_flag);
                }
            }
        }
        Commands::Done { id } => {
            if let Some(t) = todos.iter_mut().find(|t| t.id == id) {
                t.status = Status::Done;
                save_todos(&todos, &data_path)?;
                println!("Marked [{}] as done", id);
            } else {
                println!("Todo {} not found", id);
            }
        }
        Commands::Remove { id } => {
            let original_len = todos.len();
            todos.retain(|t| t.id != id);
            if todos.len() < original_len {
                save_todos(&todos, &data_path)?;
                println!("Removed todo [{}]", id);
            } else {
                println!("Todo {} not found", id);
            }
        }
    }

    Ok(())
}

fn parse_priority(s: &str) -> Priority {
    match s.to_lowercase().as_str() {
        "high" => Priority::High,
        "low" => Priority::Low,
        _ => Priority::Medium,
    }
}

fn load_todos(path: &PathBuf) -> Result<Vec<TodoItem>, Box<dyn std::error::Error>> {
    if !path.exists() {
        return Ok(Vec::new());
    }
    let content = fs::read_to_string(path)?;
    let todos = serde_json::from_str::<Vec<TodoItem>>(&content).unwrap_or_default();
    Ok(todos)
}

fn save_todos(todos: &[TodoItem], path: &PathBuf) -> Result<(), Box<dyn std::error::Error>> {
    let content = serde_json::to_string_pretty(todos)?;
    fs::write(path, content)?;
    Ok(())
}
```

> 💡 上面的 `main` 函数返回 `Result<(), Box<dyn std::error::Error>>`，这样 `?` 可以同时传播
>    `std::io::Error`（文件 I/O）和 `serde_json::Error`（序列化）。
>    `Box<dyn std::error::Error>` 是应用层错误处理的一种简单写法，
>    生产项目更常用 `anyhow::Result<T>`。

### 覆盖知识点

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

---

## 练习

### 1. 从文件读取数字并求和

- **要求**：写一个函数 `fn sum_numbers(path: &str) -> Result<i32, std::io::Error>`，读取文件中每行的整数并求和。
- **提示**：先用 `?` 运算符实现，再改用 `match` 写法对比差异。
- **预期效果**：文件内容为 `1\n2\n3\n` 时返回 `6`；文件不存在时返回 `Err`。

### 2. 迭代器链式处理

- **要求**：对 `vec![1, 2, 3, 4, 5, 6, 7, 8, 9, 10]`，求所有偶数的平方和。
- **提示**：分别用 `for` 循环和 `filter().map().sum()` 链实现。
- **预期效果**：结果都是 `220`（即 `2² + 4² + 6² + 8² + 10² = 4 + 16 + 36 + 64 + 100`）。

### 3. 扩展 TODO CLI

- **要求**：在 TODO 项目基础上给 `list` 子命令添加 `--filter` 参数，支持 `cargo run -- list --filter done` 只显示已完成项，`--filter pending` 只显示待办项。
- **提示**：把 `Commands::List` 改为 `List { #[arg(long)] filter: Option<String> }`，在 list 分支中根据 `filter` 值过滤 `todos`。
- **预期效果**：添加几个待办后，`list --filter done` 只输出 `[Status::Done]` 的项，其他项不显示。

---

## 面试回答模板

> **问：? 运算符的工作原理是什么？和 try/catch 有什么区别？**
>
> `?` 运算符是错误传播的语法糖：如果 `Result` 是 `Ok(v)`，返回 `v` 继续执行；如果是 `Err(e)`，**立即从当前函数返回 `Err(e)`**。和 try/catch 的区别：(1) `?` 只能用于返回 `Result` 或 `Option` 的函数，错误类型会自动通过 `From` trait 转换；(2) 没有隐式的控制流跳转——`?` 就是 early return，行为可预测；(3) 编译器强制你处理错误——函数签名中的 `Result` 类型让调用者知道可能失败。

> **问：unwrap、expect、? 什么时候用哪个？**
>
> `unwrap()`——确定不会失败时用（如 `vec![1,2,3].get(0).unwrap()`，或原型开发快速验证）；`expect("msg")`——同 unwrap 但带自定义 panic 信息，比 unwrap 好（调试时能看到原因）；`?`——**生产代码首选**，将错误传播给调用者处理，不会 panic。原则：任何"可能失败"的场景都用 `?` 或 `match`，只有"逻辑上不可能失败"的场景才用 unwrap/expect。

> **问：如何设计自定义错误类型？thiserror 和 anyhow 什么时候用哪个？**
>
**自定义错误类型**：定义 `enum MyError { Io(io::Error), Parse(ParseIntError), Custom(String) }`，实现 `Display`、`Error`、`From<各子错误>` trait。`thiserror`——用于**库/模块**的错误类型定义，自动生成 Display 和 From 实现，减少模板代码；`anyhow`——用于**应用层**的错误处理，提供 `anyhow::Result<T>`（错误类型统一为 `anyhow::Error`，可以装任何错误），适合 CLI 工具等不需要精细错误分类的场景。原则：库用 thiserror（给调用者明确的错误类型），应用用 anyhow（简化错误处理）。

> **问：迭代器为什么是惰性的？和 JS 的数组方法有什么区别？**
>
> Rust 迭代器适配器（`.map()`、`.filter()` 等）是**惰性的**——调用后不立即执行，只构建迭代器链，直到消费者（`.collect()`、`.sum()` 等）调用时才遍历。JS 的 `.map()`、`.filter()` 是**立即执行**的——每次调用都遍历整个数组并返回新数组。区别：(1) Rust 链式调用只遍历一次（高效），JS 链式调用每步都遍历一次；(2) Rust 可以用 `.take(n)` 只取前 n 个，JS 无法中途停止。代价：Rust 需要显式 `.collect()` 触发执行。

> **问：闭包捕获环境变量的三种方式是什么？**
>
> (1) **不可变引用**——`|y| y + x`，闭包借用 `x`（`&x`），闭包和原变量都可读；(2) **可变引用**——`|y| { count += 1; y + count }`，闭包借用 `&mut count`，闭包可修改但原变量在闭包使用期间不可访问；(3) **获取所有权**——`move |y| y + x`，闭包拿走 `x` 的所有权，原变量失效。编译器按最小权限原则自动推断，需要所有权时显式加 `move`（常见场景：闭包传给线程，线程可能比创建者活得久）。

> **下一步**：探索 Rust 进阶方向 → [[06-advanced-topics|第 6 章：后续精进]]
