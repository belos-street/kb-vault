---
name: cargo-project
title: Cargo 工程与项目组织
description: 管理 Rust 工程全流程：Cargo 命令、edition、依赖纪律、模块可见性、项目结构、测试组织。当用户要初始化/组织 Rust 项目、管依赖、写测试时使用。
tags: [rust, cargo, project, testing]
---

# Cargo 工程与项目组织

一句话定位：把"怎么组织 Rust 工程"从习惯变成纪律 —— 工具链怎么用、模块怎么拆、可见性怎么控、测试放哪里，一次性做对。

## 什么时候用
- 新建 Rust 工程要初始化、加依赖、定结构。
- 判断代码该放 `src/lib.rs` 还是 `src/main.rs`、拆不拆 workspace。
- 控制模块可见性（`pub` / `pub(crate)` / 默认私有）。
- 组织单元测试、集成测试、文档测试。

## 怎么做（核心步骤）

### 1. 工具链与日常命令
```bash
rustup update stable     # 工具链升级（rustup 管版本，rustc 编译，cargo 包管理+构建）
cargo new myapp          # 新建项目（自动用最新稳定 edition）
cargo check              # 只查编译不产二进制 —— 写码时高频用，比 build 快
cargo build --release    # 优化构建
cargo run                # 编译并运行
cargo test               # 跑全部测试
cargo add serde --features derive   # 加依赖（改 Cargo.toml）
```
- `Cargo.lock` 记录精确版本：**二进制项目必须提交**，保证构建可复现。

### 2. Cargo.toml 与 edition
```toml
[package]
name = "myapp"
version = "0.1.0"
edition = "2024"   # Rust 1.85+ 默认；不同 edition 的 crate 可无缝互操作

[dependencies]
serde = { version = "1", features = ["derive"] }
```

### 3. 模块系统（模块即文件）
```rust
// src/config.rs 就是一个模块；用 mod 声明才会参与编译
mod config;                 // 声明后才能用
use crate::config::Setting; // use 引入路径

pub fn public_api() {}      // pub 对外可见
pub(crate) fn internal() {} // 仅 crate 内可见
fn helper() {}              // 默认私有（父模块与子模块可访问）
```
- 目录模块入口：`src/models/mod.rs`（或 Rust 2018+ 风格 `src/models.rs` + 同名目录）。

### 4. 项目结构（标准模板）
```
myapp/
├── Cargo.toml
├── src/
│   ├── main.rs        # 二进制入口（可执行）
│   ├── lib.rs         # 库入口：核心逻辑放这里，main 只做装配
│   ├── config.rs
│   └── models/
├── tests/             # 集成测试：每个文件是独立 crate，只能访问公开 API
│   └── api_test.rs
├── examples/          # 示例代码（参与编译检查，cargo run --example xxx）
└── benches/           # 基准测试
```

### 5. 测试组织
```rust
// 单元测试：与源码同文件，可测私有函数
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn it_works() {
        assert_eq!(2 + 2, 4);
    }

    #[test]
    #[should_panic(expected = "invalid")]
    fn rejects_bad_input() { panic!("invalid"); }

    #[test]
    #[ignore = "慢速集成用例"]   // cargo test -- --ignored 单独跑
    fn slow_case() { /* ... */ }
}
```
- 文档测试：`///` 注释里的 ```` ``` ```` 代码块会被 `cargo test` 自动执行，示例永不腐烂。

## 常见坑 ⚠️
| 错误做法 ❌ | 后果 | 正确做法 ✅ |
|------------|------|------------|
| 建了 `src/foo.rs` 但忘写 `mod foo;` | 文件根本不参与编译，改了没效果 | 新文件先在父模块 `mod` 声明 |
| 二进制项目不提交 `Cargo.lock` | 构建不可复现 | 应用必须提交（纯库可忽略） |
| 业务逻辑全塞 `main.rs` | 难测试、难复用 | 逻辑放 `lib.rs`，`main` 只做参数解析与装配 |
| 该私有的函数加 `pub` | 对外 API 面失控，重构受限 | 默认私有，确需导出再加 `pub`/`pub(crate)` |
| 单元测试写进 `tests/` | 变成独立 crate，测不了私有函数 | 私有函数测试写源码内 `#[cfg(test)]` |

## 决策点
| 场景 | 推荐 | 理由 |
|------|------|------|
| 纯 CLI/服务 | 单 crate，`main.rs` + `lib.rs` | 逻辑可测、入口薄 |
| 多模块大项目 | workspace + 多 crate | 增量编译快、边界强制清晰 |
| 跨 crate 通用功能 | 独立 lib crate + `pub` API | 明确对外契约 |
| 快速查错 | `cargo check` 而非 `cargo build` | 省去链接，反馈更快 |

## 参考：官方文档（核验用）🔗
| 关键点 | 官方文档 |
|--------|----------|
| 模块系统与可见性 | [The Book: Modules](https://doc.rust-lang.org/book/ch07-02-defining-modules-to-control-scope-and-privacy.html) |
| 测试组织 | [The Book: Testing](https://doc.rust-lang.org/book/ch11-00-testing.html) |
| Cargo 全命令与 manifest | [The Cargo Book](https://doc.rust-lang.org/cargo/) |
| Edition 语义与迁移 | [The Edition Guide](https://doc.rust-lang.org/edition-guide/) |

## 一句话结论
- `cargo check` 高频跑、`Cargo.lock`（二进制）必提交；逻辑放 `lib.rs` 入口只装配；新文件先 `mod` 声明；可见性默认私有、最小 `pub`；单元测试贴源码、集成测试进 `tests/`。
