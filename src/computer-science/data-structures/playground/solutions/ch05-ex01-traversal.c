// ✅ 答案：ch05/ex01-traversal（做完再看！）
// 关键点：三序只差 visit 位置；层序队列保证"同层先于下层"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <stdbool.h>
#include "../common/check.h"

typedef char ElemType;
typedef struct BiTNode {
    ElemType data;
    struct BiTNode *lchild, *rchild;
} BiTNode, *BiTree;

static char out[100];
static int out_n = 0;
static void visit(BiTree p) { out[out_n++] = p->data; }
static void ResetOut(void) { out_n = 0; }
static bool OutEquals(const char expect[]) {
    for (int i = 0; expect[i] != '\0'; i++)
        if (i >= out_n || out[i] != expect[i]) return false;
    return out_n == (int)strlen(expect);
}
static BiTree TestTree(void) {
    BiTNode *A = malloc(sizeof(BiTNode)), *B = malloc(sizeof(BiTNode)),
            *C = malloc(sizeof(BiTNode)), *D = malloc(sizeof(BiTNode)),
            *E = malloc(sizeof(BiTNode)), *F = malloc(sizeof(BiTNode)),
            *G = malloc(sizeof(BiTNode));
    A->data='A'; B->data='B'; C->data='C'; D->data='D';
    E->data='E'; F->data='F'; G->data='G';
    A->lchild=B; A->rchild=E; B->lchild=C; B->rchild=D;
    E->lchild=NULL; E->rchild=F; F->lchild=NULL; F->rchild=G;
    C->lchild=C->rchild=D->lchild=D->rchild=NULL;
    G->lchild=G->rchild=NULL;
    return A;
}

void PreOrder(BiTree T) {
    if (T != NULL) {
        visit(T);                 // 根
        PreOrder(T->lchild);      // 左
        PreOrder(T->rchild);      // 右
    }
}
void InOrder(BiTree T) {
    if (T != NULL) {
        InOrder(T->lchild);
        visit(T);
        InOrder(T->rchild);
    }
}
void PostOrder(BiTree T) {
    if (T != NULL) {
        PostOrder(T->lchild);
        PostOrder(T->rchild);
        visit(T);
    }
}

static BiTree queue_buf[100];
static int q_head = 0, q_tail = 0;
static void EnQ(BiTree p) { queue_buf[q_tail++] = p; }
static BiTree DeQ(void) { return queue_buf[q_head++]; }
static bool QEmpty(void) { return q_head == q_tail; }

void LevelOrder(BiTree T) {
    if (T == NULL) return;
    q_head = q_tail = 0;
    EnQ(T);                       // 根入队
    while (!QEmpty()) {
        BiTree p = DeQ();         // 出队访问
        visit(p);
        if (p->lchild != NULL) EnQ(p->lchild);   // 左孩子入队
        if (p->rchild != NULL) EnQ(p->rchild);   // 右孩子入队
    }
}

int main() {
    BiTree T = TestTree();
    ResetOut(); PreOrder(T);
    CHECK(OutEquals("ABCDEFG"), "任务 1a：先序 A B C D E F G");
    ResetOut(); InOrder(T);
    CHECK(OutEquals("CBDAEFG"), "任务 1b：中序 C B D A E F G");
    ResetOut(); PostOrder(T);
    CHECK(OutEquals("CDBGFEA"), "任务 1c：后序 C D B G F E A");
    ResetOut(); LevelOrder(T);
    CHECK(OutEquals("ABECDFG"), "任务 2：层序 A B E C D F G");
    CHECK_END("ch05-ex01-traversal");
    return 0;
}
