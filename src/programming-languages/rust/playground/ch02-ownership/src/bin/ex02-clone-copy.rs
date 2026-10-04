// 📖 对应文档：doc/02-ownership-borrowing.md §2.2 克隆（Clone）和拷贝（Copy）
// 🎯 任务：分清三种行为——Move（转移）、Clone（显式深拷贝）、Copy（自动浅拷贝）
// ▶️ 运行：cargo run -p ch02-ownership --bin ex02-clone-copy

// 注意参数是 i32（Copy 类型）：按值传参时自动拷贝，调用方变量不受影响
fn double(n: i32) -> i32 {
    n * 2
}

// 注意参数是 String（Move 类型）：调用后原变量失效
fn shout(s: String) -> String {
    s.to_uppercase()
}

fn main() {
    // ─── 任务 1：Clone 深拷贝——堆数据完整复制 ───────────────
    // TODO：不用 clone 的话 s1 会被 move；用 clone 让两个变量都活着
    let s1 = String::from("rust");
    let s2: String = todo!();

    assert_eq!(s1, "rust", "clone 后 s1 依然可用");
    assert_eq!(s2, "rust");
    println!("✅ 任务 1：clone() 深拷贝堆数据，两个所有者各自独立");

    // ─── 任务 2：Copy 自动拷贝——栈数据随便用 ────────────────
    // 整数、浮点、bool、char 都是 Copy 类型，赋值时自动复制
    let x = 5;
    let y = x; // 这里没有 move！x 是 Copy 类型
    assert_eq!(x + y, 10, "x 和 y 都可用");
    println!("✅ 任务 2：Copy 类型赋值 = 自动浅拷贝（栈上数据）");

    // ─── 任务 3：Copy 类型按值传参无副作用 ──────────────────
    let v = 10;
    assert_eq!(double(v), 20);
    assert_eq!(double(v), 20, "同一个变量传两次？Copy 类型随便传");
    println!("✅ 任务 3：double(v) 调两次，v 还活着——Copy 的功劳");

    // ─── 任务 4：Move 类型按值传参会"耗尽"变量 ───────────────
    // TODO：让两次 shout 都成功编译
    // 第一次调用会 move 掉 msg；想办法让第二次调用也有 String 可传
    let msg = String::from("hey");
    let r1: String = todo!(); // 提示：传 msg.clone()（想想为什么不能直接传 msg）
    let r2: String = todo!();

    assert_eq!(r1, "HEY");
    assert_eq!(r2, "HEY");
    // 这行证明 msg 还活着
    assert_eq!(msg, "hey");
    println!("✅ 任务 4：Move 类型想重复使用，只能 clone");

    // ─── 任务 5：判断一个类型是 Copy 还是 Move ───────────────
    // 规则：实现了 Copy trait 的类型赋值自动拷贝，未实现的就是 Move
    // 元组：所有字段都是 Copy → 整个元组是 Copy
    let t = (1, 2.0, 'a');
    let t2 = t;
    assert_eq!(t.0 + t2.0, 2, "(i32, f64, char) 全是 Copy 类型，整个元组 Copy");
    println!("✅ 任务 5：全 Copy 字段的元组也是 Copy");

    // ─── 🧪 实验：含 String 的元组就不是 Copy 了 ──────────────
    // 取消注释，观察 E0382——只要有一个字段是 Move 类型，整个元组就是 Move
    //
    // let t3 = (1, String::from("x"));
    // let t4 = t3;
    // println!("{}", t3.1);

    println!("\n🎉 ex02 全部通过！下一步：ex03-borrowing");
}
