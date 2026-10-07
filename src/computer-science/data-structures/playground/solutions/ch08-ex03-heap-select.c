// ✅ 答案：ch08/ex03-heap-select（做完再看！）
// 关键点：建堆自 ⌊n/2⌋ 自底向上；每趟堆顶与末尾交换再调整；简单选择比较恒定
#include <stdio.h>
#include <stdbool.h>
#include "../common/check.h"

static int cmp_count = 0;

void HeapAdjust(int A[], int k, int len) {
    A[0] = A[k];                            // 暂存待调整结点
    for (int i = 2 * k; i <= len; i *= 2) { // 沿孩子向下
        cmp_count++;
        if (i < len && A[i] < A[i + 1])
            i++;                            // 取较大孩子
        if (A[0] >= A[i]) break;            // 已满足堆性质
        A[k] = A[i];                        // 大孩子上移
        k = i;                              // 继续向下
    }
    A[k] = A[0];                            // 落位
}

void BuildMaxHeap(int A[], int n) {
    for (int i = n / 2; i > 0; i--)         // 最后一个分支结点 ⌊n/2⌋ 起
        HeapAdjust(A, i, n);
}

void HeapSort(int A[], int n) {
    BuildMaxHeap(A, n);
    for (int i = n; i > 1; i--) {
        int t = A[1]; A[1] = A[i]; A[i] = t;   // 堆顶（最大值）与末尾交换
        HeapAdjust(A, 1, i - 1);               // 调整剩余 n-1 个
    }
}

void SelectSort(int A[], int n) {
    for (int i = 1; i <= n - 1; i++) {
        int min = i;
        for (int j = i + 1; j <= n; j++) {
            cmp_count++;                    // 比较 n(n-1)/2 次恒定
            if (A[j] < A[min]) min = j;
        }
        if (min != i) {
            int t = A[i]; A[i] = A[min]; A[min] = t;
        }
    }
}

static bool SeqEquals(const int A[], const int expect[], int n) {
    for (int i = 0; i < n; i++)
        if (A[i] != expect[i]) return false;
    return true;
}

int main() {
    int A[] = {0, 46, 79, 56, 38, 40, 84};
    BuildMaxHeap(A, 6);
    int heap[] = {84, 79, 56, 38, 40, 46};
    CHECK(SeqEquals(A + 1, heap, 6), "任务 2a：建堆后 {84,79,56,38,40,46}（A[0] 是暂存位）");
    HeapSort(A, 6);
    int sorted[] = {38, 40, 46, 56, 79, 84};
    CHECK(SeqEquals(A + 1, sorted, 6), "任务 3a：堆排序升序完成");
    int B[] = {0, 46, 79, 56, 38, 40, 84};
    cmp_count = 0;
    SelectSort(B, 6);
    CHECK(SeqEquals(B + 1, sorted, 6), "任务 4a：简单选择升序完成");
    CHECK(cmp_count == 15, "任务 4b：比较 5+4+3+2+1 = 15 次");
    int C[] = {0, 1, 2, 3, 4, 5, 6};
    cmp_count = 0;
    SelectSort(C, 6);
    CHECK(cmp_count == 15, "任务 4c：正序同样 15 次（与初始状态无关）");
    CHECK_END("ch08-ex03-heap-select");
    return 0;
}
