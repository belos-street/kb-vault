// ✅ 答案：ch05/ex05-custom-error（做完再看！）
// 关键点：错误 enum 携带上下文；Display 手写；From 让 ? 自动包装
use std::collections::HashMap;
use std::fmt;
use std::num::ParseIntError;

#[derive(Debug)]
enum AppError {
    Parse(ParseIntError),
    NotFound(String),
}

impl fmt::Display for AppError {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        match self {
            AppError::Parse(e) => write!(f, "无法解析数字: {}", e),
            AppError::NotFound(key) => write!(f, "键不存在: {}", key),
        }
    }
}

impl std::error::Error for AppError {}

impl From<ParseIntError> for AppError {
    fn from(e: ParseIntError) -> Self {
        AppError::Parse(e) // 包装成自己的变体
    }
}

fn parse_field(s: &str) -> Result<i32, AppError> {
    let n: i32 = s.parse()?; // parse 的 Err 是 ParseIntError，
    Ok(n)                    // ? 自动调 From 把它转成 AppError::Parse
}

fn get_value(map: &HashMap<String, i32>, key: &str) -> Result<i32, AppError> {
    match map.get(key) {
        Some(v) => Ok(*v), // v 是 &i32，*v 解引用拷贝
        None => Err(AppError::NotFound(key.to_string())),
    }
}

fn main() -> Result<(), AppError> {
    let shown = format!("{}", AppError::NotFound(String::from("x")));
    assert_eq!(shown, "键不存在: x");

    match parse_field("42") {
        Ok(n) => assert_eq!(n, 42),
        Err(_) => panic!("42 应该解析成功"),
    }
    match parse_field("abc") {
        Err(e) => assert!(e.to_string().starts_with("无法解析数字"), "{}", e),
        Ok(_) => panic!("abc 应该解析失败"),
    }

    let mut map = HashMap::new();
    map.insert(String::from("a"), 1);
    assert_eq!(get_value(&map, "a").unwrap_or(0), 1);
    match get_value(&map, "missing") {
        Err(e) => assert_eq!(e.to_string(), "键不存在: missing"),
        Ok(_) => panic!("missing 应该查不到"),
    }

    let v = get_value(&map, "a")?;
    assert_eq!(v, 1);

    println!("✅ 任务 1：Display —— 错误可以被 {} 格式化打印", "{}");
    println!("✅ 任务 2：From + ? —— ParseIntError 自动包装成 AppError::Parse");
    println!("✅ 任务 3：NotFound 变体携带 key 名（错误有上下文才好排查）");
    println!("✅ 任务 4：main 返回 Result，? 一路传播到顶层");

    // 套路总结（doc 5.1）：enum 变体收编各来源错误 → 实现 Display（给人看）
    // → 实现 Error（标记）→ 实现 From（给 ? 用）。生产里 thiserror 宏自动生成这一切。
    // main -> Result 的 ? 传播到顶后：程序打印 Error: xxx，退出码非 0。
    Ok(())
}
