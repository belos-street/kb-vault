// 📖 对应文档：doc/02-ownership-borrowing.md §2.6 生命周期（Lifetimes）入门
// 🎯 任务：手动标注一次生命周期，再体验一次省略规则——理解 'a 是"引用之间的关联"
// ▶️ 运行：cargo run -p ch02-ownership --bin ex06-lifetimes
//
// 关键认知：
//   - 生命周期标注不改变引用存活时间，只是告诉编译器"入参和返回值的关联"
//   - 'a 的含义：返回值的引用至少在 x 和 y 中较短的那个存活期内有效

// TODO：实现函数体——返回 x 和 y 中较长的那个（一样长返回 y 即可）
// 📌 为什么签名要有 'a？（doc §2.6）两个引用入参 + 返回引用，
//    编译器无法推断返回值关联谁，'a 把三者存活期绑定在一起
// 🧪 实验：删掉签名里所有 'a 保存，观察 E0106（错误信息会直接给出修复建议），
//    读完再恢复——这是手动体验一次"为什么需要生命周期标注"
fn longest<'a>(x: &'a str, y: &'a str) -> &'a str {
    todo!()
}

// 这个函数不需要手动标注——生命周期省略规则 1：
// "只有一个引用参数 → 返回引用的寿命 = 它"
// TODO：实现它，返回第一个元素
// 注意：Vec 是可增长数组（第 5 章详讲），这里只需知道 vec![10, 20, 30] 创建、v[0] 取元素
fn first_item(v: &Vec<i32>) -> &i32 {
    todo!()
}

fn main() {
    // ─── 任务 1：实现并理解 longest ────────────────────────
    // &String 传给 &str 参数会自动转换（解引用强制转换），不用手动处理
    let s1 = String::from("long string is long");
    let s2 = String::from("hi");

    let result = longest(&s1, &s2);
    assert_eq!(result, "long string is long", "长的那个赢");
    assert_eq!(longest(&s2, &s1), "long string is long", "参数顺序无关");
    println!("✅ 任务 1：'a 把 x、y、返回值三者的存活期绑定在一起");

    // ─── 任务 2：'a 的真正含义——"返回值不能活得比入参久" ────
    // 下面的代码是合法的：result 在 s1/s2 还活着的时候使用
    {
        let a = String::from("abc");
        let b = String::from("de");
        let winner = longest(&a, &b);
        assert_eq!(winner, "abc");
    } // a、b 在这里销毁，winner 在这之前就用完了，安全
    println!("✅ 任务 2：借用者比被借者先死 → 编译通过");

    // ─── 🧪 实验：借用者活得比被借者久 → E0597 ───────────────
    // 取消注释，观察 E0597（`x` does not live long enough）
    // 这就是 'a 标注在起作用：编译器发现返回值的寿命超过了两输入中较短的那个
    //
    // let inner;
    // {
    //     let short_lived = String::from("short");
    //     inner = longest("always long", &short_lived);
    // }
    // println!("{}", inner); // ❌ short_lived 已销毁，inner 成了悬垂引用

    // ─── 任务 3：省略规则——大多数时候你不用写 'a ─────────────
    let nums = vec![10, 20, 30];
    let first = first_item(&nums);
    assert_eq!(first, &10, "返回的是引用：&i32 和 &i32 比较");
    assert_eq!(*first, 10, "解引用后比较：*first == 10");
    println!("✅ 任务 3：单引用参数自动推断（省略规则 1），无需手动标注");

    // ─── 🧪 实验：省略规则速查（文档 §2.6 表格）───────────────
    // fn foo(x: &str) -> &str              → 自动推断
    // fn get(&self) -> &str                → 自动推断（方法 &self）
    // fn foo(x: i32, y: &str) -> &str      → 自动推断（只有一个引用参数）
    // fn longest<'a>(x: &'a str, y: &'a str) -> &'a str → 必须手动标注
    //   （两个引用参数，编译器无法知道返回值关联哪一个）

    println!("\n🎉 ex06 全部通过！第 2 章练习完成 🎊");
    println!("下一步：doc/03-composite-types（struct、enum、match）");
    println!("综合实战：doc/05-practical-skills + CLI TODO 项目");
}
