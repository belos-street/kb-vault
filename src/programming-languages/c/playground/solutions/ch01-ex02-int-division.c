// ✅ 答案：ch01/ex02-int-division（做完再看！）
// 关键点：整除向零截断；余数符号跟被除数走；判奇数用 n % 2 != 0
#include <stdio.h>
#include "../common/check.h"

int minutes(int total_seconds) {
    return total_seconds / 60;   // 整数除法直接截断
}

int last_digit(int n) {
    return n % 10;   // 余数符号跟被除数走：-408 % 10 == -8
}

int is_odd(int n) {
    return n % 2 != 0;   // 不能写 n % 2 == 1：-3 % 2 == -1，负数奇数会被漏判
}

int main() {
    CHECK(5 / 2 == 2, "事实 1：5 / 2 == 2（整数除法直接截断）");
    CHECK(-5 / 2 == -2, "事实 2：-5 / 2 == -2（向零截断）");
    CHECK(5 % 2 == 1, "事实 3：5 % 2 == 1");
    CHECK(-5 % 2 == -1, "事实 4：-5 % 2 == -1（余数符号跟被除数）");
    CHECK(5 / 2.0 == 2.5, "事实 5：有 double 参与才是浮点除法");

    CHECK(minutes(125) == 2, "任务 1a：125 秒 = 2 个完整分钟");
    CHECK(minutes(120) == 2, "任务 1b：120 秒 = 2 分钟");
    CHECK(last_digit(408) == 8, "任务 2a：408 的个位是 8");
    CHECK(last_digit(-408) == -8, "任务 2b：-408 的个位是 -8");
    CHECK(is_odd(7) == 1, "任务 3a：7 是奇数");
    CHECK(is_odd(-3) == 1, "任务 3b：-3 也是奇数");
    CHECK(is_odd(408) == 0, "任务 3c：408 是偶数");

    // 🧪 实验答案：if (x = 5) 是赋值表达式，值为 5 非 0 → 永远进分支；
    // 编译器 -Wall 会警告建议加括号。判断相等必须 ==。

    CHECK_END("ch01-ex02-int-division");
    return 0;
}
