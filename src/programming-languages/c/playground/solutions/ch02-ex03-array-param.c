// ✅ 答案：ch02/ex03-array-param（做完再看！）
// 关键点：数组参数退化为指针 → 必带 n；行优先地址公式；(i*列数+j)
#include <stdio.h>
#include "../common/check.h"

int array_sum(int a[], int n) {
    int total = 0;
    for (int i = 0; i < n; i++) {
        total += a[i];
    }
    return total;
}

void scale_by(int a[], int n, int k) {
    for (int i = 0; i < n; i++) {
        a[i] *= k;   // a 退化为指针，改的就是 main 里的数组本体
    }
}

int main() {
    int b[5] = {1, 2, 3};
    CHECK(b[3] == 0 && b[4] == 0, "事实：部分初始化后其余元素自动补 0");

    int arr[5] = {1, 2, 3, 4, 5};
    CHECK(array_sum(arr, 5) == 15, "任务 1a：1+2+3+4+5 = 15");
    CHECK(array_sum(arr, 0) == 0, "任务 1b：n=0 时返回 0");

    scale_by(arr, 5, 10);
    CHECK(arr[0] == 10 && arr[4] == 50, "任务 2：数组在函数内被原地修改");

    int m[3][4];
    long diff = &m[2][1] - &m[0][0];   // 指针相减 = 元素个数（行优先：(2*4+1)）
    CHECK(diff == 2 * 4 + 1, "任务 3：&m[2][1] 距首元素 9 个元素");

    // 🧪 实验答案：b[100] 越界读是未定义行为——可能垃圾值、可能正常、可能崩溃。
    // C 不检查边界，考试代码必须自己保证 0 <= i < n。

    CHECK_END("ch02-ex03-array-param");
    return 0;
}
