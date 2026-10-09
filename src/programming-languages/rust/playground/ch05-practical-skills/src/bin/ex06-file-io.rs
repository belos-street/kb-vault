// 📖 对应文档：doc/05-practical-skills.md §5.4 文件 I/O + doc 练习 1
// 🎯 任务：写文件 → 读文件 → 逐行解析求和；Box<dyn Error> 统一两种错误类型
// ▶️ 运行：cargo run -p ch05-practical-skills --bin ex06-file-io

use std::fs;
use std::path::Path;

// doc 练习 1：TODO：读取文件，每行一个整数，求和
// 流程提示：
//   1. fs::read_to_string(path)?          —— 可能产生 io::Error
//   2. for line in content.lines()       —— 逐行迭代
//   3. line.trim().parse::<i32>()?       —— 可能产生 ParseIntError
// 两种错误类型不同——Box<dyn std::error::Error> 是"什么错误都装得下"的容器
// （doc 5.5 的 main 函数就是同款签名）
fn sum_numbers(path: &Path) -> Result<i32, Box<dyn std::error::Error>> {
    todo!()
}

// main 返回 Result——练习里直接用 ?（对照 doc 5.5）
fn main() -> Result<(), Box<dyn std::error::Error>> {
    // ─── 任务 1：写文件（先造测试数据）────────────────────
    // 放在系统临时目录，不污染仓库
    let path = std::env::temp_dir().join("rust_playground_numbers.txt");
    fs::write(&path, "1\n2\n3\n")?; // fs::write 一行搞定（已存在会覆盖）
    assert!(path.exists());
    println!("✅ 任务 1：fs::write 写入临时文件");

    // ─── 任务 2：读文件 ──────────────────────────────────
    let content = fs::read_to_string(&path)?;
    assert_eq!(content, "1\n2\n3\n");
    println!("✅ 任务 2：fs::read_to_string 读取（? 传播 io::Error）");

    // ─── 任务 3：逐行解析求和（doc 练习 1）─────────────────
    let sum = sum_numbers(&path)?;
    assert_eq!(sum, 6, "1 + 2 + 3 = 6");
    println!("✅ 任务 3：sum_numbers —— ? 同时传播 io / parse 两种错误");

    // ─── 任务 4：错误路径 → Err 而不是 panic ───────────────
    let missing = std::env::temp_dir().join("definitely_not_exist_12345.txt");
    assert!(sum_numbers(&missing).is_err(), "文件不存在 → Err");
    println!("✅ 任务 4：错误是返回值，不是崩溃");

    // 清理临时文件（忽略删除失败——临时目录会自动清理）
    let _ = fs::remove_file(&path);

    // ─── 🧪 实验：? 在 main 里的效果 ──────────────────────
    // 把任务 4 的 assert 改成 let _ = sum_numbers(&missing)?; 运行看看：
    // 程序打印 Error: No such file or directory (os error 2) 后非 0 退出
    // —— main -> Result 的意义：错误上交操作系统，而不是 panic 栈

    println!("\n🎉 ex06 全部通过！第 5 章练习完成 🎊");
    println!("综合实战：doc/05.5 CLI TODO 项目（clap + serde）");
    Ok(())
}
