---
name: concurrency-async
title: 并发与异步
description: 用线程/通道/Mutex/Arc 与 tokio async/await 写并发程序：Send/Sync、数据竞争防护、Future 惰性。当用户要写 Rust 多线程或异步代码时使用。
tags: [rust, concurrency, async, tokio, thread]
---

# 并发与异步

一句话定位："无畏并发" —— 所有权 + Send/Sync 让数据竞争编译期现形，线程做并行、async 做 IO 密集并发。

## 什么时候用
- 并行处理一批任务（CPU 密集）。
- 多线程共享计数/状态。
- 高并发 IO（网络请求、服务端 handler）。
- 在"线程还是异步"之间做选型。

## 怎么做（核心步骤）

### 1. 线程 + move + join
```rust
use std::thread;

let data = vec![1, 2, 3];
let handle = thread::spawn(move || {        // move：所有权交给线程
    println!("{:?}", data)
});
handle.join().unwrap();                     // 等待线程结束
```
- 闭包引用了栈上数据就必须 `move`，否则编译错误——这就是"无畏并发"：不安全的写法根本编不过。

### 2. mpsc 通道 —— 通过通信共享内存
```rust
use std::sync::mpsc;

let (tx, rx) = mpsc::channel();
thread::spawn(move || tx.send(String::from("hello")).unwrap());
let received = rx.recv().unwrap();          // 阻塞接收
```

### 3. Arc\<Mutex\<T\>\> —— 共享可变状态的标准模式
```rust
use std::sync::{Arc, Mutex};

let counter = Arc::new(Mutex::new(0));
let mut handles = vec![];
for _ in 0..10 {
    let c = Arc::clone(&counter);           // 每线程 clone 一个 Arc
    handles.push(thread::spawn(move || {
        let mut num = c.lock().unwrap();    // 拿锁，返回 MutexGuard
        *num += 1;
    }));                                    // guard 离开作用域自动解锁
}
for h in handles { h.join().unwrap(); }
```

### 4. Send / Sync —— 编译期的并发安全标签
- `Send`：所有权可转移到别的线程；`Sync`：`&T` 可跨线程共享。
- 由字段组成自动推导：全 Send/Sync 字段的结构体自动 Send/Sync。
- 反例：`Rc<T>`、`RefCell<T>` 不是 —— 跨线程换成 `Arc`/`Mutex`，编译器会逼你换。

### 5. async/await（tokio 运行时）
```rust
// Cargo.toml: tokio = { version = "1", features = ["full"] }
#[tokio::main]
async fn main() {
    let (a, b) = tokio::join!(task_a(), task_b());  // 并发等待（≈ Promise.all）
    println!("{} {}", a, b);
}

async fn task_a() -> String {
    tokio::time::sleep(std::time::Duration::from_secs(1)).await;
    "a done".into()
}
```
- **Future 是惰性的**：async fn 调用只构建 Future，不 `.await`/不 spawn 就不执行。
- Rust 无内置运行时，async 需 tokio 等第三方 executor。

## 常见坑 ⚠️
| 错误做法 ❌ | 后果 | 正确做法 ✅ |
|------------|------|------------|
| 线程闭包引用栈变量不 `move` | 编译错误（生命周期） | 显式 `move` 转移所有权，或改用 `Arc` |
| `Rc`/`RefCell` 传给线程 | 编译错误（非 Send） | 跨线程用 `Arc`/`Mutex` |
| `lock()` 的 guard 持有跨 `.await` | 死锁/编译错误（guard 非 Send） | 先取值再 `drop` 锁；确需跨 `.await` 持锁改用 `tokio::sync::Mutex` |
| 忘 `join()` 线程 | 主线程退出，子线程没跑完 | 收集 handle 逐个 join |
| async fn 只调用不 await | Future 惰性，任务根本没执行 | `.await`、`tokio::join!` 或 `tokio::spawn` |
| CPU 密集任务堆进 async | 阻塞 executor 线程池 | 用 `tokio::task::spawn_blocking` 或线程池 |

## 决策点
| 场景 | 推荐 | 理由 |
|------|------|------|
| IO 密集、海量连接 | async（tokio） | 事件驱动，线程开销省 |
| CPU 密集并行 | 线程 + rayon | 真并行，async 无优势 |
| 简单后台任务 | `thread::spawn` | 免运行时依赖 |
| 共享可变状态 | `Arc<Mutex<T>>` | 简单直接 |
| 任务间传递数据 | mpsc/channel | 通信优于共享 |
| 读多写少 | `RwLock` | 多读者并存 |

## 与其他方案取舍
| 维度 | Rust 线程+所有权 | Go goroutine | JS async |
|------|-----------------|--------------|----------|
| 数据竞争 | 编译期杜绝（借用检查） | 运行时靠纪律 | 单线程无竞争、多线程靠锁 |
| 调度成本 | OS 线程（重） | goroutine（轻） | 事件循环 |
| 异步运行时 | 第三方（tokio） | 内置 | 内置 |
| Future 语义 | 惰性（不 await 不跑） | goroutine 创建即跑 | Promise 创建即执行 |

## 参考：官方文档（核验用）🔗
| 关键点 | 官方文档 |
|--------|----------|
| 线程与通道 | [The Book: Fearless Concurrency](https://doc.rust-lang.org/book/ch16-00-concurrency.html) |
| Send/Sync 语义 | [std::marker 文档](https://doc.rust-lang.org/std/marker/index.html) |
| Tokio 教程与 API | [tokio 官方文档](https://docs.rs/tokio/latest/tokio/) |
| 异步编程原理 | [Async Book](https://rust-lang.github.io/async-book/) |

## 一句话结论
- 线程闭包必 `move`，跨线程共享必 `Arc`、要写加 `Mutex`、guard 别跨 await；async 是 IO 密集专用且 Future 惰性、不 await 不执行；数据竞争在 Rust 里是编译错误不是线上事故。
