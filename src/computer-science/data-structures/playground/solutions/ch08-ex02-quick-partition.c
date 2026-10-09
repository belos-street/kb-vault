// ✅ 答案：ch08/ex02-quick-partition（做完再看！）
// 关键点：Partition 填坑法内层别丢 low<high；荷兰国旗遇 2 时 j 不动
#include <stdio.h>
#include <stdbool.h>
#include "../common/check.h"

int Partition(int A[], int low, int high) {
    int pivot = A[low];                     // 取第一个为枢轴
    while (low < high) {
        while (low < high && A[high] >= pivot) --high;   // 右端找小的
        A[low] = A[high];                   // 填左坑
        while (low < high && A[low] <= pivot) ++low;     // 左端找大的
        A[high] = A[low];                   // 填右坑
    }
    A[low] = pivot;                         // 枢轴落位
    return low;
}

void QuickSort(int A[], int low, int high) {
    if (low < high) {
        int pivotpos = Partition(A, low, high);
        QuickSort(A, low, pivotpos - 1);    // 递归左段
        QuickSort(A, pivotpos + 1, high);   // 递归右段
    }
}

void Flag_Netherlands(int A[], int n) {
    int i = 0, j = 0, k = n - 1;            // [0,i) 全 0 | [i,j) 全 1 | (k,n) 全 2
    while (j <= k) {
        if (A[j] == 0) {                    // 换到 0 区（换来的必是 1）
            int t = A[i]; A[i] = A[j]; A[j] = t;
            i++; j++;
        } else if (A[j] == 1) {
            j++;                            // 本就在 1 区，跳过
        } else {                            // A[j] == 2
            int t = A[j]; A[j] = A[k]; A[k] = t;
            k--;                            // j 不动：从 2 区换回的值未检查！
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
    int pos = Partition(A, 1, 6);
    CHECK(pos == 3, "任务 1a：枢轴 46 落位第 3 位（返回下标 3）");
    int expect1[] = {0, 40, 38, 46, 56, 79, 84};
    CHECK(SeqEquals(A, expect1, 7), "任务 1b：一趟后 {40,38,46,56,79,84}");
    int B[] = {0, 46, 79, 56, 38, 40, 84};
    QuickSort(B, 1, 6);
    int sorted[] = {0, 38, 40, 46, 56, 79, 84};
    CHECK(SeqEquals(B, sorted, 7), "任务 2：快排完成升序");
    int C[] = {2, 0, 1, 2, 1, 0};
    Flag_Netherlands(C, 6);
    int dutch[] = {0, 0, 1, 1, 2, 2};
    CHECK(SeqEquals(C, dutch, 6), "任务 3a：三向划分");
    int D[] = {1, 2, 0, 2, 0, 1};
    Flag_Netherlands(D, 6);
    int dutch2[] = {0, 0, 1, 1, 2, 2};
    CHECK(SeqEquals(D, dutch2, 6), "任务 3b：遇 2 换回后 j 不动");
    CHECK_END("ch08-ex02-quick-partition");
    return 0;
}
