// ✅ 答案：ch02/ex03-reverse-merge（做完再看！）
// 关键点：逆置三步（暂存后继→头插→后移）；归并尾指针 + 剩余整体接上
#include <stdio.h>
#include <stdbool.h>
#include <stdlib.h>
#include "../common/check.h"

typedef int ElemType;
typedef struct LNode {
    ElemType data;
    struct LNode *next;
} LNode, *LinkList;

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

void Reverse(LinkList L) {
    LNode *p = L->next, *q;      // p 指向第一个待处理数据结点
    L->next = NULL;              // ① 拆空
    while (p != NULL) {          // ② 逐个头插
        q = p->next;             //    暂存后继（防断链！）
        p->next = L->next;       //    头插
        L->next = p;
        p = q;                   //    后移
    }
}

LinkList MergeList(LinkList A, LinkList B) {
    LNode *pa = A->next, *pb = B->next;
    LinkList C = A;                          // 复用 A 的头结点
    LNode *r = C;                            // 尾指针
    while (pa != NULL && pb != NULL) {       // 两表都非空取较小者
        if (pa->data <= pb->data) {
            r->next = pa;
            pa = pa->next;
        } else {
            r->next = pb;
            pb = pb->next;
        }
        r = r->next;
    }
    r->next = (pa != NULL) ? pa : pb;        // 剩余部分整体接上
    free(B);                                 // 释放 B 的头结点
    return C;
}

int main() {
    int a[] = {1, 2, 3, 4, 5};
    LinkList L = BuildList(a, 5);
    Reverse(L);
    int rev[] = {5, 4, 3, 2, 1};
    CHECK(ListEquals(L, rev, 5), "任务 1a：逆置后 {5,4,3,2,1}");
    int one[] = {7};
    LinkList S = BuildList(one, 1);
    Reverse(S);
    CHECK(ListEquals(S, one, 1), "任务 1b：单结点逆置 = 原样");
    FreeList(L);
    FreeList(S);

    int a1[] = {1, 3, 5}, b1[] = {2, 4, 6};
    LinkList A = BuildList(a1, 3), B = BuildList(b1, 3);
    LinkList C = MergeList(A, B);
    int all[] = {1, 2, 3, 4, 5, 6};
    CHECK(ListEquals(C, all, 6), "任务 2a：合并后 {1,2,3,4,5,6}");
    CHECK(C == A, "任务 2b：沿用 A 的头结点");
    FreeList(C);

    LinkList A2 = BuildList(a1, 3), B2 = BuildList(a, 0);
    LinkList C2 = MergeList(A2, B2);
    CHECK(ListEquals(C2, a1, 3), "任务 2c：B 为空 → 结果 = A");
    FreeList(C2);
    CHECK_END("ch02-ex03-reverse-merge");
    return 0;
}
