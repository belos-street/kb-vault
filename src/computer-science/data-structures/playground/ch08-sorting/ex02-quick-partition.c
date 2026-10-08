// 📖 对应文档：../doc/08-sorting.md §8.3.2 快速排序 + §8.9 荷兰国旗（2016 真题）
// 🎯 任务：Partition 一趟划分（408 必考推演）+ 快排递归 + 三指针三向划分
// ▶️ 运行：make run EX=ex02-quick-partition（在 playground 目录下）

#include <stdio.h>
#include <stdbool.h>
#include "../common/check.h"

// ─── 任务 1：一趟划分（教材版，取 A[low] 为枢轴）────────────
// 口诀：high 左移找小 → 填左坑；low 右移找大 → 填右坑；相遇处落枢轴
// TODO：pivot = A[low]；while (low < high) { 内层 high 找 < 枢轴的填 A[low]；
//      内层 low 找 <= 枢轴的……最终 A[low] = pivot; return low; }
// ⚠️ 内层循环条件别丢 low < high！
int Partition(int A[], int low, int high) {
    return 0;   // TODO
}

// ─── 任务 2：快速排序递归 ──────────────────────────────────
// TODO：low < high 时：pivotpos = Partition → 递归左右两段
void QuickSort(int A[], int low, int high) {
    // TODO
}

// ─── 任务 3：荷兰国旗问题（2016 真题改编：0/1/2 三向划分）───
// ⚠️ 本任务用 0 起点数组 A[0..n-1]（真题原味），与本章其他练习的 1 起点不同
// 三指针：i 是 0 区右边界后一位，k 是 2 区左边界前一位，j 扫描：
//   遇 0 → 换到 0 区（i、j 同时前进）；遇 1 → 跳过；
//   遇 2 → 换到 2 区（k--，j 不动 —— 换回的值未检查过！）
// TODO
void Flag_Netherlands(int A[], int n) {
    // TODO
}

static bool SeqEquals(const int A[], const int expect[], int n) {
    for (int i = 0; i < n; i++)
        if (A[i] != expect[i]) return false;
    return true;
}

int main() {
    // 任务 1 检验（文档 §8.10 例 1，1 起点数组）
    int A[] = {0, 46, 79, 56, 38, 40, 84};
    int pos = Partition(A, 1, 6);
    CHECK(pos == 3, "任务 1a：枢轴 46 落位第 3 位（返回下标 3）");
    int expect1[] = {0, 40, 38, 46, 56, 79, 84};
    CHECK(SeqEquals(A, expect1, 7), "任务 1b：一趟后 {40,38,46,56,79,84}（左≤46≤右）");

    // 任务 2 检验：整体排序
    int B[] = {0, 46, 79, 56, 38, 40, 84};
    QuickSort(B, 1, 6);
    int sorted[] = {0, 38, 40, 46, 56, 79, 84};
    CHECK(SeqEquals(B, sorted, 7), "任务 2：快排完成升序");

    // 任务 3 检验：{2,0,1,2,1,0} → {0,0,1,1,2,2}
    int C[] = {2, 0, 1, 2, 1, 0};
    Flag_Netherlands(C, 6);
    int dutch[] = {0, 0, 1, 1, 2, 2};
    CHECK(SeqEquals(C, dutch, 6), "任务 3a：三向划分 O(n)、O(1)");
    int D[] = {1, 2, 0, 2, 0, 1};
    Flag_Netherlands(D, 6);
    int dutch2[] = {0, 0, 1, 1, 2, 2};
    CHECK(SeqEquals(D, dutch2, 6), "任务 3b：注意遇 2 换回后 j 不动（换回的未检查）");

    CHECK_END("ex02-quick-partition");
    return 0;
}
