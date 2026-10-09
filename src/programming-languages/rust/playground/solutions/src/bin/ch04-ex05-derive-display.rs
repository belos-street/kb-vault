// ✅ 答案：ch04/ex05-derive-display（做完再看！）
// 关键点：derive 批量实现；{:?} 调试用 vs {} 用户看；Display 手写 write!
use std::fmt;

#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord)]
struct Level(u8);

struct Amount(f64);

impl fmt::Display for Amount {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        // write! 返回 fmt::Result——作为最后一行表达式返回
        write!(f, "{} 元", self.0)
    }
}

fn main() {
    let mut levels = vec![Level(3), Level(1), Level(2)];
    levels.sort(); // 需要 Ord
    assert_eq!(levels, vec![Level(1), Level(2), Level(3)]);

    assert_eq!(format!("{:?}", Level(3)), "Level(3)");

    let a = Amount(12.5);
    assert_eq!(format!("{}", a), "12.5 元");

    println!("✅ 任务 1：derive(Ord) 让 sort() 直接可用");
    println!("✅ 任务 2：derive(Debug) 支持 {{:?}}（调试输出）");
    println!("✅ 任务 3：手动实现 Display（{{}} 格式化，面向用户）");

    // 🧪 实验答案：注释掉 Display 后 format!("{}", a) 报 E0277，
    // 编译器建议：考虑用 {:?}（若 derive 了 Debug）。
    // 记忆：{:?} 给程序员看（derive 一行），{} 给用户看（手动定义格式）。
    // 金额保留两位小数的版本：write!(f, "{:.2} 元", self.0)。
}
