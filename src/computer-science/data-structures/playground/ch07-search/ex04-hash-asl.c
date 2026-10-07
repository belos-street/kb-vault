// 📖 对应文档：../doc/07-search.md §7.4 散列表（线性探测 + 成功/失败 ASL）
// 🎯 任务：线性探测构造散列表 + 程序化计算成功/失败 ASL，验证文档例 5 的 8/6 与 28/7
// ▶️ 运行：make run EX=ex04-hash-asl（在 playground 目录下）

#include <stdio.h>
#include <stdbool.h>
#include "../common/check.h"

#define M 7                     // 表长
#define EMPTY -1                // 空位标记（408 题面通常画空格，代码用 -1）

static int table[M];            // 散列表，H(key) = key % M

// ─── 任务 1：线性探测插入 ──────────────────────────────────
// TODO：addr = key % M 起线性探测（(addr+1) % M 绕环）找第一个空位放入；
//      绕一整圈都没有空位 → 返回 false
bool HashInsert(int key) {
    return false;   // TODO
}

// ─── 任务 2：成功 ASL 的分子 ───────────────────────────────
// 对表中每个已存记录：从 H(key) 出发探测到它（途中冲突槽各算 1 次，
// 命中槽也算 1 次），累计总比较次数返回
// TODO：两层结构：外层扫 table 的非空槽，内层从 key%M 开始数到命中
int SuccessProbes(void) {
    return 0;   // TODO
}

// ─── 任务 3：失败 ASL 的分子 ───────────────────────────────
// 按哈希地址 0..M-1 分类：每类从该地址探测到【第一个空位】为止
//（空位本身也计 1 次比较），累计返回
// ⚠️ 失败 ASL 的分母是 M（哈希地址个数），不是失败关键字个数！
int FailProbes(void) {
    return 0;   // TODO
}

int main() {
    for (int i = 0; i < M; i++) table[i] = EMPTY;

    // 文档 §7.5 例 5：{7,8,30,11,18,9} 依次插入
    int keys[] = {7, 8, 30, 11, 18, 9};
    bool all_ok = true;
    for (int i = 0; i < 6; i++)
        if (!HashInsert(keys[i])) all_ok = false;
    CHECK(all_ok, "任务 1a：6 个关键字全部插入");

    // 落位验证：18 与 9 都发生了 1 次冲突后移
    CHECK(table[0] == 7 && table[1] == 8 && table[2] == 30 &&
          table[3] == 9 && table[4] == 11 && table[5] == 18 && table[6] == EMPTY,
          "任务 1b：落位 7,8,30,9,11,18,_（18:4→5、9:2→3）");

    CHECK(SuccessProbes() == 8, "任务 2：成功 ASL = 8/6 = 4/3（1+1+1+2+1+2）");
    CHECK(FailProbes() == 28, "任务 3：失败 ASL = 28/7 = 4（7+6+5+4+3+2+1，含空位）");

    CHECK_END("ex04-hash-asl");
    return 0;
}
