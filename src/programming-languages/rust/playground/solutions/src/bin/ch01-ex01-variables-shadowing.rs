// ✅ 答案：ch01/ex01-variables-shadowing（做完再看！）
// 关键点：mut 用于原地修改；shadowing 用于重新绑定（可换类型）；const 编译期常量
const MAX_POINTS: u32 = 100_000;

fn main() {
    let mut count = 0;
    count += 1;
    count += 1;
    count += 1;
    assert_eq!(count, 3, "count 应该是 3");

    let price = "199";
    // shadowing：新绑定标注 i32，parse() 就知道要解析成什么
    // RHS 的 price 还是旧的 &str——求值先于绑定生效
    let price: i32 = price.parse().expect("price 不是合法数字");
    assert_eq!(price, 199, "price 应该被遮蔽成数字 199");

    let half_points = MAX_POINTS / 2;
    assert_eq!(half_points, 50_000, "MAX_POINTS 的一半是 50000");

    println!("✅ 任务 1：mut 变量可以原地修改");
    println!("✅ 任务 2：shadowing 可以在同名下改变类型（mut 做不到）");
    println!("✅ 任务 3：const 编译期确定，类型必须显式标注");

    // 🧪 实验答案：level 未加 mut，直接赋值报 E0384。
    // 修复方式 a：let mut level = 1;（后续要反复修改时用）
    // 修复方式 b：let level = 2;（只是"换值"，shadowing 更惯用）
    // 这里只赋一次值，语义上 b 更合适。
}
