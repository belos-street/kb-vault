---
name: traits-generics
title: Trait 与泛型抽象
description: 用 trait + 泛型做多态抽象：trait bound、impl Trait、where 子句、derive、From/Into、孤儿规则、单态化。当用户要为 Rust 类型定义行为契约或写泛型函数时使用。
tags: [rust, trait, generics, derive]
---

# Trait 与泛型抽象

一句话定位：Rust 的多态只靠 trait —— 定义行为契约、约束泛型、给已有类型追加能力，全部零成本（单态化）。

## 什么时候用
- 定义多个类型的共同行为契约。
- 写泛型函数/结构体，需要约束"类型必须能做什么"。
- 为外部类型实现自定义能力，或为自定义类型实现标准库 trait。
- 让错误类型、序列化等样板代码自动生成。

## 怎么做（核心步骤）

### 1. 定义 trait + 实现
```rust
pub trait Summary {
    fn summarize(&self) -> String;              // 必须实现
    fn preview(&self) -> String {               // 默认实现
        String::from("(Read more...)")
    }
}

pub struct Tweet { pub username: String, pub content: String }

impl Summary for Tweet {
    fn summarize(&self) -> String {
        format!("{}: {}", self.username, self.content)
    }   // preview 不实现则用默认
}
```

### 2. 孤儿规则（实现的前提）
只能为"当前 crate 的类型"实现"当前 crate 的 trait"—— trait 或类型至少一个是自己的。
```rust
// ✅ 自定义类型 + 标准库 trait
impl std::fmt::Display for Point { /* ... */ }
// ✅ 标准库类型 + 自定义 trait
impl ToJson for String { /* ... */ }
// ❌ 外部类型 + 外部 trait → 用 newtype 包装：struct Wrapper(Vec<String>);
```

### 3. Trait Bound 写法（按需选择）
```rust
fn notify(item: &impl Summary) {}          // 糖：单参数简洁
fn notify<T: Summary>(item: &T) {}         // 完整：多参数同类型时必须
fn notify<T: Summary + Display>(item: &T) {} // 多约束
fn process<T, U>(t: &T, u: &U) -> i32      // where：签名太长时
where
    T: Summary + Clone,
    U: Clone + Debug,
{ 0 }

fn best_tweet() -> impl Summary { /* 返回一个具体类型 */ }
```

### 4. derive 自动实现
```rust
#[derive(Debug, Clone, PartialEq, Eq, PartialOrd, Ord, Hash, Default)]
struct Point { x: i32, y: i32 }
```
- 打印调试的前提：类型要 `derive(Debug)` 才能用 `{:?}`。

### 5. From / Into —— 类型转换的标准姿势
```rust
struct MyNumber(i32);
impl From<i32> for MyNumber {
    fn from(v: i32) -> Self { MyNumber(v) }
}
let n: MyNumber = 5.into();   // 实现 From 后 Into 自动获得
```
- 只实现 `From`：目标类型明确无歧义；`Into` 靠推断，复杂场景可能失败。

## 常见坑 ⚠️
| 错误做法 ❌ | 后果 | 正确做法 ✅ |
|------------|------|------------|
| `impl Trait` 返回值想按条件返回不同类型 | 编译错误：impl Trait 只对应一个具体类型 | 返回 `Box<dyn Trait>`（动态分发）或统一成 enum |
| 给 f64 类型 `derive(Eq)` | 编译错误：浮点无全序 | 浮点只用 `PartialEq`/`PartialOrd` |
| 为外部类型实现外部 trait | 违反孤儿规则编译错误 | newtype 包装后再实现 |
| 泛型函数内直接比较 `t > largest` | 编译错误：T 未必可比较 | 约束 `T: PartialOrd` |
| 忘记 `derive(Debug)` 就 `{:?}` | 编译错误 | 给结构体/枚举默认带上 `Debug` |

## 决策点
| 场景 | 推荐 | 理由 |
|------|------|------|
| 简单参数约束 | `impl Trait` | 签名最简洁 |
| 多参数同类型 / 多约束 | `<T: Trait>` / `where` | 表达力完整 |
| 性能敏感的抽象 | 泛型（静态分发） | 单态化零运行时开销 |
| 异构集合 / 缩小二进制 | `Box<dyn Trait>` | 动态分发，一份代码 |
| 类型转换 | 实现 `From` | `Into` 自动获得 |

## 与其他方案取舍
| 维度 | Rust 泛型（单态化） | Java 泛型（类型擦除） |
|------|--------------------|----------------------|
| 运行时开销 | 零（为每个具体类型生成专用代码） | 有（装箱/拆箱、运行时检查） |
| 二进制体积 | 可能增大（多份代码） | 小 |
| 编译期安全 | 强（bound 在编译期验证） | 弱（擦除后无检查） |

## 参考：官方文档（核验用）🔗
| 关键点 | 官方文档 |
|--------|----------|
| Trait 定义与实现 | [The Book: Traits](https://doc.rust-lang.org/book/ch10-02-traits.html) |
| 泛型与单态化 | [The Book: Generic Types](https://doc.rust-lang.org/book/ch10-01-syntax.html) |
| From/Into 转换 | [std::convert::From 文档](https://doc.rust-lang.org/std/convert/trait.From.html) |
| derive 宏清单 | [std 文档: Derive](https://doc.rust-lang.org/std/#derive) |

## 一句话结论
- 行为契约用 trait、约束按"impl Trait → <T: Trait> → where"逐级升级；只实现 `From` 就够；孤儿规则挡住的场景用 newtype；性能敏感用泛型静态分发，异构用 `dyn Trait`。
