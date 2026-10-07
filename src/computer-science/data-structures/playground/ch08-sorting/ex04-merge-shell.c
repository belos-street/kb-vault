// 📖 对应文档：../doc/08-sorting.md §8.5 归并排序 + §8.2.3 希尔排序
// 🎯 任务：归并的 Merge 默写 + 希尔排序的"按趟手推"（对应文档推演表逐趟验证）
// ▶️ 运行：make run EX=ex04-merge-shell（在 playground 目录下）

#include <stdio.h>
#include <stdbool.h>
#include "../common/check.h"

static int B[64];   // 归并辅助数组（与 A 等长，空间 O(n) 的来源）

// ─── 任务 1：Merge —— 合并 A[low..mid] 与 A[mid+1..high] ───
// 稳定性关键：相等时取【前段】（<=），保证等值记录相对次序不变
// TODO：先把 A[low..high] 复制到 B；双指针 i=low、j=mid+1 逐个取小
//      放回 A；最后把剩余段整体搬回
void Merge(int A[], int low, int mid, int high) {
    (void)B;   // 防未使用警告，实现后可删
    // TODO
}

// ─── 任务 2：二路归并排序（递归）───────────────────────────
// TODO：low < high：mid = (low+high)/2 → 递归左 → 递归右 → Merge
void MergeSort(int A[], int low, int high) {
    // TODO
}

// ─── 任务 3：希尔排序的"单趟"（增量 d 的组内直接插入）───────
// TODO：i 从 d+1 到 n：A[i] < A[i-d] 时，组内步长为 d 的插入
//      （A[0]=A[i]；j = i-d 起 A[0] < A[j] 则后移 j -= d；落位 A[j+d]=A[0]）
void ShellPass(int A[], int n, int d) {
    // TODO
}

static bool SeqEquals(const int A[], const int expect[], int n) {
    for (int i = 0; i < n; i++)
        if (A[i] != expect[i]) return false;
    return true;
}

int main() {
    // 任务 1+2 检验：文档 §8.5.2 归并推演（MergeSort 不碰 A[0]，可整体比对）
    int A[] = {0, 46, 79, 56, 38, 40, 84};
    MergeSort(A, 1, 6);
    int sorted[] = {0, 38, 40, 46, 56, 79, 84};
    CHECK(SeqEquals(A, sorted, 7), "任务 2a：二路归并升序完成（趟数 ⌈log2 6⌉ = 3）");

    // 稳定性验证：相等关键字（用负数区分标记不了，改验证 4 段合并正确性）
    int M[] = {0, 2, 4, 6, 1, 3, 5};
    Merge(M, 1, 3, 6);
    int merged[] = {0, 1, 2, 3, 4, 5, 6};
    CHECK(SeqEquals(M, merged, 7), "任务 1a：Merge 合并两个有序段 {2,4,6}+{1,3,5}");

    // 任务 3 检验：文档 §8.2.3 希尔推演（n=8），逐趟比对
    // ⚠️ ShellPass 用 A[0] 作暂存，比对从下标 1 开始
    int S[] = {0, 40, 38, 65, 97, 76, 13, 27, 49};
    ShellPass(S, 8, 4);   // d=4：组 (40,76)(38,13)(65,27)(97,49)
    int after4[] = {40, 13, 27, 49, 76, 38, 65, 97};
    CHECK(SeqEquals(S + 1, after4, 8), "任务 3a：d=4 一趟后 {40,13,27,49,76,38,65,97}");

    ShellPass(S, 8, 2);   // d=2
    int after2[] = {27, 13, 40, 38, 65, 49, 76, 97};
    CHECK(SeqEquals(S + 1, after2, 8), "任务 3b：d=2 一趟后 {27,13,40,38,65,49,76,97}");

    ShellPass(S, 8, 1);   // d=1：最后一趟就是直接插入
    int final[] = {13, 27, 38, 40, 49, 65, 76, 97};
    CHECK(SeqEquals(S + 1, final, 8), "任务 3c：d=1 后完成（希尔最后一趟必为 1）");

    CHECK_END("ex04-merge-shell");
    return 0;
}
