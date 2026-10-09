// 📖 对应文档：../doc/05-tree-and-binary-tree.md §5.4.3 非递归遍历 + §5.4.6 由遍历序列构造
// 🎯 任务：栈版中序非递归（出栈时才访问）+ 先序+中序唯一确定二叉树（408 综合题高频）
// ▶️ 运行：make run EX=ex02-nonrec-construct（在 playground 目录下）

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

// 给定：结果缓冲区 / 简单顺序栈（存结点指针）
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
static int top = -1;                       // 栈顶指针，-1 为空
static void Push(BiTree p) { stk[++top] = p; }
static BiTree Pop(void) { return stk[top--]; }
static bool StkEmpty(void) { return top == -1; }

// ─── 任务 1：中序非递归遍历 ────────────────────────────────
// 口诀："左到底 → 出栈访问 → 转向右"。与先序唯一区别：先序是"入栈前访问"
// TODO：p = T；while (p || !StkEmpty) { p 非空：入栈 p，p = p->lchild；
//      p 空：出栈 visit，p = 出栈结点的 rchild }
void InOrder2(BiTree T) {
    (void)Push; (void)Pop; (void)StkEmpty;   // 防未使用警告，实现后可删
    // TODO
}

// ─── 任务 2：先序 + 中序构造二叉树（文档 §5.4.6 BuildTree 默写）──
// 思想：先序第一个是根 → 中序中定位根，左边为左子树、右边为右子树 →
//      按左子树结点数切分先序 → 递归
// TODO：pl > pr 返回 NULL；malloc 根结点、data = pre[pl]；
//      k 从 il 找到 in[k] == pre[pl]；leftLen = k - il；
//      递归左右：lchild 用 (pl+1, pl+leftLen, il, k-1)，rchild 用 (pl+leftLen+1, pr, k+1, ir)
BiTree BuildTree(const char pre[], const char in[], int pl, int pr, int il, int ir) {
    return NULL;   // TODO
}

// 给定：后序收集（验证构造结果）
static void PostOrder(BiTree T) {
    if (T != NULL) {
        PostOrder(T->lchild);
        PostOrder(T->rchild);
        visit(T);
    }
}

int main() {
    // 文档 §5.9 例 3/例 4 的树：A(B(C,D), E(F(,G)))
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

    // 任务 1 检验：非递归中序结果与递归版一致
    ResetOut(); InOrder2(A);
    CHECK(OutEquals("CBDAEFG"), "任务 1：非递归中序 = C B D A E F G（出栈时访问）");

    // 任务 2 检验：先序 ABCDEFG + 中序 CBDAEFG → 构造出的树后序 = C D B G F E A
    ResetOut();
    BiTree T = BuildTree("ABCDEFG", "CBDAEFG", 0, 6, 0, 6);
    CHECK(T != NULL && T->data == 'A', "任务 2a：先序首元素 A 是根");
    PostOrder(T);
    CHECK(OutEquals("CDBGFEA"), "任务 2b：构造树的后序 = C D B G F E A（构造正确）");

    CHECK_END("ex02-nonrec-construct");
    return 0;
}
