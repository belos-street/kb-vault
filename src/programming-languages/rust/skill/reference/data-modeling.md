---
name: data-modeling
title: struct/enum 建模与模式匹配
description: 用 struct/enum/match 给业务数据建模：变体携带数据、穷举匹配、解构、match 守卫、Option 消除 null。当用户要设计 Rust 数据结构或写分支逻辑时使用。
tags: [rust, struct, enum, match, option]
---

# struct/enum 建模与模式匹配

一句话定位：Rust 没有类继承，数据建模靠 struct + enum 组合 —— enum 变体可携带数据，match 强制穷举，把"漏分支"这类 bug 编译期清零。

## 什么时候用
- 定义业务数据结构（实体、配置、消息）。
- 表示"多种互斥状态"且各状态携带不同数据。
- 写分支逻辑，希望编译器保证不漏情况。
- 表示"可能没有值"（替代 null）。

## 怎么做（核心步骤）

### 1. struct + impl —— 数据与方法分离
```rust
struct User {
    username: String,
    active: bool,
}

impl User {
    // 关联函数（无 self）：充当构造器，调用 User::new(...)
    fn new(username: String) -> Self {
        User { username, active: true }
    }

    fn is_active(&self) -> bool { self.active }  // &self 只读

    fn deactivate(&mut self) { self.active = false }  // &mut self 可变
}
```
- 方法第一个参数显式：`&self` / `&mut self` / `self`（消耗所有权）。
- struct 更新语法 `..user1`：其余字段从 user1 拿 —— 非 Copy 字段被 move，user1 随之失效，需要保留就先 `clone`。

### 2. enum —— 变体可携带不同数据
```rust
enum Message {
    Quit,                      // 无数据
    Move { x: i32, y: i32 },   // 匿名结构体
    Write(String),             // 元组风格
}
impl Message { fn call(&self) { /* ... */ } }  // enum 也能有方法
```
- 这是 `Option`/`Result` 的同款机制；表达力等价于 TS 的鉴别联合，远超"常量枚举"。

### 3. Option\<T\> —— 无 null 的世界
```rust
let maybe: Option<i32> = Some(5);
// 编译器强制区分 Some/None，不可能"忘判空"
```

### 4. match —— 穷举匹配
```rust
fn describe(msg: &Message) -> &'static str {
    match msg {
        Message::Quit => "quit",
        Message::Move { x, y } => { /* 解构变体数据 */ "move" }
        Message::Write(s) => s,   // 绑定变体数据
        // 漏一个变体直接编译错误
    }
}
```

### 5. if let —— 只关心一种模式
```rust
if let Some(max) = config_max {
    println!("max = {}", max);
}
// 相比 match 免写 `_ => ()`，代价是放弃穷举保护
```

### 6. 解构与守卫
```rust
let Point { x, y } = p;                    // 结构体解构
match num {
    Some(x) if x < 5 => println!("小于五"), // match 守卫
    Some(x) => println!("{}", x),
    None => (),
}
match msg {                                 // @ 绑定：范围匹配同时拿值
    Hello { id: id_v @ 3..=7 } => println!("in range {}", id_v),
    Hello { id } => println!("{}", id),
}
```

## 常见坑 ⚠️
| 错误做法 ❌ | 后果 | 正确做法 ✅ |
|------------|------|------------|
| `if let` 应付所有分支 | enum 新增变体时静默漏处理 | 需要完整处理就写 match，让编译器盯着 |
| `..user1` 后继续用 user1 | 非 Copy 字段被 move，整体失效 | 先 `clone()` 或逐字段复制 |
| 方法写 `self` 却还想用调用者 | 所有权被方法消耗 | 默认 `&self`，确需转移（如 `into_xxx`）才用 `self` |
| 用 bool/字符串字段模拟互斥状态 | 非法组合（`done=true` 且 `archived=true`）无法被类型阻止 | 用 enum 表达互斥状态机 |
| match 里用 `other =>` 过早通配 | 新变体静默落入 default | 先穷举具体变体，通配留给真正的兜底 |

## 决策点
| 场景 | 推荐 | 理由 |
|------|------|------|
| 互斥状态 + 各带数据 | enum | 类型层面排除非法状态 |
| 纯数据载体 | struct + `#[derive(Debug, Clone)]` | 简单直接 |
| 只关心一种模式 | `if let` / `let else` | 省样板 |
| 需要穷举保证 | `match` | 新增变体强制处理 |
| 可能失败的构造 | 关联函数返回 `Result<Self, E>` | 构造期校验 |

## 参考：官方文档（核验用）🔗
| 关键点 | 官方文档 |
|--------|----------|
| struct 与方法 | [The Book: Using Structs](https://doc.rust-lang.org/book/ch05-00-structs.html) |
| enum 与 match | [The Book: Enums and Pattern Matching](https://doc.rust-lang.org/book/ch06-00-enums.html) |
| 模式全语法 | [The Book: Patterns](https://doc.rust-lang.org/book/ch19-00-patterns.html) |
| Option API | [std::option 文档](https://doc.rust-lang.org/std/option/) |

## 一句话结论
- 用 enum 表达互斥状态、match 强制穷举、`if let` 只做单分支速记；struct 管数据、impl 管方法、`&self` 优先；`..user1` 记得是 move 不是 spread。
