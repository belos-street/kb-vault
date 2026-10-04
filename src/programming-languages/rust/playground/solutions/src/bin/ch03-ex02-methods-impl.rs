// ✅ 答案：ch03/ex02-methods-impl（做完再看！）
// 关键点：方法与数据分离；&self 读 / &mut self 改 / 无 self 是关联函数
struct Rectangle {
    width: u32,
    height: u32,
}

impl Rectangle {
    fn area(&self) -> u32 {
        self.width * self.height // 表达式返回，无分号
    }

    fn set_width(&mut self, width: u32) {
        self.width = width;
    }

    fn square(size: u32) -> Rectangle {
        Rectangle {
            width: size,
            height: size,
        }
    }

    fn is_square(&self) -> bool {
        self.width == self.height
    }
}

fn main() {
    let mut rect = Rectangle {
        width: 3,
        height: 4,
    };
    assert_eq!(rect.area(), 12);

    rect.set_width(6);
    assert_eq!(rect.width, 6);

    let sq = Rectangle::square(5);
    assert_eq!(sq.area(), 25);

    assert!(sq.is_square());
    assert!(!rect.is_square());

    println!("✅ 任务 1：&self 只读方法（rect 只是借用，还活着）");
    println!("✅ 任务 2：&mut self 修改字段（调用者也要 mut）");
    println!("✅ 任务 3：Rectangle::square 关联函数（类似静态方法）");
    println!("✅ 任务 4：is_square 判断");

    // 🧪 实验答案：fn area(self) 会让方法拿走所有权——
    // rect.area() 后 rect 被 move，后续使用 E0382。
    // 选择：读 &self / 写 &mut self / 消费自身（如 s.into_bytes()）才 self。
}
