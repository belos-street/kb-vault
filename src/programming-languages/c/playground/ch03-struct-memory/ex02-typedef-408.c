// 📖 对应文档：doc/03-struct-memory-408.md §3.2 typedef（+ 本章练习 1：双链表结点）
// 🎯 任务：把"能用但不像教材"的结构体定义，改写成 408 标准形式
// ▶️ 运行：make run EX=ex02-typedef-408（在 playground 目录下）
//
// 规则：TODO 处需要你实现；🧪 实验需取消注释观察行为，看完恢复注释。

#include <stdio.h>
#include "../common/check.h"

// ─── 任务 1：引入 ElemType ─────────────────────────────────
// 408 习惯：元素类型统一别名，换数据类型只改这一行
// TODO：在下面加一行 typedef，把 int 起别名叫 ElemType；
//       然后把两个结构体里的 int data 都改成 ElemType data;

// ─── 任务 2：改写成 408 标准形式（一次起两个别名）──────────
// TODO ①：struct LNode 的定义改成：
//     typedef struct LNode { ... } LNode, *LinkList;
//   含义：LNode = struct LNode（结点类型），LinkList = struct LNode*（结点指针类型）
// TODO ②：struct DNode 同样处理：typedef struct DNode { ... } DNode, *DLinkList;
//   （doc 本章练习 1：DNode 要有 prior、next 两个指针域）
// 改完后 main 里就能用 LNode / LinkList / DNode / DLinkList 了

struct LNode {
    int data;               // 任务 1 后改成 ElemType data;
    struct LNode *next;
};

struct DNode {
    int data;               // 任务 1 后改成 ElemType data;
    struct DNode *prior;    // 前驱
    struct DNode *next;     // 后继
};

int main() {
    // ─── 任务 3：用新别名操作链 ─────────────────────────────
    // TODO：把下面所有 struct LNode / struct DNode 声明换用新别名
    //       （LNode、LinkList、DNode、DLinkList 交替用一用，它们等价）
    struct LNode a, b;
    a.data = 1;
    a.next = &b;
    b.data = 2;
    b.next = NULL;

    struct LNode *head = &a;
    CHECK(head->data == 1 && head->next->data == 2, "任务 3a：单链 a→b 串好");

    // 双链验证：prior 与 next 互指
    struct DNode d1, d2;
    d1.data = 10;
    d1.prior = NULL;
    d1.next = &d2;
    d2.data = 20;
    d2.prior = &d1;
    d2.next = NULL;

    CHECK(d2.prior == &d1 && d1.next == &d2, "任务 3b：双链 prior/next 互指");
    CHECK(d2.prior->data == 10, "任务 3c：d2.prior->data 沿前驱取值");

    // ─── 🧪 实验：自引用为什么必须写 struct XXX ─────────────
    // 结构体定义内部，typedef 别名还没生效，所以指针域必须写全
    // struct LNode *next 而不能写 LNode *next（写别名会编译报错）。
    // 改写任务 2 时体会这一行：struct LNode *next 原样保留即可。

    CHECK_END("ex02-typedef-408");
    return 0;
}
