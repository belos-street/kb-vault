// 📖 对应文档：doc/03-composite-types.md §3.4 Option/Result + doc 练习 2
// 🎯 任务：没有 null 的世界——Option 表示"可能没有"，Result 表示"可能失败"
// ▶️ 运行：cargo run -p ch03-composite-types --bin ex04-option-result

// TODO：实现 safe_divide —— b 为 0.0 时返回 None，否则 Some(a / b)
// 对比 JS：1/0 是 Infinity（静默出错）；Rust 用类型系统逼你显式处理除零
fn safe_divide(a: f64, b: f64) -> Option<f64> {
    todo!()
}

// doc 练习 2：用 match 描述 Option
// TODO：Some(0) → "zero"；Some(_) → "non-zero"；None → "nothing"
// 提示：三个分支都返回 &str 字面量，用 .to_string() 统一成 String
fn describe_option(n: Option<i32>) -> String {
    todo!()
}

// TODO：用 if let 重写同样的逻辑（只关心"有值"时的语法糖）
// 形如：if let Some(x) = n { ... } else { ... }
// 进阶：if let Some(0) = n 可以直接在模式里匹配字面量！
fn describe_option_iflet(n: Option<i32>) -> String {
    todo!()
}

// TODO：实现 age_from_str —— 把字符串解析成 u8，失败返回 Err
// 提示：s.parse::<u8>() 返回 Result<u8, ParseIntError>，原样返回即可
fn age_from_str(s: &str) -> Result<u8, std::num::ParseIntError> {
    todo!()
}

fn main() {
    assert_eq!(safe_divide(10.0, 2.0), Some(5.0));
    assert_eq!(safe_divide(1.0, 0.0), None, "除零 → None，编译器逼你处理");
    println!("✅ 任务 1：Option 替代 null / NaN 哨兵值");

    assert_eq!(describe_option(Some(0)), "zero");
    assert_eq!(describe_option(Some(42)), "non-zero");
    assert_eq!(describe_option(None), "nothing");
    println!("✅ 任务 2：match 处理 Option（doc 练习 2）");

    assert_eq!(describe_option_iflet(Some(0)), "zero");
    assert_eq!(describe_option_iflet(Some(7)), "non-zero");
    assert_eq!(describe_option_iflet(None), "nothing");
    println!("✅ 任务 3：if let 语法糖（只关心一种模式时）");

    assert_eq!(age_from_str("25"), Ok(25));
    assert!(age_from_str("abc").is_err(), "解析失败 → Err");
    println!("✅ 任务 4：Result 替代 try/catch（错误也是值）");

    // ─── 🧪 实验：Option<T> 不能当 T 用 ─────────────────────
    // 取消注释，观察 E0369：binary operation `*` cannot be applied to `Option<i32>`
    //
    // let maybe: Option<i32> = Some(5);
    // let doubled = maybe * 2;
    //
    // 对比 JS：null * 2 = 0、undefined * 2 = NaN——静默出错；
    // Rust：必须先 match / if let 解包。这就是"编译器强制处理 None"。

    println!("\n🎉 ex04 全部通过！下一步：ex05-match-deep");
}
