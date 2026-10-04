// 📖 对应文档：doc/04-traits-generics.md §4.1 泛型 + doc 练习 2
// 🎯 任务：泛型函数、泛型结构体——一套代码服务多种类型（单态化零开销）
// ▶️ 运行：cargo run -p ch04-traits-generics --bin ex01-generics

// doc 原例：找最大值。&[T] 读作"T 类型的切片引用"——数组和 Vec 都能传进来
// TODO：实现 largest —— 遍历 list，返回最大元素的引用
// 提示：let mut largest = &list[0]; 然后 for item in list { if item > largest { largest = item; } }
//       最后返回 largest（&T 类型）
fn largest<T: PartialOrd>(list: &[T]) -> &T {
    todo!()
}

// doc 练习 2：返回较大的那个
// TODO：实现 max_of_two —— 注意 T 需要 PartialOrd 约束才能用 > 比较
fn max_of_two<T: PartialOrd>(a: T, b: T) -> T {
    todo!()
}

// 泛型结构体 —— 类似 TS: interface Point<T> { x: T; y: T }
#[derive(Debug, PartialEq)]
struct Point<T> {
    x: T,
    y: T,
}

fn main() {
    let nums = vec![3, 1, 4, 1, 5];
    assert_eq!(*largest(&nums), 5, "最大值是 5");
    let words = ["apple", "banana", "cherry"];
    assert_eq!(*largest(&words), "cherry", "字符串按字典序比较");
    println!("✅ 任务 1：largest<T: PartialOrd> —— i32 和 &str 都能用");

    assert_eq!(max_of_two(3, 5), 5);
    assert_eq!(max_of_two(2.5, 1.2), 2.5);
    assert_eq!(max_of_two("apple", "banana"), "banana");
    println!("✅ 任务 2：max_of_two —— 编译器单态化出三份专用代码（零运行时开销）");

    let int_point = Point { x: 1, y: 2 };
    let float_point = Point { x: 1.5, y: 2.5 };
    assert_eq!(int_point, Point { x: 1, y: 2 });
    assert_eq!(float_point.x, 1.5);
    println!("✅ 任务 3：Point<T> 用不同具体类型实例化");

    // ─── 🧪 实验：没有 trait bound 会怎样？ ────────────────
    // 把两个函数签名里的 : PartialOrd 删掉，观察 E0369：
    // cannot compare — 编译器不知道 T 支不支持 > 比较
    // trait bound 就是告诉编译器"这个 T 至少会什么"（对比 Java 的 <T extends Comparable>）

    println!("\n🎉 ex01 全部通过！下一步：ex02-trait-basics");
}
