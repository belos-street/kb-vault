---
name: smart-pointers
title: 智能指针与共享所有权
description: 选对智能指针管理堆数据与共享：Box 递归类型、Rc 多所有者只读、RefCell 内部可变性、Arc 跨线程、Drop 析构、Send/Sync。当用户要用 Rust 表达递归类型、共享数据或运行时可变性时使用。
tags: [rust, box, rc, arc, refcell]
---

# 智能指针与共享所有权

一句话定位：单一所有权表达不了的场景（递归类型、多所有者、运行时可变），用对应的智能指针组合解决 —— 每种都把检查代价放在最合适的地方。

## 什么时候用
- 定义递归数据类型（链表、树）。
- 多个地方共享同一份数据（DAG 节点、缓存）。
- 需要在 `&self` 方法里修改内部状态（内部可变性）。
- 跨线程共享数据。
- 资源需要确定性析构（Drop）。

## 怎么做（核心步骤）

### 1. Box\<T\> —— 堆分配，单一所有权
```rust
// 递归类型必须用 Box 打破无限大小
enum List {
    Cons(i32, Box<List>),
    Nil,
}
let list = List::Cons(1, Box::new(List::Cons(2, Box::new(List::Nil))));
```
- 场景：递归类型、大数据搬移避免栈拷贝、trait 对象 `Box<dyn Trait>`。

### 2. Rc\<T\> —— 单线程多所有者（只读）
```rust
use std::rc::Rc;
let a = Rc::new(String::from("hello"));
let b = Rc::clone(&a);              // 引用计数 +1，非深拷贝
println!("count: {}", Rc::strong_count(&a)); // 2
```
- 场景：单线程下多个所有者共享只读数据。计数归零才释放。

### 3. RefCell\<T\> —— 内部可变性（运行时检查）
```rust
use std::cell::RefCell;
let data = RefCell::new(5);
*data.borrow_mut() += 1;            // 可变借用，运行时记账
println!("{}", data.borrow());      // 6
```
- 借用规则从编译期推迟到运行时：**违反即 panic**（如 borrow_mut 期间再 borrow）。

### 4. 组合模式 Rc\<RefCell\<T\>\>
```rust
use std::rc::Rc;
use std::cell::RefCell;
let shared = Rc::new(RefCell::new(vec![1, 2]));
let other = Rc::clone(&shared);
other.borrow_mut().push(3);         // 多所有者 + 可修改（单线程）
```

### 5. Arc\<T\> + Mutex\<T\> —— 跨线程共享
```rust
use std::sync::{Arc, Mutex};
let counter = Arc::new(Mutex::new(0));
let c2 = Arc::clone(&counter);
std::thread::spawn(move || { *c2.lock().unwrap() += 1; });
```
- `Arc` = 原子引用计数；`Rc` 不是 `Send`/`Sync`，跨线程编译不过。

### 6. Drop —— 确定性析构
```rust
struct Conn { name: String }
impl Drop for Conn {
    fn drop(&mut self) {
        println!("closing {}", self.name);  // 离开作用域必定调用
    }
}
```
- 与 GC 语言的 finalize 不同：时机确定、无需 GC、不能手动调用（`std::mem::drop(x)` 让值提前离开作用域）。

## 常见坑 ⚠️
| 错误做法 ❌ | 后果 | 正确做法 ✅ |
|------------|------|------------|
| RefCell 同时持有 borrow 与 borrow_mut | 运行时 panic | 借用用完立刻释放（borrow 返回的 guard 缩小作用域） |
| 用 `Rc::clone(&a)` 的地方写成 `a.clone()` | 误读为深拷贝意图 | 显式 `Rc::clone` 表明只是计数 +1 |
| `Rc` / `Rc<RefCell<T>>` 传给线程 | 编译错误（非 Send） | 跨线程用 `Arc`（+ `Mutex` 需要写） |
| 两个 `Rc` 互相引用 | 引用计数永不归零，内存泄漏 | 用 `Weak::new` / `Rc::downgrade` 打破循环 |
| 手动 `impl Send`/`Sync` | 绕过线程安全保证，需自行证明 | 优先组合自动实现的类型，确需 unsafe 要写明论证 |

## 决策点
| 场景 | 推荐 | 检查时机 |
|------|------|----------|
| 堆分配 / 递归类型 | `Box<T>` | 编译期 |
| 单线程多所有者只读 | `Rc<T>` | 编译期 |
| 单线程多所有者可写 | `Rc<RefCell<T>>` | 运行时 |
| 跨线程共享只读 | `Arc<T>` | 编译期 |
| 跨线程共享可写 | `Arc<Mutex<T>>` | 编译期 + 锁 |
| 资源确定性释放 | 实现 `Drop` | 作用域结束必调 |

## 参考：官方文档（核验用）🔗
| 关键点 | 官方文档 |
|--------|----------|
| Box/Rc/RefCell 全景 | [The Book: Smart Pointers](https://doc.rust-lang.org/book/ch15-00-smart-pointers.html) |
| 引用计数语义 | [std::rc 文档](https://doc.rust-lang.org/std/rc/) |
| Arc 与原子性 | [std::sync::Arc 文档](https://doc.rust-lang.org/std/sync/struct.Arc.html) |
| Send/Sync 并发语义 | [The Rustonomicon: Send and Sync](https://doc.rust-lang.org/nomicon/send-and-sync.html) |

## 一句话结论
- 递归/堆用 `Box`；单线程共享用 `Rc`，要写就裹 `RefCell`（运行时检查）；跨线程一律 `Arc`，要写再加 `Mutex`；`Rc` 循环引用用 `Weak` 打破。
