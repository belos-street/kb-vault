// ✅ 答案：ch04/ex04-from-into（做完再看！）
// 关键点：实现 From 即自动获得 Into；from() 类型明确无歧义
#[derive(Debug, PartialEq)]
struct Point {
    x: i32,
    y: i32,
}

impl From<(i32, i32)> for Point {
    fn from(value: (i32, i32)) -> Self {
        // Self = Point（impl 块里 Self 指正在实现的类型）
        Point {
            x: value.0,
            y: value.1,
        }
    }
}

struct MyNumber(i32);

impl From<i32> for MyNumber {
    fn from(value: i32) -> Self {
        MyNumber(value)
    }
}

fn main() {
    let p: Point = (3, 4).into(); // Into 自动可用
    assert_eq!(p, Point { x: 3, y: 4 });

    let p2 = Point::from((5, 6)); // 显式 From
    assert_eq!(p2, Point { x: 5, y: 6 });

    let n: MyNumber = 42.into();
    assert_eq!(n.0, 42);

    println!("✅ 任务 1：(3, 4).into() —— 实现一次 From，两种用法");
    println!("✅ 任务 2：Point::from(...) 显式写法");
    println!("✅ 任务 3：i32.into() —— Into 是 From 的镜像");

    // 🧪 实验答案：[3, 4].into() 报 E0277——Point 没有 From<[i32; 2]>。
    // Into 完全由 From 派生：实现了 From<A> for B，才有 A: Into<B>。
    // 面试考点：推荐实现 From 因为 from() 的目标类型明确（Self），
    // 而 into() 靠类型推断，目标不明时会失败。
    // 第 5 章预告：? 运算符的错误自动转换，底层就是这个 From。
}
