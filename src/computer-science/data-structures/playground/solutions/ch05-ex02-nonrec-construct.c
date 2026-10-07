// ✅ 答案：ch05/ex02-nonrec-construct（做完再看！）
// 关键点：中序非递归"出栈才访问"；构造 = 先序定根 + 中序分割
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
static BiTree stk[100];
static int top = -1;
static void Push(BiTree p) { stk[++top] = p; }
static BiTree Pop(void) { return stk[top--]; }
static bool StkEmpty(void) { return top == -1; }

void InOrder2(BiTree T) {
    BiTNode *p = T;
    top = -1;
    while (p != NULL || !StkEmpty()) {
        if (p != NULL) {
            Push(p);              // 入栈暂存，不访问
            p = p->lchild;        // 一路向左
        } else {
            p = Pop();            // 左尽 → 出栈
            visit(p);             // 此刻才访问
            p = p->rchild;        // 转向右子树
        }
    }
}

BiTree BuildTree(const char pre[], const char in[], int pl, int pr, int il, int ir) {
    if (pl > pr) return NULL;                 // 空区间
    BiTNode *root = (BiTNode *)malloc(sizeof(BiTNode));
    root->data = pre[pl];                     // ① 先序第一个为根
    int k = il;
    while (in[k] != pre[pl]) k++;             // ② 中序定位根
    int leftLen = k - il;                     // ③ 左子树结点数
    root->lchild = BuildTree(pre, in, pl + 1, pl + leftLen, il, k - 1);
    root->rchild = BuildTree(pre, in, pl + leftLen + 1, pr, k + 1, ir);
    return root;
}

static void PostOrder(BiTree T) {
    if (T != NULL) {
        PostOrder(T->lchild);
        PostOrder(T->rchild);
        visit(T);
    }
}

int main() {
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
    ResetOut(); InOrder2(A);
    CHECK(OutEquals("CBDAEFG"), "任务 1：非递归中序 = C B D A E F G");
    ResetOut();
    BiTree T = BuildTree("ABCDEFG", "CBDAEFG", 0, 6, 0, 6);
    CHECK(T != NULL && T->data == 'A', "任务 2a：先序首元素 A 是根");
    PostOrder(T);
    CHECK(OutEquals("CDBGFEA"), "任务 2b：构造树的后序 = C D B G F E A");
    CHECK_END("ch05-ex02-nonrec-construct");
    return 0;
}
