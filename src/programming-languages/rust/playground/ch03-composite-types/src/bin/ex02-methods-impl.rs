// 📖 对应文档：doc/03-composite-types.md §3.2 方法（Method）
// 🎯 任务：impl 块、&self / &mut self / 关联函数（无 self）——方法与数据分离
// ▶️ 运行：cargo run -p ch03-composite-types --bin ex02-methods-impl

struct Rectangle {
    width: u32,
    height: u32,
}

impl Rectangle {
    // TODO：实现 area —— 返回 width * height
    // 注意 &self 是不可变借用（对比 Java 隐式 this，Rust 显式声明借用方式）
    fn area(&self) -> u32 {
        todo!()
    }

    // TODO：实现 set_width —— 修改字段需要 &mut self
    fn set_width(&mut self, width: u32) {
        todo!()
    }

    // 关联函数（类似 Java/TS 的 static）：第一个参数不是 self，用 :: 调用
    // TODO：实现 square —— 返回边长为 size 的正方形
    fn square(size: u32) -> Rectangle {
        todo!()
    }

    // TODO：实现 is_square —— 宽高相等返回 true
    fn is_square(&self) -> bool {
        todo!()
    }
}

fn main() {
    let mut rect = Rectangle {
        width: 3,
        height: 4,
    };

    assert_eq!(rect.area(), 12, "3 x 4 = 12");
    println!("✅ 任务 1：&self 只读方法（rect 只是借用，还活着）");

    // 注意 rect 声明带 mut——&mut self 方法要求所有者是可变的
    rect.set_width(6);
    assert_eq!(rect.width, 6);
    println!("✅ 任务 2：&mut self 修改字段（调用者也要 mut）");

    let sq = Rectangle::square(5); // 关联函数用 :: 调用（rect.area() 用 . 调用）
    assert_eq!(sq.area(), 25);
    println!("✅ 任务 3：Rectangle::square 关联函数（类似静态方法）");

    assert!(sq.is_square());
    assert!(!rect.is_square());
    println!("✅ 任务 4：is_square 判断");

    // ─── 🧪 实验：方法按值拿走 self 会怎样？ ────────────────
    // 把 area 的签名改成 fn area(self) -> u32 会发生什么？
    //   1. rect.area() 之后 rect 被 move，后续使用报 E0382
    //   2. sq.is_square() 同理
    // 结论：读方法用 &self、改方法用 &mut self、需要消费自身（如 into_bytes）才用 self

    println!("\n🎉 ex02 全部通过！下一步：ex03-enum-with-data");
}
