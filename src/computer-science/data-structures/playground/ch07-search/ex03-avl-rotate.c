// 📖 对应文档：../doc/07-search.md §7.3.2 AVL 树（四种旋转）
// 🎯 任务：实现 AVL 插入中的失衡判断与旋转调用 —— 旋转函数已给定，核心考点是"判断类型"
// ▶️ 运行：make run EX=ex03-avl-rotate（在 playground 目录下）
//
// 文档 §7.5 例 3：插入 {16,3,7,11,9,26,18,14,15} 共触发 5 次旋转
//（LR、LL、RR、RL、LR），最终树根为 11，四种旋转全部出现。

#include <stdio.h>
#include <stdbool.h>
#include <stdlib.h>
#include "../common/check.h"

typedef struct AVLNode {
    int key;
    struct AVLNode *lchild, *rchild;
    int height;                          // 以该结点为根的子树高度
} AVLNode, *AVLTree;

// ── 给定：高度维护 ──
static int Height(AVLTree p) { return p == NULL ? 0 : p->height; }
static int MaxInt(int a, int b) { return a > b ? a : b; }
static void UpdateHeight(AVLTree p) {
    p->height = MaxInt(Height(p->lchild), Height(p->rchild)) + 1;
}

// ── 给定：右旋（LL 型用）与左旋（RR 型用）—— 机械代码，直接用 ──
// 右旋：B 上移为根，A 成为 B 的右孩子，B 原右子树改挂 A 的左子树
static AVLTree RotateRight(AVLTree A) {
    AVLTree B = A->lchild;
    A->lchild = B->rchild;
    B->rchild = A;
    UpdateHeight(A);
    UpdateHeight(B);
    return B;
}

// 左旋：B 上移为根，A 成为 B 的左孩子，B 原左子树改挂 A 的右子树
static AVLTree RotateLeft(AVLTree A) {
    AVLTree B = A->rchild;
    A->rchild = B->lchild;
    B->lchild = A;
    UpdateHeight(A);
    UpdateHeight(B);
    return B;
}

// ─── 任务：AVL 插入（递归）—— 你的核心工作是"判断失衡类型" ──
// 插入后回溯到每个结点都要更新高度并检查平衡因子 BF = 左高 - 右高：
//   BF > 1 且 k < T->lchild->key  → LL：对 T 右旋
//   BF > 1 且 k > T->lchild->key  → LR：先对 T->lchild 左旋，再对 T 右旋
//   BF < -1 且 k > T->rchild->key → RR：对 T 左旋
//   BF < -1 且 k < T->rchild->key → RL：先对 T->rchild 右旋，再对 T 左旋
// TODO：*T == NULL → malloc（height = 1）返回；
//      k 相等直接返回；递归左右子树后 UpdateHeight(*T)，再按上面四种情况旋转
void AVL_Insert(AVLTree *T, int k) {
    (void)RotateRight; (void)RotateLeft;   // 防未使用警告，实现后可删
    // TODO
}

// ── 给定：验证整棵树每个结点 |BF| <= 1 ──
static bool CheckBalanced(AVLTree T) {
    if (T == NULL) return true;
    int bf = Height(T->lchild) - Height(T->rchild);
    return bf >= -1 && bf <= 1 && CheckBalanced(T->lchild) && CheckBalanced(T->rchild);
}

// 给定：中序收集
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

    CHECK(T != NULL && T->key == 11, "任务 a：最终树根为 11（文档例 3 的第 6 步 RR 后定型）");
    CHECK(T->lchild != NULL && T->lchild->key == 7 &&
          T->rchild != NULL && T->rchild->key == 18,
          "任务 b：根的左右孩子为 7、18");
    CHECK(T->rchild->lchild != NULL && T->rchild->lchild->key == 15,
          "任务 c：最后一次 LR 后 15 上移为 18 的左孩子");

    in_n = 0; InOrder(T);
    bool sorted = true;
    for (int i = 1; i < in_n; i++)
        if (in_order[i - 1] >= in_order[i]) sorted = false;
    CHECK(in_n == 9 && sorted, "任务 d：中序遍历 9 个结点严格递增（旋转保持 BST 性质）");
    CHECK(CheckBalanced(T), "任务 e：每个结点 |BF| <= 1（AVL 定义）");

    CHECK_END("ex03-avl-rotate");
    return 0;
}
