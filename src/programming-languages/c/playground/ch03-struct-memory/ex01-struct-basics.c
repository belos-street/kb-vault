// 📖 对应文档：doc/03-struct-memory-408.md §3.1 struct：把数据和指针打包
// 🎯 任务：结构体声明与成员访问（. vs ->）；自引用成链；遍历计数
// ▶️ 运行：make run EX=ex01-struct-basics（在 playground 目录下）
//
// 规则：TODO 处需要你实现；🧪 实验需取消注释观察行为，看完恢复注释。

#include <stdio.h>
#include "../common/check.h"

// 给定：自引用结构体 —— 链表/树结点的雏形
// 自引用必须写全 struct Node *（typedef 的名字此时还没生效，见 §3.2）
struct Node {
    int data;              // 数据域
    struct Node *next;     // 指针域（指向同类型的下一个结点）
};

int main() {
    // ─── 任务 1：初始化两个结点（栈上分配，函数结束自动回收）──
    struct Node n1;
    struct Node n2;
    n1.data = 0;
    n1.next = NULL;
    n2.data = 0;
    n2.next = NULL;
    // TODO：把 n1.data 赋为 1，n2.data 赋为 2
    // 你的代码：

    CHECK(n1.data == 1 && n2.data == 2, "任务 1a：两个结点数据域就位");
    CHECK(n1.next == NULL && n2.next == NULL, "任务 1b：指针域置 NULL（没指向就是空）");

    // ─── 任务 2：串成链 n1 → n2，并用 -> 访问 ───────────────
    struct Node *p = &n1;   // p 指向第一个结点
    // TODO：让 n1 的 next 指向 n2
    // （注意：n1 是变量用 .，p 是指针用 ->，想清楚该用哪个）
    // 你的代码：

    CHECK(n1.next == &n2, "任务 2a：n1.next 指向 n2");
    CHECK(p->next->data == 2, "任务 2b：p->next->data 连环访问");
    CHECK(p->data == (*p).data, "事实：p->data 等价于 (*p).data");

    // ─── 任务 3：遍历链表（链表遍历的标准形态）──────────────
    int count = 0;
    // TODO：用 while (p != NULL) 数出链上有几个结点（别忘 p = p->next 后移）
    // 你的代码：

    CHECK(count == 2, "任务 3：遍历数出 2 个结点");

    // ─── 🧪 实验：. 和 -> 用错对象 ──────────────────────────
    // 取消注释：p 是指针，用 . 访问成员 → 编译错误。
    // 记法：变量用 .，指针用 ->（或 (*p).data）
    //
    // printf("%d\n", p.data);

    CHECK_END("ex01-struct-basics");
    return 0;
}
