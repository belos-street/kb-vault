// 📖 对应文档：../doc/03-stack-and-queue.md §3.9 栈的应用（括号匹配 + 表达式求值）
// 🎯 任务：括号匹配的"就近匹配" + 后缀表达式求值的"先弹为右操作数"
// ▶️ 运行：make run EX=ex03-bracket-postfix（在 playground 目录下）

#include <stdio.h>
#include <stdbool.h>
#include <string.h>
#include "../common/check.h"

#define MaxSize 100

// ─── 任务 1：括号匹配 ──────────────────────────────────────
// 算法：左括号入栈；遇右括号 → 栈空则 false（右括号多余），否则弹顶必须同类；
//      扫描结束栈必须为空（左括号多余也不行）
// TODO：char stack[MaxSize] + int top 自管；三种括号 ( [ { 与 ) ] } 配对
bool BracketMatch(const char str[], int n) {
    return false;   // TODO
}

// ─── 任务 2：后缀表达式求值（操作数为 0~9 的单位数字）───────
// 算法：数字入栈；遇运算符弹出两个操作数 —— 【先弹的是右操作数】！
//      减/除顺序敏感："82/" 是 8/2=4，写成 2/8 就错了
// TODO：int 栈（数组 + top 自管）；扫描 str，数字 '0'~'9' → 数值入栈；
//      遇 + - * / 弹 a（右）、b（左），b op a 入栈；结束返回栈顶
int EvalPostfix(const char str[]) {
    return 0;   // TODO
}

int main() {
    // 任务 1 检验
    CHECK(BracketMatch("([{}])", 6), "任务 1a：([{}]) 匹配");
    CHECK(BracketMatch("()[]{}", 6), "任务 1b：()[]{} 匹配");
    CHECK(!BracketMatch("([)]", 4), "任务 1c：([)] 交叉嵌套 → 非法（就近匹配被破坏）");
    CHECK(!BracketMatch("(()", 3), "任务 1d：左括号多余（结束时栈非空）→ false");
    CHECK(!BracketMatch("())", 3), "任务 1e：右括号多余（弹栈时栈空）→ false");

    // 任务 2 检验（对应文档自测题 4）
    CHECK(EvalPostfix("82/34-*") == -4, "任务 2a：8 2 / 3 4 - * = 4 * (3-4) = -4");
    CHECK(EvalPostfix("23*4+") == 10, "任务 2b：2 3 * 4 + = 10");
    CHECK(EvalPostfix("982/-") == 5, "任务 2c：9 8 2 / - = 9 - (8/2) = 5（先弹 4 是右操作数）");

    CHECK_END("ex03-bracket-postfix");
    return 0;
}
