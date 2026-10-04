// ✅ 答案：ch05/ex03-iterators-closures（做完再看！）
// 关键点：filter/map/sum 惰性链；闭包三种捕获方式；move 拿所有权
fn sum_even_squares_for(nums: &[i32]) -> i32 {
    let mut sum = 0;
    for n in nums {
        let n = *n; // n 是 &i32，解引用成 i32
        if n % 2 == 0 {
            sum += n * n;
        }
    }
    sum
}

fn sum_even_squares_iter(nums: &[i32]) -> i32 {
    nums.iter()
        .filter(|x| *x % 2 == 0) // x 是 &&i32，*x 到 i32
        .map(|x| x * x)          // x 是 &i32，&i32 * &i32 → i32
        .sum()                   // 消费者触发执行（惰性链在这里才跑）
}

fn main() {
    let nums = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

    assert_eq!(sum_even_squares_for(&nums), 220);
    assert_eq!(sum_even_squares_iter(&nums), 220);

    let base = 10;
    let add_base = |x: i32| x + base;
    assert_eq!(add_base(5), 15);
    assert_eq!(base, 10);

    let mut count = 0;
    let mut increment = || count += 1;
    increment();
    increment();
    increment();
    assert_eq!(count, 3);

    let s = String::from("own me");
    let consume = move || s.len();
    assert_eq!(consume(), 6);
    assert_eq!(consume(), 6);

    let evens: Vec<&i32> = nums.iter().filter(|x| *x % 2 == 0).take(2).collect();
    assert_eq!(evens, vec![&2, &4]);

    println!("✅ 任务 1：偶数平方和 = 220（for 版 vs 迭代器版）");
    println!("✅ 任务 2：闭包捕获环境（对比 JS 作用域链）");
    println!("✅ 任务 3：闭包可变捕获（借用检查保证没有并发修改）");
    println!("✅ 任务 4：move 闭包拥有 s（线程闭包必须 move，第 6 章）");
    println!("✅ 任务 5：惰性链——take(2) 只消费前 2 个（JS 的 filter 会先跑完全数组）");

    // 两种实现对照：迭代器版没有中间集合、只遍历一次；
    // JS 的 .filter().map() 每步都新建数组。Rust 编译后性能等价甚至更好（零成本抽象）。
    // 解引用小抄：iter() 的 filter 闭包参数是 &&i32（引用的引用），
    // 因为 filter 把"迭代产生的 &i32"再引用一次传给你。
}
