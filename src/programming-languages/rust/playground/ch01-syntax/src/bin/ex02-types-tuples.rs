// 📖 对应文档：doc/01-basic-syntax.md §1.4 基本数据类型
// 🎯 任务：熟悉标量类型、char 的 Unicode 特性、元组解构、as 显式转换
// ▶️ 运行：cargo run -p ch01-syntax --bin ex02-types-tuples

fn main() {
    // ─── 任务 1：整数与浮点 ───────────────────────────────
    // Rust 明确区分符号和位数（对比 Java 的 int/long，TS 只有一个 number）
    let a: i32 = -100;
    let b: u32 = 100;
    let c: f64 = 1.5;
    // TODO：计算 a 的绝对值加 b，再乘以 c，结果存到 result（f64）
    // 提示：i32/u32 没有 abs 吗？有！但要和 f64 相乘必须先 as f64 转换
    let result: f64 = todo!();

    assert!((result - 300.0).abs() < 1e-9, "result 应该是 300.0");
    println!("✅ 任务 1：不同类型运算必须显式转换（as）");

    // ─── 任务 2：char 是 4 字节 Unicode ──────────────────
    // TODO：把 todo!() 替换成 emoji 字面量 '🦀'
    let ch: char = todo!();

    assert_eq!(ch, '🦀', "char 可以是任意 Unicode 字符");
    println!("✅ 任务 2：char 是 Unicode 标量值，不是 ASCII");

    // ─── 任务 3：元组解构 ────────────────────────────────
    let point: (i32, f64, char) = (500, 6.4, '中');
    // TODO：用解构赋值把 point 拆成 x / y / z 三个变量
    let (x, y, z): (i32, f64, char) = todo!(); // 把 todo!() 换成 point

    assert_eq!(x, 500);
    assert!((y - 6.4).abs() < 1e-9);
    assert_eq!(z, '中');
    println!("✅ 任务 3：元组支持解构（类似 TS 数组解构）");

    // ─── 任务 4：元组的点号索引 ──────────────────────────
    // TODO：不解构，直接用点号索引取出 point 的第一个元素
    let first: i32 = todo!();

    assert_eq!(first, 500, "点号索引从 0 开始：t.0");
    println!("✅ 任务 4：t.0 / t.1 点号索引（不是 t[0]）");

    // ─── 任务 5：as 显式类型转换 ─────────────────────────
    // TODO：把 3.9 (f64) 转成 i32，观察结果是截断还是四舍五入
    let truncated: i32 = todo!();

    assert_eq!(truncated, 3, "f64 as i32 是向零截断，不是四舍五入！");
    println!("✅ 任务 5：as 转换是截断（3.9 → 3，-3.9 → -3）");

    // ─── 🧪 实验：Rust 没有隐式类型转换 ───────────────────
    // 取消下面一行注释，观察 E0308（expected f64, found i32）
    // 对比 JS：`1 + "1" === "11"` 这种坑在 Rust 编译期就被拦下
    //
    // let x: i32 = 5;
    // let a: f64 = x;

    println!("\n🎉 ex02 全部通过！下一步：ex03-expressions-functions");
}
