// ✅ 答案：ch03/ex03-enum-with-data（做完再看！）
// 关键点：变体携带数据；match 穷举所有变体；match &T 时绑定是引用
enum Temperature {
    Celsius(f64),
    Fahrenheit(f64),
}

impl Temperature {
    fn to_celsius(self) -> f64 {
        match self {
            Temperature::Celsius(c) => c,
            Temperature::Fahrenheit(f) => (f - 32.0) * 5.0 / 9.0,
        }
    }
}

enum Message {
    Quit,
    Move { x: i32, y: i32 },
    Write(String),
    ChangeColor(i32, i32, i32),
}

fn process(msg: &Message) -> String {
    match msg {
        // msg 是 &Message，绑定自动是引用（match ergonomics）：
        // x/y 是 &i32、s 是 &String——format! 直接用即可
        Message::Quit => String::from("quit"),
        Message::Move { x, y } => format!("move to ({}, {})", x, y),
        Message::Write(s) => format!("write: {}", s),
        Message::ChangeColor(r, g, b) => format!("color ({}, {}, {})", r, g, b),
    }
}

fn main() {
    assert_eq!(Temperature::Fahrenheit(86.0).to_celsius(), 30.0);
    assert_eq!(Temperature::Celsius(100.0).to_celsius(), 100.0);

    assert_eq!(process(&Message::Quit), "quit");
    assert_eq!(process(&Message::Move { x: 3, y: 7 }), "move to (3, 7)");
    assert_eq!(process(&Message::Write(String::from("hi"))), "write: hi");
    assert_eq!(process(&Message::ChangeColor(255, 0, 0)), "color (255, 0, 0)");

    println!("✅ 任务 1：enum 变体携带数据 + impl 方法（doc 练习 1）");
    println!("✅ 任务 2：一个 match 处理四种变体（编译器保证穷举）");

    // 对比 TS：这里不需要手写 kind 鉴别字段，变体本身就是"标签+数据"。
    // 新增一个变体？所有 match 它的地方都会编译错误——重构安全感拉满。
}
