// ✅ 答案：ch02/ex02-swap（做完再看！）
// 关键点：传值 = 副本无效；f(&x) + *p 修改原变量；指针参数带回多值
#include <stdio.h>
#include "../common/check.h"

void swap_wrong(int x, int y) {
    int t = x;
    x = y;
    y = t;
}

void swap(int *x, int *y) {
    int t = *x;   // 暂存 x 指向的值
    *x = *y;
    *y = t;
}

void min_max(int a[], int n, int *mn, int *mx) {
    *mn = a[0];   // 先假设首元素是最值
    *mx = a[0];
    for (int i = 1; i < n; i++) {
        if (a[i] < *mn) *mn = a[i];
        if (a[i] > *mx) *mx = a[i];
    }
}

int main() {
    int a = 3, b = 5;
    swap(&a, &b);   // 传地址
    CHECK(a == 5 && b == 3, "任务 1：swap 后 a=5, b=3");

    int arr[5] = {3, 1, 4, 1, 5};
    int mn = 0, mx = 0;
    min_max(arr, 5, &mn, &mx);   // 结果变量的地址传进去
    CHECK(mn == 1 && mx == 5, "任务 2：mn=1, mx=5");

    // 🧪 实验答案：swap_wrong(a, b) 交换的是副本，a、b 不变，CHECK 变红。
    // C 只有传值；想改调用方的变量 → 传地址 + 解引用。

    CHECK_END("ch02-ex02-swap");
    return 0;
}
