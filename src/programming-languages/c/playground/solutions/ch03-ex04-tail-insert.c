// ✅ 答案：ch03/ex04-tail-insert（做完再看！）
// 关键点：头结点 L + 新结点 s + 尾指针 r；r->next = NULL 收尾别漏
#include <stdio.h>
#include <stdlib.h>
#include "../common/check.h"

typedef int ElemType;
typedef struct LNode {
    ElemType data;
    struct LNode *next;
} LNode, *LinkList;

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

// 尾插法：r 始终指向尾结点，保证 O(1) 接入
LinkList build_list(int a[], int n) {
    LinkList L = (LinkList)malloc(sizeof(LNode));   // 1. 头结点（不存数据）
    if (L == NULL) return NULL;
    L->next = NULL;
    LNode *r = L;                                   // 2. 尾指针从头结点出发
    for (int i = 0; i < n; i++) {                   // 3. 逐个挂尾
        LNode *s = (LNode *)malloc(sizeof(LNode));
        if (s == NULL) break;
        s->data = a[i];
        s->next = NULL;
        r->next = s;
        r = s;
    }
    r->next = NULL;                                 // 4. 收尾（n=0 时也不能漏）
    return L;
}

int main() {
    int a[5] = {1, 2, 3, 4, 5};
    LinkList L = build_list(a, 5);
    int expect[5] = {1, 2, 3, 4, 5};
    CHECK(list_equals(L, expect, 5), "任务：尾插法建表后顺序 1→2→3→4→5");

    LinkList E = build_list(a, 0);
    CHECK(E != NULL && E->next == NULL, "边界：n=0 → 只建出头结点");

    free_list(L);
    free_list(E);
    CHECK_END("ch03-ex04-tail-insert");
    return 0;
}
