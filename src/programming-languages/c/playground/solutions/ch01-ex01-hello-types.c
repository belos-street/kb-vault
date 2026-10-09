// ✅ 答案：ch01/ex01-hello-types（做完再看！）
// 关键点：char 是 1 字节整数（'A' == 65）；类型宽度表要背（408/计组联考）
#include <stdio.h>
#include "../common/check.h"

int main() {
    printf("Hello, 408!\n");
    CHECK(1, "任务 1：程序编译运行成功（输出里应有 Hello, 408!）");

    // char 本质是 1 字节整数，单引号字符就是它的 ASCII 码
    char c = 'A';
    CHECK(c == 65, "任务 2a：'A' 的 ASCII 码是 65");

    char next = c + 1;   // 字符直接参与整数运算
    CHECK(next == 'B', "任务 2b：'A' + 1 就是 'B'");

    int int_bytes = sizeof(int);
    CHECK(int_bytes == 4, "任务 3a：int 占 4 字节");

    int double_bytes = sizeof(double);
    CHECK(double_bytes == 8, "任务 3b：double 占 8 字节");
    CHECK(sizeof(char) == 1, "任务 3c：char 占 1 字节");
    CHECK(sizeof(short) == 2, "任务 3d：short 占 2 字节");
    CHECK(sizeof(long long) == 8, "任务 3e：long long 占 8 字节");

    // 🧪 实验答案：未初始化变量读到的是栈上残留的垃圾值，每次运行可能不同，
    // 编译器 -Wall 也会警告。考试代码必须初始化（数组同理）。

    CHECK_END("ch01-ex01-hello-types");
    return 0;
}
