// ✅ 答案：ch01/ex05-implicit-conversion（做完再看！）
// 关键点：一切转换都显式；f64→i32 向零截断；as 不检查溢出
fn main() {
    let x: i32 = 5;
    let widened = x as f64;
    assert_eq!(widened, 5.0);

    // 向零截断：不是四舍五入（4），也不是向下取整（-4）
    let p = 3.9_f64 as i32;
    let m = (-3.9_f64) as i32;
    assert_eq!(p, 3);
    assert_eq!(m, -3);

    // u32→u8 只取低 8 位：300 = 0b1_0010_1100 → 0b0010_1100 = 44
    let big: u32 = 300;
    let small = big as u8;
    assert_eq!(small, 44);

    let one = 1_i32;
    let one_point_five = 0.5_f64;
    let total = one as f64 + one_point_five;
    assert_eq!(total, 1.5);

    println!("✅ 任务 1：拓宽（i32 → f64）也要显式 as");
    println!("✅ 任务 2：f64 as i32 向零截断：3.9 → 3，-3.9 → -3");
    println!("✅ 任务 3：as 是『我相信你』的转换，溢出不报错，要自己算清楚");
    println!("✅ 任务 4：跨类型运算永远显式转换");

    // 🧪 实验答案：let b: f64 = a; 报 E0308。
    // 编译器提示里会直接给出修复建议（use `as` 或改用 f64 字面量），
    // 这是 Rust 学习曲线平缓的原因之一：错误信息即教程。
    // 更严谨的数值转换可以考虑 TryFrom（会返回 Result，可处理失败）。
}
