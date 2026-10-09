// ✅ 答案：ch02/ex04-pointer-arithmetic（做完再看！）
// 关键点：a[i] ⟺ *(a+i)；指针遍历模板；双下标原地逆置
#include <stdio.h>
#include "../common/check.h"

int find_max(int a[], int n) {
    int *max = a;   // max 指向当前最大值所在元素
    for (int *p = a + 1; p < a + n; p++) {
        if (*p > *max) max = p;
    }
    return *max;
}

void reverse(int a[], int n) {
    int i = 0, j = n - 1;
    while (i < j) {
        int t = a[i];
        a[i] = a[j];
        a[j] = t;
        i++;
        j--;
    }
}

int main() {
    int a[5] = {1, 2, 3, 4, 5};
    int *p = a;

    CHECK(a[2] == *(a + 2), "事实：a[2] 就是 *(a+2)");
    CHECK(p[1] == 2, "事实：指针也能用下标");

    int third = *(p + 2);
    CHECK(third == 3, "任务 1：*(p + 2) 取到第 3 个元素");

    CHECK(find_max(a, 5) == 5, "任务 2a：{1,2,3,4,5} 最大值 5");
    int neg[4] = {-7, -1, -9, -3};
    CHECK(find_max(neg, 4) == -1, "任务 2b：负数数组也能找对");

    reverse(a, 5);
    CHECK(a[0] == 5 && a[4] == 1, "任务 3a：逆置后首尾互换");
    CHECK(a[1] == 4 && a[2] == 3, "任务 3b：中间部分也对");
    int one[1] = {42};
    reverse(one, 1);
    CHECK(one[0] == 42, "任务 3c：单元素逆置 = 无操作");

    // 🧪 实验答案：p 与 p+1 的地址相差 4 字节（sizeof(int)）。
    // 指针 +1 的步长 = 所指类型的大小，这就是"指针类型决定一切"。

    CHECK_END("ch02-ex04-pointer-arithmetic");
    return 0;
}
