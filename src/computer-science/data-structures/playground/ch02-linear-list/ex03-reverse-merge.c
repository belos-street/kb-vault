// 📖 对应文档：../doc/02-linear-list.md §2.8 算法设计题专题（2.8.1 逆置 / 2.8.2 合并）
// 🎯 任务：按"三问格式"的代码部分默写两个最高频真题算法 —— 均为 O(n) 时间、O(1) 空间
// ▶️ 运行：make run EX=ex03-reverse-merge（在 playground 目录下）

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

// ─── 任务 1：带头结点单链表的原地逆置（头插法，O(n) 时间 O(1) 空间）──
// 三步口诀：暂存后继 → 头插 → 后移
// TODO：p = L->next；L->next = NULL（拆空）；
//      while (p) { q = p->next; p->next = L->next; L->next = p; p = q; }
// （纯 C 说明：逆置不修改头指针本身，头结点地址不变，用 LinkList 即可）
void Reverse(LinkList L) {
    // TODO
}

// ─── 任务 2：合并两个递增有序链表为递增有序（归并，O(n+m) 时间 O(1) 空间）──
// 设计思想：pa、pb 指向两表首结点，较小者接到结果表尾（尾指针 r 记录）；
//          某表取空后把另一表剩余部分整体接上；沿用 A 的头结点，free(B)
// TODO：返回结果表头指针（纯 C 用返回值代替引用带出）
LinkList MergeList(LinkList A, LinkList B) {
    return NULL;   // TODO
}

int main() {
    // 任务 1 检验：{1,2,3,4,5} → {5,4,3,2,1}
    int a[] = {1, 2, 3, 4, 5};
    LinkList L = BuildList(a, 5);
    Reverse(L);
    int rev[] = {5, 4, 3, 2, 1};
    CHECK(ListEquals(L, rev, 5), "任务 1a：逆置后 {5,4,3,2,1}（先暂存后继再头插）");

    int one[] = {7};
    LinkList S = BuildList(one, 1);
    Reverse(S);
    CHECK(ListEquals(S, one, 1), "任务 1b：单结点逆置 = 原样");
    FreeList(L);
    FreeList(S);

    // 任务 2 检验：{1,3,5} + {2,4,6} → {1,2,3,4,5,6}
    int a1[] = {1, 3, 5}, b1[] = {2, 4, 6};
    LinkList A = BuildList(a1, 3), B = BuildList(b1, 3);
    LinkList C = MergeList(A, B);
    int all[] = {1, 2, 3, 4, 5, 6};
    CHECK(ListEquals(C, all, 6), "任务 2a：合并后 {1,2,3,4,5,6}");
    CHECK(C == A, "任务 2b：沿用 A 的头结点（不另开空间）");
    FreeList(C);

    // 一表为空的边界：B 空 → 结果就是 A
    LinkList A2 = BuildList(a1, 3), B2 = BuildList(a, 0);
    LinkList C2 = MergeList(A2, B2);
    CHECK(ListEquals(C2, a1, 3), "任务 2c：B 为空 → 结果 = A（剩余部分整体接上）");
    FreeList(C2);

    CHECK_END("ex03-reverse-merge");
    return 0;
}
