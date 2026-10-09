// 📖 对应文档：doc/01-basic-syntax.md §1.6 控制流
// 🎯 任务：for + Range、loop 带值退出（break value）、if/else 分支（FizzBuzz，doc 练习 2）
// ▶️ 运行：cargo run -p ch01-syntax --bin ex04-control-flow

fn main() {
    // ─── 任务 1：for + Range 求和 ─────────────────────────
    // TODO：用 for 循环和 Range（0..=100 或 1..=100）计算 1 到 100 的和
    // 提示：`0..10` 不含 10，`0..=10` 含两端（类似 Python 的 range）
    let sum: i32 = todo!();

    assert_eq!(sum, 5050, "1 到 100 的和是 5050");
    println!("✅ 任务 1：for + Range（类似 JS 的 for-of / Python 的 for-in）");

    // ─── 任务 2：loop + break 带出值 ──────────────────────
    // while 和 for 是语句，但 loop 是表达式——break 可以返回值！
    // TODO：让 n 不断翻倍，直到第一次超过 1000，用 break n 把结果带出来
    let mut n: u64 = 1;
    let result: u64 = loop {
        todo!() // 提示：n *= 2; 超过 1000 时 break n;
    };

    assert_eq!(result, 1024, "2 的 10 次方是第一个超过 1000 的");
    println!("✅ 任务 2：loop 是表达式，break 可以带出值（while 做不到）");

    // ─── 任务 3：FizzBuzz（doc 练习 2）────────────────────
    // TODO：实现 fizzbuzz(i) -> String：
    //   3 的倍数 → "Fizz"，5 的倍数 → "Buzz"，
    //   同时是 3 和 5 的倍数 → "FizzBuzz"，其他 → 数字本身
    // 提示：函数体内的 if/else 是表达式，可以直接作为返回值；
    //       &str 分支用 .to_string()，数字用 i.to_string()
    fn fizzbuzz(i: i32) -> String {
        todo!()
    }

    let mut out: Vec<String> = Vec::new();
    for i in 1..=15 {
        out.push(fizzbuzz(i));
    }
    assert_eq!(out[2], "Fizz", "3 → Fizz");
    assert_eq!(out[4], "Buzz", "5 → Buzz");
    assert_eq!(out[14], "FizzBuzz", "15 → FizzBuzz");
    assert_eq!(out[0], "1", "1 → 1");
    assert_eq!(out[8], "Fizz", "9 → Fizz");
    // 可视化输出 1~15
    for o in &out {
        print!("{} ", o);
    }
    println!();
    println!("✅ 任务 3：FizzBuzz 完成（顺序很重要，先判 15 的倍数）");

    // ─── 🧪 实验：for 迭代数组的两种写法 ────────────────────
    // 两种写法等价（edition 2024 中 for-in 默认按值迭代；.iter() 按引用迭代）
    let arr = [1, 2, 3];
    for element in arr {
        print!("{} ", element);
    }
    for element in arr.iter() {
        print!("{} ", element);
    }
    println!();

    println!("\n🎉 ex04 全部通过！下一步：ex05-implicit-conversion");
}
