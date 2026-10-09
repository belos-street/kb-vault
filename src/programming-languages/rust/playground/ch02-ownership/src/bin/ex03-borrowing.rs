// 📖 对应文档：doc/02-ownership-borrowing.md §2.3 借用（Borrowing）与引用
// 🎯 任务：学会用 & 借用——引用值而不获取所有权，这是"每次传参都要 move"的解药
// ▶️ 运行：cargo run -p ch02-ownership --bin ex03-borrowing

// 不可变借用：s 只是"只读引用"，不是所有者，函数结束不会释放值
// TODO：实现它——返回字符串长度（对比 §2.3 文档示例）
fn calculate_length(s: &String) -> usize {
    todo!()
}

// 可变借用：&mut 允许修改被借用的值，但同一时刻只能有一个可变借用
// TODO：实现它——把 " world" 追加到 s 末尾
// 提示：String 有 push_str 方法
fn append_world(s: &mut String) {
    todo!()
}

fn main() {
    // ─── 任务 1：不可变借用传参 ────────────────────────────
    let s = String::from("hello");
    // TODO：借用 s 调用 calculate_length（注意调用处也要 &）
    let len: usize = todo!();

    assert_eq!(len, 5, "calculate_length(&s) 返回 5");
    // 关键验证：s 还能用！如果是按值传参，这里已经编译错误了
    assert_eq!(s, "hello", "借用不夺走所有权，s 依然可用");
    println!("✅ 任务 1：& 传参 = 只读借用，调用方保留所有权");

    // ─── 任务 2：可变借用修改数据 ──────────────────────────
    let mut msg = String::from("hello");
    // TODO：可变借用 msg 调用 append_world
    // 注意两件事：msg 声明要 mut，调用处要 &mut
    todo!();

    assert_eq!(msg, "hello world", "append_world 通过 &mut 修改了 msg");
    println!("✅ 任务 2：&mut 传参 = 可写借用，修改对调用方可见");

    // ─── 任务 3：借用的完整生命周期 ────────────────────────
    // 读（不可变借用）→ 写（可变借用）→ 再读，交替进行完全 OK
    let mut note = String::from("read");
    let len_before = calculate_length(&note); // 不可变借用，用完即还
    append_world(&mut note);                  // 可变借用，此刻无其他借用
    assert_eq!(len_before, 4);
    assert_eq!(note, "read world", "两次借用各司其职");
    println!("✅ 任务 3：借用是『临时』的——用完就还，随时可再借");

    // ─── 🧪 实验：借用 ≠ 所有权转移 ────────────────────────
    // 对比 ex01：consume(s) 之后 s 没了；calculate_length(&s) 之后 s 还在
    // 假设把 calculate_length 的参数从 &String 改成 String 会怎样？
    //
    // let s3 = String::from("borrow me");
    // let len3 = take_ownership(s3);   // 假想的 take_ownership(s: String)
    // println!("{}", s3);              // E0382！所有权被函数拿走了
    //
    // 思考：什么时候按值传 String，什么时候传 &String？
    // 答案：函数需要"拥有"它（存起来、返回它）→ 按值；只是"看看" → 借用

    println!("\n🎉 ex03 全部通过！下一步：ex04-borrow-rules-nll");
}
