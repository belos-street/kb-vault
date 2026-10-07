// 📖 对应文档：../doc/08-sorting.md §8.4 选择排序（简单选择 + 堆排序 408 必考）
// 🎯 任务：建堆推演逐步验证 + 堆排序 + 简单选择的"比较次数恒定"
// ▶️ 运行：make run EX=ex03-heap-select（在 playground 目录下）
//
// 约定：1 起点数组，A[0] 暂存；升序用大根堆（每趟堆顶与末尾交换）。

#include <stdio.h>
#include <stdbool.h>
#include "../common/check.h"

static int cmp_count = 0;   // 比较计数器

// ─── 任务 1：HeapAdjust —— 将以 k 为根的子树调整为大根堆 ───
// 前提：A[k] 的左右子树已是堆。沿【较大的孩子】向下筛选
// TODO：A[0] = A[k] 暂存；for (i = 2k; i <= len; i *= 2) {
//        i < len 且 A[i] < A[i+1] 则 i++（选大孩子）；
//        A[0] >= A[i] 则 break；否则大孩子上移 A[k]=A[i]，k = i 继续 }
//      最后 A[k] = A[0]（比较处 cmp_count++）
void HeapAdjust(int A[], int k, int len) {
    // TODO
}

// ─── 任务 2：BuildMaxHeap —— 自底向上建堆 ──────────────────
// 为什么从 ⌊n/2⌋ 开始？下标 ⌊n/2⌋+1 ~ n 全是叶子，天然满足堆性质
// TODO：for (i = n/2; i > 0; i--) HeapAdjust(A, i, n);
void BuildMaxHeap(int A[], int n) {
    // TODO
}

// ─── 任务 3：堆排序（建堆 + n-1 趟"交换堆顶与末尾再调整"）──
// TODO：BuildMaxHeap；for (i = n; i > 1; i--) { 交换 A[1] 与 A[i]；
//      HeapAdjust(A, 1, i-1); }
void HeapSort(int A[], int n) {
    // TODO
}

// ─── 任务 4：简单选择排序 ──────────────────────────────────
// TODO：i 从 1 到 n-1：在 A[i..n] 中选最小下标 min，min != i 则交换
//      （比较处 cmp_count++）
void SelectSort(int A[], int n) {
    // TODO
}

static bool SeqEquals(const int A[], const int expect[], int n) {
    for (int i = 0; i < n; i++)
        if (A[i] != expect[i]) return false;
    return true;
}

int main() {
    // 任务 1+2 检验：文档 §8.4.2 建堆推演 → 初始堆 {84,79,56,38,40,46}
    int A[] = {0, 46, 79, 56, 38, 40, 84};
    BuildMaxHeap(A, 6);
    int heap[] = {0, 84, 79, 56, 38, 40, 46};
    CHECK(SeqEquals(A, heap, 7), "任务 2a：建堆后 {84,79,56,38,40,46}（自 i=3 起）");

    // 任务 3 检验：堆排序完成升序（第 1 趟输出 84，第 2 趟输出 79……）
    HeapSort(A, 6);
    int sorted[] = {0, 38, 40, 46, 56, 79, 84};
    CHECK(SeqEquals(A, sorted, 7), "任务 3a：堆排序升序完成");

    // 任务 4 检验：排序正确 + 比较次数恒为 n(n-1)/2（与初始状态无关）
    int B[] = {0, 46, 79, 56, 38, 40, 84};
    cmp_count = 0;
    SelectSort(B, 6);
    CHECK(SeqEquals(B, sorted, 7), "任务 4a：简单选择升序完成");
    CHECK(cmp_count == 15, "任务 4b：比较 5+4+3+2+1 = 15 = n(n-1)/2（正序也不例外）");

    int C[] = {0, 1, 2, 3, 4, 5, 6};
    cmp_count = 0;
    SelectSort(C, 6);
    CHECK(cmp_count == 15, "任务 4c：正序输入同样比较 15 次（移动少但比较恒定）");

    CHECK_END("ex03-heap-select");
    return 0;
}
