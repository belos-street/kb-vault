// 📖 对应文档：doc/04-traits-generics.md §4.2 Trait + doc 练习 1
// 🎯 任务：定义 trait（只写签名）、为多个类型实现、默认实现与覆盖
// ▶️ 运行：cargo run -p ch04-traits-generics --bin ex02-trait-basics

use std::f64::consts::PI;

// trait 定义已给好——注意 trait 里只写函数签名，分号结尾（对比 Java interface）
trait Area {
    fn area(&self) -> f64;
}

struct Circle {
    radius: f64,
}

struct Rect {
    width: f64,
    height: f64,
}

// doc 练习 1：TODO：为 Circle 实现 Area —— 返回 PI * r * r
impl Area for Circle {
    fn area(&self) -> f64 {
        todo!()
    }
}

// TODO：为 Rect 实现 Area —— 返回 width * height
impl Area for Rect {
    fn area(&self) -> f64 {
        todo!()
    }
}

// 默认实现 —— 类似 Java 8 的 default 方法：trait 里直接给出方法体
trait Greet {
    fn greet(&self) -> String {
        String::from("hello, stranger")
    }
}

struct Cat;
struct Dog;

// Cat 白嫖默认实现——impl 体留空即可
impl Greet for Cat {}

// TODO：为 Dog 覆盖默认实现 —— 返回 "woof"
impl Greet for Dog {
    fn greet(&self) -> String {
        todo!()
    }
}

fn main() {
    let c = Circle { radius: 2.0 };
    let r = Rect {
        width: 3.0,
        height: 4.0,
    };

    assert!(
        (c.area() - 12.566370614359172).abs() < 1e-9,
        "doc 练习 1：Circle.area ≈ 12.566"
    );
    assert_eq!(r.area(), 12.0);
    println!("✅ 任务 1：一个 trait，两种几何体各自实现");

    assert_eq!(Cat.greet(), "hello, stranger");
    assert_eq!(Dog.greet(), "woof");
    println!("✅ 任务 2：默认实现 vs 覆盖（Cat 用默认，Dog 自己写）");

    // ─── 🧪 实验：孤儿规则 ──────────────────────────────
    // 试试取消注释这一行，观察 E0117：
    //
    // impl std::fmt::Display for i32 {}
    //
    // trait 和类型都来自标准库 → 违反孤儿规则，编译器拒绝
    // 规则：trait 或类型至少有一个是当前 crate 定义的
    // （反过来 OK：为自定义 Circle 实现标准库的 trait 就完全合法，上面刚做过）

    println!("\n🎉 ex02 全部通过！下一步：ex03-trait-bounds");
}
