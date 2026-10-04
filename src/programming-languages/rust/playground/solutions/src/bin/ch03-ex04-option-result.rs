// ✅ 答案：ch03/ex04-option-result（做完再看！）
// 关键点：Option 替代 null；match 穷举；if let 只关心一种模式；Result 替代异常
fn safe_divide(a: f64, b: f64) -> Option<f64> {
    if b == 0.0 {
        None
    } else {
        Some(a / b)
    }
}

fn describe_option(n: Option<i32>) -> String {
    match n {
        Some(0) => "zero".to_string(),  // 字面量也能当模式！
        Some(_) => "non-zero".to_string(),
        None => "nothing".to_string(),
    }
}

fn describe_option_iflet(n: Option<i32>) -> String {
    // if let 链：每个 else if let 都是一次模式匹配
    if let Some(0) = n {
        "zero".to_string()
    } else if let Some(_) = n {
        "non-zero".to_string()
    } else {
        "nothing".to_string()
    }
}

fn age_from_str(s: &str) -> Result<u8, std::num::ParseIntError> {
    s.parse::<u8>() // turbofish 指定目标类型，Result 原样返回
}

fn main() {
    assert_eq!(safe_divide(10.0, 2.0), Some(5.0));
    assert_eq!(safe_divide(1.0, 0.0), None);

    assert_eq!(describe_option(Some(0)), "zero");
    assert_eq!(describe_option(Some(42)), "non-zero");
    assert_eq!(describe_option(None), "nothing");

    assert_eq!(describe_option_iflet(Some(0)), "zero");
    assert_eq!(describe_option_iflet(Some(7)), "non-zero");
    assert_eq!(describe_option_iflet(None), "nothing");

    assert_eq!(age_from_str("25"), Ok(25));
    assert!(age_from_str("abc").is_err());

    println!("✅ 任务 1：Option 替代 null / NaN 哨兵值");
    println!("✅ 任务 2：match 处理 Option（doc 练习 2）");
    println!("✅ 任务 3：if let 语法糖（只关心一种模式时）");
    println!("✅ 任务 4：Result 替代 try/catch（错误也是值）");

    // 🧪 实验答案：maybe * 2 报 E0369——Option<i32> 没实现 Mul。
    // 必须先解包：match maybe { Some(v) => v * 2, None => 0 } 或 maybe.unwrap_or(0) * 2。
    // 这就是 Option 的意义：null 是隐式的、Option 是类型系统强制的。
    // if let 代价（doc 面试题）：放弃穷举检查，enum 加新变体时 if let 不会提醒你。
}
