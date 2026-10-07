// ✅ 答案：ch01/ex05-recursion（做完再看！）
// 关键点：递归两要素（终止条件 + 递推式）；递归深度 = 空间复杂度；朴素 fib 是 O(2^n)
#include <stdio.h>
#include "../common/check.h"

int fact(int n) {
    if (n == 0) return 1;          // 终止条件（必须放最前）
    return n * fact(n - 1);        // 递推式
}

int fib(int n) {
    if (n <= 1) return n;          // fib(0)=0, fib(1)=1
    return fib(n - 1) + fib(n - 2);
}

int count_fib_calls(int n) {
    if (n <= 1) return 1;          // 本次调用自己算 1 次
    return 1 + count_fib_calls(n - 1) + count_fib_calls(n - 2);
}

int main() {
    CHECK(fact(5) == 120, "任务 1a：fact(5) == 120");
    CHECK(fact(0) == 1, "任务 1b：fact(0) == 1");

    CHECK(fib(0) == 0, "任务 2a：fib(0) == 0");
    CHECK(fib(1) == 1, "任务 2b：fib(1) == 1");
    CHECK(fib(10) == 55, "任务 2c：fib(10) == 55");

    // 手推对照：calls(0)=calls(1)=1，calls(2)=3，calls(3)=5，
    // calls(4)=9，calls(5)=15 —— 与递归树结点数一致
    CHECK(count_fib_calls(5) == 15, "任务 3a：fib(5) 共 15 次调用");
    CHECK(count_fib_calls(6) == 25, "任务 3b：n 变大调用次数爆炸 → O(2^n)");

    // 🧪 实验答案：注释掉终止条件后 fact 无限递归（n 一直减到负也停不下来），
    // 每层调用都在栈上占空间，最终栈溢出崩溃。终止条件永远是递归第一行。

    CHECK_END("ch01-ex05-recursion");
    return 0;
}
