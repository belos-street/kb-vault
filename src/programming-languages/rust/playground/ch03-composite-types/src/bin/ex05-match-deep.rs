// 📖 对应文档：doc/03-composite-types.md §3.5 模式匹配 + doc 练习 3
// 🎯 任务：match 守卫、解构结构体、@ 绑定——模式匹配的三板斧
// ▶️ 运行：cargo run -p ch03-composite-types --bin ex05-match-deep

struct Person {
    name: String,
    age: u8,
}

// doc 练习 3：match + 守卫做年龄分类
// TODO：< 18 → "未成年人"；>= 65 → "老年人"；其他 → "成年人"
// 提示：用 .. 忽略 name 字段；守卫写在模式后面：
//       Person { age, .. } if age < 18 => ...
// 注意：返回值是 &'static str（三个分支都是字面量，'static = 活得和程序一样久）
fn classify(p: Person) -> &'static str {
    todo!()
}

struct Point {
    x: i32,
    y: i32,
}

// TODO：实现 describe_point —— match 中解构结构体：
//   x 为 0 → format!("y 轴上，y = {}", y)    // 模式：Point { x: 0, y }
//   y 为 0 → format!("x 轴上，x = {}", x)    // 模式：Point { x, y: 0 }
//   其他   → format!("({},{})", x, y)        // 模式：Point { x, y }
// 注意分支顺序——模式从上到下匹配，(0,0) 会命中第一个！
fn describe_point(p: Point) -> String {
    todo!()
}

fn main() {
    // ─── 任务 1：match 守卫（doc 练习 3）────────────────────
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
    println!("✅ 任务 1：match 守卫 if age < 18（doc 练习 3）");

    // ─── 任务 2：match 中解构 + 字面值模式 ───────────────────
    assert_eq!(describe_point(Point { x: 0, y: 7 }), "y 轴上，y = 7");
    assert_eq!(describe_point(Point { x: 5, y: 0 }), "x 轴上，x = 5");
    assert_eq!(describe_point(Point { x: 2, y: 3 }), "(2,3)");
    println!("✅ 任务 2：解构结构体 + 字面值模式（Point {{ x: 0, y }}）");

    // ─── 任务 3：@ 绑定——匹配范围的同时拿到值 ───────────────
    // 下面是 doc §3.5 的例子改写，直接运行体会
    let id = 5;
    let desc = match id {
        n @ 3..=7 => format!("{} 在 3-7 范围内", n),
        10..=12 => String::from("在 10-12（不绑定值）"),
        n => format!("其他：{}", n),
    };
    assert!(desc.contains("在 3-7"), "{}", desc);
    println!("✅ 任务 3：n @ 3..=7 —— 匹配范围并绑定（只读示例）");

    // ─── 🧪 实验：穷举检查 ───────────────────────────────
    // 把 describe_point 的最后一个分支 Point { x, y } 注释掉，观察 E0004：
    // non-exhaustive patterns——编译器直接列出漏掉的情况
    // 对比 TS/Java 的 switch：漏分支只能等运行时/测试发现

    println!("\n🎉 ex05 全部通过！第 3 章练习完成 🎊");
    println!("▶️ 下一章：cargo run -p ch04-traits-generics --bin ex01-generics");
}
