// 📖 对应文档：../doc/07-search.md §7.3.1 BST（插入/查找/删除三情形）
// 🎯 任务：BST 构造、查找、删除 —— 中序遍历递增有序是贯穿一切的验证手段
// ▶️ 运行：make run EX=ex02-bst-ops（在 playground 目录下）

#include <stdio.h>
#include <stdbool.h>
#include <stdlib.h>
#include "../common/check.h"

typedef struct BSTNode {
    int key;
    struct BSTNode *lchild, *rchild;
} BSTNode, *BSTree;

// ─── 任务 1：BST 插入（递归，纯 C 用二级指针修改树）─────────
// TODO：*T == NULL → malloc 新结点（key、左右孩子置好）返回 true；
//      k 相等 → false（BST 不允许重复）；k 小 → 递归左子树；k 大 → 递归右子树
bool BST_Insert(BSTree *T, int k) {
    return false;   // TODO
}

// ─── 任务 2：BST 查找（非递归）─────────────────────────────
// TODO：从根出发，key 小走左、大走右，相等返回结点；走到 NULL 失败
BSTNode *BST_Search(BSTree T, int key) {
    return NULL;   // TODO
}

// ─── 任务 3：BST 删除（三种情形，删除后仍保持 BST 性质）─────
// ① 叶子：直接删；② 单孩子：孩子顶替；③ 双孩子：用【中序前驱】
//   （左子树最右下）的值替换，再删除前驱结点
// TODO：key 小/大 → 递归左右；找到 T 后：
//      左空 → q=*T, *T=右孩子, free(q)；右空同理；
//      双孩子 → pre 找左子树最右下（parent 跟踪），*T 的 key 替换，
//              pre 的左子树接回 parent（parent==*T 时接 lchild，否则接 rchild），free(pre)
void BST_Delete(BSTree *T, int key) {
    // TODO
}

// ── 给定：中序收集 + 数组比对 ──
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
    // 文档 §7.5 例 2：依次插入 {45,24,53,12,37,93}
    BSTree T = NULL;
    int keys[] = {45, 24, 53, 12, 37, 93};
    bool all_ok = true;
    for (int i = 0; i < 6; i++)
        if (!BST_Insert(&T, keys[i])) all_ok = false;
    CHECK(all_ok, "任务 1a：6 个关键字全部插入成功");
    CHECK(!BST_Insert(&T, 45), "任务 1b：重复关键字插入 → false（BST 不允许重复）");

    // 中序递增有序验证 + ASL 来源
    in_n = 0; InOrder(T);
    int sorted[] = {12, 24, 37, 45, 53, 93};
    CHECK(ArrEquals(sorted, 6), "任务 1c：中序遍历 = {12,24,37,45,53,93}（BST 的灵魂性质）");

    // 任务 2 检验：37 在第 3 层（比较 3 次），查找 99 失败
    BSTNode *hit = BST_Search(T, 37);
    CHECK(hit != NULL && hit->key == 37, "任务 2a：查找 37 命中");
    CHECK(BST_Search(T, 99) == NULL, "任务 2b：查找 99 失败返回 NULL");

    // 任务 3 检验（三种删除各自独立）：
    // ① 删叶子 37 → 中序 {12,24,45,53,93}
    BST_Delete(&T, 37);
    in_n = 0; InOrder(T);
    int after1[] = {12, 24, 45, 53, 93};
    CHECK(ArrEquals(after1, 5), "任务 3a：删叶子 37 后中序有序");

    // ② 删单孩子结点 53（只有右孩子 93）→ 93 顶替
    BST_Delete(&T, 53);
    in_n = 0; InOrder(T);
    int after2[] = {12, 24, 45, 93};
    CHECK(ArrEquals(after2, 4), "任务 3b：删 53 后中序有序（93 顶替）");

    // ③ 重建树删双孩子结点 24（前驱 12 替换）→ 中序仍有序
    T = NULL;
    for (int i = 0; i < 6; i++) BST_Insert(&T, keys[i]);
    BST_Delete(&T, 24);
    in_n = 0; InOrder(T);
    int after3[] = {12, 37, 45, 53, 93};
    CHECK(ArrEquals(after3, 5), "任务 3c：删双孩子 24（前驱 12 替换）后中序有序");

    CHECK_END("ex02-bst-ops");
    return 0;
}
