// ✅ 答案：ch03/ex05-match-deep（做完再看！）
// 关键点：守卫 if 补充条件；.. 忽略字段；字面值模式；@ 绑定
struct Person {
    name: String,
    age: u8,
}

fn classify(p: Person) -> &'static str {
    match p {
        // .. 忽略 name（String 不会被 move 出来）
        // 守卫在模式后：只有 age < 18 才进这个分支
        Person { age, .. } if age < 18 => "未成年人",
        Person { age, .. } if age >= 65 => "老年人",
        _ => "成年人", // 兜底分支保证穷举
    }
}

struct Point {
    x: i32,
    y: i32,
}

fn describe_point(p: Point) -> String {
    match p {
        // 字面值模式 + 解构混合：x: 0 匹配"恰好为 0"，y 绑定任意值
        Point { x: 0, y } => format!("y 轴上，y = {}", y),
        Point { x, y: 0 } => format!("x 轴上，x = {}", x),
        Point { x, y } => format!("({},{})", x, y),
    }
}

fn main() {
    let tom = Person {
        name: String::from("Tom"),
        age: 10,
    };
    assert_eq!(classify(tom), "未成年人");

    let senior = Person {
        name: String::from("Li"),
        age: 70,
    };
    assert_eq!(classify(senior), "老年人");

    let adult = Person {
        name: String::from("Wang"),
        age: 30,
    };
    assert_eq!(classify(adult), "成年人");

    assert_eq!(describe_point(Point { x: 0, y: 7 }), "y 轴上，y = 7");
    assert_eq!(describe_point(Point { x: 5, y: 0 }), "x 轴上，x = 5");
    assert_eq!(describe_point(Point { x: 2, y: 3 }), "(2,3)");

    let id = 5;
    let desc = match id {
        n @ 3..=7 => format!("{} 在 3-7 范围内", n),
        10..=12 => String::from("在 10-12（不绑定值）"),
        n => format!("其他：{}", n),
    };
    assert!(desc.contains("在 3-7"));

    println!("✅ 任务 1：match 守卫 if age < 18（doc 练习 3）");
    println!("✅ 任务 2：解构结构体 + 字面值模式（Point {{ x: 0, y }}）");
    println!("✅ 任务 3：n @ 3..=7 —— 匹配范围并绑定（只读示例）");

    // 🧪 实验答案：删掉最后分支报 E0004 non-exhaustive patterns，
    // 编译器列出所有未覆盖的情况（如 Point { x: 2, y: 3 }）。
    // 面试高频：穷举检查 = "不可能遗漏的情况就不会出 bug"。
    // 注意 (0,0)：会命中第一个分支（x: 0），输出 "y 轴上，y = 0"——顺序即语义。
}
