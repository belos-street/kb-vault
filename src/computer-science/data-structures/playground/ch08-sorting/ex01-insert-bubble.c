// 📖 对应文档：../doc/08-sorting.md §8.2 直接插入 + §8.3.1 冒泡
// 🎯 任务：两个"最好情况 O(n)"的排序 —— 哨兵插入与 flag 提前结束
// ▶️ 运行：make run EX=ex01-insert-bubble（在 playground 目录下）
//
// 约定：关键字简化为 int（考试记录可能是 struct，用 A[i].key，逻辑一致）；
//      数组 1 起点存放，A[0] 作哨兵/暂存 —— 与文档代码一致。

#include <stdio.h>
#include <stdbool.h>
#include "../common/check.h"

static int cmp_count = 0;   // 比较计数器（在比较处累计）

// ─── 任务 1：直接插入排序（哨兵版默写，文档 §8.2.1）─────────
// TODO：i 从 2 到 n；A[i] < A[i-1] 时才插入：A[0]=A[i]，
//      for (j=i-1; A[0] < A[j]; --j) A[j+1]=A[j]（比较处 cmp_count++），
//      A[j+1]=A[0]
void InsertSort(int A[], int n) {
    // TODO
}

// ─── 任务 2：冒泡排序（从前往后沉底 + flag 提前结束）────────
// TODO：i 从 1 到 n-1；flag=false；j 从 1 到 n-i：A[j] > A[j+1] 则交换
//      （比较处 cmp_count++）并 flag=true；本趟无交换 → return
void BubbleSort(int A[], int n) {
    // TODO
}

int main() {
    // 任务 1 检验：文档 §8.2.1 推演序列
    int A[] = {0, 46, 79, 56, 38, 40, 84};   // A[0] 占位
    InsertSort(A, 6);
    CHECK(A[1]==38 && A[2]==40 && A[3]==46 && A[4]==56 && A[5]==79 && A[6]==84,
          "任务 1a：{46,79,56,38,40,84} 升序完成");

    // 最好情况（正序）：只比较 n-1 次、0 次移动 → O(n)
    int B[] = {0, 1, 2, 3, 4, 5, 6};
    cmp_count = 0;
    InsertSort(B, 6);
    CHECK(cmp_count == 5, "任务 1b：正序输入比较 n-1 = 5 次（每个只需与哨兵比一次）");

    // 任务 2 检验：文档 §8.3.1 推演序列
    int C[] = {0, 46, 79, 56, 38, 40, 84};
    BubbleSort(C, 6);
    CHECK(C[1]==38 && C[2]==40 && C[3]==46 && C[4]==56 && C[5]==79 && C[6]==84,
          "任务 2a：冒泡升序完成（每趟最大值沉底）");

    // 正序输入 + flag → 第 1 趟无交换提前结束，比较恰好 n-1 次
    int D[] = {0, 1, 2, 3, 4, 5, 6};
    cmp_count = 0;
    BubbleSort(D, 6);
    CHECK(cmp_count == 5, "任务 2b：flag 提前结束，正序比较 n-1 = 5 次 → O(n)");

    CHECK_END("ex01-insert-bubble");
    return 0;
}
