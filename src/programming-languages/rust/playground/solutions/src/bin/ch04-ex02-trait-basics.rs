// ✅ 答案：ch04/ex02-trait-basics（做完再看！）
// 关键点：trait 只写签名；impl Trait for Type；默认实现可覆盖
use std::f64::consts::PI;

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

impl Area for Circle {
    fn area(&self) -> f64 {
        PI * self.radius * self.radius
    }
}

impl Area for Rect {
    fn area(&self) -> f64 {
        self.width * self.height
    }
}

trait Greet {
    fn greet(&self) -> String {
        String::from("hello, stranger") // 默认实现
    }
}

struct Cat;
struct Dog;

impl Greet for Cat {} // 白嫖默认

impl Greet for Dog {
    fn greet(&self) -> String {
        String::from("woof") // 覆盖默认
    }
}

fn main() {
    let c = Circle { radius: 2.0 };
    let r = Rect {
        width: 3.0,
        height: 4.0,
    };

    assert!((c.area() - 12.566370614359172).abs() < 1e-9);
    assert_eq!(r.area(), 12.0);

    assert_eq!(Cat.greet(), "hello, stranger");
    assert_eq!(Dog.greet(), "woof");

    println!("✅ 任务 1：一个 trait，两种几何体各自实现");
    println!("✅ 任务 2：默认实现 vs 覆盖（Cat 用默认，Dog 自己写）");

    // 🧪 实验答案：impl Display for i32 报 E0117——trait 和类型都是外部的，
    // 违反孤儿规则。存在意义：防止 crate A、B 都为 i32 实现 Display 时产生歧义，
    // 保证全局每个 (类型, trait) 组合只有一份实现。
    // 合法替代：newtype 包装 struct MyI32(i32) 后为 MyI32 实现。
}
