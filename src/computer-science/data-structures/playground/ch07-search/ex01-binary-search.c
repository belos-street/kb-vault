// 📖 对应文档：../doc/07-search.md §7.2.3 折半查找 + §7.2.4 判定树
// 🎯 任务：折半查找实现 + 比较次数统计，验证判定树的层数结论
// ▶️ 运行：make run EX=ex01-binary-search（在 playground 目录下）
//
// 前提（缺一不可）：关键字有序 + 顺序存储。链表不能折半！

#include <stdio.h>
#include <stdbool.h>
#include "../common/check.h"

// 给定：1 起点的静态查找表（elem[1..TableLen] 升序）
typedef struct {
    int elem[64];
    int TableLen;
} SSTable;

static int cmp_count = 0;   // 比较计数器

// ─── 任务：折半查找，返回位置（1 基），失败返回 -1 ──────────
// 易错点：① 循环条件 low <= high（不是 <）；② mid = (low+high)/2 向下取整；
//        ③ 每次比较（含最后一次命中）都要 cmp_count++
// TODO
int Binary_Search(SSTable ST, int key) {
    return -1;   // TODO
}

int main() {
    SSTable ST = {0};
    ST.TableLen = 10;
    for (int i = 1; i <= 10; i++) ST.elem[i] = i;   // {1..10}

    // 文档 §7.5 例 1：判定树根是 5（第一次比较即命中）
    cmp_count = 0;
    CHECK(Binary_Search(ST, 5) == 5, "任务 a：key=5 是判定树根，位置 5");
    CHECK(cmp_count == 1, "任务 b：根结点只需 1 次比较");

    // 查找 4：5 → 2 → 3 → 4，共 4 次（第 4 层结点）
    cmp_count = 0;
    CHECK(Binary_Search(ST, 4) == 4, "任务 c：key=4 在第 4 层，位置 4");
    CHECK(cmp_count == 4, "任务 d：比较 4 次 = 所在层数");

    // 查找 10：5 → 8 → 9 → 10，共 4 次；失败最多也是 ⌈log2(n+1)⌉ = 4 次
    cmp_count = 0;
    CHECK(Binary_Search(ST, 10) == 10 && cmp_count == 4, "任务 e：key=10 比较 4 次命中");
    cmp_count = 0;
    CHECK(Binary_Search(ST, 99) == -1, "任务 f：查找失败返回 -1");
    CHECK(cmp_count <= 4, "任务 g：失败比较次数不超过树高 ⌈log2(11)⌉ = 4");

    CHECK_END("ex01-binary-search");
    return 0;
}
