// 📖 对应文档：doc/02-pointers-and-arrays.md §2.4 指针与数组 + 本章练习 1
// 🎯 任务：a[i] ⟺ *(a+i)；指针版找最大值（双指针模板）；原地逆置（doc 练习 1）
// ▶️ 运行：make run EX=ex04-pointer-arithmetic（在 playground 目录下）
//
// 规则：TODO 处需要你实现；🧪 实验需取消注释观察行为，看完恢复注释。

#include <stdio.h>
#include "../common/check.h"

// ─── 任务 2：指针版找最大值（doc §2.4 双指针模板默写）──────
// 模板：max 指向当前最大元素，p 从第二个元素扫到末尾
// TODO：实现它（用指针遍历，别用下标版）
int find_max(int a[], int n) {
    return 0;   // TODO：int *max = a; for (int *p = a + 1; p < a + n; p++) ...
}

// ─── 任务 3：原地逆置（doc 本章练习 1，头尾双下标）─────────
// TODO：头尾两个下标向中间走，逐对交换
void reverse(int a[], int n) {
    // TODO：int i = 0, j = n - 1; while (i < j) { 交换 a[i]、a[j]; i++; j--; }
}

int main() {
    int a[5] = {1, 2, 3, 4, 5};
    int *p = a;   // 数组名退化为指向首元素的指针（a == &a[0]）

    // ─── 任务 1：下标访问 ⟺ 指针算术 ───────────────────────
    CHECK(a[2] == *(a + 2), "事实：a[2] 就是 *(a+2)（下标只是语法糖）");
    CHECK(p[1] == 2, "事实：指针也能用下标 p[1] ⟺ *(p+1)");

    int third = 0;
    // TODO：只用指针算术（不许写 a[2]）取第 3 个元素
    // 你的代码：

    CHECK(third == 3, "任务 1：*(p + 2) 取到第 3 个元素");

    // ─── 任务 2 检验 ────────────────────────────────────────
    CHECK(find_max(a, 5) == 5, "任务 2a：{1,2,3,4,5} 最大值 5");
    int neg[4] = {-7, -1, -9, -3};
    CHECK(find_max(neg, 4) == -1, "任务 2b：负数数组也能找对");

    // ─── 任务 3 检验 ────────────────────────────────────────
    reverse(a, 5);
    CHECK(a[0] == 5 && a[4] == 1, "任务 3a：逆置后首尾互换");
    CHECK(a[1] == 4 && a[2] == 3, "任务 3b：中间部分也对");
    int one[1] = {42};
    reverse(one, 1);
    CHECK(one[0] == 42, "任务 3c：单元素逆置 = 无操作（边界）");

    // ─── 🧪 实验：指针 +1 到底走了多远 ──────────────────────
    // 取消注释重跑：两个地址的差不是 1 字节，是 1 个元素（4 字节）！
    // 指针算术的单位由指针类型决定 —— 类型错了，步长和解引用全错。
    //
    // printf("p   = %p\n", (void *)p);
    // printf("p+1 = %p\n", (void *)(p + 1));
    // printf("相差 %ld 字节 = sizeof(int)\n", (long)((char *)(p + 1) - (char *)p));

    CHECK_END("ex04-pointer-arithmetic");
    return 0;
}
