// 📖 对应文档：../doc/02-linear-list.md §2.8（2.8.3 删 x / 2.8.4 倒数第 k 个 / 2.8.5 找中点）
// 🎯 任务：三大"指针套路"专题 —— pre 前驱法、快慢指针、同步指针，全部一趟 O(n)
// ▶️ 运行：make run EX=ex04-two-pointer（在 playground 目录下）

#include <stdio.h>
#include <stdbool.h>
#include <stdlib.h>
#include "../common/check.h"

typedef int ElemType;

typedef struct LNode {
    ElemType data;
    struct LNode *next;
} LNode, *LinkList;

// ── 给定工具：建表 / 校验 / 释放 ──
static LinkList BuildList(const int a[], int n) {
    LinkList L = (LinkList)malloc(sizeof(LNode));
    L->next = NULL;
    LNode *r = L;
    for (int i = 0; i < n; i++) {
        LNode *s = (LNode *)malloc(sizeof(LNode));
        s->data = a[i];
        r->next = s;
        r = s;
    }
    r->next = NULL;
    return L;
}

static bool ListEquals(LinkList L, const int expect[], int n) {
    if (L == NULL) return false;
    LNode *p = L->next;
    for (int i = 0; i < n; i++) {
        if (p == NULL || p->data != expect[i]) return false;
        p = p->next;
    }
    return p == NULL;
}

static void FreeList(LinkList L) {
    while (L != NULL) {
        LNode *nxt = L->next;
        free(L);
        L = nxt;
    }
}

// ─── 任务 1：删除所有值为 x 的结点（pre 前驱法，O(n) 时间 O(1) 空间）──
// 关键：命中后 pre 不动！p 改为 pre->next（新接上来的结点还要继续查）
// TODO：pre = L, p = L->next；p->data == x 时摘除 free 且 p = pre->next；
//      否则 pre、p 同步后移
void DeleteAllX(LinkList L, ElemType x) {
    // TODO
}

// ─── 任务 2：删除倒数第 k 个结点（同步指针，一趟完成）──
// 设计思想：fast 先走 k 步，然后 fast 与 pre（从头结点出发）同步走，
//          fast 为 NULL 时 pre 恰是倒数第 k 个结点的前驱
// TODO：k <= 0 返回 false；fast = L->next 先走 k 步（走不满 k 步说明 k > 表长 → false）；
//      pre = L 与 fast 同步走到 fast == NULL；摘除 pre->next 并 free，返回 true
bool DeleteLastK(LinkList L, int k) {
    return false;   // TODO
}

// ─── 任务 3：找中间结点（快慢指针，fast 每次 2 步 slow 每次 1 步）──
// 约定：奇数个返回正中间；偶数个返回第 n/2+1 个（偏右）
// TODO：空表返回 NULL；fast=slow=L->next；
//      while (fast != NULL && fast->next != NULL) { fast 走 2 步; slow 走 1 步; }
LNode *FindMid(LinkList L) {
    return NULL;   // TODO
}

int main() {
    // 任务 1 检验：{1,2,4,2,5} 删 2 → {1,4,5}（中间和尾部都有 2）
    int a[] = {1, 2, 4, 2, 5};
    LinkList L = BuildList(a, 5);
    DeleteAllX(L, 2);
    int e1[] = {1, 4, 5};
    CHECK(ListEquals(L, e1, 3), "任务 1a：删光所有 2 → {1,4,5}");

    int c[] = {3, 3, 3, 3};
    LinkList L3 = BuildList(c, 4);
    DeleteAllX(L3, 3);
    CHECK(L3->next == NULL, "任务 1b：全是 x → 只剩头结点");
    FreeList(L);
    FreeList(L3);

    // 任务 2 检验：{1,2,3,4,5} 删倒数第 2 个（即 4）→ {1,2,3,5}
    int seq5[] = {1, 2, 3, 4, 5};
    LinkList L2 = BuildList(seq5, 5);
    CHECK(DeleteLastK(L2, 2), "任务 2a：删除倒数第 2 个成功");
    int e2[] = {1, 2, 3, 5};
    CHECK(ListEquals(L2, e2, 4), "任务 2b：结果 {1,2,3,5}");
    CHECK(!DeleteLastK(L2, 10), "任务 2c：k > 表长 → false");
    FreeList(L2);

    // 任务 3 检验：5 个结点返回正中间 3；4 个结点返回偏右的第 3 个
    LinkList L5 = BuildList(seq5, 5);
    CHECK(FindMid(L5) != NULL && FindMid(L5)->data == 3, "任务 3a：5 个结点中点是 3");
    int b[] = {1, 2, 3, 4};
    LinkList L4 = BuildList(b, 4);
    CHECK(FindMid(L4) != NULL && FindMid(L4)->data == 3, "任务 3b：4 个结点返回偏右的 3");
    FreeList(L5);
    FreeList(L4);

    CHECK_END("ex04-two-pointer");
    return 0;
}
