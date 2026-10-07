// ✅ 答案：ch03/ex01-struct-basics（做完再看！）
// 关键点：变量用 .、指针用 ->；自引用成链；while (p != NULL) 遍历
#include <stdio.h>
#include "../common/check.h"

struct Node {
    int data;
    struct Node *next;
};

int main() {
    struct Node n1;
    struct Node n2;
    n1.data = 1;
    n1.next = NULL;
    n2.data = 2;
    n2.next = NULL;
    CHECK(n1.data == 1 && n2.data == 2, "任务 1a：两个结点数据域就位");
    CHECK(n1.next == NULL && n2.next == NULL, "任务 1b：指针域置 NULL");

    struct Node *p = &n1;
    n1.next = &n2;   // n1 是变量，用 . 访问
    CHECK(n1.next == &n2, "任务 2a：n1.next 指向 n2");
    CHECK(p->next->data == 2, "任务 2b：p->next->data 连环访问");
    CHECK(p->data == (*p).data, "事实：p->data 等价于 (*p).data");

    int count = 0;
    while (p != NULL) {   // 链表遍历的标准形态
        count++;
        p = p->next;      // 后移，否则死循环
    }
    CHECK(count == 2, "任务 3：遍历数出 2 个结点");

    // 🧪 实验答案：p.data 编译报错——p 是指针，成员访问用 ->（或 (*p).data）。

    CHECK_END("ch03-ex01-struct-basics");
    return 0;
}
