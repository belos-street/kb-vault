// ✅ 答案：ch03/ex05-reverse-list（做完再看！）
// 关键点：头插法三步 —— 暂存后继 q → 头插 p → 后移 p；O(n) 时间 O(1) 空间
#include <stdio.h>
#include <stdlib.h>
#include "../common/check.h"

typedef int ElemType;
typedef struct LNode {
    ElemType data;
    struct LNode *next;
} LNode, *LinkList;

static LinkList build_list(int a[], int n) {
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

static void free_list(LinkList L) {
    while (L != NULL) {
        LNode *nxt = L->next;
        free(L);
        L = nxt;
    }
}

static int list_equals(LinkList L, int expect[], int n) {
    if (L == NULL) return 0;
    LNode *p = L->next;
    for (int i = 0; i < n; i++) {
        if (p == NULL || p->data != expect[i]) return 0;
        p = p->next;
    }
    return p == NULL;
}

// 带头结点单链表的原地逆置（doc §3.5 原样）
void reverse_list(LinkList L) {
    LNode *p = L->next;    // p 指向第一个数据结点（待处理结点）
    LNode *q;
    L->next = NULL;        // 逆置后的表初始为空
    while (p != NULL) {
        q = p->next;       // 暂存后继，防断链
        p->next = L->next; // 头插：新结点接到头结点之后
        L->next = p;
        p = q;             // 后移，处理原链表下一个结点
    }
}

int main() {
    int a[5] = {1, 2, 3, 4, 5};
    LinkList L = build_list(a, 5);
    reverse_list(L);
    int expect[5] = {5, 4, 3, 2, 1};
    CHECK(list_equals(L, expect, 5), "任务：{1,2,3,4,5} 逆置成 {5,4,3,2,1}");
    free_list(L);

    int one[1] = {7};
    LinkList S = build_list(one, 1);
    reverse_list(S);
    CHECK(list_equals(S, one, 1), "边界：单结点逆置 = 原样");
    free_list(S);

    LinkList E = build_list(one, 0);
    reverse_list(E);
    CHECK(E->next == NULL, "边界：空表逆置 = 原样");
    free_list(E);

    CHECK_END("ch03-ex05-reverse-list");
    return 0;
}
