// 📖 对应文档：doc/03-struct-memory-408.md §3.3 malloc/free + §3.4 顺序表速查
// 🎯 任务：malloc 三件套（判 NULL → 用 → free 置空）；顺序表定义与初始化
// ▶️ 运行：make run EX=ex03-malloc-free（在 playground 目录下）
//
// 规则：TODO 处需要你实现；🧪 实验需取消注释观察行为，看完恢复注释。

#include <stdio.h>
#include <stdlib.h>   // malloc、free 都在这里
#include "../common/check.h"

// 给定：408 标准单链表结点定义（§3.2）
typedef int ElemType;
typedef struct LNode {
    ElemType data;
    struct LNode *next;
} LNode, *LinkList;

// 给定：顺序表容量宏（§3.4 —— 408 定义表容量的标准写法）
#define MaxSize 100

// ─── 任务 3：补全顺序表 + 写初始化函数 ─────────────────────
typedef struct {
    ElemType data[MaxSize];   // 静态分配的存储空间（编译期定死 100 个）
    int length;               // 当前长度
} SqList;

// TODO：实现 InitList —— 把顺序表恢复成"空表"状态
// 注意形参是 SqList *L：想修改调用方的结构体，必须传指针（第 2 章 §2.5）
void InitList(SqList *L) {
    // TODO: 通过 L 修改 length
}

int main() {
    // ─── 任务 1：在堆上创建一个结点 ─────────────────────────
    // malloc(sizeof(LNode)) 在堆上分配一块结点大小的内存，返回 void*
    // 三件套：判 NULL → 赋值 → 用完 free
    LNode *s = NULL;
    // TODO：用 malloc 创建结点（考试写法带上强制转换 (LNode *)）
    //       分配失败保护（s == NULL 时不许解引用）
    //       然后把 data 赋为 408，next 置 NULL
    // 你的代码：

    CHECK(s != NULL && s->data == 408 && s->next == NULL,
          "任务 1：堆上结点创建成功（malloc + 判 NULL + 赋值）");

    // ─── 任务 2：释放内存 ───────────────────────────────────
    // TODO：free(s) 释放，然后置 NULL 防悬空
    // 你的代码：

    CHECK(s == NULL, "任务 2：free 后指针置 NULL（防悬空访问）");

    // ─── 任务 3 检验 ────────────────────────────────────────
    SqList L;
    L.length = 5;   // 假装这张表用过
    InitList(&L);   // 传地址，函数才能改到 L 本体
    CHECK(L.length == 0, "任务 3：初始化把 length 清回 0（空表）");

    // ─── 🧪 实验：free 之后继续用 = 悬空指针 ────────────────
    // 先完成任务 1、2，再取消注释重跑：读已释放的内存是未定义行为，
    // 可能打印垃圾值也可能崩溃 —— 所以 free 后立刻置 NULL。
    //
    // LNode *t = (LNode *)malloc(sizeof(LNode));
    // free(t);
    // printf("%d\n", t->data);   // 悬空访问，UB！
    // t = NULL;                  // 正确收尾

    CHECK_END("ex03-malloc-free");
    return 0;
}
