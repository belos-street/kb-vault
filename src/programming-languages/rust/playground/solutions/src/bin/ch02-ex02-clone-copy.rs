// ✅ 答案：ch02/ex02-clone-copy（做完再看！）
// 关键点：Copy 类型赋值/传参自动拷贝；Move 类型想重复用只能 clone
fn double(n: i32) -> i32 {
    n * 2
}

fn shout(s: String) -> String {
    s.to_uppercase()
}

fn main() {
    let s1 = String::from("rust");
    let s2 = s1.clone(); // 深拷贝堆数据，两个所有者各自独立
    assert_eq!(s1, "rust");
    assert_eq!(s2, "rust");

    let x = 5;
    let y = x; // i32 是 Copy：自动浅拷贝，不是 move
    assert_eq!(x + y, 10);

    let v = 10;
    assert_eq!(double(v), 20);
    assert_eq!(double(v), 20); // Copy 类型传参随便传

    let msg = String::from("hey");
    let r1 = shout(msg.clone());
    let r2 = shout(msg.clone()); // 再来一份
    assert_eq!(r1, "HEY");
    assert_eq!(r2, "HEY");
    assert_eq!(msg, "hey");

    let t = (1, 2.0, 'a');
    let t2 = t; // 全 Copy 字段 → 整个元组 Copy
    assert_eq!(t.0 + t2.0, 2);

    println!("✅ 任务 1：clone() 深拷贝堆数据，两个所有者各自独立");
    println!("✅ 任务 2：Copy 类型赋值 = 自动浅拷贝（栈上数据）");
    println!("✅ 任务 3：double(v) 调两次，v 还活着——Copy 的功劳");
    println!("✅ 任务 4：Move 类型想重复使用，只能 clone");
    println!("✅ 任务 5：全 Copy 字段的元组也是 Copy");

    // 🧪 实验答案：元组含 String 字段后整体变 Move，
    // let t4 = t3; 后再读 t3.1 报 E0382。
    // 记忆口诀：Copy 是"全栈数据"的特权，沾上一个堆类型就失效。
}
