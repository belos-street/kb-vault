// 📖 对应文档：doc/03-struct-memory-408.md §3.6 尾插法建表（+ 本章练习 2）
// 🎯 任务：默写尾插法 —— 头结点 L、新结点 s、尾指针 r 三个关键角色
// ▶️ 运行：make run EX=ex04-tail-insert（在 playground 目录下）
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

// ── 给定工具：释放整条链（含头结点），练习直接使用 ──
static void free_list(LinkList L) {
    while (L != NULL) {
        LNode *nxt = L->next;   // 先存后继再 free，防止断链
        free(L);
        L = nxt;
    }
}

// ── 给定工具：校验 L（带头结点）的数据域序列是否与 expect 一致 ──
static int list_equals(LinkList L, int expect[], int n) {
    if (L == NULL) return 0;
    LNode *p = L->next;   // 跳过头结点
    for (int i = 0; i < n; i++) {
        if (p == NULL || p->data != expect[i]) return 0;
        p = p->next;
    }
    return p == NULL;     // 长度也必须刚好
}

// ─── 本练习任务：尾插法建表 ────────────────────────────────
// 把数组 a[0..n) 依次接到链尾，返回带头结点的单链表
// 考试原味版（doc §3.6）用 scanf 读到 9999 为止，逻辑与本函数一致，
// 只是把"数组取值"换成"scanf 取值"。
// TODO：实现它（返回值带回头指针；考试写法用引用/二级指针改 L，见 §2.6）
LinkList build_list(int a[], int n) {
    return NULL;   // TODO
    // 思路脚手架：
    //   1. malloc 头结点，next 置 NULL（头结点不存数据）
    //   2. 尾指针 r = L
    //   3. for i in 0..n：malloc 新结点 s，s->data = a[i]，挂到 r 后面，r = s
    //   4. 收尾：r->next = NULL
    //   5. return L
}

int main() {
    int a[5] = {1, 2, 3, 4, 5};
    LinkList L = build_list(a, 5);

    int expect[5] = {1, 2, 3, 4, 5};
    CHECK(list_equals(L, expect, 5), "任务：尾插法建表后顺序 1→2→3→4→5");

    // 边界：n=0 时也要有头结点
    LinkList E = build_list(a, 0);
    CHECK(E != NULL && E->next == NULL, "边界：n=0 → 只建出头结点");

    free_list(L);
    free_list(E);
    CHECK_END("ex04-tail-insert");
    return 0;
}
