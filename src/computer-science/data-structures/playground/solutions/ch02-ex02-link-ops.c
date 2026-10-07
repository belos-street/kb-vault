// ✅ 答案：ch02/ex02-link-ops（做完再看！）
// 关键点：按位操作一律先找前驱；后插先接后继防断链；删除跨过再 free
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

LNode *GetElem(LinkList L, int i) {
    if (i < 1) return NULL;
    LNode *p = L->next;              // p 指向第 1 个数据结点
    int j = 1;
    while (p != NULL && j < i) {     // 向后走到第 i 个
        p = p->next;
        j++;
    }
    return p;                        // i 超表长时 p 为 NULL
}

bool ListInsert(LinkList L, int i, ElemType e) {
    if (i < 1) return false;
    LNode *p = (i == 1) ? L : GetElem(L, i - 1);   // 前驱（i=1 时是头结点）
    if (p == NULL) return false;                   // i-1 超表长
    LNode *s = (LNode *)malloc(sizeof(LNode));
    if (s == NULL) return false;
    s->data = e;
    s->next = p->next;               // ① 先接后继
    p->next = s;                     // ② 再接前驱（顺序不能反！）
    return true;
}

bool ListDelete(LinkList L, int i, ElemType *e) {
    if (i < 1) return false;
    LNode *p = (i == 1) ? L : GetElem(L, i - 1);   // 前驱
    if (p == NULL || p->next == NULL) return false;
    LNode *q = p->next;              // 待删结点
    *e = q->data;                    // ① 取值
    p->next = q->next;               // ② 跨过 q
    free(q);                         // ③ 释放
    return true;
}

int main() {
    int a[] = {1, 2, 3, 4, 5};
    LinkList L = BuildList(a, 5);
    CHECK(GetElem(L, 1) != NULL && GetElem(L, 1)->data == 1, "任务 1a：第 1 个结点值 1");
    CHECK(GetElem(L, 3) != NULL && GetElem(L, 3)->data == 3, "任务 1b：第 3 个结点值 3");
    CHECK(GetElem(L, 0) == NULL && GetElem(L, 6) == NULL, "任务 1c：越界返回 NULL");
    CHECK(ListInsert(L, 3, 99), "任务 2a：位置 3 插入成功");
    int e1[] = {1, 2, 99, 3, 4, 5};
    CHECK(ListEquals(L, e1, 6), "任务 2b：插入后 {1,2,99,3,4,5}");
    CHECK(!ListInsert(L, 0, 7) && !ListInsert(L, 8, 7), "任务 2c：越界插入被拒绝");
    int deleted = 0;
    CHECK(ListDelete(L, 3, &deleted) && deleted == 99, "任务 3a：删除位置 3 带回 99");
    CHECK(ListEquals(L, a, 5), "任务 3b：删回 {1,2,3,4,5}");
    CHECK(!ListDelete(L, 6, &deleted), "任务 3c：i 超表长 → false");
    FreeList(L);
    CHECK_END("ch02-ex02-link-ops");
    return 0;
}
