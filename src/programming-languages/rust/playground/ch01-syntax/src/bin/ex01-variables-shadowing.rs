// 📖 对应文档：doc/01-basic-syntax.md §1.3 变量与绑定
// 🎯 任务：掌握 mut、shadowing、const 三种"变量"的区别
// ▶️ 运行：cargo run -p ch01-syntax --bin ex01-variables-shadowing
//
// 规则：`todo!()` 标记的地方需要你实现；🧪 实验需要取消注释观察编译错误后修复。
// 全部任务完成后，程序会打印 ✅ 而不是 panic。

// ① 常量：编译期确定，必须标注类型（对比 TS 的 const / Java 的 final）
const MAX_POINTS: u32 = 100_000;

fn main() {
    // ─── 任务 1：mut 可变绑定 ─────────────────────────────
    // TODO：声明一个可变变量 count 初始为 0，连续加 1 三次
    let mut count: i32 = todo!();
    // TODO：在这里写三次自增（count += 1;）

    assert_eq!(count, 3, "count 应该是 3");
    println!("✅ 任务 1：mut 变量可以原地修改");

    // ─── 任务 2：shadowing 变量遮蔽（可以改变类型！）────────
    // price 一开始是 &str，用 shadowing 变成 i32
    // TODO：用 let 重新绑定 price，把字符串解析成 i32
    // 提示：price.parse() 需要目标类型信息，重新绑定时要标注 `let price: i32 = ...`
    let price = "199";
    let price: i32 = todo!(); // 目标类型已给出，你只需写出解析表达式

    assert_eq!(price, 199, "price 应该被遮蔽成数字 199");
    println!("✅ 任务 2：shadowing 可以在同名下改变类型（mut 做不到）");

    // ─── 任务 3：const 使用 ───────────────────────────────
    // TODO：计算 MAX_POINTS 的一半，赋给 half_points（注意类型是 u32）
    let half_points: u32 = todo!();

    assert_eq!(half_points, 50_000, "MAX_POINTS 的一半是 50000");
    println!("✅ 任务 3：const 编译期确定，类型必须显式标注");

    // ─── 🧪 实验：默认不可变 ──────────────────────────────
    // 取消下面两行注释，观察编译错误 E0384（cannot assign twice to immutable variable）
    // 思考：两种修复方式——加 mut？还是用 shadowing？哪种更符合这里的语义？
    //
    // let level = 1;
    // level = 2;

    println!("\n🎉 ex01 全部通过！下一步：ex02-types-tuples");
}
