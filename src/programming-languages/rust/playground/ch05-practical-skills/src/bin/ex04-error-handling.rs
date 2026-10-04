// 📖 对应文档：doc/05-practical-skills.md §5.1 错误处理
// 🎯 任务：Result 的 match 写法 vs ? 写法、错误类型统一、unwrap_or 兜底
// ▶️ 运行：cargo run -p ch05-practical-skills --bin ex04-error-handling

// TODO：match 版本——不用 ?，手动 match parse 的 Result 并原样传播
// 提示：s.parse::<i32>() 返回 Result<i32, ParseIntError>
//       match 的两臂：Ok(n) => Ok(n)，Err(e) => Err(e)
fn parse_positive_match(s: &str) -> Result<i32, std::num::ParseIntError> {
    todo!()
}

// TODO：? 版本——两行搞定，对比上面的样板代码
// 提示：let n: i32 = s.parse()?; 然后 Ok(n)
fn parse_positive(s: &str) -> Result<i32, std::num::ParseIntError> {
    todo!()
}

// TODO：业务规则版——解析成功后校验，错误类型统一为 String
// 要求：负数 → Err(String::from("不能为负"))
//       解析失败 → Err(e.to_string())
//       正常 → Ok(n)
// 提示：match s.parse::<i32>()，需要三个分支（其中一个带 if n < 0 守卫）
fn checked_parse(s: &str) -> Result<i32, String> {
    todo!()
}

fn main() {
    assert_eq!(parse_positive("42"), Ok(42));
    assert!(parse_positive("abc").is_err());
    assert_eq!(
        parse_positive("42"),
        parse_positive_match("42"),
        "两种写法等价"
    );
    println!("✅ 任务 1：match vs ? —— 等价，但 ? 消灭了样板代码");

    assert_eq!(checked_parse("10"), Ok(10));
    assert_eq!(checked_parse("-5"), Err(String::from("不能为负")));
    assert!(checked_parse("xx").is_err());
    println!("✅ 任务 2：业务校验 + 错误类型统一（String 当简易错误）");

    // unwrap_or：失败给默认值（类似 JS 的 ?? 兜底）
    assert_eq!(parse_positive("bad").unwrap_or(0), 0);
    assert_eq!(parse_positive("7").unwrap_or(0), 7);
    println!("✅ 任务 3：unwrap_or 默认值兜底");

    // ─── 🧪 实验：unwrap 的代价 ──────────────────────────
    // 取消注释，运行时 panic：called `Result::unwrap()` on an `Err` value: ...
    //
    // let n = parse_positive("abc").unwrap();
    //
    // expect 同样 panic 但带说明（比 unwrap 好定位）：
    // let n = parse_positive("abc").expect("配置里的数字必须是合法整数");
    //
    // 原则（doc 面试题）：可能失败 → ?/match；逻辑上不可能失败 → expect

    println!("\n🎉 ex04 全部通过！下一步：ex05-custom-error");
}
