// ✅ 答案：ch03/ex01-sq-stack（做完再看！）
// 关键点：栈满 top==MaxSize-1、栈空 top==-1；共享栈判满 top1-top0==1
#include <stdio.h>
#include <stdbool.h>
#include "../common/check.h"

#define MaxSize 4
typedef int ElemType;

typedef struct {
    ElemType data[MaxSize];
    int top;
} SqStack;

typedef struct {
    ElemType data[MaxSize];
    int top0, top1;
} ShStack;

bool Push(SqStack *S, ElemType x) {
    if (S->top == MaxSize - 1) return false;   // 栈满（最后一个下标是 MaxSize-1）
    S->data[++S->top] = x;                     // 先移指针再赋值
    return true;
}

bool Pop(SqStack *S, ElemType *x) {
    if (S->top == -1) return false;            // 栈空
    *x = S->data[S->top--];                    // 先取值再移指针
    return true;
}

bool Push0(ShStack *S, ElemType x) {
    if (S->top1 - S->top0 == 1) return false;  // 两栈顶相遇才满
    S->data[++S->top0] = x;                    // 向右生长
    return true;
}

bool Push1(ShStack *S, ElemType x) {
    if (S->top1 - S->top0 == 1) return false;
    S->data[--S->top1] = x;                    // 向左生长
    return true;
}

int main() {
    SqStack S;
    S.top = -1;
    ElemType x = 0;
    CHECK(!Pop(&S, &x), "任务 1a：空栈 Pop → false");
    CHECK(Push(&S, 1) && Push(&S, 2) && Push(&S, 3) && Push(&S, 4), "任务 1b：连入 1~4 成功");
    CHECK(!Push(&S, 5), "任务 1c：栈满 → false");
    CHECK(Pop(&S, &x) && x == 4, "任务 1d：出栈得到 4（LIFO）");
    CHECK(Pop(&S, &x) && x == 3, "任务 1e：出栈得到 3");

    ShStack T;
    T.top0 = -1;
    T.top1 = MaxSize;
    CHECK(Push0(&T, 1) && Push0(&T, 2), "任务 2a：0 号栈连入 1、2");
    CHECK(Push1(&T, 9) && Push1(&T, 8), "任务 2b：1 号栈连入 9、8");
    CHECK(!Push0(&T, 3) && !Push1(&T, 7), "任务 2c：两栈顶相遇 → 双双拒绝");
    CHECK(T.data[0] == 1 && T.data[1] == 2 && T.data[3] == 9 && T.data[2] == 8,
          "任务 2d：相向生长落位正确");
    CHECK_END("ch03-ex01-sq-stack");
    return 0;
}
