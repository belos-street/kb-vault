// 📖 对应文档：doc/03-composite-types.md §3.3 枚举 + doc 练习 1
// 🎯 任务：带数据的枚举（对比 TS 鉴别联合）、为 enum 实现方法
// ▶️ 运行：cargo run -p ch03-composite-types --bin ex03-enum-with-data

// 温度枚举 —— 两个变体携带不同数据
// 对比 TS：type Temperature = { kind: 'c', value: number } | { kind: 'f', value: number }
// Rust 变体自带数据，不需要手工鉴别字段
enum Temperature {
    Celsius(f64),
    Fahrenheit(f64),
}

impl Temperature {
    // 按值拿走 self（纯转换计算，不需要借用）
    // doc 练习 1：Fahrenheit = Celsius * 9/5 + 32 → Celsius = (F - 32) * 5/9
    // TODO：实现 to_celsius —— match self 的两个变体
    fn to_celsius(self) -> f64 {
        todo!()
    }
}

// 消息枚举 —— 四个变体分别携带：无数据 / 匿名结构体 / 元组 / 多值元组
enum Message {
    Quit,
    Move { x: i32, y: i32 },
    Write(String),
    ChangeColor(i32, i32, i32),
}

// TODO：实现 process —— match 四个变体，返回描述字符串：
//   Quit                    → "quit"
//   Move { x, y }           → format!("move to ({}, {})", x, y)
//   Write(s)                → format!("write: {}", s)
//   ChangeColor(r, g, b)    → format!("color ({}, {}, {})", r, g, b)
// 提示：参数是 &Message，match 的绑定自动是引用（match ergonomics），直接用即可
fn process(msg: &Message) -> String {
    todo!()
}

fn main() {
    assert_eq!(
        Temperature::Fahrenheit(86.0).to_celsius(),
        30.0,
        "86°F 应该等于 30°C"
    );
    assert_eq!(Temperature::Celsius(100.0).to_celsius(), 100.0);
    println!("✅ 任务 1：enum 变体携带数据 + impl 方法（doc 练习 1）");

    assert_eq!(process(&Message::Quit), "quit");
    assert_eq!(process(&Message::Move { x: 3, y: 7 }), "move to (3, 7)");
    assert_eq!(process(&Message::Write(String::from("hi"))), "write: hi");
    assert_eq!(
        process(&Message::ChangeColor(255, 0, 0)),
        "color (255, 0, 0)"
    );
    println!("✅ 任务 2：一个 match 处理四种变体（编译器保证穷举）");

    println!("\n🎉 ex03 全部通过！下一步：ex04-option-result");
}
