// 📖 对应文档：doc/05-practical-skills.md §5.2 HashMap
// 🎯 任务：HashMap 增查 + entry().or_insert() 计数模式（词频统计经典题）
// ▶️ 运行：cargo run -p ch05-practical-skills --bin ex02-hashmap

use std::collections::HashMap;

// TODO：实现 word_count —— 统计每个单词出现次数
// 核心模式（doc §5.2）：
//   let count = map.entry(word).or_insert(0);
//   *count += 1;   // entry 返回 &mut V，解引用累加
// 对比两步写法：get 判断 → insert 覆盖（要查两次哈希，entry 一次搞定）
// 迭代提示：for &word in words 直接解构出 &str
//          （如果写 for word in words，word 是 &&str，entry 会推出错误的键类型）
//
// 📌 生命周期回访（ch02 ex06）：&[&str] 里有两个输入引用（外层切片 + 内层字符串），
// 省略规则无法确定返回的 &str 关联哪个，必须手动标注 'a
fn word_count<'a>(words: &[&'a str]) -> HashMap<&'a str, i32> {
    todo!()
}

fn main() {
    let mut scores = HashMap::new();
    scores.insert(String::from("Blue"), 10);
    scores.insert(String::from("Yellow"), 50);

    // ─── 任务 1：get 返回 Option<&V> ─────────────────────
    assert_eq!(scores.get("Blue"), Some(&10));
    assert_eq!(scores.get("Green"), None);
    println!("✅ 任务 1：get 查不到 → None（没有 null，只有 Option）");

    // ─── 任务 2：entry().or_insert() —— 不存在才插入 ──────
    scores.entry(String::from("Green")).or_insert(0);
    assert_eq!(scores.get("Green"), Some(&0), "Green 不存在，插入默认 0");
    scores.entry(String::from("Blue")).or_insert(999);
    assert_eq!(scores.get("Blue"), Some(&10), "Blue 已存在，999 不会覆盖");
    println!("✅ 任务 2：entry().or_insert() 幂等插入");

    // ─── 任务 3：词频统计 ────────────────────────────────
    let words = ["apple", "banana", "apple", "cherry", "banana", "apple"];
    let counts = word_count(&words);
    assert_eq!(counts.get("apple"), Some(&3));
    assert_eq!(counts.get("banana"), Some(&2));
    assert_eq!(counts.get("cherry"), Some(&1));
    println!("✅ 任务 3：word_count —— entry + or_insert + 解引用累加");

    // ─── 🧪 实验：entry 链式修改 ──────────────────────────
    // doc 里还有 and_modify——entry 之后可以继续链：
    //
    // *scores.entry(String::from("Blue")).and_modify(|e| *e += 100).or_insert(0);
    // assert_eq!(scores.get("Blue"), Some(&110));
    //
    // 取消注释跑一遍，体会这个 API 为什么好用

    println!("\n🎉 ex02 全部通过！下一步：ex03-iterators-closures");
}
