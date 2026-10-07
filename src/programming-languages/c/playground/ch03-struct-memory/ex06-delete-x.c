// 📖 对应文档：doc/03-struct-memory-408.md 本章练习 3（2019 真题改编）
// 🎯 任务：删除带头结点单链表中所有值为 x 的结点 + 按三问格式笔答
// ▶️ 运行：make run EX=ex06-delete-x（在 playground 目录下）
//
// 规则：TODO 处需要你实现；📝 笔答区对照 solutions 复盘。

#include <stdio.h>
#include <stdlib.h>
#include "../common/check.h"

typedef int ElemType;
typedef struct LNode {
    ElemType data;
    struct LNode *next;
} LNode, *LinkList;

// ── 给定工具：尾插法建表（ex04 答案形态）──
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

// ── 给定工具：释放整条链（含头结点）──
static void free_list(LinkList L) {
    while (L != NULL) {
        LNode *nxt = L->next;
        free(L);
        L = nxt;
    }
}

// ── 给定工具：校验 L（带头结点）的数据域序列是否与 expect 一致 ──
static int list_equals(LinkList L, int expect[], int n) {
    if (L == NULL) return 0;
    LNode *p = L->next;
    for (int i = 0; i < n; i++) {
        if (p == NULL || p->data != expect[i]) return 0;
        p = p->next;
    }
    return p == NULL;
}

// ─── 本练习任务：删除链表中所有值为 x 的结点（带头结点）────
// 思路（doc 练习 3 提示）：前驱指针 pre 遍历，pre->next 是待检查结点；
// 命中 → 摘除并 free（pre 不动！）；未命中 → pre 后移
void delete_all_x(LinkList L, int x) {
    // TODO
    // 思路脚手架：
    //   LNode *pre = L;                      // pre 指向待检查结点的前驱
    //   while (pre->next != NULL) {
    //       if (pre->next->data == x) {
    //           摘除：暂存 q = pre->next → pre->next = q->next → free(q)
    //           （注意：命中后 pre 不能后移！新接上来的结点还要继续查）
    //       } else {
    //           pre = pre->next;
    //       }
    //   }
}

int main() {
    int a[5] = {1, 2, 4, 2, 5};
    LinkList L = build_list(a, 5);
    delete_all_x(L, 2);
    int expect1[3] = {1, 4, 5};
    CHECK(list_equals(L, expect1, 3), "任务 1：删光所有 2 → {1,4,5}（中间和尾部都有 2）");
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

    // ─── 📝 笔答区：三问格式（写完对照 solutions/ch03-ex06 复盘）──
    // (1) 设计思想：______（2-3 句话说清"用什么方法、分几步"，不写代码细节）
    // (2) 代码：上面的 delete_all_x，关键行记得注释（循环目的/指针含义/边界）
    // (3) 复杂度：时间 O(n)？空间 O(1)？为什么 —— 想清楚再对答案

    CHECK_END("ex06-delete-x");
    return 0;
}
