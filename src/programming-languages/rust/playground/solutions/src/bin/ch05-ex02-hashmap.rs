// ✅ 答案：ch05/ex02-hashmap（做完再看！）
// 关键点：get → Option<&V>；entry().or_insert() 计数三件套
use std::collections::HashMap;

fn word_count<'a>(words: &[&'a str]) -> HashMap<&'a str, i32> {
    let mut map = HashMap::new();
    for &word in words {
        // for &word in words：模式解构，word 直接是 &'a str
        // entry：键存在 → 返回它的 &mut 值；不存在 → 插入 0 再返回 &mut
        let count = map.entry(word).or_insert(0);
        *count += 1; // 解引用累加
    }
    map
}

fn main() {
    let mut scores = HashMap::new();
    scores.insert(String::from("Blue"), 10);
    scores.insert(String::from("Yellow"), 50);

    assert_eq!(scores.get("Blue"), Some(&10));
    assert_eq!(scores.get("Green"), None);

    scores.entry(String::from("Green")).or_insert(0);
    assert_eq!(scores.get("Green"), Some(&0));
    scores.entry(String::from("Blue")).or_insert(999);
    assert_eq!(scores.get("Blue"), Some(&10));

    let words = ["apple", "banana", "apple", "cherry", "banana", "apple"];
    let counts = word_count(&words);
    assert_eq!(counts.get("apple"), Some(&3));
    assert_eq!(counts.get("banana"), Some(&2));
    assert_eq!(counts.get("cherry"), Some(&1));

    println!("✅ 任务 1：get 查不到 → None（没有 null，只有 Option）");
    println!("✅ 任务 2：entry().or_insert() 幂等插入");
    println!("✅ 任务 3：word_count —— entry + or_insert + 解引用累加");

    // 🧪 实验答案：entry + and_modify + or_insert 链式组合，
    // 一行完成"存在则改、不存在则插"——比 get+insert 两步查快且无重复哈希。
    // 注意 for word in words 中 word 是 &&str，entry(word) 靠解引用强制转换收下。
}
