// 📖 对应文档：doc/02-ownership-borrowing.md §2.4 借用规则（面试必考）
// 🎯 任务：亲眼验证借用规则 + NLL（引用死于"最后一次使用"，不是作用域结尾）
// ▶️ 运行：cargo run -p ch02-ownership --bin ex04-borrow-rules-nll
//
// 借用规则（同时只能二选一）：
//   1. 任意多个不可变引用 &T
//   2. 最多一个可变引用 &mut T

fn main() {
    // ─── 任务 1：多个不可变引用，没问题 ─────────────────────
    // 类比：多人同时"读"一本书 ✅
    let s = String::from("hello");
    let r1 = &s;
    let r2 = &s;
    assert_eq!(r1, "hello");
    assert_eq!(r2, "hello", "任意多个 &T 同时存在，完全合法");
    println!("✅ 任务 1：多个只读借用共存 ✅");

    // ─── 任务 2：NLL——引用用完之后，&mut 就可以来了 ─────────
    // 注意：r1/r2 在上面的 assert! 之后再也没有被使用，
    // NLL 规则下它们的生命周期"当场结束"，所以下面的 &mut 合法！
    let mut s2 = String::from("hello");

    let r3 = &s2;
    let r4 = &s2;
    assert_eq!(r3, "hello"); // r3 最后一次使用
    assert_eq!(r4, "hello"); // r4 最后一次使用——到此，r3/r4 已死

    let r5 = &mut s2; // ✅ 合法（NLL），如果没有 NLL 这里会报错
    r5.push_str(" world");
    assert_eq!(s2, "hello world");
    println!("✅ 任务 2：NLL 让代码更自然——用完即可借出 &mut");

    // ─── 任务 3：读写同时存在，编译器拦截 ────────────────────
    // TODO：让下面的代码通过编译，且断言全部成立
    // 规则提示：先把所有"读"用完，再创建 &mut
    let mut s3 = String::from("abc");
    let reader = &s3; // 不可变借用
    assert_eq!(reader, "abc");
    // TODO：在这里创建一个 &mut 借用，追加 "def"（提示：&mut s3）
    // 不能再使用 reader 了！想想为什么（NLL：reader 上面已用完）
    todo!();

    assert_eq!(s3, "abcdef", "修改成功");
    println!("✅ 任务 3：先读后写，顺序正确就能通过");

    // ─── 🧪 实验：违反规则的两种姿势 ────────────────────────
    // 实验 A：读着读着要写 → E0502（cannot borrow as mutable because
    //         it is also borrowed as immutable）
    // 取消注释，观察错误后修复（把 println 移到 writer 创建之前）
    //
    // let mut s4 = String::from("hi");
    // let reader2 = &s4;
    // let writer = &mut s4;
    // writer.push_str("!");
    // println!("{}", reader2);   // ❌ reader2 在 writer 存活期间被使用

    // 实验 B：两个 &mut 同时存在 → E0499
    //
    // let mut s5 = String::from("hi");
    // let w1 = &mut s5;
    // let w2 = &mut s5;          // ❌ 已有可变借用
    // w1.push_str("a");
    // w2.push_str("b");

    println!("\n🎉 ex04 全部通过！下一步：ex05-dangling");
}
