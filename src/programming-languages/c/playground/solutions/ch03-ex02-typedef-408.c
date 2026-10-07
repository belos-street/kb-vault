// ✅ 答案：ch03/ex02-typedef-408（做完再看！）
// 关键点：typedef struct LNode {...} LNode, *LinkList; 逐部分含义；DNode 双链
#include <stdio.h>
#include "../common/check.h"

typedef int ElemType;   // 任务 1：元素类型统一别名，换类型只改这一行

// 任务 2：408 标准形式 —— 一次起两个别名
typedef struct LNode {
    ElemType data;          // 注意：内部自引用必须写全 struct LNode *
    struct LNode *next;
} LNode, *LinkList;

typedef struct DNode {
    ElemType data;
    struct DNode *prior;    // 前驱
    struct DNode *next;     // 后继
} DNode, *DLinkList;

int main() {
    // 任务 3：用新别名操作（LNode/LinkList/DNode/DLinkList）
    LNode a, b;
    a.data = 1;
    a.next = &b;
    b.data = 2;
    b.next = NULL;

    LinkList head = &a;   // LinkList 就是 LNode*，习惯上用作头指针
    CHECK(head->data == 1 && head->next->data == 2, "任务 3a：单链 a→b 串好");

    DNode d1, d2;
    d1.data = 10;
    d1.prior = NULL;
    d1.next = &d2;
    d2.data = 20;
    d2.prior = &d1;
    d2.next = NULL;

    CHECK(d2.prior == &d1 && d1.next == &d2, "任务 3b：双链 prior/next 互指");
    CHECK(d2.prior->data == 10, "任务 3c：沿前驱取值");

    // 🧪 实验答案：结构体定义内部 typedef 别名尚未生效，
    // 自引用指针域必须写全 struct LNode *next，不能写 LNode *next。

    CHECK_END("ch03-ex02-typedef-408");
    return 0;
}
