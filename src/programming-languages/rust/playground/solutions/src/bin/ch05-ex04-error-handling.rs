// ✅ 答案：ch05/ex04-error-handling（做完再看！）
// 关键点：match 传播 vs ? 传播；错误类型统一；unwrap_or 兜底
fn parse_positive_match(s: &str) -> Result<i32, std::num::ParseIntError> {
    match s.parse::<i32>() {
        Ok(n) => Ok(n),
        Err(e) => Err(e), // 原样传播——? 就是这段样板代码的语法糖
    }
}

fn parse_positive(s: &str) -> Result<i32, std::num::ParseIntError> {
    let n: i32 = s.parse()?; // Err 立即 return，Ok 解包继续
    Ok(n)
}

fn checked_parse(s: &str) -> Result<i32, String> {
    match s.parse::<i32>() {
        Ok(n) if n < 0 => Err(String::from("不能为负")), // 业务校验
        Ok(n) => Ok(n),
        Err(e) => Err(e.to_string()), // 统一错误类型为 String
    }
}

fn main() {
    assert_eq!(parse_positive("42"), Ok(42));
    assert!(parse_positive("abc").is_err());
    assert_eq!(parse_positive("42"), parse_positive_match("42"));

    assert_eq!(checked_parse("10"), Ok(10));
    assert_eq!(checked_parse("-5"), Err(String::from("不能为负")));
    assert!(checked_parse("xx").is_err());

    assert_eq!(parse_positive("bad").unwrap_or(0), 0);
    assert_eq!(parse_positive("7").unwrap_or(0), 7);

    println!("✅ 任务 1：match vs ? —— 等价，但 ? 消灭了样板代码");
    println!("✅ 任务 2：业务校验 + 错误类型统一（String 当简易错误）");
    println!("✅ 任务 3：unwrap_or 默认值兜底");

    // 🧪 实验答案：unwrap panic 并打印 Err 内部值；expect 带自定义信息更好定位。
    // 层级：? 传播（生产首选）> unwrap_or/unwrap_or_else 兜底 > expect（确认不会挂）> unwrap（原型）。
    // String 当错误类型适合小工具；正式项目看 ex05 的自定义错误 enum。
}
