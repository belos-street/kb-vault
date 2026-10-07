// ✅ 答案：ch03/ex03-malloc-free（做完再看！）
// 关键点：malloc 三件套（判 NULL → 用 → free 置空）；静态顺序表定义
#include <stdio.h>
#include <stdlib.h>
#include "../common/check.h"

typedef int ElemType;
typedef struct LNode {
    ElemType data;
    struct LNode *next;
} LNode, *LinkList;

#define MaxSize 100

typedef struct {
    ElemType data[MaxSize];
    int length;
} SqList;

void InitList(SqList *L) {
    L->length = 0;   // 形参是结构体指针，用 -> 修改本体
}

int main() {
    // 任务 1：malloc + 判 NULL + 赋值（考试写法带强制转换，兼容 C++）
    LNode *s = (LNode *)malloc(sizeof(LNode));
    if (s == NULL) return 1;   // 分配失败保护 —— 考试写上加分
    s->data = 408;
    s->next = NULL;
    CHECK(s != NULL && s->data == 408 && s->next == NULL,
          "任务 1：堆上结点创建成功（malloc + 判 NULL + 赋值）");

    // 任务 2：free + 置空
    free(s);
    s = NULL;
    CHECK(s == NULL, "任务 2：free 后指针置 NULL（防悬空访问）");

    SqList L;
    L.length = 5;
    InitList(&L);   // 传地址
    CHECK(L.length == 0, "任务 3：初始化把 length 清回 0（空表）");

    // 🧪 实验答案：free(t) 后 t 仍指向原地址（悬空指针），读 t->data 是 UB，
    // 可能打印垃圾值也可能崩溃。free 后立刻置 NULL 是肌肉记忆。

    CHECK_END("ch03-ex03-malloc-free");
    return 0;
}
