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
| 编程基础 | 熟悉变量、函数、控制流、数据结构 | Rust 的语法和 Java/TS 有相似之处 |
| 类型系统 | 理解静态类型、泛型 | Java 泛型 / TypeScript 类型系统可以类比 |
| 函数式概念 | 理解 map/filter/reduce | Rust 大量使用迭代器和闭包 |
| 内存模型 | 了解栈（Stack）和堆（Heap）的基本概念 | 不理解也不影响入门，但理解后能更好地掌握所有权 |

---

## 🗺️ 学习路径

整个教程按 **基础语法 → 所有权（核心）→ 组合类型 → Trait 与泛型 → 实战能力 → 持续精进** 递进：

```mermaid
flowchart LR
    A[第1章: 基础语法] --> B[第2章: 所有权]
    B --> C[第3章: 组合类型]
    C --> D[第4章: Trait与泛型]
    D --> E[第5章: 实战]
    E --> F[第6章: 精进]
```

| 章节 | 内容 | 定位 |
|------|------|------|
| **第 1 章** | [[doc/01-basic-syntax\|Rust 基础语法]] | 快速扫盲，让你能用 Rust 写简单程序 |
| **第 2 章** | [[doc/02-ownership-borrowing\|所有权、借用、生命周期]] | **Rust 最难也最核心的部分**，必须集中攻破 |
| **第 3 章** | [[doc/03-composite-types\|struct、enum、模式匹配]] | 组合数据类型，与 TS/Python 的类/联合类型对照 |
| **第 4 章** | [[doc/04-traits-generics\|Trait、泛型、常用 Trait]] | Rust 的 "接口" 系统 |
| **第 5 章** | [[doc/05-practical-skills\|错误处理、集合、文件 I/O]] | 能写实用的 CLI 工具 |
| **第 6 章** | [[doc/06-advanced-topics\|后续精进方向]] | 并发、Cargo 生态、测试、异步 |

---

## 🕹️ 入门实践项目：CLI 命令行待办事项管理工具

一个简单的命令行 TODO 工具，支持添加、列出、删除待办事项，数据存储在 JSON 文件中。

```bash
cargo run -- add "Buy milk"
cargo run -- list
cargo run -- done 1
cargo run -- remove 1
```

**覆盖知识点**：CLI 参数解析（clap）、文件 I/O、serde 序列化、结构体与方法、枚举与 `Option<T>`、错误处理（`?` 运算符）、Vec 集合操作。详见 [[doc/05-practical-skills]]。

---

## 🗓️ 建议学习时间线（每天 1-2 小时）

| 阶段 | 内容 | 时间 |
|------|------|------|
| **第 1-2 天** | [[doc/01-basic-syntax\|第 1 章：基础语法]] | 快速过，重点在表达式语义和类型系统 |
| **第 3-5 天** | [[doc/02-ownership-borrowing\|第 2 章：所有权、借用]] | **最核心也最花时间**，务必理解，多写代码验证 |
| **第 6 天** | [[doc/03-composite-types\|第 3 章：struct / enum / match]] | 结合 TS 联合类型对比学习 |
| **第 7-8 天** | [[doc/04-traits-generics\|第 4 章：Trait 与泛型]] | 重点在 Trait 的基本使用 |
| **第 9-10 天** | [[doc/05-practical-skills\|第 5 章：实战]] | 多写代码 |
| **第 11-12 天** | 实践项目：CLI TODO | 综合练习 |
| **后续** | [[doc/06-advanced-topics\|第 6 章]] | 并发、异步、生态 |
| **合计** | **~12 天入门** | **能独立写 CLI 工具** |

---

## ✅ 入门完成标准

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
| 内存管理 | 所有权 + 借用（编译期检查） | GC（标记清除 + 分代收集） | GC（分代收集） | GC（引用计数 + 循环检测） |
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

*最后更新：2026年8月*
