// ✅ 答案：ch03/ex01-struct-basics（做完再看！）
// 关键点：字段必须全初始化；..spread 会 move 非 Copy 字段；元组结构体 .0 访问
#[derive(Debug, Clone)]
struct User {
    username: String,
    email: String,
    active: bool,
    sign_in_count: u64,
}

struct Color(i32, i32, i32);

fn main() {
    let user1 = User {
        username: String::from("someone"),
        email: String::from("someone@example.com"),
        active: true,
        sign_in_count: 1,
    };
    assert_eq!(user1.sign_in_count, 1);

    let user2 = User {
        email: String::from("another@example.com"),
        ..user1.clone() // 深拷贝 user1，两个实例各自独立
    };
    assert_eq!(user2.username, "someone");
    assert_eq!(user1.sign_in_count, 1); // user1 存活

    let black = Color(0, 0, 0);
    assert_eq!(black.0, 0);

    println!("✅ 任务 1：struct 实例化（类似 TS 对象字面量，但字段不可缺省）");
    println!("✅ 任务 2：.. 复用字段且 user1 存活（所有权陷阱的解法）");
    println!("✅ 任务 3：元组结构体 = 新类型包装（区别于普通元组）");

    // 🧪 实验答案：..user1 会把 username/email（String，非 Copy）move 进 user2，
    // user1 整体失效 → 后续使用 E0382。解法三选一：
    //   a) ..user1.clone()      保留 user1（本答案，任务 2 的目标写法）
    //   b) 只用 user2，不再碰 user1
    //   c) 字段全是 Copy 类型时 ..user1 天然安全
    // 对比 JS：spread { ...obj } 永远浅拷贝无副作用——Rust 把这个差异变成了编译期约束。
}
