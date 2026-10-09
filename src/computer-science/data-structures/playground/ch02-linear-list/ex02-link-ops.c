// 📖 对应文档：../doc/02-linear-list.md §2.3 单链表（建表 + 查找 + 插入删除）
// 🎯 任务：按位查找 GetElem、按位插入 ListInsert、按位删除 ListDelete —— 全部先找前驱
// ▶️ 运行：make run EX=ex02-link-ops（在 playground 目录下）
//
// 代码约定：带头结点；408 的 LinkList &L 引用写法用纯 C 返回值/二级指针等价替代。

#include <stdio.h>
#include <stdbool.h>
#include <stdlib.h>
#include "../common/check.h"

typedef int ElemType;

typedef struct LNode {
    ElemType data;
    struct LNode *next;
} LNode, *LinkList;

// ── 给定工具：尾插法建表（返回带头结点的链表）──
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

// ── 给定工具：校验 L 的数据序列 / 释放整条链 ──
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

// ─── 任务 1：按位查找（1 基，返回第 i 个数据结点，越界/不存在返回 NULL）──
// 408 结论：单链表不支持随机访问，按位查找必须从头遍历 → O(n)
// TODO：p 从 L->next 出发、计数器 j 从 1 起，走到第 i 个或 p 为空
LNode *GetElem(LinkList L, int i) {
    return NULL;   // TODO
}

// ─── 任务 2：按位插入（在第 i 个位置插入 e，成功返回 true）──
// 核心思路：先找第 i-1 个结点作前驱（i=1 时前驱就是头结点 L），再"后插"：
//   ① s->next = p->next（先接后继，防断链）  ② p->next = s
// TODO：i < 1 返回 false；p = (i == 1) ? L : GetElem(L, i - 1)；p 为空 → false；
//      malloc 新结点（判 NULL）赋值后按①②接入
bool ListInsert(LinkList L, int i, ElemType e) {
    return false;   // TODO
}

// ─── 任务 3：按位删除（删除第 i 个结点，用 *e 带回其值，成功返回 true）──
// 核心思路：找第 i-1 个结点 p，删 p 的后继 q：
//   ① e = q->data  ② p->next = q->next（跨过 q）  ③ free(q)
// TODO
bool ListDelete(LinkList L, int i, ElemType *e) {
    return false;   // TODO
}

int main() {
    int a[] = {1, 2, 3, 4, 5};
    LinkList L = BuildList(a, 5);

    // 任务 1 检验
    CHECK(GetElem(L, 1) != NULL && GetElem(L, 1)->data == 1, "任务 1a：第 1 个数据结点值 1");
    CHECK(GetElem(L, 3) != NULL && GetElem(L, 3)->data == 3, "任务 1b：第 3 个数据结点值 3");
    CHECK(GetElem(L, 0) == NULL && GetElem(L, 6) == NULL, "任务 1c：i=0 与超出表长都返回 NULL");

    // 任务 2 检验：位置 3 插入 99 → {1,2,99,3,4,5}
    CHECK(ListInsert(L, 3, 99), "任务 2a：位置 3 插入成功");
    int e1[] = {1, 2, 99, 3, 4, 5};
    CHECK(ListEquals(L, e1, 6), "任务 2b：插入后 {1,2,99,3,4,5}");
    CHECK(!ListInsert(L, 0, 7) && !ListInsert(L, 8, 7), "任务 2c：越界插入被拒绝");

    // 任务 3 检验：删除 99 → 回到 {1,2,3,4,5}
    int deleted = 0;
    CHECK(ListDelete(L, 3, &deleted) && deleted == 99, "任务 3a：删除位置 3 并带回 99");
    CHECK(ListEquals(L, a, 5), "任务 3b：删回 {1,2,3,4,5}");
    CHECK(!ListDelete(L, 6, &deleted), "任务 3c：i 超出表长 → false");

    FreeList(L);
    CHECK_END("ex02-link-ops");
    return 0;
}
