// ✅ 答案：ch05/ex01-vec（做完再看！）
// 关键点：push 增、get 查（Option）、&mut 迭代改、retain 删
fn main() {
    let mut v: Vec<i32> = Vec::new();
    for i in 1..=5 {
        v.push(i);
    }
    assert_eq!(v.len(), 5);
    assert_eq!(v[0], 1);

    assert_eq!(v.get(2), Some(&3));
    assert_eq!(v.get(100), None);

    for i in &mut v {
        *i *= 2; // i 是 &mut i32，*i 解引用拿到值本身
    }
    assert_eq!(v, vec![2, 4, 6, 8, 10]);

    v.retain(|&x| x != 4);
    assert_eq!(v, vec![2, 6, 8, 10]);

    println!("✅ 任务 1：Vec::new + push（vec![1, 2, 3] 宏是捷径）");
    println!("✅ 任务 2：get → Option（安全），索引 → 越界 panic（快）");
    println!("✅ 任务 3：&mut 迭代 + *i 解引用修改");
    println!("✅ 任务 4：retain 条件删除（|&x| 解构引用拿值）");

    // 🧪 实验答案：v[100] panic——index out of bounds。
    // 选型：性能敏感且确定不越界 → 索引；不确定 → get + Option 处理。
    // 第 5.3 节后回看：迭代器版翻倍 v.iter_mut().for_each(|i| *i *= 2)。
}
