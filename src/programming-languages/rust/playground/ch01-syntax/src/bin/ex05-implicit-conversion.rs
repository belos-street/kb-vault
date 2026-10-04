// 📖 对应文档：doc/01-basic-syntax.md §1.4 类型转换（doc 练习 3）
// 🎯 任务：理解 Rust 没有隐式转换——类型变化必须写出来（as）
// ▶️ 运行：cargo run -p ch01-syntax --bin ex05-implicit-conversion

fn main() {
    // ─── 任务 1：拓宽转换也要显式 ──────────────────────────
    // i32 → f64 是"安全"的拓宽，Rust 依然要求你写 as
    let x: i32 = 5;
    // TODO：把 x 转成 f64 存到 widened
    let widened: f64 = todo!();

    assert_eq!(widened, 5.0, "5 as f64 是 5.0");
    println!("✅ 任务 1：拓宽（i32 → f64）也要显式 as");

    // ─── 任务 2：窄化转换是截断 ───────────────────────────
    // f64 → i32 会丢失小数部分，向零截断（不是四舍五入、不是向下取整）
    // TODO：把 3.9 和 -3.9 分别转成 i32
    let p: i32 = todo!(); // 3.9 as i32
    let m: i32 = todo!(); // -3.9 as i32

    assert_eq!(p, 3, "3.9 截断为 3");
    assert_eq!(m, -3, "-3.9 向零截断为 -3（不是 -4！）");
    println!("✅ 任务 2：f64 as i32 向零截断：3.9 → 3，-3.9 → -3");

    // ─── 任务 3：as 的风险要自己承担 ──────────────────────
    // 大数塞进小类型会静默溢出回绕（wrap），Rust 不检查 as 的窄化溢出
    let big: u32 = 300;
    let small = big as u8; // 300 = 0x12C，低 8 位是 0x2C

    assert_eq!(small, 44, "300 as u8 回绕成 44——as 不检查溢出");
    println!("✅ 任务 3：as 是『我相信你』的转换，溢出不报错，要自己算清楚");

    // ─── 🧪 实验：隐式转换？不存在 ──────────────────────────
    // 取消下面两行注释，观察 E0308：mismatched types
    // 错误信息里编译器甚至会直接告诉你修复方法：use `as` 或写 5.0
    //
    // let a: i32 = 5;
    // let b: f64 = a;

    // 对比一下你熟悉的三种语言：
    //   JS:     1 + "1" === "11"   （隐式转字符串）
    //   Java:   long l = intVal;   （宽化隐式）
    //   Python: 无隐式数字转换，但 1 + 1.0 = 2.0（数字类型间自动统一）
    //   Rust:   1 + 1.0            （编译错误，必须写 1 + 1.0_f64 或 as）
    let one = 1_i32;
    let one_point_five = 0.5_f64;
    let total = one as f64 + one_point_five;
    assert_eq!(total, 1.5);
    println!("✅ 任务 4：跨类型运算永远显式转换");

    println!("\n🎉 ex05 全部通过！第 1 章练习完成，进入第 2 章：所有权");
    println!("▶️  下一题：cargo run -p ch02-ownership --bin ex01-move-semantics");
}
