// ✅ 答案：ch07/ex04-hash-asl（做完再看！）
// 关键点：成功数到命中、失败数到第一个空位（空位也算 1 次）；分母分别是 n 与 m
#include <stdio.h>
#include <stdbool.h>
#include "../common/check.h"

#define M 7
#define EMPTY -1

static int table[M];

bool HashInsert(int key) {
    int addr = key % M;                   // 初始散列地址
    for (int i = 0; i < M; i++) {         // 最多探测 M 次
        int pos = (addr + i) % M;         // 线性探测（绕环）
        if (table[pos] == EMPTY) {
            table[pos] = key;
            return true;
        }
    }
    return false;                         // 表满
}

int SuccessProbes(void) {
    int total = 0;
    for (int i = 0; i < M; i++) {         // 外层：每个已存记录
        if (table[i] == EMPTY) continue;
        int addr = table[i] % M;          // 它的哈希地址
        int probes = 0;
        for (int j = 0; j < M; j++) {     // 从哈希地址探测到命中
            int pos = (addr + j) % M;
            probes++;
            if (table[pos] == table[i]) break;   // 命中（含途经冲突槽各 1 次）
        }
        total += probes;
    }
    return total;
}

int FailProbes(void) {
    int total = 0;
    for (int addr = 0; addr < M; addr++) {        // 按哈希地址分 M 类
        for (int j = 0; j < M; j++) {
            int pos = (addr + j) % M;
            total++;                              // 每探测一格计 1 次
            if (table[pos] == EMPTY) break;       // 数到第一个空位（空位计入）
        }
    }
    return total;
}

int main() {
    for (int i = 0; i < M; i++) table[i] = EMPTY;
    int keys[] = {7, 8, 30, 11, 18, 9};
    bool all_ok = true;
    for (int i = 0; i < 6; i++)
        if (!HashInsert(keys[i])) all_ok = false;
    CHECK(all_ok, "任务 1a：6 个关键字全部插入");
    CHECK(table[0] == 7 && table[1] == 8 && table[2] == 30 &&
          table[3] == 9 && table[4] == 11 && table[5] == 18 && table[6] == EMPTY,
          "任务 1b：落位 7,8,30,9,11,18,_");
    CHECK(SuccessProbes() == 8, "任务 2：成功 ASL = 8/6 = 4/3");
    CHECK(FailProbes() == 28, "任务 3：失败 ASL = 28/7 = 4");
    CHECK_END("ch07-ex04-hash-asl");
    return 0;
}
