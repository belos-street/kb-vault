// ✅ 答案：ch04/ex03-trait-bounds（做完再看！）
// 关键点：&impl Trait 是 <T: Trait> 的语法糖；where 管复杂签名；impl Trait 返回单一类型
trait Summary {
    fn summarize(&self) -> String;
}

struct NewsArticle {
    headline: String,
    author: String,
}

struct Tweet {
    username: String,
    content: String,
}

impl Summary for NewsArticle {
    fn summarize(&self) -> String {
        format!("{} (by {})", self.headline, self.author)
    }
}

impl Summary for Tweet {
    fn summarize(&self) -> String {
        format!("{}: {}", self.username, self.content)
    }
}

// 写法 A：&impl Trait —— 简单场景首选，签名最短
fn notify_a(item: &impl Summary) -> String {
    format!("Breaking! {}", item.summarize())
}

// 写法 B：完整 bound —— 与 A 编译后完全相同（单态化结果一致）
fn notify_b<T: Summary>(item: &T) -> String {
    format!("Breaking! {}", item.summarize())
}

// where 子句：泛型多、约束多时签名更清爽
fn notify_all<T, U>(a: &T, b: &U) -> String
where
    T: Summary,
    U: Summary,
{
    format!("{} | {}", a.summarize(), b.summarize())
}

// -> impl Trait：调用者只知道"返回了 Summary"，不关心具体类型
fn make_tweet() -> impl Summary {
    Tweet {
        username: String::from("belos"),
        content: String::from("learning rust"),
    }
}

fn main() {
    let article = NewsArticle {
        headline: String::from("Rust 1.98 released"),
        author: String::from("rust team"),
    };
    let tweet = Tweet {
        username: String::from("belos"),
        content: String::from("learning rust"),
    };

    assert_eq!(
        notify_a(&article),
        "Breaking! Rust 1.98 released (by rust team)"
    );
    assert_eq!(notify_b(&article), notify_a(&article));

    assert_eq!(
        notify_all(&article, &tweet),
        "Rust 1.98 released (by rust team) | belos: learning rust"
    );

    let t = make_tweet();
    assert_eq!(t.summarize(), "belos: learning rust");

    println!("✅ 任务 1：&impl Trait vs <T: Summary>——签名不同，行为相同");
    println!("✅ 任务 2：where 子句（泛型参数多、签名太长时更清晰）");
    println!("✅ 任务 3：-> impl Trait 返回值（调用者无需知道具体类型）");

    // 🧪 实验答案：make_tweet 条件返回两种类型 → E0308。
    // -> impl Trait 是"编译期固定的一种类型"，不是"任意 Summary"。
    // 需要运行时多选一 → Box<dyn Summary>（trait 对象，第 6 章 dyn 话题）。
}
