// ✅ 答案：ch02/ex04-borrow-rules-nll（做完再看！）
// 关键点：多读共存 ✅；读写互斥；NLL——引用死于最后一次使用
fn main() {
    let s = String::from("hello");
    let r1 = &s;
    let r2 = &s;
    assert_eq!(r1, "hello");
    assert_eq!(r2, "hello");

    let mut s2 = String::from("hello");
    let r3 = &s2;
    let r4 = &s2;
    assert_eq!(r3, "hello"); // r3 最后一次使用
    assert_eq!(r4, "hello"); // r4 最后一次使用——NLL 下它们到此"死亡"

    let r5 = &mut s2; // ✅ 因为 r3/r4 已不再使用（NLL）
    r5.push_str(" world");
    assert_eq!(s2, "hello world");

    let mut s3 = String::from("abc");
    let reader = &s3;
    assert_eq!(reader, "abc"); // reader 最后一次使用，此后可安全借出 &mut
    let writer = &mut s3;
    writer.push_str("def");
    assert_eq!(s3, "abcdef");

    println!("✅ 任务 1：多个只读借用共存 ✅");
    println!("✅ 任务 2：NLL 让代码更自然——用完即可借出 &mut");
    println!("✅ 任务 3：先读后写，顺序正确就能通过");

    // 🧪 实验 A 答案：reader2 在 writer 存活期间被使用 → E0502。
    // 修复：把 println!("{}", reader2) 移到 let writer = &mut s4; 之前。
    // 本质：保证"最后一个不可变借用"的生命终点早于可变借用的诞生。

    // 🧪 实验 B 答案：w1 还活着时又造 w2 → E0499
    // （cannot borrow `s5` as mutable more than once at a time）。
    // 两个 &mut 同时存在 = 两个写者并发改同一数据 = 数据竞争的种子，
    // 借用检查器把它扼杀在编译期。
}
