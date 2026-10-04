// 📖 对应文档：doc/02-ownership-borrowing.md §2.5 悬垂引用（Dangling References）
// 🎯 任务：为什么 Rust 不允许返回"函数内部数据的引用"，而返回所有权可以
// ▶️ 运行：cargo run -p ch02-ownership --bin ex05-dangling

// 对照组：返回"调用者数据的引用"是安全的——所有权还在调用者手里
// 这里用了生命周期省略规则 1（单引用参数 → 返回引用与它同寿，详见 ex06）
fn echo(s: &String) -> &String {
    s
}

// TODO：实现"正确版"——返回 String 本身，把所有权转移给调用者
// 函数内的 s 离开作用域会被 drop，但所有权已经转移出去了，所以安全
fn no_dangle() -> String {
    let s = String::from("hello");
    todo!() // 提示：返回 s 本身，注意不要写 &s、不要写分号
}

fn main() {
    // ─── 任务 1：悬垂引用为什么危险 ────────────────────────
    // 在 C/C++ 里，下面的 dangle 会编译通过，运行时返回指向已释放内存的指针
    // Rust 直接在编译期拒绝它——这是所有权系统最大的卖点之一
    //
    // 🧪 实验：取消注释，观察编译错误（两步报错）
    //   1. E0106: missing lifetime specifier（缺生命周期标注）
    //   2. 修掉 1 之后是 E0515: cannot return reference to local variable `s`
    //      （cannot return reference to a temporary / returns a reference to
    //        data owned by the current function）
    //
    // fn dangle() -> &String {
    //     let s = String::from("hello");
    //     &s              // s 离开函数就被释放，返回的引用会悬垂
    // }
    //
    // 修复方式就是 no_dangle 的做法：返回 String 转移所有权

    // ─── 任务 2：正确版——转移所有权 ───────────────────────
    let got = no_dangle();
    assert_eq!(got, "hello", "所有权转移到了 main，字符串活着");
    println!("✅ 任务 2：返回 String 本身 = 所有权转移出去，安全");

    // ─── 任务 3：对照——引用调用者的数据完全没问题 ───────────
    let mine = String::from("mine");
    let borrowed = echo(&mine);
    assert_eq!(borrowed, "mine", "echo 返回的引用指向调用者的数据");
    // 注意：borrowed 和 mine 同时可用——borrowed 只是借用
    assert_eq!(mine, "mine");
    println!("✅ 任务 3：引用调用者的数据 → 安全；引用函数内的数据 → 禁止");

    println!("\n🎉 ex05 全部通过！下一步：ex06-lifetimes");
}
