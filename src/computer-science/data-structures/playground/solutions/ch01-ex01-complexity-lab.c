// ✅ 答案：ch01/ex01-complexity-lab（做完再看！）
// 关键点：执行次数给精确值、复杂度取最高阶；递归次数/深度 = 栈空间分析
#include <stdio.h>
#include "../common/check.h"

static int counter = 0;

static int call_count = 0, cur_depth = 0, max_depth = 0;

long long fact(int n) {
    call_count++;
    if (++cur_depth > max_depth) max_depth = cur_depth;
    long long result = (n <= 0) ? 1 : n * fact(n - 1);   // 终止条件 + 递推式
    cur_depth--;
    return result;
}

void hanoi(int n, char from, char mid, char to) {
    if (n == 0) return;                 // 0 个盘不用动
    hanoi(n - 1, from, to, mid);        // 上面 n-1 个借 to 到 mid
    counter++;                          // 第 n 个盘 from → to
    hanoi(n - 1, mid, from, to);        // n-1 个借 from 到 to
}

int main() {
    counter = 0;
    for (int i = 1; i <= 100; i++)
        for (int j = i; j <= 100; j++)
            counter++;
    CHECK(counter == 5050, "任务 1a：i..n 嵌套循环执行 n(n+1)/2 = 5050 次 → O(n^2)");

    counter = 0;
    for (int i = 1; i <= 100; i *= 2)
        counter++;
    CHECK(counter == 7, "任务 1b：⌈log2(101)⌉ = 7 次 → O(log n)");

    counter = 0;
    for (int i = 1; i * i <= 100; i++)
        counter++;
    CHECK(counter == 10, "任务 1c：⌊√100⌋ = 10 次 → O(√n)");

    call_count = cur_depth = max_depth = 0;
    CHECK(fact(5) == 120, "任务 2a：fact(5) == 120");
    CHECK(call_count == 6, "任务 2b：调用 6 次");
    CHECK(max_depth == 6, "任务 2c：最大深度 6 → 空间 O(n)");

    counter = 0;
    hanoi(3, 'A', 'B', 'C');
    CHECK(counter == 7, "任务 3a：2^3 - 1 = 7 次");
    counter = 0;
    hanoi(10, 'A', 'B', 'C');
    CHECK(counter == 1023, "任务 3b：2^10 - 1 = 1023 次");

    CHECK_END("ch01-ex01-complexity-lab");
    return 0;
}
