// ✅ 答案：ch02/ex05-dangling（做完再看！）
// 关键点：不能返回函数内数据的引用；返回所有权是正解；引用调用者数据安全
fn echo(s: &String) -> &String {
    s // 省略规则 1：返回引用与唯一入参同寿
}

fn no_dangle() -> String {
    let s = String::from("hello");
    s // 无 & 、无分号：所有权随返回值转移给调用者
}

fn main() {
    let got = no_dangle();
    assert_eq!(got, "hello");

    let mine = String::from("mine");
    let borrowed = echo(&mine);
    assert_eq!(borrowed, "mine");
    assert_eq!(mine, "mine");

    println!("✅ 任务 2：返回 String 本身 = 所有权转移出去，安全");
    println!("✅ 任务 3：引用调用者的数据 → 安全；引用函数内的数据 → 禁止");

    // 🧪 实验答案：fn dangle() -> &String 两步报错：
    //   1) E0106 missing lifetime specifier——编译器要求标注返回引用的寿命；
    //   2) 就算硬标 'a 也会报 E0515：cannot return reference to local
    //      variable `s`——s 在函数结束时被 drop，返回它的引用必然悬垂。
    // Rust 在编译期就消灭了 C/C++ 的经典悬垂指针问题，
    // 修复思路永远是：把所有权交出去（返回 String）。
}
