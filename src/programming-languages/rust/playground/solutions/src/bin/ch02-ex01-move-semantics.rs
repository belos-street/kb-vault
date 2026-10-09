// ✅ 答案：ch02/ex01-move-semantics（做完再看！）
// 关键点：按值传参 = move；clone 保留原变量；返回值把所有权转回调用者
fn consume(s: String) -> usize {
    s.len()
}

fn make_greet() -> String {
    String::from("hi")
}

fn main() {
    let s = String::from("hello");
    let len = consume(s); // s 的所有权进入函数，函数结束时被 drop
    assert_eq!(len, 5, "consume 返回字符串长度");

    let s2 = String::from("world");
    let len2 = consume(s2.clone()); // 深拷贝一份传进去，s2 保留所有权
    assert_eq!(len2, 5);
    assert_eq!(s2, "world");

    let greeting = make_greet(); // 返回值把所有权转移给 main
    assert_eq!(greeting, "hi");

    println!("✅ 任务 1：按值传参 = 所有权转移");
    println!("✅ 任务 2：.clone() 深拷贝，原变量保留所有权");
    println!("✅ 任务 3：返回值把所有权转移给调用者");

    // 🧪 实验 1 答案：println!("{}", s) 报 E0382 borrow of moved value: `s`。
    // 编译器会标注两个位置：value moved here（consume(s)）和
    // value used here after move。这是 Rust 最常见的错误，前 10 次见到它
    // 都会觉得烦，之后你会感谢它——这就是"编译器帮你找问题"。

    // 🧪 实验 2 答案：赋值 let t = u; 同样触发 move。
    // 三种修复：clone / 不再用 u / 用 &u 借用（下一节）。
}
