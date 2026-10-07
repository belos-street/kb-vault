// ✅ 答案：ch07/ex02-bst-ops（做完再看！）
// 关键点：插入/查找走同一路径；双孩子删除用中序前驱替换；中序验证一切
#include <stdio.h>
#include <stdbool.h>
#include <stdlib.h>
#include "../common/check.h"

typedef struct BSTNode {
    int key;
    struct BSTNode *lchild, *rchild;
} BSTNode, *BSTree;

bool BST_Insert(BSTree *T, int k) {
    if (*T == NULL) {                        // 找到空位
        *T = (BSTree)malloc(sizeof(BSTNode));
        (*T)->key = k;
        (*T)->lchild = (*T)->rchild = NULL;
        return true;
    }
    if (k == (*T)->key) return false;        // 不允许重复
    if (k < (*T)->key)
        return BST_Insert(&(*T)->lchild, k); // 二级指针递归
    return BST_Insert(&(*T)->rchild, k);
}

BSTNode *BST_Search(BSTree T, int key) {
    while (T != NULL && key != T->key) {
        if (key < T->key)
            T = T->lchild;                   // 小往左
        else
            T = T->rchild;                   // 大往右
    }
    return T;
}

void BST_Delete(BSTree *T, int key) {
    if (*T == NULL) return;
    if (key < (*T)->key) {
        BST_Delete(&(*T)->lchild, key);
        return;
    }
    if (key > (*T)->key) {
        BST_Delete(&(*T)->rchild, key);
        return;
    }
    // 找到待删结点 *T
    if ((*T)->lchild == NULL) {              // ① 左空（含叶子）：右子树顶替
        BSTree q = *T;
        *T = (*T)->rchild;
        free(q);
    } else if ((*T)->rchild == NULL) {       // ② 右空：左子树顶替
        BSTree q = *T;
        *T = (*T)->lchild;
        free(q);
    } else {                                 // ③ 双孩子：中序前驱替换
        BSTree pre = (*T)->lchild, parent = *T;   // pre 找左子树最右下
        while (pre->rchild != NULL) {
            parent = pre;
            pre = pre->rchild;
        }
        (*T)->key = pre->key;                // 前驱值上移
        if (parent == *T)                    // 前驱就是左孩子
            parent->lchild = pre->lchild;    // 前驱的左子树接回
        else
            parent->rchild = pre->lchild;
        free(pre);
    }
}

static int in_order[64], in_n = 0;
static void InOrder(BSTree T) {
    if (T != NULL) {
        InOrder(T->lchild);
        in_order[in_n++] = T->key;
        InOrder(T->rchild);
    }
}
static bool ArrEquals(const int expect[], int n) {
    if (in_n != n) return false;
    for (int i = 0; i < n; i++)
        if (in_order[i] != expect[i]) return false;
    return true;
}

int main() {
    BSTree T = NULL;
    int keys[] = {45, 24, 53, 12, 37, 93};
    bool all_ok = true;
    for (int i = 0; i < 6; i++)
        if (!BST_Insert(&T, keys[i])) all_ok = false;
    CHECK(all_ok, "任务 1a：6 个关键字插入成功");
    CHECK(!BST_Insert(&T, 45), "任务 1b：重复关键字 → false");
    in_n = 0; InOrder(T);
    int sorted[] = {12, 24, 37, 45, 53, 93};
    CHECK(ArrEquals(sorted, 6), "任务 1c：中序递增有序");
    BSTNode *hit = BST_Search(T, 37);
    CHECK(hit != NULL && hit->key == 37, "任务 2a：查找 37 命中");
    CHECK(BST_Search(T, 99) == NULL, "任务 2b：查找 99 失败");
    BST_Delete(&T, 37);
    in_n = 0; InOrder(T);
    int after1[] = {12, 24, 45, 53, 93};
    CHECK(ArrEquals(after1, 5), "任务 3a：删叶子 37");
    BST_Delete(&T, 53);
    in_n = 0; InOrder(T);
    int after2[] = {12, 24, 45, 93};
    CHECK(ArrEquals(after2, 4), "任务 3b：删单孩子 53（93 顶替）");
    T = NULL;
    for (int i = 0; i < 6; i++) BST_Insert(&T, keys[i]);
    BST_Delete(&T, 24);
    in_n = 0; InOrder(T);
    int after3[] = {12, 37, 45, 53, 93};
    CHECK(ArrEquals(after3, 5), "任务 3c：删双孩子 24（前驱 12 替换）");
    CHECK_END("ch07-ex02-bst-ops");
    return 0;
}
