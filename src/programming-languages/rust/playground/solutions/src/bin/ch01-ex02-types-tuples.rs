// ✅ 答案：ch01/ex02-types-tuples（做完再看！）
// 关键点：跨类型运算必须 as；char 是 4 字节 Unicode；元组解构 + 点号索引；as 截断
fn main() {
    let a: i32 = -100;
    let b: u32 = 100;
    let c: f64 = 1.5;
    // a.abs() 是 i32、b 是 u32——不同类型不能直接相加，先统一成 u32
    // 加法结果还是 u32，与 f64 相乘前再一次 as f64
    let result = (a.abs() as u32 + b) as f64 * c;
    assert!((result - 300.0).abs() < 1e-9, "result 应该是 300.0");

    let ch: char = '🦀';
    assert_eq!(ch, '🦀');

    let point: (i32, f64, char) = (500, 6.4, '中');
    let (x, y, z) = point; // 全 Copy 字段，解构是拷贝，point 仍可用
    assert_eq!(x, 500);
    assert!((y - 6.4).abs() < 1e-9);
    assert_eq!(z, '中');

    let first = point.0;
    assert_eq!(first, 500);

    let truncated = 3.9_f64 as i32;
    assert_eq!(truncated, 3, "f64 as i32 向零截断");

    println!("✅ 任务 1：不同类型运算必须显式转换（as）");
    println!("✅ 任务 2：char 是 Unicode 标量值，不是 ASCII");
    println!("✅ 任务 3：元组支持解构（类似 TS 数组解构）");
    println!("✅ 任务 4：t.0 / t.1 点号索引（不是 t[0]）");
    println!("✅ 任务 5：as 转换是截断（3.9 → 3，-3.9 → -3）");

    // 🧪 实验答案：let a: f64 = x; 报 E0308 expected f64, found i32。
    // Rust 完全没有隐式数字转换，连 i32→f64 这种"安全"的都要写 x as f64。
}
