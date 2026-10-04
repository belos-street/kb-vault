// ✅ 答案：ch02/ex03-borrowing（做完再看！）
// 关键点：& 只读借用、&mut 可写借用；借用是临时的，用完即还
fn calculate_length(s: &String) -> usize {
    s.len() // s 是借用不是所有者，函数结束不会释放值
}

fn append_world(s: &mut String) {
    s.push_str(" world");
}

fn main() {
    let s = String::from("hello");
    let len = calculate_length(&s); // 调用处也要 &
    assert_eq!(len, 5);
    assert_eq!(s, "hello"); // s 依然可用——借用不夺走所有权

    let mut msg = String::from("hello");
    append_world(&mut msg); // msg 声明为 mut，调用处 &mut
    assert_eq!(msg, "hello world");

    let mut note = String::from("read");
    let len_before = calculate_length(&note);
    append_world(&mut note);
    assert_eq!(len_before, 4);
    assert_eq!(note, "read world");

    println!("✅ 任务 1：& 传参 = 只读借用，调用方保留所有权");
    println!("✅ 任务 2：&mut 传参 = 可写借用，修改对调用方可见");
    println!("✅ 任务 3：借用是『临时』的——用完就还，随时可再借");

    // 🧪 实验答案：参数从 &String 改成 String 后，调用即 move，
    // 后续使用 s3 报 E0382。
    // 选择原则：函数要拥有它（保存/返回/修改所有权）→ 按值；
    // 只需要读一眼 → 借用 &T；要改它 → &mut T。
}
