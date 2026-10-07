// ✅ 答案：ch03/ex02-circular-queue（做完再看！）
// 关键点：长度公式 (rear-front+MaxSize)%MaxSize；牺牲单元法最多存 MaxSize-1 个
#include <stdio.h>
#include <stdbool.h>
#include "../common/check.h"

#define MaxSize 10
typedef int ElemType;

typedef struct {
    ElemType data[MaxSize];
    int front, rear;
} SqQueue;

void InitQueue(SqQueue *Q) {
    Q->front = Q->rear = 0;
}

bool EnQueue(SqQueue *Q, ElemType x) {
    if ((Q->rear + 1) % MaxSize == Q->front) return false;   // 队满（牺牲一个单元）
    Q->data[Q->rear] = x;
    Q->rear = (Q->rear + 1) % MaxSize;                       // 循环后移
    return true;
}

bool DeQueue(SqQueue *Q, ElemType *x) {
    if (Q->front == Q->rear) return false;                   // 队空
    *x = Q->data[Q->front];
    Q->front = (Q->front + 1) % MaxSize;
    return true;
}

int QueueLength(SqQueue Q) {
    return (Q.rear - Q.front + MaxSize) % MaxSize;   // rear < front 时必须补 MaxSize
}

int main() {
    SqQueue Q;
    InitQueue(&Q);
    ElemType x = 0;
    CHECK(Q.front == Q.rear, "任务 a：初始化后队空");
    CHECK(QueueLength(Q) == 0, "任务 b：空队长度 0");
    CHECK(EnQueue(&Q, 1) && EnQueue(&Q, 2) && EnQueue(&Q, 3), "任务 c：连入 1,2,3");
    CHECK(DeQueue(&Q, &x) && x == 1, "任务 d：出队得到 1（FIFO）");
    CHECK(EnQueue(&Q, 4) && EnQueue(&Q, 5), "任务 e：再入 4,5");
    CHECK(QueueLength(Q) == 4, "任务 f：长度 4（指针已不连续）");
    Q.front = 7;
    Q.rear = 3;
    CHECK(QueueLength(Q) == 6, "任务 g：(3-7+10)%%10 = 6");
    SqQueue F;
    InitQueue(&F);
    int pushed = 0;
    while (EnQueue(&F, pushed + 1)) pushed++;
    CHECK(pushed == MaxSize - 1, "任务 h：最多存 MaxSize-1 = 9 个");
    CHECK(!EnQueue(&F, 99), "任务 i：队满拒绝");
    CHECK_END("ch03-ex02-circular-queue");
    return 0;
}
