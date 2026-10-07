// ✅ 答案：ch01/ex04-sum（做完再看！）
// 关键点：for + 累加器；边界 n=0/n=1 必测；公式版 O(1) 对比循环版 O(n)
#include <stdio.h>
#include "../common/check.h"

int sum(int n) {
    int total = 0;
    for (int i = 1; i <= n; i++) {   // i <= n：n=1 时也要跑到
        total += i;
    }
    return total;
}

int sum_formula(int n) {
    return n * (n + 1) / 2;   // 等差数列公式，时间 O(1)
}

int main() {
    CHECK(sum(100) == 5050, "任务 1a：sum(100) == 5050");
    CHECK(sum(0) == 0, "任务 1b：sum(0) == 0（边界：循环一次不跑）");
    CHECK(sum(1) == 1, "任务 1c：sum(1) == 1（边界：只跑一次）");

    CHECK(sum_formula(100) == 5050, "任务 2a：公式版同样得 5050");
    CHECK(sum_formula(0) == 0, "任务 2b：公式版 n=0 也对");
    CHECK(sum(100) == sum_formula(100), "任务 2c：两版本结果一致");

    // 🧪 实验答案：条件改成 i < n 后 sum(1) = 0、sum(100) = 4950，
    // 差一错误当场现形。手写算法题写完先用 n=0、n=1 验边界。

    CHECK_END("ch01-ex04-sum");
    return 0;
}
