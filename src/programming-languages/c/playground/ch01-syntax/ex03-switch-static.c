// 📖 对应文档：doc/01-basic-syntax.md §1.6 控制流 + §1.7 函数（static）
// 🎯 任务：switch 的 fall-through 穿透行为；static 局部变量只初始化一次（doc 本章练习 3）
// ▶️ 运行：make run EX=ex03-switch-static（在 playground 目录下）
//
// 规则：TODO 处需要你实现；🧪 实验需取消注释观察行为，看完恢复注释。

#include <stdio.h>
#include "../common/check.h"

// ─── 任务 1：用 switch 实现简易计算器 ──────────────────────
// TODO：'+' 返回 a+b，'-' 返回 a-b，其他字符返回 0
// ⚠️ 每个 case 记得 break —— 不写会 fall-through 穿透到下一个 case！
int apply(char op, int a, int b) {
    int result = 0;
    switch (op) {
        case '+':
            // TODO: result = a + b; 后加 break;
        case '-':
            // TODO: result = a - b; 后加 break;
        default:
            result = 0;
    }
    return result;
}

// ─── 任务 2：static 局部变量 ───────────────────────────────
// TODO：实现 next_id()：第 1 次调用返回 1，第 2 次返回 2……
// 关键：static 局部变量只在第一次调用时初始化，函数退出后值保留（选择题考过）
int next_id(void) {
    static int cnt = 0;   // 脚手架已给出，想想下面写什么
    // TODO: 先自增再返回
    return cnt;
}

int main() {
    // ─── 任务 1 检验 ────────────────────────────────────────
    CHECK(apply('+', 3, 4) == 7, "任务 1a：apply('+',3,4) == 7");
    CHECK(apply('-', 3, 4) == -1, "任务 1b：apply('-',3,4) == -1");
    CHECK(apply('*', 3, 4) == 0, "任务 1c：未知运算符走 default 返回 0");

    // ─── 任务 2 检验（doc 练习 3：连续调用的输出）──────────
    CHECK(next_id() == 1, "任务 2a：第 1 次调用返回 1");
    CHECK(next_id() == 2, "任务 2b：第 2 次调用返回 2");
    CHECK(next_id() == 3, "任务 2c：第 3 次调用返回 3 —— static 的值跨调用保留");

    // ─── 🧪 实验：亲眼看看 fall-through ─────────────────────
    // 把 apply 里 case '+' 和 case '-' 的 break 注释掉（如果已经写了），
    // 重跑观察哪些 CHECK 变红：'+' 命中后会一路"掉"到 default。
    //
    // 思考：什么场景故意利用 fall-through？—— 连续 case 共用一段逻辑：
    // case 'a': case 'A': printf("字母 A"); break;   // 两个标签同一动作

    CHECK_END("ex03-switch-static");
    return 0;
}
