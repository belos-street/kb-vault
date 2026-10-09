// ✅ 答案：ch02/ex05-my-strlen（做完再看！）
// 关键点：'\0' 是终止符；逐字符遍历模板；数组副本可改、字面量只读
#include <stdio.h>
#include <string.h>
#include "../common/check.h"

int my_strlen(char s[]) {
    int len = 0;
    for (int i = 0; s[i] != '\0'; i++) {   // 数到 '\0' 为止，不含它
        len++;
    }
    return len;
}

void to_upper(char s[]) {
    for (int i = 0; s[i] != '\0'; i++) {
        if (s[i] >= 'a' && s[i] <= 'z') {
            s[i] = s[i] - 32;   // ASCII：小写 = 大写 + 32
        }
    }
}

int main() {
    char s1[] = "abc";
    CHECK(sizeof(s1) == 4, "事实：sizeof(s1)==4 —— 含 '\\0'，编译期信息");
    CHECK(strlen(s1) == 3, "事实：strlen(s1)==3 —— 不含 '\\0'");

    CHECK(my_strlen(s1) == 3, "任务 1a：my_strlen(\"abc\") == 3");
    CHECK(my_strlen("") == 0, "任务 1b：空串长度 0");
    CHECK(my_strlen("408") == 3, "任务 1c：数字串也一样");

    to_upper(s1);
    CHECK(strcmp(s1, "ABC") == 0, "任务 2：to_upper 后变成 \"ABC\"");

    // 🧪 实验答案：char *s2 = "abc" 指向只读区的字面量，s2[0]='x' 段错误；
    // char s1[] = "abc" 是把字面量拷进可改的数组。这就是 doc 练习 3 的结论。

    CHECK_END("ch02-ex05-my-strlen");
    return 0;
}
