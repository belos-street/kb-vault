// 📖 对应文档：doc/03-composite-types.md §3.1 结构体
// 🎯 任务：定义 struct、实例化、结构体更新语法 ..、元组结构体；感受 ..user1 的所有权陷阱
// ▶️ 运行：cargo run -p ch03-composite-types --bin ex01-struct-basics

#[derive(Debug, Clone)]
struct User {
    username: String,
    email: String,
    active: bool,
    sign_in_count: u64,
}

// 元组结构体 —— 字段没有名字（对比 TS：type Color = [number, number, number]）
struct Color(i32, i32, i32);

fn main() {
    // ─── 任务 1：创建实例 ────────────────────────────────
    // user1 已经写好——注意：所有字段必须显式初始化，不能像 JS 那样缺省
    let user1 = User {
        username: String::from("someone"),
        email: String::from("someone@example.com"),
        active: true,
        sign_in_count: 1,
    };
    assert_eq!(user1.sign_in_count, 1);
    println!("✅ 任务 1：struct 实例化（类似 TS 对象字面量，但字段不可缺省）");

    // ─── 任务 2：结构体更新语法 ..（类似 JS spread）────────
    // ⚠️ doc 警告：直接 ..user1 会 move 未显式指定的 String 字段，user1 整体失效！
    // TODO：自己写完整的 user2 构造——email 换新，其余字段从 user1 复用，
    //       且保证下面的 user1 断言能编译通过（.. 后面写什么？）
    let user2: User = todo!(); // 提示：User { email: ..., ..??? }

    assert_eq!(user2.username, "someone");
    // 下面这行能编译通过 = user1 没被 move ✅
    assert_eq!(user1.sign_in_count, 1);
    println!("✅ 任务 2：.. 复用字段且 user1 存活（所有权陷阱的解法）");

    // ─── 任务 3：元组结构体 ──────────────────────────────
    // TODO：创建 Color 实例 black，值为 (0, 0, 0)
    let black: Color = todo!();

    assert_eq!(black.0, 0, "元组结构体用 .0/.1/.2 访问");
    println!("✅ 任务 3：元组结构体 = 新类型包装（区别于普通元组）");

    // ─── 🧪 实验：..user1 的所有权陷阱 ────────────────────
    // 任务 2 你写的应该是 ..user1.clone()。把它改成直接 ..user1，观察 E0382：
    // user1 的 username/email 被 move 进 user2，后续使用 user1 直接报错
    //
    // println!("{:?}", user1);
    //
    // 思考：如果 User 的字段全是 Copy 类型（i32/bool），
    // ..user1 之后 user1 还能用吗？（答案：能——Copy 字段是拷贝不是 move）

    println!("\n🎉 ex01 全部通过！下一步：ex02-methods-impl");
}
