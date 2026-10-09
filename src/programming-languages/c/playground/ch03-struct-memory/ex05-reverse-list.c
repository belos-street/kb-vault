// 📖 对应文档：doc/03-struct-memory-408.md §3.5 头插法原地逆置（完整示例默写）
// 🎯 任务：不看文档默写 ReverseList —— 暂存后继 → 头插 → 后移
// ▶️ 运行：make run EX=ex05-reverse-list（在 playground 目录下）
//
// 规则：TODO 处需要你实现；🧪 实验需取消注释观察行为，看完恢复注释。

#include <stdio.h>
#include <stdlib.h>
#include "../common/check.h"

typedef int ElemType;
typedef struct LNode {
    ElemType data;
    struct LNode *next;
} LNode, *LinkList;

// ── 给定工具：尾插法建表（ex04 的答案形态，直接用）──
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

// ─── 本练习任务：带头结点的单链表原地逆置（doc §3.5 完整示例）──
// 三步口诀：暂存后继 → 头插 → 后移。只改指针不搬数据，空间 O(1)
void reverse_list(LinkList L) {
    // TODO
    // 思路脚手架（对照 doc §3.5 的代码逐行默写）：
    //   LNode *p = L->next;   // p 指向第一个数据结点（待处理结点）
    //   LNode *q;             // q 暂存 p 的后继，防止断链
    //   L->next = NULL;       // 逆置后的表初始为空
    //   while (p != NULL) { 暂存 → 头插 → 后移 }
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

    CHECK_END("ex05-reverse-list");
    return 0;
}
