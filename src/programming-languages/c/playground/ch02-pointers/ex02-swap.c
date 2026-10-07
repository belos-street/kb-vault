// 📖 对应文档：doc/02-pointers-and-arrays.md §2.5 指针传参（本章最重要）+ §1.7 返回多值
// 🎯 任务：体会传值 vs 指针传参；用指针参数带回多个结果
// ▶️ 运行：make run EX=ex02-swap（在 playground 目录下）
//
// 规则：TODO 处需要你实现；🧪 实验需取消注释观察行为，看完恢复注释。

#include <stdio.h>
#include "../common/check.h"

// ❌ 失败版（给定对照）：C 只有传值，x、y 是 a、b 的副本，怎么换都影响不到外面
void swap_wrong(int x, int y) {
    int t = x;
    x = y;
    y = t;
}

// ✅ 任务 1：实现正确版 swap —— 传入地址，解引用交换
void swap(int *x, int *y) {
    // TODO：三步交换（提示：int t 暂存 *x）
}

// ✅ 任务 2：用指针参数"返回"多个值（§1.7：C 不支持多返回值）
// TODO：遍历 a[0..n)，把最小值写进 *mn，最大值写进 *mx
void min_max(int a[], int n, int *mn, int *mx) {
    // TODO
}

int main() {
    int a = 3, b = 5;

    // TODO：调用 swap 交换 a 和 b（想想实参该传什么）
    // 你的代码：

    CHECK(a == 5 && b == 3, "任务 1：swap 后 a=5, b=3");

    int arr[5] = {3, 1, 4, 1, 5};
    CHECK(arr[0] == 3 && arr[4] == 5, "给定：数组按序就位");
    int mn = 0, mx = 0;

    // TODO：调用 min_max 求 arr 的最小/最大值（实参传谁的地址？）
    // 你的代码：

    CHECK(mn == 1 && mx == 5, "任务 2：mn=1, mx=5");

    // ─── 🧪 实验：swap_wrong 为什么没用 ─────────────────────
    // 把上面任务 1 的调用换成 swap_wrong(a, b)，重跑 → 任务 1 的 CHECK 变红。
    // 原因：形参是副本，交换发生在副本身上。
    // 想改调用方的东西 → 传地址。这也是第 3 章链表插入要动头指针时
    // 用二级指针/引用的根由。
    //
    // swap_wrong(a, b);   // 换成这行试试（记得把 swap 的调用注释掉）

    CHECK_END("ex02-swap");
    return 0;
}
