---
name: collections-iterators
title: 集合与迭代器
description: 用 Vec/HashMap + 惰性迭代器链处理集合数据：entry API、适配器/消费者、闭包捕获、move 语义、文件 IO。当用户要批量处理数据或写集合逻辑时使用。
tags: [rust, vec, hashmap, iterator, closure]
---

# 集合与迭代器

一句话定位：日常数据处理的两板斧 —— 集合选对容器与访问方式，迭代器链一次遍历完成 filter/map/reduce，全部零成本。

## 什么时候用
- 存储与操作一组数据（增删改查、按 key 取值）。
- 批量变换数据（过滤、映射、聚合）。
- 需要闭包捕获环境变量（回调、惰性计算）。
- 读写文件内容。

## 怎么做（核心步骤）

### 1. Vec —— 默认集合
```rust
let mut v = vec![1, 2, 3];
v.push(4);

let third: &i32 = &v[2];             // 越界 panic
let safe: Option<&i32> = v.get(2);   // 安全访问，返回 Option

for i in &mut v { *i *= 2; }         // 可变遍历
```

### 2. HashMap —— entry API 增删改查
```rust
use std::collections::HashMap;
let mut scores: HashMap<String, i32> = HashMap::new();
scores.insert(String::from("Blue"), 10);

let s = scores.get("Blue");          // Option<&i32>

scores.entry("Blue".to_string()).or_insert(0);              // 不存在才插入
scores.entry("Red".to_string())
      .and_modify(|e| *e += 10)
      .or_insert(0);                                             // 存在改、不存在插
```

### 3. 迭代器链 —— 惰性 + 一次遍历
```rust
let numbers = vec![1, 2, 3, 4, 5, 6];
let result: Vec<i32> = numbers
    .iter()
    .filter(|x| *x % 2 == 0)   // 适配器：只建链不执行
    .map(|x| x * 2)
    .take(2)
    .collect();                // 消费者：此刻才真正遍历

let sum: i32 = numbers.iter().sum();
let has_big = numbers.iter().any(|x| *x > 5);
```

### 4. 三种迭代方式
```rust
for v in &vec { }        // &Vec<T> → &T 只读借用
for v in &mut vec { }    // &mut Vec<T> → &mut T 可修改
for v in vec { }         // Vec<T> → T 消耗所有权（如 into_iter）
```

### 5. 闭包捕获环境（三种方式）
```rust
let x = 5;
let a = |y| y + x;              // 不可变借用

let mut count = 0;
let mut inc = || count += 1;    // 可变借用（闭包本身要 mut）
inc(); inc();

let s = String::from("hello");
let own = move || println!("{}", s);  // 强制拿所有权（如传给线程）
```

### 6. 文件 IO 一分钟
```rust
let content = std::fs::read_to_string("a.txt")?;   // 读全文
std::fs::write("b.txt", "hello")?;                 // 写（覆盖）

// 追加
use std::io::Write;
let mut f = std::fs::OpenOptions::new().append(true).open("log.txt")?;
f.write_all(b"line\n")?;
```

## 常见坑 ⚠️
| 错误做法 ❌ | 后果 | 正确做法 ✅ |
|------------|------|------------|
| `v[i]` 拿值不管边界 | 越界 panic | 不确定时用 `v.get(i)` + Option 处理 |
| 遍历 Vec 同时 push/删除 | 借用冲突编译错误 | 先 `collect` 再改，或用 `retain` 原地过滤 |
| `collect()` 不标类型 | 编译错误：目标类型不明 | `let v: Vec<i32> = ...collect();` 或 `collect::<Vec<i32>>()` |
| 以为 `.map()` 立即执行 | 迭代器没跑，数据没变 | 迭代器惰性，必须消费者（collect/sum/for）触发 |
| HashMap 依赖遍历顺序 | 顺序随机不稳定 | 需要有序用 `BTreeMap`，或先排序 key |
| 闭包借用变量又把它 move 出去 | 借用冲突 | 确需转移用 `move` 闭包；否则缩小借用范围 |

## 决策点
| 场景 | 推荐 | 理由 |
|------|------|------|
| 变换/聚合管道 | 迭代器链 | 一次遍历 + 零成本抽象 |
| 逻辑复杂难读 | for 循环 | 可读性优先 |
| 可能越界访问 | `get()` | Option 强制处理 |
| 按 key 计数/去重 | HashMap entry API | 原子式"查+改"，免双重查找 |
| 删除满足条件的元素 | `vec.retain(\|x\| cond)` | 原地、无借用冲突 |
| 键需要有序遍历 | `BTreeMap` | 按 key 排序 |

## 参考：官方文档（核验用）🔗
| 关键点 | 官方文档 |
|--------|----------|
| 常用集合 API | [The Book: Common Collections](https://doc.rust-lang.org/book/ch08-00-common-collections.html) |
| 迭代器与闭包 | [The Book: Functional Language Features](https://doc.rust-lang.org/book/ch13-00-functional-features.html) |
| Iterator trait 全清单 | [std::iter 文档](https://doc.rust-lang.org/std/iter/) |
| HashMap entry API | [std::collections::HashMap 文档](https://doc.rust-lang.org/std/collections/struct.HashMap.html) |

## 一句话结论
- Vec/HashMap 是默认容器，`get` 防越界、entry 做原子更新；迭代器链惰性零成本、collect 记得标类型；闭包按最小权限捕获，传线程才 `move`。
