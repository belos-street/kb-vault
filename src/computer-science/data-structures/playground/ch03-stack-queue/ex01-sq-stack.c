// 📖 对应文档：../doc/03-stack-and-queue.md §3.2 顺序栈 + §3.3 共享栈
// 🎯 任务：顺序栈 Push/Pop（判满判空）+ 共享栈相向入栈 —— top 边界是选择题常客
// ▶️ 运行：make run EX=ex01-sq-stack（在 playground 目录下）

#include <stdio.h>
#include <stdbool.h>
#include "../common/check.h"

#define MaxSize 4              // 故意取小：方便验证"栈满"

typedef int ElemType;

// ── 给定：顺序栈定义（top 初始 -1，data[0..MaxSize-1]）──
typedef struct {
    ElemType data[MaxSize];
    int top;                   // 栈顶指针
} SqStack;

// ── 给定：共享栈定义（0 号栈顶 -1 向右长，1 号栈顶 MaxSize 向左长）──
typedef struct {
    ElemType data[MaxSize];
    int top0, top1;
} ShStack;

// ─── 任务 1：顺序栈的 Push / Pop ───────────────────────────
// 408 边界：栈满 top == MaxSize - 1（不是 MaxSize！）；栈空 top == -1（不是 0！）
// TODO：Push —— 栈满返回 false；否则先 ++top 再入 data（S->data[++S->top] = x）
//      Pop  —— 栈空返回 false；否则先取值再 top--（*x = S->data[S->top--]）
bool Push(SqStack *S, ElemType x) {
    return false;   // TODO
}

bool Pop(SqStack *S, ElemType *x) {
    return false;   // TODO
}

// ─── 任务 2：共享栈的两侧入栈 ──────────────────────────────
// 408 结论：共享栈只在"两栈顶相遇"时才算满 → 判满 top1 - top0 == 1
// TODO：Push0 —— 判满后 S->data[++S->top0] = x（向右）
//      Push1 —— 判满后 S->data[--S->top1] = x（向左）
bool Push0(ShStack *S, ElemType x) {
    return false;   // TODO
}

bool Push1(ShStack *S, ElemType x) {
    return false;   // TODO
}

int main() {
    SqStack S;
    S.top = -1;
    ElemType x = 0;

    // 空栈出栈必须失败
    CHECK(!Pop(&S, &x), "任务 1a：空栈 Pop → false（top == -1 判空）");

    // 入 1,2,3,4 后栈满，再入失败；出栈顺序 4,3,2,1（LIFO）
    CHECK(Push(&S, 1) && Push(&S, 2) && Push(&S, 3) && Push(&S, 4),
          "任务 1b：连入 1~4 成功");
    CHECK(!Push(&S, 5), "任务 1c：top == MaxSize-1 时栈满 → false");
    CHECK(Pop(&S, &x) && x == 4, "任务 1d：出栈得到 4（后进先出）");
    CHECK(Pop(&S, &x) && x == 3, "任务 1e：出栈得到 3");

    // 共享栈：两侧各入 2 个后相遇 → 满；两侧交替仍可继续（一空一满不算满）
    ShStack T;
    T.top0 = -1;
    T.top1 = MaxSize;
    CHECK(Push0(&T, 1) && Push0(&T, 2), "任务 2a：0 号栈连入 1、2");
    CHECK(Push1(&T, 9) && Push1(&T, 8), "任务 2b：1 号栈连入 9、8");
    CHECK(!Push0(&T, 3) && !Push1(&T, 7), "任务 2c：两栈顶相遇（top1-top0==1）→ 双双拒绝");
    CHECK(T.data[0] == 1 && T.data[1] == 2 && T.data[3] == 9 && T.data[2] == 8,
          "任务 2d：相向生长落位正确");

    CHECK_END("ex01-sq-stack");
    return 0;
}
