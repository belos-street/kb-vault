// 📖 对应文档：doc/01-basic-syntax.md §1.4 表达式 vs 语句 + §1.5 函数
// 🎯 任务：理解"一切皆表达式"——if 是表达式、块是表达式、函数最后一行无分号即返回值
// ▶️ 运行：cargo run -p ch01-syntax --bin ex03-expressions-functions

// ─── 任务 3：函数体是表达式，无 return、无分号 ───────────────
// 对比 TS: function double(x: number): number { return x * 2; }
// TODO：实现 double，最后一行表达式返回 x 的两倍（不要写 return 和分号）
fn double(x: i32) -> i32 {
    todo!()
}

// ─── 任务 4：实现圆面积（doc 练习 1）────────────────────────
// 提示：Rust 没有 Math.PI，用 std::f64::consts::PI
// TODO：实现 area，返回 π * r²
fn area(r: f64) -> f64 {
    todo!()
}

fn main() {
    // ─── 任务 1：if 是表达式（对比 TS 三元表达式）────────────
    let n = 7;
    // TODO：用 if 表达式（不是 if 语句！）判断 n 是偶数还是奇数
    // 目标：let label = if ... { "偶数" } else { "奇数" };
    let label: &str = todo!();

    assert_eq!(label, "奇数", "7 是奇数");
    println!("✅ 任务 1：if 可以直接赋值，不需要三元运算符");

    // ─── 任务 2：代码块也是表达式 ──────────────────────────
    // TODO：修改下面的块，让 y 等于 1 到 5 的和（15）
    // 块内最后一行不带分号就是返回值
    let y = {
        let inner = 3;
        inner + 1
    };

    assert_eq!(y, 15, "块表达式应返回 1+2+3+4+5 = 15");
    println!("✅ 任务 2：{} 也是表达式，最后一行无分号即返回值", "{}");

    // ─── 任务 3：函数 = 参数 + 返回类型 + 表达式 ────────────
    assert_eq!(double(21), 42, "double(21) 应该是 42");
    println!("✅ 任务 3：函数最后一行表达式即返回值（x + y，无分号）");

    // ─── 任务 4：圆面积 ──────────────────────────────────
    let a = area(2.0);
    assert!(
        (a - 12.566370614359172).abs() < 1e-9,
        "area(2.0) 应该约等于 12.566"
    );
    println!("✅ 任务 4：area(2.0) = {:.6}，浮点比较用误差范围", a);

    // ─── 🧪 实验：分号把表达式变成语句 ──────────────────────
    // 取消下面一行的注释，观察错误：函数应返回 i32，但 `x + 1;` 返回 ()
    // 思考：加上分号后，`x + 1` 的值被丢弃，剩下的类型是 unit `()`
    //
    // fn broken(x: i32) -> i32 { x + 1; }

    println!("\n🎉 ex03 全部通过！下一步：ex04-control-flow");
}
