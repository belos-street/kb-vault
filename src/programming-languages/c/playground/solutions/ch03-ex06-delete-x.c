// ✅ 答案：ch03/ex06-delete-x（做完再看！）
// 关键点：前驱指针 pre；命中摘除后 pre 不动；O(n) 时间 O(1) 空间
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

// 删除带头结点单链表中所有值为 x 的结点（2019 真题思路）
void delete_all_x(LinkList L, int x) {
    LNode *pre = L;                       // pre 指向待检查结点的前驱
    while (pre->next != NULL) {
        LNode *cur = pre->next;           // cur 是待检查结点
        if (cur->data == x) {
            pre->next = cur->next;        // 摘除
            free(cur);                    // 释放
            // 注意：pre 不动 —— 新接上来的结点还要继续查
        } else {
            pre = pre->next;              // 未命中才后移
        }
    }
}

int main() {
    int a[5] = {1, 2, 4, 2, 5};
    LinkList L = build_list(a, 5);
    delete_all_x(L, 2);
    int expect1[3] = {1, 4, 5};
    CHECK(list_equals(L, expect1, 3), "任务 1：删光所有 2 → {1,4,5}");
    free_list(L);

    int b[3] = {7, 8, 9};
    LinkList L2 = build_list(b, 3);
    delete_all_x(L2, 2);
    CHECK(list_equals(L2, b, 3), "边界：没有值为 x 的结点 → 原样不动");
    free_list(L2);

    int c[4] = {3, 3, 3, 3};
    LinkList L3 = build_list(c, 4);
    delete_all_x(L3, 3);
    CHECK(L3 != NULL && L3->next == NULL, "边界：全是 x → 只剩头结点");
    free_list(L3);

    // 📝 三问参考答案：
    // (1) 设计思想：设置前驱指针 pre，从头结点出发扫描；若 pre 所指结点的
    //     后继数据域为 x，则摘除该后继结点并释放，pre 保持不动；否则 pre 后移。
    //     直到所有结点检查完毕。
    // (2) 代码：见 delete_all_x，关键处已注释（前驱含义/摘除/不后移的原因）。
    // (3) 复杂度：单层循环扫描 n 个结点，时间 O(n)；只用 pre、cur 两个辅助
    //     指针，空间 O(1)。

    CHECK_END("ch03-ex06-delete-x");
    return 0;
}
