// 📖 对应文档：../doc/05-tree-and-binary-tree.md §5.4 遍历（递归三序 + 层序）
// 🎯 任务：默写先/中/后序递归遍历与队列层序遍历，用文档例 3 的树逐序列验证
// ▶️ 运行：make run EX=ex01-traversal（在 playground 目录下）
//
// 测试树（文档 §5.9 例 3 构造出的树）：A(B(C,D), E(F(,G)))
//   先序 A B C D E F G | 中序 C B D A E F G | 后序 C D B G F E A | 层序 A B E C D F G

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

// ── 给定：收集遍历结果的缓冲区（visit 就是"写入缓冲区"）──
static char out[100];
static int out_n = 0;

static void visit(BiTree p) { out[out_n++] = p->data; }
static void ResetOut(void) { out_n = 0; }
static bool OutEquals(const char expect[]) {
    for (int i = 0; expect[i] != '\0'; i++)
        if (i >= out_n || out[i] != expect[i]) return false;
    return out_n == (int)strlen(expect);
}

// ── 给定：文档例 3 的树 ──
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

// ─── 任务 1：递归遍历三连（各 3 行）────────────────────────
void PreOrder(BiTree T) {
    (void)visit;   // 防未使用警告，实现后可删
    // TODO：T 非空时：visit(T) → 递归左 → 递归右
}

void InOrder(BiTree T) {
    // TODO：左 → visit → 右
}

void PostOrder(BiTree T) {
    // TODO：左 → 右 → visit
}

// ─── 任务 2：层序遍历（队列辅助）───────────────────────────
// 给定：简单顺序队列（存结点指针，容量足够）
static BiTree queue_buf[100];
static int q_head = 0, q_tail = 0;
static void EnQ(BiTree p) { queue_buf[q_tail++] = p; }
static BiTree DeQ(void) { return queue_buf[q_head++]; }
static bool QEmpty(void) { return q_head == q_tail; }

// TODO：根入队；队空循环 { 出队 visit；左孩子非空入队；右孩子非空入队 }
void LevelOrder(BiTree T) {
    (void)visit; (void)EnQ; (void)DeQ; (void)QEmpty;   // 防未使用警告，实现后可删
    // TODO
}

int main() {
    BiTree T = TestTree();

    ResetOut(); PreOrder(T);
    CHECK(OutEquals("ABCDEFG"), "任务 1a：先序 A B C D E F G（根左右）");

    ResetOut(); InOrder(T);
    CHECK(OutEquals("CBDAEFG"), "任务 1b：中序 C B D A E F G（左根右）");

    ResetOut(); PostOrder(T);
    CHECK(OutEquals("CDBGFEA"), "任务 1c：后序 C D B G F E A（左右根）");

    ResetOut(); LevelOrder(T);
    CHECK(OutEquals("ABECDFG"), "任务 2：层序 A B E C D F G（逐层从左到右）");

    CHECK_END("ex01-traversal");
    return 0;
}
