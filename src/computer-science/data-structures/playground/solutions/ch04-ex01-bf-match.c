// ✅ 答案：ch04/ex01-bf-match（做完再看！）
// 关键点：失配回溯 i = i-j+2（不是 +1）；最坏 (n-m+1)*m = 28 次
#include <stdio.h>
#include <string.h>
#include "../common/check.h"

#define MAXLEN 255

typedef struct {
    char ch[MAXLEN];
    int length;
} SString;

static void SetString(SString *S, const char *src) {
    S->length = (int)strlen(src);
    for (int i = 1; i <= S->length; i++) S->ch[i] = src[i - 1];
}

static int cmp_count = 0;

int Index_BF(SString S, SString T) {
    int i = 1, j = 1;
    while (i <= S.length && j <= T.length) {
        cmp_count++;                       // 每次字符比较计 1 次
        if (S.ch[i] == T.ch[j]) {          // 相等：双指针后移
            ++i;
            ++j;
        } else {
            i = i - j + 2;                 // 回溯到本轮起点 i-j+1 的【下一位】
            j = 1;
        }
    }
    if (j > T.length)
        return i - T.length;               // 成功：起始位置
    return 0;
}

int main() {
    SString S, T;
    SetString(&S, "ababc");
    SetString(&T, "abc");
    cmp_count = 0;
    CHECK(Index_BF(S, T) == 3, "任务 1a：'abc' 在 'ababc' 的位置 3");
    SetString(&S, "0000000001");
    SetString(&T, "0001");
    cmp_count = 0;
    CHECK(Index_BF(S, T) == 7, "任务 2a：匹配成功返回位置 7");
    CHECK(cmp_count == 28, "任务 2b：(n-m+1)*m = 7*4 = 28 → O(mn)");
    SetString(&S, "abc");
    SetString(&T, "abd");
    cmp_count = 0;
    CHECK(Index_BF(S, T) == 0 && cmp_count == 5, "任务 3：匹配失败返回 0，比较 5 次");
    CHECK_END("ch04-ex01-bf-match");
    return 0;
}
