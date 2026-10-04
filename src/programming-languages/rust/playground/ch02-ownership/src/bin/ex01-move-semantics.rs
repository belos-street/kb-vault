// 📖 对应文档：doc/02-ownership-borrowing.md §2.1 所有权规则
// 🎯 任务：亲眼看到 Move——为什么 String 赋值后原变量失效了
// ▶️ 运行：cargo run -p ch02-ownership --bin ex01-move-semantics

// 这个函数"拿走"传入 String 的所有权（参数按值传递 = move）
// 函数结束后 s 被 drop（释放），调用方就再也用不了它了
fn consume(s: String) -> usize {
    s.len() // s 在这里是所有者
}

fn main() {
    // ─── 任务 1：按值传参 = 所有权转移 ─────────────────────
    // TODO：把 s 传给 consume，拿回长度
    // 注意：调用之后 s 就不再有效了！
    let s = String::from("hello");
    let len: usize = todo!(); // 把 s 传进去

    assert_eq!(len, 5, "consume 返回字符串长度");

    // ─── 任务 2：想让原变量继续可用？clone 一份 ─────────────
    // TODO：修复"传出去就没了"的问题——传 s2 的深拷贝
    let s2 = String::from("world");
    let len2: usize = todo!(); // 提示：s2.clone()

    assert_eq!(len2, 5);
    // 这行能编译通过，说明 s2 的所有权没被带走 ✅
    assert_eq!(s2, "world", "clone 之后原变量仍然可用");
    println!("✅ 任务 2：.clone() 深拷贝，原变量保留所有权");

    // ─── 任务 3：返回值也会转移所有权（转移回来）─────────────
    // TODO：写一个函数 make_greet() -> String，返回 String::from("hi")
    //       在 main 里接收它的返回值并断言内容
    // 思考：函数内创建的 String，离开函数作用域本该被 drop，
    //       但通过返回值把所有权"转移"给了调用者，所以活着
    fn make_greet() -> String {
        todo!()
    }
    let greeting: String = todo!(); // 调用 make_greet 并接收所有权

    assert_eq!(greeting, "hi", "make_greet 返回的字符串");
    println!("✅ 任务 3：返回值把所有权转移给调用者");

    // ─── 🧪 实验 1：观察 move 编译错误 ─────────────────────
    // 取消注释，观察 E0382：borrow of moved value: `s`
    // 编译器会精确指出：value moved here（在 consume(s) 那行）
    //
    // println!("{}", s);

    // ─── 🧪 实验 2：赋值也是 move ─────────────────────────
    // 取消注释，观察同样错误——赋值 let t = u; 也会转移所有权
    //
    // let u = String::from("rust");
    // let t = u;
    // println!("{}", u);
    //
    // 修复方式（三选一，都在文档 §2.2/§2.3）：
    //   a) let t = u.clone();   深拷贝
    //   b) 只用 t，不再用 u     接受 move
    //   c) let t = &u;          借用（下一节讲）

    println!("\n🎉 ex01 全部通过！下一步：ex02-clone-copy");
}
