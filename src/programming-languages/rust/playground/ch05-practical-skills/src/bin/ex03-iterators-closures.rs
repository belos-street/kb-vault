// 📖 对应文档：doc/05-practical-skills.md §5.3 迭代器与闭包 + doc 练习 2
// 🎯 任务：filter/map/sum 惰性链、闭包捕获环境（三种方式）、move 所有权
// ▶️ 运行：cargo run -p ch05-practical-skills --bin ex03-iterators-closures

// doc 练习 2：偶数平方和（1..=10 应得 220：4+16+36+64+100）
// TODO：用 for 循环实现
// 提示：nums 是 &[i32]，for n in nums 里 n 是 &i32，用 *n 取值
fn sum_even_squares_for(nums: &[i32]) -> i32 {
    todo!()
}

// TODO：用迭代器链实现——.iter().filter(...).map(...).sum()
// 对比 TS: nums.filter(n => n % 2 === 0).map(n => n ** 2).reduce((a, b) => a + b, 0)
// 提示：filter 的闭包参数是 &&i32（写 *x % 2 == 0），map 的参数是 &i32（写 x * x）
fn sum_even_squares_iter(nums: &[i32]) -> i32 {
    todo!()
}

fn main() {
    let nums = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

    // ─── 任务 1：偶数平方和（doc 练习 2）────────────────────
    assert_eq!(sum_even_squares_for(&nums), 220);
    assert_eq!(sum_even_squares_iter(&nums), 220, "两种写法结果一致");
    println!("✅ 任务 1：偶数平方和 = 220（for 版 vs 迭代器版）");

    // ─── 任务 2：闭包捕获环境（不可变借用）─────────────────
    let base = 10;
    let add_base = |x: i32| x + base; // 捕获 base（最小权限：不可变借用）
    assert_eq!(add_base(5), 15);
    assert_eq!(base, 10, "base 只是被借用，还能继续用");
    println!("✅ 任务 2：闭包捕获环境（对比 JS 作用域链）");

    // ─── 任务 3：可变捕获 ────────────────────────────────
    let mut count = 0;
    let mut increment = || count += 1; // 捕获 count（可变借用）
    increment();
    increment();
    increment();
    assert_eq!(count, 3);
    println!("✅ 任务 3：闭包可变捕获（借用检查保证没有并发修改）");

    // ─── 任务 4：move 强制拿走所有权 ──────────────────────
    let s = String::from("own me");
    let consume = move || s.len(); // s 的所有权移入闭包
    assert_eq!(consume(), 6);
    assert_eq!(consume(), 6, "Fn 闭包可以反复调用");
    // 🧪 取消注释观察 E0382：s 已被 move 进闭包
    // println!("{}", s);
    println!("✅ 任务 4：move 闭包拥有 s（线程闭包必须 move，第 6 章）");

    // ─── 任务 5：惰性求值验证 ────────────────────────────
    // filter + take(2)：链式调用只遍历一次，取到 2 个就停
    let evens: Vec<&i32> = nums.iter().filter(|x| *x % 2 == 0).take(2).collect();
    assert_eq!(evens, vec![&2, &4]);
    println!("✅ 任务 5：惰性链——take(2) 只消费前 2 个（JS 的 filter 会先跑完全数组）");

    println!("\n🎉 ex03 全部通过！下一步：ex04-error-handling");
}
