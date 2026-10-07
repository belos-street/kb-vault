// 📖 对应文档：doc/01-basic-syntax.md §1.2 程序结构 + §1.3 变量与基本类型
// 🎯 任务：跑通编译运行工具链；验证"char 是 1 字节整数"与类型宽度表（408/计组联考考点）
// ▶️ 运行：make run EX=ex01-hello-types（在 playground 目录下）
//
// 规则：TODO 处需要你实现；🧪 实验需取消注释观察行为，看完恢复注释。
// 全部 CHECK 通过后程序会打印 🎉。

#include <stdio.h>
#include "../common/check.h"

int main() {
    // ─── 任务 1：第一个程序（已写好，确认输出）──────────────
    printf("Hello, 408!\n");   // \n 别丢：不换行输出会黏在一起
    CHECK(1, "任务 1：程序编译运行成功（输出里应有 Hello, 408!）");

    // ─── 任务 2：char 本质是 1 字节整数 ─────────────────────
    // 'A' 的 ASCII 码是 65 —— 字符参与运算时就是整数
    char c = 0;
    // TODO：把 c 赋值为字符 'A'（注意用单引号）
    // 你的代码：

    CHECK(c == 65, "任务 2a：'A' 的 ASCII 码是 65");

    // TODO：用 c 算出下一个字符 'B'，赋给 next（提示：字符可以 +1）
    char next = 0;
    // 你的代码：

    CHECK(next == 'B', "任务 2b：'A' + 1 就是 'B'");

    // ─── 任务 3：用 sizeof 验证类型宽度表 ───────────────────
    // 408 提示：这张表要背（char 1 / short 2 / int 4 / long long 8 / double 8）
    int int_bytes = 0;
    // TODO：用 sizeof(int) 求 int 的字节数
    // 你的代码：

    CHECK(int_bytes == 4, "任务 3a：int 占 4 字节");

    int double_bytes = 0;
    // TODO：用 sizeof(double) 求 double 的字节数
    // 你的代码：

    CHECK(double_bytes == 8, "任务 3b：double 占 8 字节");
    CHECK(sizeof(char) == 1, "任务 3c：char 占 1 字节（给定 CHECK，直接感受）");
    CHECK(sizeof(short) == 2, "任务 3d：short 占 2 字节");
    CHECK(sizeof(long long) == 8, "任务 3e：long long 占 8 字节");

    // ─── 🧪 实验：未初始化的变量是垃圾值 ────────────────────
    // 取消注释重跑：观察打印的"随机数"（可能每次运行都不同），以及编译器警告。
    // 结论：考试代码必须初始化变量（数组同理，见第 2 章）。
    //
    // int garbage;
    // printf("垃圾值 = %d\n", garbage);

    CHECK_END("ex01-hello-types");
    return 0;
}
