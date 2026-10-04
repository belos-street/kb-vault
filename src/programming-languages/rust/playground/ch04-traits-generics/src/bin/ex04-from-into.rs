// 📖 对应文档：doc/04-traits-generics.md §4.4 From/Into + doc 练习 3
// 🎯 任务：实现 From，白嫖 Into——"实现 From 就够，into() 自动可用"
// ▶️ 运行：cargo run -p ch04-traits-generics --bin ex04-from-into

#[derive(Debug, PartialEq)]
struct Point {
    x: i32,
    y: i32,
}

// doc 练习 3：TODO：实现 from —— 把元组解构成 x、y
// 提示：value.0 / value.1 或 let (x, y) = value;
impl From<(i32, i32)> for Point {
    fn from(value: (i32, i32)) -> Self {
        todo!()
    }
}

struct MyNumber(i32);

// doc 示例：TODO：实现 from —— 直接用 value 包装成 MyNumber
impl From<i32> for MyNumber {
    fn from(value: i32) -> Self {
        todo!()
    }
}

fn main() {
    // From 的反向 Into 自动成立：因为 Point: From<(i32, i32)>
    // 所以 (i32, i32): Into<Point>（编译器自动生成反向实现）
    let p: Point = (3, 4).into();
    assert_eq!(p, Point { x: 3, y: 4 });
    println!("✅ 任务 1：(3, 4).into() —— 实现一次 From，两种用法");

    let p2 = Point::from((5, 6));
    assert_eq!(p2, Point { x: 5, y: 6 });
    println!("✅ 任务 2：Point::from(...) 显式写法");

    let n: MyNumber = 42.into();
    assert_eq!(n.0, 42);
    println!("✅ 任务 3：i32.into() —— Into 是 From 的镜像");

    // ─── 🧪 实验：没实现 From 就没有 Into ─────────────────
    // 试试取消注释，观察 E0277：
    //
    // let q: Point = [3, 4].into();
    //
    // the trait bound `Point: From<[i32; 2]>` is not satisfied
    // Into 不是魔法——它完全依赖 From 的实现
    // 面试考点：为什么推荐实现 From 而非 Into？from() 类型明确无歧义

    println!("\n🎉 ex04 全部通过！下一步：ex05-derive-display");
}
