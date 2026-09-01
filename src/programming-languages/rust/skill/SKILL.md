---
name: "rust-skills"
title: "Rust 项目最佳实战 Skill 集合"
description: "Rust 项目落地时可直接执行的最佳实践：Cargo 工程、所有权与借用、智能指针、数据建模、Trait 抽象、错误处理、集合迭代器、并发异步。当用户要写/改/review Rust 工程代码时使用。"
tags: [rust, backend, best-practices, project]
---

# Rust 项目最佳实战 Skill 集合

自包含的实战手册，可独立搬运到任意项目使用，讲如何在**真实的 Rust 工程**里直接照做，而不是讲解语法。

## 使用场景 → 读哪个能力

| 你要做什么 | 读 |
|-----------|----|
| 初始化项目 / Cargo 命令 / 管依赖 / 拆模块 / 组织测试 | [reference/cargo-project.md](reference/cargo-project.md) |
| 解所有权/借用编译错：move、借用规则、生命周期标注 | [reference/ownership-borrowing.md](reference/ownership-borrowing.md) |
| 表达递归类型/多所有者/内部可变性：Box、Rc、RefCell、Arc | [reference/smart-pointers.md](reference/smart-pointers.md) |
| 用 struct/enum/match 给业务数据建模、穷举分支 | [reference/data-modeling.md](reference/data-modeling.md) |
| 定义行为契约：trait、泛型约束、derive、From/Into | [reference/traits-generics.md](reference/traits-generics.md) |
| 错误处理：Result、? 传播、自定义错误、thiserror/anyhow | [reference/error-handling.md](reference/error-handling.md) |
| 处理集合数据：Vec/HashMap、迭代器链、闭包捕获 | [reference/collections-iterators.md](reference/collections-iterators.md) |
| 写并发/异步：线程、channel、Mutex/Arc、tokio | [reference/concurrency-async.md](reference/concurrency-async.md) |

## 核心原则（一页速记）

1. **所有权独占**：每个值有且只有一个所有者，赋值即 move。想继续用就 clone，想共享访问就借用（`&T`/`&mut T`），想共享所有权才用 `Rc`/`Arc`。
2. **借用规则**：任意多个 `&T` **或** 最多一个 `&mut T`，二者不可同时存在——这是防数据竞争的编译期保证；`RefCell` 只是把检查推迟到运行时。
3. **无 null 无异常**：可能没有值用 `Option<T>`，可能失败用 `Result<T, E>`；`?` 传播错误，`unwrap` 只留给"逻辑上不可能失败"的场景。
4. **组合优于继承**：没有 extends，行为契约用 trait 表达；泛型单态化零运行时开销，动态分发才用 `dyn Trait`。
5. **match 必须穷举**：enum 新增变体时编译器逼你处理所有分支；只关心一种模式才用 `if let`（放弃穷举保护）。
6. **迭代器是惰性的**：适配器只建链不执行，消费者（collect/sum）才触发；整条链一次遍历完成。
7. **库用 thiserror，应用用 anyhow**：库给调用者明确的错误类型，应用统一错误处理简化传播。
