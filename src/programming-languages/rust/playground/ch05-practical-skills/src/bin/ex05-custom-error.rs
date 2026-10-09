// 📖 对应文档：doc/05-practical-skills.md §5.1 自定义错误类型
// 🎯 任务：错误 enum + Display/Error + From——让 ? 自动转换错误类型
// ▶️ 运行：cargo run -p ch05-practical-skills --bin ex05-custom-error

use std::collections::HashMap;
use std::fmt;
use std::num::ParseIntError;

// 自定义错误：两个变体分别来自"解析失败"和"键不存在"
// 对比 doc 的 MyError：Io/Parse/Custom 三变体——这里简化为两变体
#[derive(Debug)]
enum AppError {
    Parse(ParseIntError),
    NotFound(String),
}

// TODO：实现 Display（错误信息给人看，{} 输出）
//   Parse(e)       → write!(f, "无法解析数字: {}", e)
//   NotFound(key)  → write!(f, "键不存在: {}", key)
// 提示：match self，两个分支分别 write!（返回 fmt::Result）
impl fmt::Display for AppError {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        todo!()
    }
}

// Error trait 是"我是错误"的标志——有 Display + Debug 就能空实现
impl std::error::Error for AppError {}

// TODO：实现 From<ParseIntError> —— 把解析错误包装成 AppError::Parse
// 这一步是 ? 自动转换的前提！
impl From<ParseIntError> for AppError {
    fn from(e: ParseIntError) -> Self {
        todo!()
    }
}

// TODO：用 ? 让 parse 的 ParseIntError 自动转成 AppError
// 签名里的返回类型不用改——? 会调用 From 完成包装
fn parse_field(s: &str) -> Result<i32, AppError> {
    let n: i32 = s.parse()?; // ← ? 在这里触发 From<ParseIntError> for AppError
    Ok(n)
}

// TODO：查 map，查不到返回 AppError::NotFound(key)
// 提示：match map.get(key) { Some(v) => Ok(*v), None => Err(AppError::NotFound(key.to_string())) }
fn get_value(map: &HashMap<String, i32>, key: &str) -> Result<i32, AppError> {
    todo!()
}

// main 也能返回 Result——错误直接交给操作系统（doc 5.5 同款）
fn main() -> Result<(), AppError> {
    // ─── 任务 1：Display 实现 ────────────────────────────
    let shown = format!("{}", AppError::NotFound(String::from("x")));
    assert_eq!(shown, "键不存在: x");
    println!("✅ 任务 1：Display —— 错误可以被 {} 格式化打印", "{}");

    // ─── 任务 2：From + ? 自动转换 ────────────────────────
    match parse_field("42") {
        Ok(n) => assert_eq!(n, 42),
        Err(_) => panic!("42 应该解析成功"),
    }
    match parse_field("abc") {
        Err(e) => assert!(
            e.to_string().starts_with("无法解析数字"),
            "应为 Parse 变体：{}",
            e
        ),
        Ok(_) => panic!("abc 应该解析失败"),
    }
    println!("✅ 任务 2：From + ? —— ParseIntError 自动包装成 AppError::Parse");

    // ─── 任务 3：变体携带上下文 ───────────────────────────
    let mut map = HashMap::new();
    map.insert(String::from("a"), 1);
    assert_eq!(get_value(&map, "a").unwrap_or(0), 1);
    match get_value(&map, "missing") {
        Err(e) => assert_eq!(e.to_string(), "键不存在: missing"),
        Ok(_) => panic!("missing 应该查不到"),
    }
    println!("✅ 任务 3：NotFound 变体携带 key 名（错误有上下文才好排查）");

    // ─── 任务 4：main() -> Result 的 ? 传播 ───────────────
    let v = get_value(&map, "a")?; // Err 会直接结束 main，打印错误并以非 0 退出
    assert_eq!(v, 1);
    println!("✅ 任务 4：main 返回 Result，? 一路传播到顶层");

    println!("\n🎉 ex05 全部通过！下一步：ex06-file-io");
    Ok(())
}
