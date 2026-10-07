// 📖 对应文档：../doc/04-string.md §4.3 朴素模式匹配（BF 算法）
// 🎯 任务：实现 BF 匹配 + 统计比较次数，验证最坏情况 O(mn) 的精确计数（文档例 1：28 次）
// ▶️ 运行：make run EX=ex01-bf-match（在 playground 目录下）
//
// 约定：1 起点风格 —— S.ch[1..length] 存字符（下标 0 闲置），与文档代码一致。

#include <stdio.h>
#include <string.h>
#include "../common/check.h"

#define MAXLEN 255

typedef struct {
    char ch[MAXLEN];   // ch[1..length] 存字符
    int length;
} SString;

// 给定：从 C 字符串构造 SString（1 起点搬移）
static void SetString(SString *S, const char *src) {
    S->length = (int)strlen(src);
    for (int i = 1; i <= S->length; i++) S->ch[i] = src[i - 1];
}

static int cmp_count = 0;   // 全局比较计数器（每次字符比较 +1）

// ─── 任务：BF 匹配，返回匹配起始位置（1 基），失败返回 0 ────
// 核心陷阱：失配时主串回溯是 i = i - j + 2【不是 i - j + 1】！
//          i-j+1 是本轮起点（已和 T[1] 比过且失败），必须再进一位
// TODO：i = j = 1；相等则 i++/j++（cmp_count++）；失配则 cmp_count++、
//      i = i - j + 2、j = 1；j > T.length 时返回 i - T.length
int Index_BF(SString S, SString T) {
    return 0;   // TODO
}

int main() {
    SString S, T;
    SetString(&S, "ababc");
    SetString(&T, "abc");

    // 一般情况："ababc" 中找 "abc" → 位置 3
    cmp_count = 0;
    CHECK(Index_BF(S, T) == 3, "任务 1a：'abc' 在 'ababc' 的位置 3");

    // 最坏情况（文档 §4.3 推演）：主串 '0000000001'（n=10），模式 '0001'（m=4）
    // 每个起点几乎比满 4 次才失配 → (n-m+1)*m = 7*4 = 28 次比较
    SetString(&S, "0000000001");
    SetString(&T, "0001");
    cmp_count = 0;
    CHECK(Index_BF(S, T) == 7, "任务 2a：最坏情况下匹配成功返回位置 7");
    CHECK(cmp_count == 28, "任务 2b：总比较次数 (n-m+1)*m = 28 → O(mn) 的由来");

    // 失败情况：找不到返回 0
    SetString(&S, "abcabc");
    SetString(&T, "abcaabc");
    CHECK(Index_BF(S, T) == 0, "任务 3：模式比主串还长/匹配失败 → 0");

    CHECK_END("ex01-bf-match");
    return 0;
}
