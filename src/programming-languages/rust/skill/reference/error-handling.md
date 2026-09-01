---
name: error-handling
title: Result 错误处理
description: 用 Option/Result + ? 做无异常的错误处理：unwrap/expect 纪律、自定义错误 enum、thiserror/anyhow 选型。当用户要写/改 Rust 错误处理代码时使用。
tags: [rust, error-handling, result, thiserror, anyhow]
---

# Result 错误处理

一句话定位：Rust 没有异常 —— 可能失败的函数返回 `Result<T, E>`，`?` 负责传播，类型系统保证调用者无处可逃。

## 什么时候用
- 写可能失败的函数（IO、解析、网络、外部输入）。
- 决定错误该传播（`?`）、兜底（`unwrap_or`）还是快速失败（`unwrap`）。
- 设计库的自定义错误类型，或应用的统一错误处理。
- 评审代码里 unwrap/panic 的合理性。

## 怎么做（核心步骤）

### 1. Result 与 ? —— 传播的首选
```rust
use std::fs::File;
use std::io::{self, Read};

fn read_username() -> Result<String, io::Error> {
    let mut s = String::new();
    File::open("hello.txt")?.read_to_string(&mut s)?;  // Err 立即 return
    Ok(s)
}
```
- `?` 语义：`Ok(v)` 解包继续；`Err(e)` 立即从函数返回。
- 遇到错误类型不一致时，`?` 自动调用 `From` 转换成函数签名的错误类型。

### 2. unwrap / expect 纪律
```rust
let n: i32 = "42".parse().expect("配置文件里写死的常量，不可能解析失败");
```
- `unwrap()`：panic on Err —— 只用于"逻辑上不可能失败"或原型期。
- `expect("原因")`：同 unwrap 但带上下文，永远比 unwrap 好。
- 生产路径：**能 `?` 就 `?`，能 match 就 match**。

### 3. 自定义错误类型（库/模块用 thiserror）
```rust
use thiserror::Error;

#[derive(Error, Debug)]
pub enum MyError {
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),          // #[from] 自动生成 From，? 可直接转换

    #[error("Parse error: {0}")]
    Parse(#[from] std::num::ParseIntError),

    #[error("Custom error: {message}")]
    Custom { message: String },
}
```
- 手写等价物 = `enum` + `impl Display` + `impl std::error::Error` + 逐个 `impl From<...>`；thiserror 全部宏生成。

### 4. 应用层用 anyhow
```rust
use anyhow::{Context, Result};

fn load_config(path: &str) -> Result<String> {
    let content = std::fs::read_to_string(path)
        .with_context(|| format!("读取配置失败: {}", path))?;  // 附加上下文
    Ok(content)
}
```
- `anyhow::Result<T>`：错误统一为 `anyhow::Error`，可装任何错误，`?` 免转换。
- `main` 返回 `Result<(), Box<dyn std::error::Error>>` 或 `anyhow::Result<()>`，即可全程用 `?`。

### 5. panic 纪律
- panic 只留给：编程 bug（断言失败、不可能到达的分支）、示例/测试。
- 可预期的失败（文件不存在、输入非法）一律 `Result`，绝不 panic。

## 常见坑 ⚠️
| 错误做法 ❌ | 后果 | 正确做法 ✅ |
|------------|------|------------|
| 业务代码里到处 `unwrap()` | 一处意外输入整个进程崩溃 | 生产路径 `?` / match / `unwrap_or` 兜底 |
| `?` 用在返回 `()` 的函数里 | 编译错误 | 函数签名改为返回 `Result<T, E>` |
| 错误类型不一致硬 `?` | 编译错误（From 缺失） | 自定义错误 + `#[from]`，或统一 `Box<dyn Error>` / anyhow |
| 错误信息直接透传给终端用户 | 泄露内部路径/实现细节 | 边界层记日志、对外返回统一的友好信息 |
| 库里用 anyhow | 调用者拿不到具体错误类型 | 库用 thiserror 定义明确类型；anyhow 留给应用 |

## 决策点
| 场景 | 推荐 | 理由 |
|------|------|------|
| 错误应让上层决策 | `?` 传播 | 职责清晰 |
| 有合理默认值 | `unwrap_or` / `unwrap_or_else` | 兜底不中断 |
| 逻辑上不可能失败 | `expect("原因")` | 带上下文的快速失败 |
| 库 crate | thiserror + 明确 enum | 调用者可 match 分类处理 |
| 应用/CLI 二进制 | anyhow + context | 免类型体操，日志友好 |
| 原型/一次性脚本 | unwrap | 快速迭代，后续收敛 |

## 参考：官方文档（核验用）🔗
| 关键点 | 官方文档 |
|--------|----------|
| Result 与 ? 运算符 | [The Book: Error Handling](https://doc.rust-lang.org/book/ch09-00-error-handling.html) |
| Error trait 契约 | [std::error::Error 文档](https://doc.rust-lang.org/std/error/trait.Error.html) |
| thiserror 用法 | [thiserror docs.rs](https://docs.rs/thiserror/) |
| anyhow 用法 | [anyhow docs.rs](https://docs.rs/anyhow/) |

## 一句话结论
- 错误就是返回值：`?` 传播、`unwrap_or` 兜底、`expect` 只给"不可能失败"；库用 thiserror 给类型、应用用 anyhow 给上下文；panic 是 bug 专属。
