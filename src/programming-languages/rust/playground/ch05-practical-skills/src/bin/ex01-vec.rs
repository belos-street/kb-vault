// 📖 对应文档：doc/05-practical-skills.md §5.2 Vec
// 🎯 任务：Vec 增删查改、get 安全访问 vs 索引 panic、可变迭代
// ▶️ 运行：cargo run -p ch05-practical-skills --bin ex01-vec

fn main() {
    // ─── 任务 1：创建与添加 ──────────────────────────────
    // TODO：用 for 循环把 1..=5 推进空 Vec
    let mut v: Vec<i32> = Vec::new();
    todo!(); // 提示：for i in 1..=5 { v.push(i); }

    assert_eq!(v.len(), 5);
    assert_eq!(v[0], 1);
    println!("✅ 任务 1：Vec::new + push（vec![1, 2, 3] 宏是捷径）");

    // ─── 任务 2：get 安全访问 vs 索引 panic ───────────────
    // get 返回 Option<&i32>（第 3 章），索引越界直接 panic
    assert_eq!(v.get(2), Some(&3));
    assert_eq!(v.get(100), None, "get 越界返回 None，不 panic");
    println!("✅ 任务 2：get → Option（安全），索引 → 越界 panic（快）");

    // ─── 任务 3：可变迭代 —— 原地翻倍 ────────────────────
    // TODO：用 &mut v 迭代，把每个元素乘 2
    // 提示：for i in &mut v { *i *= 2; }（*i 解引用后修改）
    todo!();

    assert_eq!(v, vec![2, 4, 6, 8, 10]);
    println!("✅ 任务 3：&mut 迭代 + *i 解引用修改");

    // ─── 任务 4：条件删除（示例）─────────────────────────
    // retain 保留"闭包返回 true"的元素——闭包当谓词用（§5.3 主角）
    v.retain(|&x| x != 4);

    assert_eq!(v, vec![2, 6, 8, 10]);
    println!("✅ 任务 4：retain 条件删除（|&x| 解构引用拿值）");

    // ─── 🧪 实验：索引越界的代价 ──────────────────────────
    // 取消注释，运行观察 panic：index out of bounds: the len is 4 but the index is 100
    //
    // println!("{}", v[100]);
    //
    // 三种语言对照：
    //   JS：arr[100] = undefined（静默埋雷）
    //   Java：ArrayIndexOutOfBoundsException（运行时）
    //   Rust：get 给 Option 编译期逼你处理；索引给 panic（要性能时用）

    println!("\n🎉 ex01 全部通过！下一步：ex02-hashmap");
}
