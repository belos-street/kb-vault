// 📖 对应文档：../doc/03-stack-and-queue.md §3.6 循环队列（本章核心）
// 🎯 任务：牺牲单元法的 EnQueue/DeQueue/QueueLength —— 长度公式必须 +MaxSize 再取模
// ▶️ 运行：make run EX=ex02-circular-queue（在 playground 目录下）

#include <stdio.h>
#include <stdbool.h>
#include "../common/check.h"

#define MaxSize 10

typedef int ElemType;

typedef struct {
    ElemType data[MaxSize];
    int front, rear;           // 队头、队尾（rear 指向队尾元素的下一位置）
} SqQueue;

// ─── 任务：补全循环队列的三个核心操作（牺牲单元法）─────────
// 判空：front == rear
// 判满：(rear + 1) % MaxSize == front（牺牲一个单元）
// 长度：(rear - front + MaxSize) % MaxSize（rear < front 时少加 MaxSize 必错！）

// TODO：初始化 front = rear = 0
void InitQueue(SqQueue *Q) {
    // TODO
}

// TODO：队满返回 false；否则 data[rear] = x，rear = (rear + 1) % MaxSize
bool EnQueue(SqQueue *Q, ElemType x) {
    return false;   // TODO
}

// TODO：队空返回 false；否则 *x = data[front]，front = (front + 1) % MaxSize
bool DeQueue(SqQueue *Q, ElemType *x) {
    return false;   // TODO
}

// TODO：返回元素个数（长度公式）
int QueueLength(SqQueue Q) {
    return 0;   // TODO
}

int main() {
    SqQueue Q;
    InitQueue(&Q);
    ElemType x = 0;

    CHECK(Q.front == Q.rear, "任务 a：初始化后队空（front == rear）");
    CHECK(QueueLength(Q) == 0, "任务 b：空队长度 0");

    // 入 1,2,3 → 出 1 个（front 前移）→ 再入 2 个 → 长度 4
    CHECK(EnQueue(&Q, 1) && EnQueue(&Q, 2) && EnQueue(&Q, 3), "任务 c：连入 1,2,3");
    CHECK(DeQueue(&Q, &x) && x == 1, "任务 d：出队得到 1（FIFO）");
    CHECK(EnQueue(&Q, 4) && EnQueue(&Q, 5), "任务 e：再入 4,5");
    CHECK(QueueLength(Q) == 4, "任务 f：3 入 1 出再入 2 → 长度 4（指针已不连续）");

    // 文档 §3.11 例 1 的固定陷阱场景：rear < front 时必须补 MaxSize
    Q.front = 7;
    Q.rear = 3;
    CHECK(QueueLength(Q) == 6, "任务 g：front=7, rear=3, MaxSize=10 → (3-7+10)%%10 = 6");

    // 绕环验证：牺牲单元法最多存 MaxSize-1 个
    SqQueue F;
    InitQueue(&F);
    int pushed = 0;
    while (EnQueue(&F, pushed + 1)) pushed++;
    CHECK(pushed == MaxSize - 1, "任务 h：牺牲单元法最多存 MaxSize-1 = 9 个");
    CHECK(!EnQueue(&F, 99), "任务 i：队满后 (rear+1)%%MaxSize == front → 拒绝");

    CHECK_END("ex02-circular-queue");
    return 0;
}
