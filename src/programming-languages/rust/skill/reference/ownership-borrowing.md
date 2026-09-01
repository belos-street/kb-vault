---
name: ownership-borrowing
title: 所有权与借用
description: 用所有权/借用/生命周期写出编译期内存安全的代码：move/clone/copy、借用规则、NLL、悬垂引用、生命周期标注。当用户写/改 Rust 代码遇到所有权或借用编译错误时使用。
tags: [rust, ownership, borrowing, lifetimes]
---

# 所有权与借用

一句话定位：Rust 的内存安全全靠这套编译期规则 —— 理解 move/借用规则/生命周期，就能自己读懂并修掉 90% 的借用检查错误。

## 什么时候用
- 遇到 `E0382`（borrow of moved value）、`E0502`（cannot borrow as mutable）等编译错误。
- 设计函数签名：参数传 `T`、`&T` 还是 `&mut T`。
- 函数返回引用时，决定要不要写生命周期标注。
- 排查"为什么这个变量突然不能用了"。

## 怎么做（核心步骤）

### 1. 所有权三规则
1. 每个值有且只有一个**所有者**。
2. 所有者离开作用域，值自动释放（drop）。
3. 赋值/传参时所有权 **move**，原变量失效。

```rust
let s1 = String::from("hello");
let s2 = s1;             // 所有权 move 到 s2
// println!("{}", s1);   // ❌ E0382：s1 已失效
```
- 设计动机：杜绝 double free —— 只有一个所有者负责释放，编译期检查，无 GC。

### 2. Move / Clone / Copy
```rust
let s1 = String::from("hello");
let s2 = s1.clone();     // 显式深拷贝，s1 仍可用

let x = 5;
let y = x;               // 标量类型实现 Copy，自动按位拷贝，x 仍可用
```
- 判断规则：实现了 `Copy` 的类型（整数、浮点、bool、char、全 Copy 字段的元组/struct）赋值时自动拷贝；其余默认 move。

### 3. 借用规则（面试必考）
**同时只能满足其一：**
1. 任意多个不可变引用 `&T`；
2. 最多一个可变引用 `&mut T`。

```rust
let mut s = String::from("hello");

let r1 = &s;
let r2 = &s;             // ✅ 多个不可变引用
println!("{} {}", r1, r2); // r1/r2 最后一次使用在这里（NLL：生命周期到此结束）

let r3 = &mut s;         // ✅ 前面的引用已不再使用
r3.push_str(" world");
```
- 类比：多个读者可同时读；一个写者独占写；读写不能并存 —— 数据竞争在编译期被消灭。

### 4. 悬垂引用：编译器保证不存在
```rust
// ❌ 编译错误：返回局部值的引用
// fn dangle() -> &String {
//     let s = String::from("hello");
//     &s
// }

// ✅ 返回值本身，所有权转移给调用者
fn no_dangle() -> String {
    let s = String::from("hello");
    s
}
```

### 5. 生命周期标注（只在编译器推不出来时写）
```rust
// 返回值的引用来自 x 还是 y？编译器无法推断，需标注关联
fn longest<'a>(x: &'a str, y: &'a str) -> &'a str {
    if x.len() > y.len() { x } else { y }
}
// 'a 的含义：返回值引用的存活期不超过 x、y 中较短的那个
```
- 生命周期标注**不改变**存活时间，只是描述引用间关系让编译器验证。
- 省略规则覆盖大部分场景：单引用参数、`&self` 方法等无需标注。
- 结构体持有引用时必须标注：`struct Excerpt<'a> { part: &'a str }`。

## 常见坑 ⚠️
| 错误做法 ❌ | 后果 | 正确做法 ✅ |
|------------|------|------------|
| move 后继续用原变量 | `E0382` 编译错误 | 需要保留就 `.clone()`，或改传引用 |
| struct 更新语法 `..user1` 后继续用 user1 | 未显式指定的非 Copy 字段被 move，user1 整体失效 | 先 `..user1.clone()`，或逐字段 clone |
| 同一作用域混用 `&s` 与 `&mut s` | `E0502` | 让不可变引用先于 `&mut` 产生并结束使用（NLL 已宽松很多） |
| 函数返回局部值的引用 | `E0515`（无法返回局部引用；签名缺标注时先报 `E0106`） | 返回值本身转移所有权 |
| 循环里反复 clone 绕过借用检查 | 性能损耗，掩盖设计问题 | 重构数据流：缩小借用范围、先收集再修改 |

## 决策点
| 场景 | 推荐 | 理由 |
|------|------|------|
| 只读访问 | `&T` | 多读者并存，零成本 |
| 需要修改 | `&mut T` | 独占写，编译期防竞争 |
| 转移所有权 | `T`（按值） | 调用方不再需要，如 `into_iter`、构造器消费参数 |
| 调用方还要用且类型昂贵 | 传 `&T` + 需要副本再 clone | 避免无谓深拷贝 |
| 返回引用推不出生命周期 | 补标注或直接返回 owned 值 | owned 最省心，先对再优化 |

## 与其他方案取舍
| 维度 | Rust 所有权 | GC（Java/Go/JS） |
|------|------------|------------------|
| 内存安全 | 编译期保证 | 运行时保证 |
| 运行时开销 | 零（无 GC 暂停） | GC 停顿/吞吐损耗 |
| 心智成本 | 前期高（和编译器搏斗） | 低（内存问题后置） |
| 数据竞争 | 借用规则编译期消灭 | 靠锁与纪律 |

## 参考：官方文档（核验用）🔗
| 关键点 | 官方文档 |
|--------|----------|
| 所有权模型 | [The Book: Ownership](https://doc.rust-lang.org/book/ch04-01-what-is-ownership.html) |
| 借用与引用 | [The Book: References and Borrowing](https://doc.rust-lang.org/book/ch04-02-references-and-borrowing.html) |
| 生命周期 | [The Book: Validating References with Lifetimes](https://doc.rust-lang.org/book/ch10-03-lifetime-syntax.html) |
| Rust 2018 NLL | [The Rust Blog: NLL](https://blog.rust-lang.org/2018/12/06/Rust-1.31-and-rust-2018.html) |

## 一句话结论
- 值独占、赋值即 move；要共享就借用，`多个 &T 或一个 &mut T` 是铁律；返回引用给不出生命周期就返回 owned；NLL 按最后一次使用判定冲突。
