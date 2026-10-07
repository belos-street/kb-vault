// 📖 对应文档：doc/02-pointers-and-arrays.md §2.7 字符串（+ 本章练习 2）
// 🎯 任务：手写 my_strlen（doc 练习 2）；逐字符遍历模板；字面量不可改（doc 练习 3）
// ▶️ 运行：make run EX=ex05-my-strlen（在 playground 目录下）
//
// 规则：TODO 处需要你实现；🧪 实验需取消注释观察行为，看完恢复注释。

#include <stdio.h>
#include <string.h>   // 仅验证用（strlen/strcmp），做题时不许调用
#include "../common/check.h"

// ─── 任务 1：手写 my_strlen（doc 练习 2）───────────────────
// 规则：数到 '\0' 为止（不含 '\0'）；不许用 string.h
int my_strlen(char s[]) {
    return 0;   // TODO：for (int i = 0; s[i] != '\0'; i++) 数数
}

// ─── 任务 2：逐字符遍历模板实战：小写转大写 ────────────────
// 模板（串一章 KMP 的基础）：for (int i = 0; s[i] != '\0'; i++) { 处理 s[i]; }
// 提示：小写字母 = 大写字母 + 32（ASCII 差值，char 本质是整数）
void to_upper(char s[]) {
    // TODO
}

int main() {
    char s1[] = "abc";   // 数组形式：{'a','b','c','\0'}，内容可改

    // ─── 先猜后跑：sizeof vs strlen ────────────────────────
    CHECK(sizeof(s1) == 4, "事实：sizeof(s1)==4 —— 含 '\\0'，编译期信息");
    CHECK(strlen(s1) == 3, "事实：strlen(s1)==3 —— 不含 '\\0'，运行期数出来");

    // ─── 任务 1 检验 ────────────────────────────────────────
    CHECK(my_strlen(s1) == 3, "任务 1a：my_strlen(\"abc\") == 3");
    CHECK(my_strlen("") == 0, "任务 1b：空串只有 '\\0'，长度 0（边界）");
    CHECK(my_strlen("408") == 3, "任务 1c：数字串也一样");

    // ─── 任务 2 检验 ────────────────────────────────────────
    to_upper(s1);
    CHECK(strcmp(s1, "ABC") == 0, "任务 2：to_upper 后变成 \"ABC\"（strcmp 相等返回 0）");

    // ─── 🧪 实验：字符串字面量不可改（doc 本章练习 3）───────
    // char *s2 = "abc";  // 指针指向字面量，字面量存于只读区
    // 取消下面一行重跑：程序崩溃（段错误）—— 字面量不可写！
    // 结论：char s1[] = "abc" 是可改的数组副本；char *s2 = "abc" 指向只读区。
    //
    // char *s2 = "abc";
    // s2[0] = 'x';

    CHECK_END("ex05-my-strlen");
    return 0;
}
