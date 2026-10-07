// 📖 对应文档：../doc/05-tree-and-binary-tree.md §5.7 哈夫曼树与 WPL（408 必考）
// 🎯 任务：教材静态数组法构造哈夫曼树 + 计算 WPL，验证文档例题 WPL = 205
// ▶️ 运行：make run EX=ex03-huffman（在 playground 目录下）
//
// 静态三叉表示（严蔚敏教材）：n 个叶子 → 2n-1 个结点，数组 1..n 是叶子，
// 每次从未并入（parent == 0）的结点中选权值最小的两个合并。

#include <stdio.h>
#include <stdbool.h>
#include "../common/check.h"

#define MAXNODE 100

typedef struct {
    int weight;
    int parent, lchild, rchild;   // 双亲与左右孩子下标（0 表示空）
} HTNode;

// ─── 任务 1：选出权值最小的两个未并入结点 ──────────────────
// TODO：在 HT[1..end] 中找 parent == 0 的结点里权值最小的两个，
//      下标写入 *s1（更小）与 *s2（次小）。两轮扫描即可：先找最小，
//      再跳过它找次小（或一遍扫描同时维护两个最小值）。
void SelectTwo(const HTNode HT[], int end, int *s1, int *s2) {
    // TODO
}

// ─── 任务 2：构造哈夫曼树（n 个权值 → 2n-1 个结点）──────────
// TODO：① HT[1..n] 放 n 个权值，parent/lchild/rchild 全 0；
//      ② for i = n+1 .. 2n-1：SelectTwo(i-1, &s1, &s2)，
//         HT[s1].parent = HT[s2].parent = i，
//         HT[i] = { HT[s1].weight + HT[s2].weight, 0, s1, s2 }
void BuildHuffman(HTNode HT[], const int w[], int n) {
    // TODO
}

// ─── 任务 3：计算 WPL（从每个叶子向上数到根的路径长度）──────
// 408 快捷验算：WPL = 所有内部结点（n+1 .. 2n-1）权值之和
// TODO：对每个叶子 i（1..n）：沿 parent 链走到根（parent == 0），累计深度 dep；
//      WPL += weight * dep
int CalcWPL(const HTNode HT[], int n) {
    return 0;   // TODO
}

int main() {
    // 文档 §5.7.3 例题：权值 {5, 15, 40, 30, 10} → WPL = 205
    int w[] = {5, 15, 40, 30, 10};
    int n = 5;
    HTNode HT[MAXNODE] = {0};

    BuildHuffman(HT, w, n);

    CHECK(HT[2 * n - 1].weight == 100, "任务 2a：根（第 9 号结点）权值 = 100（5+10+15+30+40）");
    int leaf_cnt = 0, inner_sum = 0;
    for (int i = 1; i <= 2 * n - 1; i++) {
        if (HT[i].lchild == 0) leaf_cnt++;
        else inner_sum += HT[i].weight;
    }
    CHECK(leaf_cnt == 5, "任务 2b：共 5 个叶子（初始权值全是叶子）");
    CHECK(inner_sum == 205, "任务 2c：内部结点权值和 = 100+60+30+15 = 205（快捷验算法）");

    CHECK(CalcWPL(HT, n) == 205, "任务 3a：WPL = 40×1 + 30×2 + 15×3 + 5×4 + 10×4 = 205");

    // 再验一组：文档自测题 5，权值 {2,3,6,9} → WPL = 36
    int w2[] = {2, 3, 6, 9};
    HTNode HT2[MAXNODE] = {0};
    BuildHuffman(HT2, w2, 4);
    CHECK(CalcWPL(HT2, 4) == 36, "任务 3b：{2,3,6,9} → WPL = 36（9+12+9+6）");

    CHECK_END("ex03-huffman");
    return 0;
}
