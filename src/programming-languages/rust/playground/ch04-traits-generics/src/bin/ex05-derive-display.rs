// 📖 对应文档：doc/04-traits-generics.md §4.4 常用标准库 Trait
// 🎯 任务：#[derive] 一行批量实现 trait + 手动实现 Display
// ▶️ 运行：cargo run -p ch04-traits-generics --bin ex05-derive-display

use std::fmt;

// derive 一行 = 自动实现 7 个 trait（Debug/Clone/Copy/PartialEq/Eq/PartialOrd/Ord）
// 元组结构体 Level(u8) —— 单值包装，全 Copy 字段所以整体 Copy
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord)]
struct Level(u8);

// 带单位的金额 —— Display 无法 derive（格式化因人而异），必须手动实现
// 对比 Java 的 toString() / Python 的 __str__
struct Amount(f64);

// TODO：实现 Display —— 用 write!(f, "{} 元", self.0) 输出
// 提示：write! 返回 fmt::Result，作为函数体最后一行（无分号）即可
impl fmt::Display for Amount {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        todo!()
    }
}

fn main() {
    // ─── 任务 1：derive(Ord) 排序 ────────────────────────
    // derived Ord 按字段顺序比较（元组结构体按内部值）
    let mut levels = vec![Level(3), Level(1), Level(2)];
    levels.sort();
    assert_eq!(levels, vec![Level(1), Level(2), Level(3)]);
    println!("✅ 任务 1：derive(Ord) 让 sort() 直接可用");

    // ─── 任务 2：Debug 格式化 ────────────────────────────
    println!("Debug 输出：{:?}", Level(3));
    assert_eq!(format!("{:?}", Level(3)), "Level(3)");
    println!("✅ 任务 2：derive(Debug) 支持 {{:?}}（调试输出）");

    // ─── 任务 3：手动 Display ────────────────────────────
    let a = Amount(12.5);
    assert_eq!(format!("{}", a), "12.5 元");
    println!("✅ 任务 3：手动实现 Display（{{}} 格式化，面向用户）");

    // ─── 🧪 实验：没有 Display 就不能用 {} ────────────────
    // 注释掉上面的 impl fmt::Display for Amount，观察 E0277：
    // `Amount` doesn't implement `std::fmt::Display`
    // 编译器还会贴心提示：考虑用 {:?}（前提是 derive 了 Debug）
    // 记忆：{:?} 给程序员看（derive 就行），{} 给用户看（手动写格式）

    println!("\n🎉 ex05 全部通过！第 4 章练习完成 🎊");
    println!("▶️ 下一章：cargo run -p ch05-practical-skills --bin ex01-vec");
}
