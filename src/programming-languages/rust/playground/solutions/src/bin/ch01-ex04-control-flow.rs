// ✅ 答案：ch01/ex04-control-flow（做完再看！）
// 关键点：for + Range、loop 表达式带值退出、if/else 分支顺序
fn main() {
    // 任务 1：for 循环累加
    let mut sum = 0;
    for i in 1..=100 {
        sum += i;
    }
    assert_eq!(sum, 5050);

    // 任务 2：loop 是表达式，break n 把值带出来
    let mut n: u64 = 1;
    let result = loop {
        n *= 2;
        if n > 1000 {
            break n;
        }
    };
    assert_eq!(result, 1024);

    // 任务 3：FizzBuzz——必须先判 15 的倍数，否则 3/5 的分支会先命中
    fn fizzbuzz(i: i32) -> String {
        if i % 15 == 0 {
            "FizzBuzz".to_string()
        } else if i % 3 == 0 {
            "Fizz".to_string()
        } else if i % 5 == 0 {
            "Buzz".to_string()
        } else {
            i.to_string()
        }
    }

    let mut out: Vec<String> = Vec::new();
    for i in 1..=15 {
        out.push(fizzbuzz(i));
    }
    assert_eq!(out[2], "Fizz");
    assert_eq!(out[4], "Buzz");
    assert_eq!(out[14], "FizzBuzz");
    assert_eq!(out[0], "1");
    assert_eq!(out[8], "Fizz");
    for o in &out {
        print!("{} ", o);
    }
    println!();

    println!("✅ 任务 1：for + Range（类似 JS 的 for-of / Python 的 for-in）");
    println!("✅ 任务 2：loop 是表达式，break 可以带出值（while 做不到）");
    println!("✅ 任务 3：FizzBuzz 完成（顺序很重要，先判 15 的倍数）");
}
