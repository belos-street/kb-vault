// ✅ 答案：ch02/ex04-two-pointer（做完再看！）
// 关键点：删 x 命中后 pre 不动；删倒数第 k 个先走 k 步；找中点双条件判越界
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

void DeleteAllX(LinkList L, ElemType x) {
    LNode *pre = L, *p = L->next;    // pre 始终是 p 的前驱
    while (p != NULL) {
        if (p->data == x) {
            pre->next = p->next;     // 前驱跨过 p
            free(p);
            p = pre->next;           // p 指向新后继，pre 不动！
        } else {
            pre = p;                 // 同步后移
            p = p->next;
        }
    }
}

bool DeleteLastK(LinkList L, int k) {
    if (k <= 0) return false;
    LNode *fast = L->next, *pre = L;
    int i = 0;
    for (; i < k && fast != NULL; i++)   // fast 先走 k 步
        fast = fast->next;
    if (i < k) return false;             // k > 表长
    while (fast != NULL) {               // 同步走到 fast == NULL
        fast = fast->next;
        pre = pre->next;
    }
    LNode *q = pre->next;                // pre 是倒数第 k 个的前驱
    pre->next = q->next;
    free(q);
    return true;
}

LNode *FindMid(LinkList L) {
    if (L->next == NULL) return NULL;    // 空表
    LNode *fast = L->next, *slow = L->next;
    while (fast != NULL && fast->next != NULL) {   // 两个条件缺一越界
        fast = fast->next->next;
        slow = slow->next;
    }
    return slow;
}

int main() {
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

    int seq5[] = {1, 2, 3, 4, 5};
    LinkList L2 = BuildList(seq5, 5);
    CHECK(DeleteLastK(L2, 2), "任务 2a：删除倒数第 2 个成功");
    int e2[] = {1, 2, 3, 5};
    CHECK(ListEquals(L2, e2, 4), "任务 2b：结果 {1,2,3,5}");
    CHECK(!DeleteLastK(L2, 10), "任务 2c：k > 表长 → false");
    FreeList(L2);

    LinkList L5 = BuildList(seq5, 5);
    CHECK(FindMid(L5) != NULL && FindMid(L5)->data == 3, "任务 3a：5 个结点中点是 3");
    int b[] = {1, 2, 3, 4};
    LinkList L4 = BuildList(b, 4);
    CHECK(FindMid(L4) != NULL && FindMid(L4)->data == 3, "任务 3b：4 个结点返回偏右的 3");
    FreeList(L5);
    FreeList(L4);
    CHECK_END("ch02-ex04-two-pointer");
    return 0;
}
