// ✅ 答案：ch05/ex06-file-io（做完再看！）
// 关键点：fs::write/read_to_string；lines() 逐行；? 跨错误类型传播靠 Box<dyn Error>
use std::fs;
use std::path::Path;

fn sum_numbers(path: &Path) -> Result<i32, Box<dyn std::error::Error>> {
    let content = fs::read_to_string(path)?; // io::Error → 自动 Box
    let mut sum = 0;
    for line in content.lines() {
        let n: i32 = line.trim().parse()?; // ParseIntError → 自动 Box
        sum += n;
    }
    Ok(sum)
}

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let path = std::env::temp_dir().join("rust_playground_numbers.txt");
    fs::write(&path, "1\n2\n3\n")?;
    assert!(path.exists());

    let content = fs::read_to_string(&path)?;
    assert_eq!(content, "1\n2\n3\n");

    let sum = sum_numbers(&path)?;
    assert_eq!(sum, 6);

    let missing = std::env::temp_dir().join("definitely_not_exist_12345.txt");
    assert!(sum_numbers(&missing).is_err());

    let _ = fs::remove_file(&path);

    println!("✅ 任务 1：fs::write 写入临时文件");
    println!("✅ 任务 2：fs::read_to_string 读取（? 传播 io::Error）");
    println!("✅ 任务 3：sum_numbers —— ? 同时传播 io / parse 两种错误");
    println!("✅ 任务 4：错误是返回值，不是崩溃");

    // Box<dyn Error> 是"什么错误都装得下"的容器：io::Error 和 ParseIntError
    // 都实现了 Error trait，? 自动 Box 装箱。原型期够用；
    // 精细分类 → ex05 的自定义 enum（或 thiserror）；应用层偷懒 → anyhow。
    // 迭代器版 sum_numbers（对照着读）：
    //   fs::read_to_string(path)?
    //       .lines()
    //       .map(|l| l.trim().parse::<i32>())
    //       .sum::<Result<i32, _>>()?  // Result 的 sum：攒出一个 Result
    Ok(())
}
