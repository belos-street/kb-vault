// ✅ 答案：ch08/ex04-merge-shell（做完再看！）
// 关键点：归并相等取前段保稳定（Rec.id 可断言）；希尔单趟 = 步长 d 的组内插入
#include <stdio.h>
#include <stdbool.h>
#include "../common/check.h"

typedef struct { int key; int id; } Rec;

static Rec B[64];

void Merge(Rec A[], int low, int mid, int high) {
    for (int k = low; k <= high; k++)       // 复制到辅助数组
        B[k] = A[k];
    int i = low, j = mid + 1, k = i;
    while (i <= mid && j <= high) {
        if (B[i].key <= B[j].key)           // <=：相等 key 取前段 → 稳定！
            A[k++] = B[i++];
        else
            A[k++] = B[j++];
    }
    while (i <= mid) A[k++] = B[i++];       // 前段剩余
    while (j <= high) A[k++] = B[j++];      // 后段剩余
}

void MergeSort(Rec A[], int low, int high) {
    if (low < high) {
        int mid = (low + high) / 2;
        MergeSort(A, low, mid);
        MergeSort(A, mid + 1, high);
        Merge(A, low, mid, high);
    }
}

void ShellPass(int A[], int n, int d) {
    for (int i = d + 1; i <= n; i++) {      // 组内直接插入（步长 d）
        if (A[i] < A[i - d]) {
            A[0] = A[i];
            int j;
            for (j = i - d; j > 0 && A[0] < A[j]; j -= d)
                A[j + d] = A[j];            // 组内后移
            A[j + d] = A[0];                // 落位
        }
    }
}

static bool KeyEquals(const Rec A[], const int key[], int n) {
    for (int i = 0; i < n; i++)
        if (A[i].key != key[i]) return false;
    return true;
}

static bool IdEquals(const Rec A[], const int id[], int n) {
    for (int i = 0; i < n; i++)
        if (A[i].id != id[i]) return false;
    return true;
}

static bool SeqEquals(const int A[], const int expect[], int n) {
    for (int i = 0; i < n; i++)
        if (A[i] != expect[i]) return false;
    return true;
}

int main() {
    Rec A[] = {{0, 0}, {46, 1}, {79, 2}, {56, 3}, {38, 4}, {40, 5}, {84, 6}};
    MergeSort(A, 1, 6);
    int sorted_key[] = {38, 40, 46, 56, 79, 84};
    CHECK(KeyEquals(A + 1, sorted_key, 6), "任务 2a：二路归并升序完成");

    Rec M[] = {{0, 0}, {2, 1}, {4, 2}, {6, 3}, {1, 4}, {2, 5}, {5, 6}};
    Merge(M, 1, 3, 6);
    int merged_key[] = {1, 2, 2, 4, 5, 6};
    int merged_id[] = {4, 1, 5, 2, 6, 3};
    CHECK(KeyEquals(M + 1, merged_key, 6), "任务 1a：Merge 键序正确");
    CHECK(IdEquals(M + 1, merged_id, 6), "任务 1b：相等 key 取前段（<=）→ 稳定");

    int S[] = {0, 40, 38, 65, 97, 76, 13, 27, 49};
    ShellPass(S, 8, 4);
    int after4[] = {40, 13, 27, 49, 76, 38, 65, 97};
    CHECK(SeqEquals(S + 1, after4, 8), "任务 3a：d=4 后 {40,13,27,49,76,38,65,97}（A[0] 暂存）");
    ShellPass(S, 8, 2);
    int after2[] = {27, 13, 40, 38, 65, 49, 76, 97};
    CHECK(SeqEquals(S + 1, after2, 8), "任务 3b：d=2 后 {27,13,40,38,65,49,76,97}");
    ShellPass(S, 8, 1);
    int final[] = {13, 27, 38, 40, 49, 65, 76, 97};
    CHECK(SeqEquals(S + 1, final, 8), "任务 3c：d=1 后完成");

    CHECK_END("ch08-ex04-merge-shell");
    return 0;
}
