// ✅ 答案：ch03/ex03-bracket-postfix（做完再看！）
// 关键点：括号就近匹配；后缀求值先弹的是右操作数（减/除顺序敏感）
#include <stdio.h>
#include <stdbool.h>
#include <string.h>
#include "../common/check.h"

#define MaxSize 100

bool BracketMatch(const char str[], int n) {
    char stack[MaxSize];
    int top = -1;
    for (int i = 0; i < n; i++) {
        if (str[i] == '(' || str[i] == '[' || str[i] == '{') {
            stack[++top] = str[i];                       // 左括号入栈
        } else if (str[i] == ')' || str[i] == ']' || str[i] == '}') {
            if (top == -1) return false;                 // 右括号多余
            char left = stack[top--];                    // 弹出最近左括号（就近匹配）
            if ((str[i] == ')' && left != '(') ||
                (str[i] == ']' && left != '[') ||
                (str[i] == '}' && left != '{'))
                return false;                            // 类型不匹配
        }
    }
    return top == -1;                                    // 左括号多余也不行
}

int EvalPostfix(const char str[]) {
    int stack[MaxSize];
    int top = -1;
    for (int i = 0; str[i] != '\0'; i++) {
        char c = str[i];
        if (c >= '0' && c <= '9') {
            stack[++top] = c - '0';                      // 数字入栈
        } else {
            int a = stack[top--];                        // 先弹 = 右操作数！
            int b = stack[top--];                        // 后弹 = 左操作数
            switch (c) {
                case '+': stack[++top] = b + a; break;
                case '-': stack[++top] = b - a; break;   // b - a（不是 a - b）
                case '*': stack[++top] = b * a; break;
                case '/': stack[++top] = b / a; break;   // b / a
            }
        }
    }
    return stack[top];
}

int main() {
    CHECK(BracketMatch("([{}])", 6), "任务 1a：([{}]) 匹配");
    CHECK(BracketMatch("()[]{}", 6), "任务 1b：()[]{} 匹配");
    CHECK(!BracketMatch("([)]", 4), "任务 1c：交叉嵌套非法");
    CHECK(!BracketMatch("(()", 3), "任务 1d：左括号多余");
    CHECK(!BracketMatch("())", 3), "任务 1e：右括号多余");
    CHECK(EvalPostfix("82/34-*") == -4, "任务 2a：4 * (3-4) = -4");
    CHECK(EvalPostfix("23*4+") == 10, "任务 2b：2*3+4 = 10");
    CHECK(EvalPostfix("982/-") == 5, "任务 2c：9 - (8/2) = 5（先弹 4 是右操作数）");
    CHECK_END("ch03-ex03-bracket-postfix");
    return 0;
}
