// ✅ 答案：ch07/ex03-avl-rotate（做完再看！）
// 关键点：BF>1 看新结点在孩子哪侧定 LL/LR；LR 先对孩子旋再对失衡点旋
#include <stdio.h>
#include <stdbool.h>
#include <stdlib.h>
#include "../common/check.h"

typedef struct AVLNode {
    int key;
    struct AVLNode *lchild, *rchild;
    int height;
} AVLNode, *AVLTree;

static int Height(AVLTree p) { return p == NULL ? 0 : p->height; }
static int MaxInt(int a, int b) { return a > b ? a : b; }
static void UpdateHeight(AVLTree p) {
    p->height = MaxInt(Height(p->lchild), Height(p->rchild)) + 1;
}

static AVLTree RotateRight(AVLTree A) {   // LL：右旋
    AVLTree B = A->lchild;
    A->lchild = B->rchild;                // B 原右子树挂 A 左
    B->rchild = A;                        // A 成 B 右孩子
    UpdateHeight(A);
    UpdateHeight(B);
    return B;                             // B 上移为根
}

static AVLTree RotateLeft(AVLTree A) {    // RR：左旋
    AVLTree B = A->rchild;
    A->rchild = B->lchild;                // B 原左子树挂 A 右
    B->lchild = A;
    UpdateHeight(A);
    UpdateHeight(B);
    return B;
}

void AVL_Insert(AVLTree *T, int k) {
    if (*T == NULL) {                     // 找到空位
        *T = (AVLTree)malloc(sizeof(AVLNode));
        (*T)->key = k;
        (*T)->lchild = (*T)->rchild = NULL;
        (*T)->height = 1;
        return;
    }
    if (k == (*T)->key) return;           // 不允许重复
    if (k < (*T)->key)
        AVL_Insert(&(*T)->lchild, k);
    else
        AVL_Insert(&(*T)->rchild, k);
    UpdateHeight(*T);                     // 回溯时更新高度、检查平衡
    int bf = Height((*T)->lchild) - Height((*T)->rchild);
    if (bf > 1 && k < (*T)->lchild->key)
        *T = RotateRight(*T);             // LL：右旋
    else if (bf > 1) {                    // LR：先对左孩子左旋，再对 T 右旋
        (*T)->lchild = RotateLeft((*T)->lchild);
        *T = RotateRight(*T);
    } else if (bf < -1 && k > (*T)->rchild->key) {
        *T = RotateLeft(*T);              // RR：左旋
    } else if (bf < -1) {                 // RL：先对右孩子右旋，再对 T 左旋
        (*T)->rchild = RotateRight((*T)->rchild);
        *T = RotateLeft(*T);
    }
}

static bool CheckBalanced(AVLTree T) {
    if (T == NULL) return true;
    int bf = Height(T->lchild) - Height(T->rchild);
    return bf >= -1 && bf <= 1 && CheckBalanced(T->lchild) && CheckBalanced(T->rchild);
}

static int in_order[64], in_n = 0;
static void InOrder(AVLTree T) {
    if (T != NULL) {
        InOrder(T->lchild);
        in_order[in_n++] = T->key;
        InOrder(T->rchild);
    }
}

int main() {
    AVLTree T = NULL;
    int keys[] = {16, 3, 7, 11, 9, 26, 18, 14, 15};
    for (int i = 0; i < 9; i++)
        AVL_Insert(&T, keys[i]);
    CHECK(T != NULL && T->key == 11, "任务 a：最终树根为 11");
    CHECK(T->lchild != NULL && T->lchild->key == 7 &&
          T->rchild != NULL && T->rchild->key == 18, "任务 b：左右孩子 7、18");
    CHECK(T->rchild->lchild != NULL && T->rchild->lchild->key == 15,
          "任务 c：15 上移为 18 的左孩子");
    in_n = 0; InOrder(T);
    bool sorted = true;
    for (int i = 1; i < in_n; i++)
        if (in_order[i - 1] >= in_order[i]) sorted = false;
    CHECK(in_n == 9 && sorted, "任务 d：中序严格递增");
    CHECK(CheckBalanced(T), "任务 e：|BF| <= 1");
    CHECK_END("ch07-ex03-avl-rotate");
    return 0;
}
