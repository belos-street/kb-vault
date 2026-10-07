// ✅ 答案：ch08/ex01-insert-bubble（做完再看！）
// 关键点：插入哨兵防越界；冒泡 flag 提前结束；两者最好情况都是 n-1 次比较
#include <stdio.h>
#include <stdbool.h>
#include "../common/check.h"

static int cmp_count = 0;

void InsertSort(int A[], int n) {
    for (int i = 2; i <= n; i++) {
        cmp_count++;                        // 与 A[i-1] 的比较（正序输入只有这一次）
        if (A[i] < A[i - 1]) {              // 已有序则不进分支（正序 O(n) 的来源）
            A[0] = A[i];                    // 哨兵：暂存 + 防越界
            int j;
            for (j = i - 1; A[0] < A[j]; --j) {
                cmp_count++;                // 折返比较
                A[j + 1] = A[j];
            }
            cmp_count++;                    // 与哨兵相等/更小的那次比较（终止）
            A[j + 1] = A[0];                // 落位
        }
    }
}

void BubbleSort(int A[], int n) {
    for (int i = 1; i <= n - 1; i++) {
        bool flag = false;                  // 本趟是否发生交换
        for (int j = 1; j <= n - i; j++) {  // 从前向后，大者沉底
            cmp_count++;
            if (A[j] > A[j + 1]) {
                int t = A[j]; A[j] = A[j + 1]; A[j + 1] = t;
                flag = true;
            }
        }
        if (!flag) return;                  // 无交换 → 已有序，提前结束
    }
}

int main() {
    int A[] = {0, 46, 79, 56, 38, 40, 84};
    InsertSort(A, 6);
    CHECK(A[1]==38 && A[2]==40 && A[3]==46 && A[4]==56 && A[5]==79 && A[6]==84,
          "任务 1a：直接插入升序完成");
    int B[] = {0, 1, 2, 3, 4, 5, 6};
    cmp_count = 0;
    InsertSort(B, 6);
    CHECK(cmp_count == 5, "任务 1b：正序比较 n-1 = 5 次 → O(n)");
    int C[] = {0, 46, 79, 56, 38, 40, 84};
    BubbleSort(C, 6);
    CHECK(C[1]==38 && C[2]==40 && C[3]==46 && C[4]==56 && C[5]==79 && C[6]==84,
          "任务 2a：冒泡升序完成（每趟最大值沉底）");
    int D[] = {0, 1, 2, 3, 4, 5, 6};
    cmp_count = 0;
    BubbleSort(D, 6);
    CHECK(cmp_count == 5, "任务 2b：flag 提前结束，正序比较 n-1 = 5 次");
    CHECK_END("ch08-ex01-insert-bubble");
    return 0;
}
