// ✅ 答案：ch04/ex02-kmp（做完再看！）
// 关键点：get_next 失配 j=next[j]；nextval 两处都用 nextval；KMP 主串 i 不回溯
#include <stdio.h>
#include <string.h>
#include <stdbool.h>
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

void GetNext(SString T, int next[]) {
    int i = 1, j = 0;
    next[1] = 0;                             // 规定
    while (i < T.length) {
        if (j == 0 || T.ch[i] == T.ch[j]) {
            ++i;
            ++j;                             // 匹配：i、j 同时前进
            next[i] = j;                     // 推出 next[i]
        } else {
            j = next[j];                     // 失配：j 回溯（自匹配核心）
        }
    }
}

void GetNextVal(SString T, int nextval[]) {
    int i = 1, j = 0;
    nextval[1] = 0;
    while (i < T.length) {
        if (j == 0 || T.ch[i] == T.ch[j]) {
            ++i;
            ++j;
            if (T.ch[i] != T.ch[j])
                nextval[i] = j;              // 不同：直接用 j
            else
                nextval[i] = nextval[j];     // 相同：继承优化结果
        } else {
            j = nextval[j];                  // 失配也用 nextval（两处都别写错）
        }
    }
}

int Index_KMP(SString S, SString T, const int next[]) {
    int i = 1, j = 1;
    while (i <= S.length && j <= T.length) {
        if (j == 0 || S.ch[i] == T.ch[j]) {  // j==0：模式首字符也失配，i 前进重新对齐
            ++i;
            ++j;
        } else {
            j = next[j];                     // 主串 i 不动，只动 j
        }
    }
    if (j > T.length)
        return i - T.length;
    return 0;
}

int main() {
    SString T;
    int next[MAXLEN] = {0}, nextval[MAXLEN] = {0};
    SetString(&T, "abaabcac");
    GetNext(T, next);
    CHECK(next[1] == 0 && next[2] == 1 && next[3] == 1 && next[4] == 2 &&
          next[5] == 2 && next[6] == 3 && next[7] == 1 && next[8] == 2,
          "任务 1a：'abaabcac' next = (0,1,1,2,2,3,1,2)");
    SetString(&T, "aaaab");
    GetNext(T, next);
    CHECK(next[1] == 0 && next[2] == 1 && next[3] == 2 && next[4] == 3 && next[5] == 4,
          "任务 1b：'aaaab' next = (0,1,2,3,4)");
    GetNextVal(T, nextval);
    CHECK(nextval[1] == 0 && nextval[2] == 0 && nextval[3] == 0 &&
          nextval[4] == 0 && nextval[5] == 4,
          "任务 2a：'aaaab' nextval = (0,0,0,0,4)");
    SetString(&T, "ababaa");
    GetNext(T, next);
    GetNextVal(T, nextval);
    CHECK(next[6] == 4 && nextval[3] == 0 && nextval[5] == 0 && nextval[6] == 4,
          "任务 2b：'ababaa' nextval = (0,1,0,1,0,4)");
    SString S;
    SetString(&S, "ababcabcacbab");
    SetString(&T, "abcac");
    GetNext(T, next);
    CHECK(Index_KMP(S, T, next) == 6, "任务 3：KMP 返回位置 6（主串 i 全程不回溯）");
    CHECK_END("ch04-ex02-kmp");
    return 0;
}
