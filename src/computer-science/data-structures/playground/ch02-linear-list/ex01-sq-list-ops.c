// 📖 对应文档：../doc/02-linear-list.md §2.2 顺序表（408 签名必带 n / MaxSize）
// 🎯 任务：默写顺序表的 ListInsert / ListDelete —— 移动方向与 length 更新是两大易错点
// ▶️ 运行：make run EX=ex01-sq-list-ops（在 playground 目录下）
//
// 代码约定：408 教材用 C++ 引用 SqList &L，本练习册统一纯 C 等价写法
//（SqList *L + 调用处传 &L），逻辑一致，见 C 语言教程 §2.6。

#include <stdio.h>
#include <stdbool.h>
#include "../common/check.h"

#define MaxSize 5              // 故意取小：方便验证"表满"分支

typedef int ElemType;

typedef struct {
    ElemType data[MaxSize];    // 静态分配的存储空间
    int length;                // 当前表长
} SqList;

// 给定：初始化
void InitList(SqList *L) { L->length = 0; }

// 给定：把前 n 个元素批量装入表（测试用）
void Fill(SqList *L, const int a[], int n) {
    for (int i = 0; i < n; i++) L->data[i] = a[i];
    L->length = n;
}

// 给定：比对前 n 个元素
static bool SeqEquals(const SqList *L, const int expect[], int n) {
    if (L->length != n) return false;
    for (int i = 0; i < n; i++)
        if (L->data[i] != expect[i]) return false;
    return true;
}

// ─── 任务 1：插入 ──────────────────────────────────────────
// TODO：在位序 i（1 基，1 <= i <= length+1）插入 e。
// 步骤：① 判 i 越界 → false；② 判表满 → false；
//      ③ 从最后一个元素起【从后往前】后移一位（方向错了会覆盖！）；④ 写入 e；⑤ length++
bool ListInsert(SqList *L, int i, ElemType e) {
    return false;   // TODO
}

// ─── 任务 2：删除 ──────────────────────────────────────────
// TODO：删除位序 i（1 <= i <= length）的元素，用 *e 带回其值。
// 步骤：① 判 i 越界 → false；② 取出被删元素；③ 从第 i+1 个元素起
//      【从前往后】前移一位；④ length--（漏掉就是"幽灵元素"！）
bool ListDelete(SqList *L, int i, ElemType *e) {
    return false;   // TODO
}

int main() {
    SqList L;
    int e = 0;

    // 基本插入：{1,2,3} 的位序 1 插入 0 → {0,1,2,3}
    InitList(&L);
    int a1[] = {1, 2, 3};
    Fill(&L, a1, 3);
    CHECK(ListInsert(&L, 1, 0), "任务 1a：在位序 1 插入成功");
    int e1[] = {0, 1, 2, 3};
    CHECK(SeqEquals(&L, e1, 4), "任务 1b：插入后为 {0,1,2,3}（原元素整体后移）");

    // 尾插（位序 length+1 合法）与表尾删除
    CHECK(ListInsert(&L, L.length + 1, 9), "任务 1c：位序 length+1 是合法插入位置");
    CHECK(ListDelete(&L, L.length, &e) && e == 9, "任务 2a：删除表尾元素 9 并带回其值");

    // 越界分支：位序 0 与 length+2 都必须拒绝
    CHECK(!ListInsert(&L, 0, 7), "任务 1d：位序 0 越界 → false");
    CHECK(!ListInsert(&L, L.length + 2, 7), "任务 1e：位序 length+2 越界 → false");
    CHECK(!ListDelete(&L, 0, &e), "任务 2b：删除位序 0 越界 → false");
    CHECK(!ListDelete(&L, L.length + 1, &e), "任务 2c：删除位序 length+1 越界 → false");

    // 表满分支：MaxSize = 5，装满后再插必须拒绝
    int full[] = {1, 2, 3, 4, 5};
    Fill(&L, full, MaxSize);
    CHECK(!ListInsert(&L, 1, 0), "任务 1f：表满插入 → false（别忘判 length == MaxSize）");

    // 综合验证：删中间元素后 length 正确减少
    Fill(&L, full, 5);
    CHECK(ListDelete(&L, 2, &e) && e == 2, "任务 2d：删除位序 2 的元素 2");
    int e2[] = {1, 3, 4, 5};
    CHECK(SeqEquals(&L, e2, 4), "任务 2e：删除后为 {1,3,4,5}（后续元素整体前移）");

    CHECK_END("ex01-sq-list-ops");
    return 0;
}
