// ✅ 答案：ch02/ex06-lifetimes（做完再看！）
// 关键点：'a 绑定多个引用的存活关系；省略规则覆盖大多数场景
fn longest<'a>(x: &'a str, y: &'a str) -> &'a str {
    if x.len() > y.len() {
        x
    } else {
        y
    }
}

fn first_item(v: &Vec<i32>) -> &i32 {
    &v[0] // 省略规则 1：单引用参数，返回引用自动与它同寿
}

fn main() {
    let s1 = String::from("long string is long");
    let s2 = String::from("hi");
    // &String 自动转换成 &str（解引用强制转换）
    let result = longest(&s1, &s2);
    assert_eq!(result, "long string is long");
    assert_eq!(longest(&s2, &s1), "long string is long");

    {
        let a = String::from("abc");
        let b = String::from("de");
        let winner = longest(&a, &b);
        assert_eq!(winner, "abc");
    } // a、b 在此销毁，winner 之前已用完，安全

    let nums = vec![10, 20, 30];
    let first = first_item(&nums);
    assert_eq!(first, &10);
    assert_eq!(*first, 10);

    println!("✅ 任务 1：'a 把 x、y、返回值三者的存活期绑定在一起");
    println!("✅ 任务 2：借用者比被借者先死 → 编译通过");
    println!("✅ 任务 3：单引用参数自动推断（省略规则 1），无需手动标注");

    // 🧪 实验答案：inner 活到了 short_lived 销毁之后 → E0597。
    // 'a 被推断为 short_lived 的存活期（两个输入中较短的那个），
    // 而 println! 里 inner 的使用超出了 'a 的范围。
    // 生命周期标注的价值正在于此：它让"悬垂引用"变成编译错误而非运行时惨案。
}
