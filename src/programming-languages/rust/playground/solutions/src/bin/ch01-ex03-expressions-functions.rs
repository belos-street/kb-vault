// ✅ 答案：ch01/ex03-expressions-functions（做完再看！）
// 关键点：if 是表达式、块是表达式、函数最后一行无分号即返回值
fn double(x: i32) -> i32 {
    x * 2 // 无 return、无分号——表达式即返回值
}

fn area(r: f64) -> f64 {
    std::f64::consts::PI * r * r
}

fn main() {
    let n = 7;
    // if 表达式直接产生值，两个分支类型必须一致
    let label = if n % 2 == 0 { "偶数" } else { "奇数" };
    assert_eq!(label, "奇数");

    // 块表达式：块内可以有多行逻辑，最后一行无分号就是返回值
    let y = {
        let mut sum = 0;
        for i in 1..=5 {
            sum += i;
        }
        sum // 无分号
    };
    assert_eq!(y, 15, "块表达式应返回 1+2+3+4+5 = 15");

    assert_eq!(double(21), 42);

    let a = area(2.0);
    assert!((a - 12.566370614359172).abs() < 1e-9);

    println!("✅ 任务 1：if 可以直接赋值，不需要三元运算符");
    println!("✅ 任务 2：{} 也是表达式，最后一行无分号即返回值", "{}");
    println!("✅ 任务 3：函数最后一行表达式即返回值（x + y，无分号）");
    println!("✅ 任务 4：area(2.0) = {:.6}，浮点比较用误差范围", a);

    // 🧪 实验答案：fn broken(x: i32) -> i32 { x + 1; }
    // 分号把 `x + 1` 从表达式变成语句，值被丢弃，块返回 ()，
    // 与声明的返回类型 i32 不符 → E0308。去掉分号即可。
}
