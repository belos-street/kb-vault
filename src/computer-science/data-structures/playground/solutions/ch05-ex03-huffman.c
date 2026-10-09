// ✅ 答案：ch05/ex03-huffman（做完再看！）
// 关键点：静态三叉数组构造；WPL = 内部结点权和（快捷验算）
#include <stdio.h>
#include <stdbool.h>
#include "../common/check.h"

#define MAXNODE 100

typedef struct {
    int weight;
    int parent, lchild, rchild;
} HTNode;

void SelectTwo(const HTNode HT[], int end, int *s1, int *s2) {
    // 平局约定：取下标更小者（一遍扫描的严格小于比较天然如此）。
    // 哈夫曼树不唯一（等权合并顺序可不同），树形可能与文档 §5.7.3 略异，但 WPL 唯一。
    *s1 = *s2 = 0;
    for (int i = 1; i <= end; i++) {           // 一遍扫描维护两个最小
        if (HT[i].parent != 0) continue;       // 已并入的跳过
        if (*s1 == 0 || HT[i].weight < HT[*s1].weight) {
            *s2 = *s1;                         // 原最小降级为次小
            *s1 = i;
        } else if (*s2 == 0 || HT[i].weight < HT[*s2].weight) {
            *s2 = i;
        }
    }
}

void BuildHuffman(HTNode HT[], const int w[], int n) {
    for (int i = 1; i <= n; i++) {             // ① n 个叶子
        HT[i].weight = w[i - 1];
        HT[i].parent = HT[i].lchild = HT[i].rchild = 0;
    }
    for (int i = n + 1; i <= 2 * n - 1; i++) { // ② n-1 次合并
        int s1, s2;
        SelectTwo(HT, i - 1, &s1, &s2);
        HT[s1].parent = i;
        HT[s2].parent = i;
        HT[i].weight = HT[s1].weight + HT[s2].weight;
        HT[i].parent = 0;
        HT[i].lchild = s1;
        HT[i].rchild = s2;
    }
}

int CalcWPL(const HTNode HT[], int n) {
    int wpl = 0;
    for (int i = 1; i <= n; i++) {             // 每个叶子向上数深度
        int dep = 0;
        for (int p = i; HT[p].parent != 0; p = HT[p].parent)
            dep++;
        wpl += HT[i].weight * dep;
    }
    return wpl;
}

int main() {
    int w[] = {5, 15, 40, 30, 10};
    int n = 5;
    HTNode HT[MAXNODE] = {0};
    BuildHuffman(HT, w, n);
    CHECK(HT[2 * n - 1].weight == 100, "任务 2a：根权值 = 100");
    int leaf_cnt = 0, inner_sum = 0;
    for (int i = 1; i <= 2 * n - 1; i++) {
        if (HT[i].lchild == 0) leaf_cnt++;
        else inner_sum += HT[i].weight;
    }
    CHECK(leaf_cnt == 5, "任务 2b：5 个叶子");
    CHECK(inner_sum == 205, "任务 2c：内部结点和 100+60+30+15 = 205");
    CHECK(CalcWPL(HT, n) == 205, "任务 3a：WPL = 205");
    int w2[] = {2, 3, 6, 9};
    HTNode HT2[MAXNODE] = {0};
    BuildHuffman(HT2, w2, 4);
    CHECK(CalcWPL(HT2, 4) == 36, "任务 3b：{2,3,6,9} → WPL = 36");
    CHECK_END("ch05-ex03-huffman");
    return 0;
}
