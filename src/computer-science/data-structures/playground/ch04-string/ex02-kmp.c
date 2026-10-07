// 📖 对应文档：../doc/04-string.md §4.4 KMP + §4.5 nextval（本章核心）
// 🎯 任务：默写 get_next / get_nextval / Index_KMP 三段经典代码，用文档例题的数组逐位验证
// ▶️ 运行：make run EX=ex02-kmp（在 playground 目录下）
//
// 约定：1 起点（王道/严蔚敏风格）—— next[1] = 0、next[2] = 1；0 起点则 next[1] = -1。

#include <stdio.h>
#include <string.h>
#include <stdbool.h>
#include "../common/check.h"

#define MAXLEN 255

typedef struct {
    char ch[MAXLEN];
    int length;
} SString;

// 给定：构造 SString
static void SetString(SString *S, const char *src) {
    S->length = (int)strlen(src);
    for (int i = 1; i <= S->length; i++) S->ch[i] = src[i - 1];
}

// ─── 任务 1：构造 next 数组（代码法默写，文档 §4.4.4）───────
// 核心：失配时 j = next[j]（不是退回 1）—— 构造过程本身就是一个 KMP 自匹配
// TODO：i = 1, j = 0, next[1] = 0；
//      while (i < T.length) { j==0 || T.ch[i]==T.ch[j] ? (++i, ++j, next[i]=j) : (j = next[j]); }
void GetNext(SString T, int next[]) {
    // TODO
}

// ─── 任务 2：构造 nextval 数组（文档 §4.5，比 get_next 多一个判断）──
// 规则：进位后若 T.ch[i] != T.ch[j] 则 nextval[i] = j，否则 nextval[i] = nextval[j]；
//      失配回退用 j = nextval[j]（两处都是 nextval！）
void GetNextVal(SString T, int nextval[]) {
    // TODO
}

// ─── 任务 3：KMP 匹配（返回起始位置，失败 0）────────────────
// 核心：主串指针 i 永不回溯！失配时 j = next[j]；j == 0 时 i、j 同时前进
int Index_KMP(SString S, SString T, const int next[]) {
    return 0;   // TODO
}

int main() {
    SString T;
    int next[MAXLEN] = {0}, nextval[MAXLEN] = {0};

    // 文档 §4.4.5 例题：'abaabcac' → next = (0,1,1,2,2,3,1,2)
    SetString(&T, "abaabcac");
    GetNext(T, next);
    CHECK(next[1] == 0 && next[2] == 1 && next[3] == 1 && next[4] == 2 &&
          next[5] == 2 && next[6] == 3 && next[7] == 1 && next[8] == 2,
          "任务 1a：'abaabcac' 的 next = (0,1,1,2,2,3,1,2)");

    // 连续重复字符：'aaaab' → next = (0,1,2,3,4)
    SetString(&T, "aaaab");
    GetNext(T, next);
    CHECK(next[1] == 0 && next[2] == 1 && next[3] == 2 && next[4] == 3 && next[5] == 4,
          "任务 1b：'aaaab' 的 next = (0,1,2,3,4)");

    // 文档 §4.5 例题：'aaaab' → nextval = (0,0,0,0,4)
    GetNextVal(T, nextval);
    CHECK(nextval[1] == 0 && nextval[2] == 0 && nextval[3] == 0 &&
          nextval[4] == 0 && nextval[5] == 4,
          "任务 2a：'aaaab' 的 nextval = (0,0,0,0,4)（无效回退被一步压缩）");

    // 'ababaa' → next = (0,1,1,2,3,4)，nextval = (0,1,0,1,0,4)
    SetString(&T, "ababaa");
    GetNext(T, next);
    GetNextVal(T, nextval);
    CHECK(next[6] == 4 && nextval[3] == 0 && nextval[5] == 0 && nextval[6] == 4,
          "任务 2b：'ababaa' 的 nextval = (0,1,0,1,0,4)");

    // 文档 §4.7 例 3 匹配：S='ababcabcacbab' 找 'abcac'（next=(0,1,1,1,2)）→ 位置 6
    SString S;
    SetString(&S, "ababcabcacbab");
    SetString(&T, "abcac");
    GetNext(T, next);
    CHECK(Index_KMP(S, T, next) == 6, "任务 3：KMP 匹配返回位置 6（主串 i 全程不回溯）");

    CHECK_END("ex02-kmp");
    return 0;
}
