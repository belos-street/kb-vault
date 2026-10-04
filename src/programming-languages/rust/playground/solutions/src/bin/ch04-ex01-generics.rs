// ✅ 答案：ch04/ex01-generics（做完再看！）
// 关键点：PartialOrd bound 才能比较；&[T] 切片参数收数组/Vec；单态化
fn largest<T: PartialOrd>(list: &[T]) -> &T {
    let mut largest = &list[0];
    for item in list {
        if item > largest {
            largest = item;
        }
    }
    largest // &T 类型
}

fn max_of_two<T: PartialOrd>(a: T, b: T) -> T {
    if a > b {
        a
    } else {
        b
    }
}

#[derive(Debug, PartialEq)]
struct Point<T> {
    x: T,
    y: T,
}

fn main() {
    let nums = vec![3, 1, 4, 1, 5];
    assert_eq!(*largest(&nums), 5);

    let words = ["apple", "banana", "cherry"];
    assert_eq!(*largest(&words), "cherry");

    assert_eq!(max_of_two(3, 5), 5);
    assert_eq!(max_of_two(2.5, 1.2), 2.5);
    assert_eq!(max_of_two("apple", "banana"), "banana");

    let int_point = Point { x: 1, y: 2 };
    let float_point = Point { x: 1.5, y: 2.5 };
    assert_eq!(int_point, Point { x: 1, y: 2 });
    assert_eq!(float_point.x, 1.5);

    println!("✅ 任务 1：largest<T: PartialOrd> —— i32 和 &str 都能用");
    println!("✅ 任务 2：max_of_two —— 编译器单态化出三份专用代码（零运行时开销）");
    println!("✅ 任务 3：Point<T> 用不同具体类型实例化");

    // 🧪 实验答案：删掉 : PartialOrd 后报 E0369——编译器不知道 T 能不能 >。
    // 迭代版更惯用的写法（第 5 章后回看）：
    //   list.iter().max_by(|a, b| a.partial_cmp(b).unwrap())
    // 面试考点：单态化 = 每个具体类型一份机器码，和手写一样快；代价是二进制变大。
}
