// 📖 对应文档：../doc/08-sorting.md §8.5 归并排序 + §8.2.3 希尔排序
// 🎯 任务：归并的 Merge 默写（Rec 带 id 可检验稳定性）+ 希尔排序的"按趟手推"
// ▶️ 运行：make run EX=ex04-merge-shell（在 playground 目录下）
//
// 约定：归并部分用 Rec{key,id}（贴近考试 A[i].key 风格，且能断言稳定性）；
//      希尔部分用 int 数组逐趟对照文档推演表（A[0] 作暂存，比对从下标 1 起）。

#include <stdio.h>
#include <stdbool.h>
#include "../common/check.h"

typedef struct { int key; int id; } Rec;

static Rec B[64];   // 归并辅助数组（与 A 等长，空间 O(n) 的来源）

// ─── 任务 1：Merge —— 合并 A[low..mid] 与 A[mid+1..high] ───
// 稳定性关键：相等 key 取【前段】（<=）—— 同 key 时前段元素的原 id 更小，
// 稳定合并的结果里同 key 的 id 必然递增（TODO 注意见 main 的检验方式）
// TODO：先把 A[low..high] 复制到 B；双指针 i=low、j=mid+1 按 key 逐个取小
//      放回 A（相等取前段）；最后把剩余段整体搬回
void Merge(Rec A[], int low, int mid, int high) {
    (void)B;   // 防未使用警告，实现后可删
    // TODO
}

// ─── 任务 2：二路归并排序（递归）───────────────────────────
// TODO：low < high：mid = (low+high)/2 → 递归左 → 递归右 → Merge
void MergeSort(Rec A[], int low, int high) {
    // TODO
}

// ─── 任务 3：希尔排序的"单趟"（增量 d 的组内直接插入，int 版）──
// TODO：i 从 d+1 到 n：A[i] < A[i-d] 时，组内步长为 d 的插入
//      （A[0]=A[i]；j = i-d 起 A[0] < A[j] 则后移 j -= d；落位 A[j+d]=A[0]）
void ShellPass(int A[], int n, int d) {
    // TODO
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
    // 任务 2 检验：文档 §8.5.2 归并推演（{46,79,56,38,40,84} 升序）
    Rec A[] = {{0, 0}, {46, 1}, {79, 2}, {56, 3}, {38, 4}, {40, 5}, {84, 6}};
    MergeSort(A, 1, 6);
    int sorted_key[] = {38, 40, 46, 56, 79, 84};
    CHECK(KeyEquals(A + 1, sorted_key, 6), "任务 2a：二路归并升序完成（趟数 ⌈log2 6⌉ = 3）");

    // 任务 1 检验 + 稳定性：两段 {2,4,6}+{1,2,5} 各含一个 key=2
    // 稳定合并结果 key = {1,2,2,4,5,6}，且同 key 的 id = {1(前段), 5(后段)} 递增 ——
    // 若实现误用 <（相等取后段），id 会变成 {5 在 1 前} → 稳定性断言抓包
    Rec M[] = {{0, 0}, {2, 1}, {4, 2}, {6, 3}, {1, 4}, {2, 5}, {5, 6}};
    Merge(M, 1, 3, 6);
    int merged_key[] = {1, 2, 2, 4, 5, 6};
    int merged_id[] = {4, 1, 5, 2, 6, 3};
    CHECK(KeyEquals(M + 1, merged_key, 6), "任务 1a：Merge 合并 {2,4,6}+{1,2,5} 键序正确");
    CHECK(IdEquals(M + 1, merged_id, 6), "任务 1b：相等 key 取前段（<=）→ 稳定性成立");

    // 任务 3 检验：文档 §8.2.3 希尔推演（n=8），逐趟比对
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
