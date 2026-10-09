// 📖 对应文档：doc/04-traits-generics.md §4.3 Trait Bound
// 🎯 任务：&impl Trait 语法糖、<T: Trait> 完整语法、where 子句、impl Trait 返回值
// ▶️ 运行：cargo run -p ch04-traits-generics --bin ex03-trait-bounds

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

// TODO：写法 A —— &impl Trait 语法糖（最简洁）
//      返回 format!("Breaking! {}", item.summarize())
fn notify_a(item: &impl Summary) -> String {
    todo!()
}

// TODO：写法 B —— 完整 trait bound 语法，功能与 A 完全等价
// 对比 Java：<T extends Summary>
fn notify_b<T: Summary>(item: &T) -> String {
    todo!()
}

// TODO：where 子句版 —— 两个不同类型的参数都要 Summary
//      返回两者摘要用 " | " 拼接
// 提示：签名已给好，实现时分别调用 a.summarize() 和 b.summarize()
fn notify_all<T, U>(a: &T, b: &U) -> String
where
    T: Summary,
    U: Summary,
{
    todo!()
}

// TODO：返回 impl Trait —— 补全 make_tweet 的两个字段（todo!() 替换成字符串）
// 调用者只知道"返回了某个实现了 Summary 的类型"，不知道具体是哪个
fn make_tweet() -> impl Summary {
    Tweet {
        username: todo!(),
        content: todo!(),
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
    assert_eq!(notify_b(&article), notify_a(&article), "两种写法等价");
    println!("✅ 任务 1：&impl Trait vs <T: Summary>——签名不同，行为相同");

    assert_eq!(
        notify_all(&article, &tweet),
        "Rust 1.98 released (by rust team) | belos: learning rust"
    );
    println!("✅ 任务 2：where 子句（泛型参数多、签名太长时更清晰）");

    let t = make_tweet();
    assert_eq!(t.summarize(), "belos: learning rust");
    println!("✅ 任务 3：-> impl Trait 返回值（调用者无需知道具体类型）");

    // ─── 🧪 实验：impl Trait 返回值只能是一种类型 ────────────
    // 让 make_tweet 按条件返回 NewsArticle 或 Tweet，观察 E0308：
    // -> impl Summary 要求所有 return 路径返回同一个具体类型
    // （真正的"不同类型动态分发"需要 dyn Trait —— 第 6 章话题）

    println!("\n🎉 ex03 全部通过！下一步：ex04-from-into");
}
