// 📖 对应文档：../doc/01-introduction.md §1.3 时间复杂度 + §1.4 空间复杂度
// 🎯 任务：用"计数器实测"验证循环执行次数公式与递归的调用次数/深度/移动次数
// ▶️ 运行：make run EX=ex01-complexity-lab（在 playground 目录下）
//
// 规则：TODO 处需要你实现；全部 CHECK 通过后程序会打印 🎉。
// 408 视角：选择题问"执行次数"要给精确值，问"复杂度"只取最高阶 —— 本练习两者都验。

#include <stdio.h>
#include "../common/check.h"

static int counter = 0;   // 全局计数器：模拟"基本操作的执行次数"

// ─── 任务 2：递归调用次数与最大深度 ────────────────────────
// 408 结论：fact(n) 调用 n+1 次（fact(n)→fact(n-1)→…→fact(0)），
//          递归深度 = n+1，每次调用 O(1) 空间 → 空间复杂度 O(n)
static int call_count = 0;    // 调用次数
static int cur_depth = 0;     // 当前深度
static int max_depth = 0;     // 最大深度（即栈空间需求）

long long fact(int n) {
    // 给定：进入时计数 +1、深度 +1，返回前深度 -1（脚手架，勿改）
    call_count++;
    if (++cur_depth > max_depth) max_depth = cur_depth;
    long long result = 0;
    // TODO：写递归体 —— n <= 0 时返回 1，否则返回 n * fact(n - 1)
    // 你的代码：

    cur_depth--;
    return result;
}

// ─── 任务 3：汉诺塔移动次数（递归计数经典）─────────────────
// 408 结论：n 个盘移动 2^n - 1 次。递推：T(n) = 2*T(n-1) + 1
// TODO：把 n 个盘从 from 借助 mid 移到 to，每移动一个盘 counter++
void hanoi(int n, char from, char mid, char to) {
    // TODO：n == 0 直接返回；否则：上面 n-1 个 from→mid，
    //       第 n 个盘 from→to（counter++），再 n-1 个 mid→to
}

int main() {
    // ─── 任务 1：三种循环模式的精确执行次数 ─────────────────
    // 先笔算填注释里的空，再用计数器实测验证（n = 100）

    // 模式 A：for(i=1..n) for(j=i..n) —— 次数 = n(n+1)/2
    counter = 0;
    for (int i = 1; i <= 100; i++)
        for (int j = i; j <= 100; j++)
            counter++;
    CHECK(counter == 5050, "任务 1a：i..n 嵌套循环执行 n(n+1)/2 = 5050 次 → O(n^2)");

    // 模式 B：i 每次 *2 —— 次数 = ⌈log2(n+1)⌉
    counter = 0;
    for (int i = 1; i <= 100; i *= 2)
        counter++;
    CHECK(counter == 7, "任务 1b：i=1,2,4,...,64 共 7 次 = ⌈log2(101)⌉ → O(log n)");

    // 模式 C：i*i <= n —— 次数 = ⌊√n⌋
    counter = 0;
    for (int i = 1; i * i <= 100; i++)
        counter++;
    CHECK(counter == 10, "任务 1c：i=1..10 共 10 次 = ⌊√100⌋ → O(√n)");

    // ─── 任务 2 检验 ────────────────────────────────────────
    call_count = cur_depth = max_depth = 0;
    CHECK(fact(5) == 120, "任务 2a：fact(5) == 120");
    CHECK(call_count == 6, "任务 2b：fact(5) 调用 6 次（5→4→3→2→1→0）");
    CHECK(max_depth == 6, "任务 2c：最大递归深度 6 = 栈空间 O(n) 的来源");

    // ─── 任务 3 检验 ────────────────────────────────────────
    counter = 0;
    hanoi(3, 'A', 'B', 'C');
    CHECK(counter == 7, "任务 3a：3 个盘移动 2^3 - 1 = 7 次");
    counter = 0;
    hanoi(10, 'A', 'B', 'C');
    CHECK(counter == 1023, "任务 3b：10 个盘移动 2^10 - 1 = 1023 次（指数阶 O(2^n)）");

    CHECK_END("ex01-complexity-lab");
    return 0;
}
