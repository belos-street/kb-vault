// ✅ 答案：ch01/ex03-switch-static（做完再看！）
// 关键点：case 结尾必须 break（否则 fall-through）；static 局部变量跨调用保值
#include <stdio.h>
#include "../common/check.h"

int apply(char op, int a, int b) {
    int result = 0;
    switch (op) {
        case '+':
            result = a + b;
            break;           // 忘了 break 会穿透到 case '-'！
        case '-':
            result = a - b;
            break;
        default:
            result = 0;      // default 兜底，最后一个分支可不加 break
    }
    return result;
}

int next_id(void) {
    static int cnt = 0;   // 只在第一次调用时初始化，函数退出后值保留
    cnt++;
    return cnt;
}

int main() {
    CHECK(apply('+', 3, 4) == 7, "任务 1a：apply('+',3,4) == 7");
    CHECK(apply('-', 3, 4) == -1, "任务 1b：apply('-',3,4) == -1");
    CHECK(apply('*', 3, 4) == 0, "任务 1c：未知运算符走 default 返回 0");

    CHECK(next_id() == 1, "任务 2a：第 1 次调用返回 1");
    CHECK(next_id() == 2, "任务 2b：第 2 次调用返回 2");
    CHECK(next_id() == 3, "任务 2c：第 3 次调用返回 3");

    // 🧪 实验答案：去掉 break 后 apply('+',3,4) 从 case '+' 一路穿透执行到
    // default，result 被覆盖成 0 → 三条 CHECK 全红。
    // 故意利用 fall-through 的场景：多个 case 共用一段逻辑
    //（case 'a': case 'A': ...; break;）。

    CHECK_END("ch01-ex03-switch-static");
    return 0;
}
